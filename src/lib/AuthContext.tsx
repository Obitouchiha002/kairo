import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user document exists, if not, create it
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let initialData: any = {};
        if (!userSnap.exists()) {
          initialData = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Subject',
            xp: 0,
            level: 1,
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
          await setDoc(userRef, initialData);
        } else {
          initialData = userSnap.data();
        }

        syncFromFirebase(initialData);

        // Listen for user changes
        const unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            syncFromFirebase(doc.data());
          }
        });

        // Listen for quests
        const questsRef = collection(db, 'users', firebaseUser.uid, 'quests');
        const unsubQuests = onSnapshot(query(questsRef), (snapshot) => {
          const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          syncFromFirebase({ quests });
        });

        setUser(firebaseUser);
        setLoading(false);
        
        return () => {
          unsubUser();
          unsubQuests();
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
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
