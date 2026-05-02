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

export type DailyGoal = {
  id: string;
  text: string;
  completed: boolean;
  failed?: boolean;
  deadline?: number;
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
  dailyGoals: DailyGoal[];
  badges: string[];
  
  activeQuestId: string | null;
  questStartTime: number | null;
  lastCompletedQuest: { xp: number; title: string; aiFeedback: string; coins: number } | null;

  appLanguage: 'English' | 'Hinglish';
  hapticsEnabled: boolean;
  profileImage: string;

  addXp: (amount: number) => Promise<void>;
  completeQuest: (id: string, aiFeedback?: string) => Promise<void>;
  startQuest: (id: string) => Promise<void>;
  cancelActiveQuest: () => Promise<void>;
  clearLastCompletedQuest: () => void;
  removeQuest: (id: string) => Promise<void>;
  addLog: (entry: Omit<LogEntry, 'id' | 'date'>) => Promise<void>;
  syncFromFirebase: (data: Partial<KairoState>) => void;
  updateDailyGoal: (id: string, text: string, completed: boolean, deadline?: number, failed?: boolean) => Promise<void>;
  removeDailyGoal: (id: string) => Promise<void>;
  checkBadges: () => Promise<void>;
}

const LEVEL_NAMES = [
  "Wanderer",
  "Initiator",
  "Fear Breaker",
  "Presence Builder",
  "System Runner",
  "Shadow Master"
];

const BADGE_DEFINITIONS = [
  { id: 'first_blood', name: 'First Action', condition: (state: KairoState) => state.quests.filter(q => q.completed).length >= 1 },
  { id: 'quest_10', name: 'Action Taker', condition: (state: KairoState) => state.quests.filter(q => q.completed).length >= 10 },
  { id: 'streak_7', name: '7-Day Streak', condition: (state: KairoState) => state.streak >= 7 },
  { id: 'level_5', name: 'Level 5 Agent', condition: (state: KairoState) => state.level >= 5 },
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
  lastCompletedQuest: null,

  quests: [],
  logs: [],
  dailyGoals: [],
  badges: [],

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

  updateDailyGoal: async (id, text, completed, deadline, failed) => {
    const state = get();
    let newGoals = [...(state.dailyGoals || [])];
    const index = newGoals.findIndex(g => g.id === id);
    
    let updatedGoal: any = { id, text, completed };
    if (index >= 0) {
      updatedGoal = { ...newGoals[index], text, completed };
      if (deadline !== undefined) updatedGoal.deadline = deadline;
      if (failed !== undefined) updatedGoal.failed = failed;
    } else {
      if (deadline !== undefined) updatedGoal.deadline = deadline;
      if (failed !== undefined) updatedGoal.failed = failed;
    }

    // Clean any undefined properties that might have sneaked in
    Object.keys(updatedGoal).forEach(key => updatedGoal[key] === undefined && delete updatedGoal[key]);

    if (index >= 0) {
      newGoals[index] = updatedGoal;
    } else {
      newGoals.push(updatedGoal);
    }
    
    set({ dailyGoals: newGoals });
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { dailyGoals: newGoals, updatedAt: serverTimestamp() });
    }
  },

  removeDailyGoal: async (id) => {
    const state = get();
    const newGoals = (state.dailyGoals || []).filter(g => g.id !== id);
    set({ dailyGoals: newGoals });
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { dailyGoals: newGoals, updatedAt: serverTimestamp() });
    }
  },

  checkBadges: async () => {
    const state = get();
    const currentBadges = new Set(state.badges || []);
    let newBadgeEarned = false;

    BADGE_DEFINITIONS.forEach(def => {
      if (!currentBadges.has(def.id) && def.condition(state)) {
        currentBadges.add(def.id);
        newBadgeEarned = true;
      }
    });

    if (newBadgeEarned) {
      const newBadges = Array.from(currentBadges);
      set({ badges: newBadges });
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { badges: newBadges, updatedAt: serverTimestamp() });
      }
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

  removeQuest: async (id) => {
    const state = get();
    set({ quests: state.quests.filter(q => q.id !== id) });
    if (auth.currentUser) {
      try {
        const { deleteDoc } = await import('firebase/firestore');
        const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', id);
        await deleteDoc(questRef);
      } catch (error) {
        console.error('Failed to delete quest', error);
      }
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
    const state = get();
    const quest = state.quests.find(q => q.id === id);
    if (!quest || quest.completed) return;

    const coinsEarned = Math.floor(quest.xpReward / 5);

    if (auth.currentUser) {
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', id);
      await updateDoc(questRef, { completed: true, verificationFeedback: aiFeedback, updatedAt: serverTimestamp() });
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { 
        activeQuestId: '', 
        questStartTime: 0, 
        coins: (state.coins || 0) + coinsEarned,
        updatedAt: serverTimestamp() 
      });
    }
    
    set({ 
      lastCompletedQuest: { 
        xp: quest.xpReward, 
        title: quest.title, 
        aiFeedback: aiFeedback,
        coins: coinsEarned
      },
      coins: (state.coins || 0) + coinsEarned
    });
    
    // Check badges after a small delay to allow state sync
    setTimeout(() => {
      get().checkBadges();
    }, 1000);
  },

  clearLastCompletedQuest: () => set({ lastCompletedQuest: null }),

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
