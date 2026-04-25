import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export type Quest = {
  id: string;
  title: string;
  description: string;
  category: 'Social' | 'Mental' | 'Physical' | 'Creator' | 'Discipline' | 'Fear Breaking' | 'Deep Work';
  xpReward: number;
  completed: boolean;
};

export type LogEntry = {
  id: string;
  date: string;
  mood: number; // 1-5
  notes: string;
  wins: string[];
};

interface KairoState {
  level: number;
  levelName: string;
  xp: number;
  xpRequired: number;
  streak: number;
  coins: number;
  energyScore: number;
  focusScore: number;
  confidenceScore: number;
  socialScore: number;
  
  quests: Quest[];
  logs: LogEntry[];
  
  activeQuestId: string | null;
  questStartTime: number | null;

  appLanguage: 'English' | 'Hinglish';
  hapticsEnabled: boolean;
  profileImage: string;

  addXp: (amount: number) => Promise<void>;
  completeQuest: (id: string, aiFeedback?: string) => Promise<void>;
  startQuest: (id: string) => Promise<void>;
  cancelActiveQuest: () => Promise<void>;
  addLog: (entry: Omit<LogEntry, 'id' | 'date'>) => Promise<void>;
  syncFromFirebase: (data: Partial<KairoState>) => void;
}

const LEVEL_NAMES = [
  "Wanderer",
  "Initiator",
  "Fear Breaker",
  "Presence Builder",
  "System Runner",
  "Shadow Master"
];

export const useKairoStore = create<KairoState>((set, get) => ({
  level: 1,
  levelName: LEVEL_NAMES[0],
  xp: 0,
  xpRequired: 300,
  streak: 0,
  coins: 0,
  energyScore: 100,
  focusScore: 50,
  confidenceScore: 50,
  socialScore: 50,

  appLanguage: 'Hinglish',
  hapticsEnabled: true,
  profileImage: '',

  activeQuestId: null,
  questStartTime: null,

  quests: [],
  logs: [],

  syncFromFirebase: (data) => set((state) => ({ ...state, ...data })),

  addXp: async (amount) => {
    const state = get();
    let newXp = state.xp + amount;
    let newLevel = state.level;
    let newXpRequired = state.xpRequired;

    while (newXp >= newXpRequired) {
      newXp -= newXpRequired;
      newLevel += 1;
      newXpRequired = Math.floor(newXpRequired * 1.5);
    }

    const updates = {
      xp: newXp,
      level: newLevel,
      xpRequired: newXpRequired,
      levelName: LEVEL_NAMES[Math.min(newLevel - 1, LEVEL_NAMES.length - 1)] || `Level ${newLevel}`,
      updatedAt: serverTimestamp()
    };

    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, updates);
    }
  },

  startQuest: async (id) => {
    const startTime = Date.now();
    set({ activeQuestId: id, questStartTime: startTime });
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { activeQuestId: id, questStartTime: startTime, updatedAt: serverTimestamp() });
    }
  },

  cancelActiveQuest: async () => {
    set({ activeQuestId: null, questStartTime: null });
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { activeQuestId: '', questStartTime: 0, updatedAt: serverTimestamp() });
    }
  },

  completeQuest: async (id, aiFeedback = '') => {
    const quest = get().quests.find(q => q.id === id);
    if (!quest || quest.completed) return;

    if (auth.currentUser) {
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', id);
      await updateDoc(questRef, { completed: true, verificationFeedback: aiFeedback, updatedAt: serverTimestamp() });
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { activeQuestId: '', questStartTime: 0, updatedAt: serverTimestamp() });
    }
  },

  addLog: async (entry) => {
    if (auth.currentUser) {
      const logId = Math.random().toString(36).substr(2, 9);
      const logRef = doc(db, 'users', auth.currentUser.uid, 'logs', logId);
      await setDoc(logRef, {
        userId: auth.currentUser.uid,
        mood: entry.mood,
        notes: entry.notes,
        wins: entry.wins,
        date: Date.now(),
        createdAt: serverTimestamp()
      });
    }
  }
}));
