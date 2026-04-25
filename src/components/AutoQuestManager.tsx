import { useEffect, useRef } from 'react';
import { useKairoStore } from '@/store';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export function AutoQuestManager() {
  const { quests, startQuest } = useKairoStore();
  const kairoState = useKairoStore();
  const stateRef = useRef(kairoState);
  stateRef.current = kairoState;

  useEffect(() => {
    // Check every 30 seconds
    const interval = setInterval(async () => {
      const state = stateRef.current as any;
      const start = state.taskWindowStart || '09:00';
      const end = state.taskWindowEnd || '21:00';
      const activeId = state.activeQuestId;
      const allQuests = state.quests;

      const now = new Date();
      const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      if (!activeId && currentHourStr >= start && currentHourStr <= end) {
        // Find if we have any pending offline quests
        let pendingQuest = allQuests.find((q: any) => !q.completed);
        
        if (pendingQuest) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
          startQuest(pendingQuest.id);
        } else {
          // If no pending quests, we could theoretically generate one automatically here.
          // Due to API costs, we will insert a generic micro-task.
          try {
            if (auth.currentUser) {
              const questsRef = collection(db, 'users', auth.currentUser.uid, 'quests');
              const newQuest = {
                userId: auth.currentUser.uid,
                title: 'Jaldi Paani Piyo',
                description: 'Physical energy kam ho rahi hai. Current state maintain karne ke liye 1 glass paani piyo abhi.',
                category: 'Physical',
                xpReward: 20,
                completed: false,
                verificationFeedback: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              const docRef = await addDoc(questsRef, newQuest);
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
              startQuest(docRef.id);
            }
          } catch(e) {
            console.error('Failed to auto-assign task', e);
          }
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [startQuest]);

  return null;
}
