import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInAnonymously, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, serverTimestamp } from 'firebase/firestore';
import { useKairoStore } from '@/store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { syncFromFirebase } = useKairoStore();

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubQuests: (() => void) | null = null;

    const authInit = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.error("Auth persistence setup failed", e);
      }
    };
    authInit();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUser) unsubUser();
      if (unsubQuests) unsubQuests();

      if (firebaseUser) {
        // Check if user document exists, if not, create it
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (e) {
          console.warn('Failed to get user doc, possibly offline', e);
        }
        
        let initialData: any = {};
        if (userSnap && userSnap.exists()) {
          initialData = userSnap.data();
        } else if (!userSnap) {
          // If offline and no cache, just don't overwrite but use default local state to let app run
          console.warn('Using default state for offline mode');
        } else {
          initialData = {
            email: firebaseUser.uid + '@anonymous.device',
            displayName: 'Agent ' + firebaseUser.uid.substring(0, 4),
            xp: 0,
            level: 1,
            levelName: 'Initiate',
            xpRequired: 300,
            streak: 0,
            energyScore: 100,
            focusScore: 50,
            confidenceScore: 50,
            socialScore: 50,
            activeQuestId: '',
            questStartTime: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            taskWindowStart: '09:00',
            taskWindowEnd: '21:00',
            appLanguage: 'Hinglish',
            hapticsEnabled: true,
            profileImage: ''
          };
          try {
            await setDoc(userRef, initialData);
          } catch(e) {
            console.warn('Failed to set initial user datam possibly offline', e);
          }
        }

        syncFromFirebase(initialData);

        // Listen for user changes
        unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            syncFromFirebase(doc.data());
          }
        }, (error) => {
           console.error("Error in user snapshot listener:", error);
        });

        // Listen for quests
        const questsRef = collection(db, 'users', firebaseUser.uid, 'quests');
        unsubQuests = onSnapshot(query(questsRef), (snapshot) => {
          const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          syncFromFirebase({ quests });
        }, (error) => {
           console.error("Error in quests snapshot listener:", error);
        });

        setUser(firebaseUser);
        setLoading(false);
      } else {
        // Automatically sign in anonymously when not logged in
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous authentication failed:", error);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
      if (unsubQuests) unsubQuests();
    };
  }, []);

  const login = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Login failed", error);
      alert("Anonymous Login Error: " + (error?.message || "Make sure Anonymous Authentication is enabled in Firebase Console."));
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
