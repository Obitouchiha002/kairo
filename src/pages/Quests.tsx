import { motion } from 'motion/react';
import { useKairoStore } from '@/store';
import { Target, CheckCircle2, Circle, Plus, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export function Quests() {
  const { quests, completeQuest, addXp, startQuest, activeQuestId, removeQuest } = useKairoStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [questList, setQuestList] = useState(quests);

  const handleQuestAction = (id: string, reward: number, completed: boolean) => {
    if (completed) return;
    
    if (activeQuestId !== id) {
      startQuest(id);
    }
  };

  const generateNewQuest = async () => {
    setIsGenerating(true);
    try {
      const { appLanguage } = useKairoStore.getState();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate one totally unique micro-quest for self-improvement and reducing social anxiety. Return ONLY a JSON object with 'title', 'description', and 'category' (choose from: Social, Mental, Physical, Creator, Discipline, Fear Breaking, Deep Work). Do NOT format the response as code block just raw JSON.
Language Requirement: You ABSOLUTELY MUST write the title and description in 'Hinglish' (conversational Hindi written using the English alphabet). Do not write pure English.`,
      });

      const raw = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(raw);
      
      const newQuestContent = {
        title: data.title,
        description: data.description,
        category: data.category as any,
        xpReward: Math.floor(Math.random() * 50) + 20,
        completed: false,
        verificationFeedback: ''
      };

      if (auth.currentUser) {
        const questsRef = collection(db, 'users', auth.currentUser.uid, 'quests');
        await addDoc(questsRef, {
          ...newQuestContent,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Local fallback
        const newQuest = { id: Math.random().toString(), ...newQuestContent };
        setQuestList([newQuest, ...questList]);
        useKairoStore.setState(state => ({ quests: [newQuest, ...state.quests] }));
      }
    } catch (e) {
      console.error('Failed to generate AI quest:', e);
      // Fallback for offline mode or AI failure
      const { appLanguage } = useKairoStore.getState();
      const isHinglish = appLanguage === 'Hinglish';
      
      const newQuestContent = {
        title: isHinglish ? 'Digital Detox' : 'Digital Detox',
        description: isHinglish ? 'AI offline! Apna phone 15 minute ke liye door rakho aur breathe karo.' : 'AI offline! Put your phone away for 15 minutes and just breathe.',
        category: 'Discipline' as any,
        xpReward: 30,
        completed: false,
        verificationFeedback: ''
      };

      if (auth.currentUser) {
        const questsRef = collection(db, 'users', auth.currentUser.uid, 'quests');
        await addDoc(questsRef, {
          ...newQuestContent,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Sync state correctly if external completion happens
  const displayQuests = useKairoStore(s => s.quests);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-[#222] pb-6">
        <div>
          <h2 className="font-bold tracking-tight text-4xl mb-2">Protocol Database</h2>
          <p className="text-dim mono text-[10px] uppercase tracking-widest">Active Missions // {displayQuests.filter(q => !q.completed).length} Remaining</p>
        </div>
        <button 
          onClick={generateNewQuest}
          disabled={isGenerating}
          className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 font-bold tracking-widest text-xs uppercase shadow-xl hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isGenerating ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">Generate Mission</span>
        </button>
      </div>

      <div className="space-y-4">
        {displayQuests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleQuestAction(quest.id, quest.xpReward, quest.completed)}
            className={`bg-card cyber-border p-5 md:p-6 rounded-xl transition-transform active:scale-[0.98] flex items-start gap-4 ${
              quest.completed ? 'opacity-50 cursor-default' : 'hover:border-white/30 cursor-pointer hover:bg-[#151515]'
            } ${activeQuestId === quest.id ? 'border-[#00ff9d]/50 bg-[#00ff9d]/5' : ''}`}
          >
            <div className="mt-1">
              {quest.completed ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : activeQuestId === quest.id ? (
                <Play className="w-6 h-6 text-[#00ff9d] animate-pulse fill-[#00ff9d]/20" />
              ) : (
                <Circle className="w-6 h-6 text-dim" />
              )}
            </div>
            
            <div className="flex-1 relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] mono uppercase tracking-widest px-2 py-1 bg-black rounded-lg border border-[#222]">
                  {quest.category}
                </span>
                <span className="text-[10px] mono tracking-widest text-white/70">+{quest.xpReward} XP</span>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${quest.completed ? 'line-through text-white/50' : 'text-white'}`}>
                {quest.title}
              </h3>
              <p className="text-dim text-sm">{quest.description}</p>
              
              {quest.completed && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuest(quest.id);
                  }}
                  className="absolute bottom-0 right-0 p-2 text-dim hover:text-[#ff5555] transition-colors rounded-lg bg-black/40 hover:bg-[#ff5555]/10 border border-transparent hover:border-[#ff5555]/30 z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
