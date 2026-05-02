import { motion, AnimatePresence } from 'motion/react';
import { useKairoStore, DailyGoal } from '@/store';
import { Flame, Brain, ArrowRight, Play, AlertTriangle, X, CheckSquare, Square, Plus, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TypewriterText } from '@/components/TypewriterText';
import { useState, useEffect } from 'react';
import React from 'react';
import { TimePickerModal } from '@/components/TimePickerModal';
import { GoalVerificationModal } from '@/components/GoalVerificationModal';

const HINGLISH_QUOTES = [
  { text: "Consistency is your greatest weapon. Tumhare emotions tumhe rokenge, par tumhara routine tumhe banayega.", author: "Kairo System" },
  { text: "Kal khud se haar gaye the, aaj jeetna hai. Distractions temporary hain, progress is permanent.", author: "Kairo Protocol" },
  { text: "Comfort zone me kuch bada nahi milta. Pain aur friction ko embrace karo, growth wahin par hai.", author: "Kairo Philosophy" },
  { text: "Actions ko thoughts se bada banao. Sochne se kuch nahi badalta, execute karne se sab badalta hai.", author: "Stoic Logic" },
  { text: "Your focus is your true currency. Isey faltu ki cheezon pe aur cheap dopamine pe kharch mat karo.", author: "Kairo Core" },
  { text: "Discipline ka matlab hai what you want NOW vs what you want MOST ke beech ka decision.", author: "Kairo AI" }
];

const ENGLISH_QUOTES = [
  { text: "Consistency is your greatest weapon. Your emotions will try to stop you, but your routine will build you.", author: "Kairo System" },
  { text: "You lost to yourself yesterday, but you must win today. Distractions are temporary, progress is permanent.", author: "Kairo Protocol" },
  { text: "Nothing ever grows in the comfort zone. Embrace the friction.", author: "Kairo Philosophy" },
  { text: "Let your actions be louder than your overthinking. Execution changes everything.", author: "Stoic Logic" },
  { text: "Your focus is your true currency. Stop spending it on cheap dopamine.", author: "Kairo Core" },
  { text: "Discipline is choosing between what you want now, and what you want most.", author: "Kairo AI" }
];

const FEAR_RESETS = [
  "Go outside for 2 minutes. Feel the air.",
  "Say one sentence out loud confidently.",
  "Stand straight for 30 seconds, shoulders back.",
  "Drink a glass of water and reset.",
  "Take 3 deep breaths. 4s in, 4s hold, 4s out."
];

export function HomeDashboard() {
  const { level, xp, xpRequired, streak, quests, startQuest, activeQuestId, appLanguage, dailyGoals, updateDailyGoal, removeDailyGoal } = useKairoStore();
  const navigate = useNavigate();
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [fearModalOpen, setFearModalOpen] = useState(false);
  const [fearTask, setFearTask] = useState('');
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalTime, setNewGoalTime] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [verifyingGoal, setVerifyingGoal] = useState<DailyGoal | null>(null);

  useEffect(() => {
    const quotes = appLanguage === 'Hinglish' ? HINGLISH_QUOTES : ENGLISH_QUOTES;
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [appLanguage]);

  const triggerFearDetect = () => {
    setFearTask(FEAR_RESETS[Math.floor(Math.random() * FEAR_RESETS.length)]);
    setFearModalOpen(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 100, 50, 100, 50]);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim() || !newGoalTime) return;
    
    // Parse the time string (HH:MM) to create a valid timestamp for today
    const [hours, minutes] = newGoalTime.split(':').map(Number);
    const deadlineDate = new Date();
    deadlineDate.setHours(hours, minutes, 0, 0);
    
    // If time is implicitly in the past, maybe they meant tomorrow? But for daily goals, let's just accept the time.
    // However if it's strictly in the past, add 1 day so it doesn't fail instantly, or just let them suffer. Let's just use the strict time.
    if (deadlineDate.getTime() < Date.now()) {
      deadlineDate.setDate(deadlineDate.getDate() + 1);
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    await updateDailyGoal(id, newGoalText.trim(), false, deadlineDate.getTime(), false);
    setNewGoalText('');
    setNewGoalTime('');
    setIsAddingGoal(false);
  };

  const handleGoalToggle = (goal: DailyGoal) => {
    if (goal.completed) return;
    setVerifyingGoal(goal);
  };

  const xpPercentage = (xp / xpRequired) * 100;
  const activeQuests = quests.filter(q => !q.completed);

  // ... (rest of render logic continued below matching the updated UI layout)


  return (
    <div className="h-full w-full max-w-4xl mx-auto flex flex-col gap-6 md:gap-8 justify-center min-h-[80vh]">
      
      {/* Header Profile Short */}
      <header className="flex justify-between items-center bg-card cyber-border p-4 rounded-2xl w-full relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center bg-black rounded-full border border-[#333]">
            <div className="absolute inset-0 rounded-full border border-white opacity-20" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${xpPercentage}%, 0 ${xpPercentage}%)` }} />
            <span className="font-mono text-sm glow-text">L.{level}</span>
          </div>
          <div>
            <div className="text-[10px] mono text-dim tracking-widest uppercase">CURRENT CLASS</div>
            <div className="text-sm font-bold tracking-widest uppercase text-[#00ff9d]">Online</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111] rounded-lg border border-[#222]">
          <Flame className="w-4 h-4 text-[#ff5555]" />
          <span className="font-mono text-xs">{streak}</span>
        </div>
      </header>

      {/* AI System Pulse - Big Central Widget */}
      <div className="bg-[#111] cyber-border rounded-2xl p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group border border-[#222] min-h-[180px] justify-center">
        <motion.div 
          animate={{ opacity: [0.02, 0.05, 0.02] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[#00ff9d] pointer-events-none"
        />
        
        <div className="relative z-10">
          <div className="text-[10px] mono uppercase tracking-widest flex items-center gap-2 mb-4 text-[#00ff9d]">
            <Brain className="w-4 h-4" /> System Pulse Active
          </div>
          <p className="text-xl md:text-2xl font-medium tracking-tight leading-tight text-white mb-4 min-h-[4rem]">
            "{quote.text && <TypewriterText text={quote.text} speed={30} />}"
          </p>
          {quote.author && (
            <div className="text-[10px] mono uppercase tracking-widest text-[#00ff9d] opacity-80 text-right">
              — {quote.author}
            </div>
          )}
        </div>
      </div>

      {/* Fear Detected Action Button */}
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={triggerFearDetect}
        className="w-full bg-[#150000] border-2 border-[#ff3333] hover:bg-[#ff3333] group transition-colors rounded-2xl p-4 flex items-center justify-center gap-3 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff10_10px,#ffffff10_20px)] opacity-50 pointer-events-none" />
        <AlertTriangle className="w-6 h-6 text-[#ff3333] group-hover:text-white transition-colors relative z-10" />
        <span className="font-black tracking-widest uppercase text-white relative z-10">FEAR DETECTED</span>
      </motion.button>

      {/* Daily Goals */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] mono uppercase tracking-widest text-dim px-2">
          <span>Daily Goals ({dailyGoals?.length || 0})</span>
          {!isAddingGoal && (
            <button onClick={() => setIsAddingGoal(true)} className="hover:text-white flex items-center gap-1 text-[#00ff9d]">
              <Plus className="w-3 h-3" /> Add Goal
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {dailyGoals?.map(goal => (
            <div key={goal.id} className={`bg-card border ${goal.failed ? 'border-[#ff5555]' : 'border-[#222]'} p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group/goal`}>
              {goal.failed && (
                <div className="absolute inset-0 bg-[#ff5555]/10 pointer-events-none" />
              )}
              <button 
                onClick={() => handleGoalToggle(goal)}
                className={`text-dim hover:text-[#00ff9d] transition-colors z-10 ${goal.completed ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {goal.completed ? <CheckSquare className="w-5 h-5 text-[#00ff9d]" /> : <Square className="w-5 h-5" />}
              </button>
              <div className={`flex flex-col flex-1 z-10 ${goal.completed ? 'opacity-50' : ''}`}>
                <span className={`text-sm tracking-tight ${goal.completed ? 'text-dim line-through decoration-[#333]' : (goal.failed ? 'text-[#ff5555]' : 'text-white')}`}>
                  {goal.text}
                </span>
                {goal.deadline && (
                  <span className="text-[10px] mono uppercase tracking-widest text-dim mt-0.5">
                    Deadline: {new Date(goal.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {goal.failed ? ' [FAILED]' : ''}
                  </span>
                )}
              </div>
              {goal.completed && (
                <button onClick={() => removeDailyGoal(goal.id)} className="text-dim hover:text-[#ff5555] opacity-50 hover:opacity-100 z-10 relative transition-opacity p-2 ml-auto shrink-0 bg-black/40 rounded-lg hover:bg-[#ff5555]/10 border border-transparent hover:border-[#ff5555]/30">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {isAddingGoal && (
            <form onSubmit={handleAddGoal} className="bg-card border border-[#333] p-3 rounded-xl flex items-center gap-3 flex-wrap">
              <Square className="w-5 h-5 text-dim opacity-50 shrink-0" />
              <input 
                type="text" 
                value={newGoalText}
                onChange={e => setNewGoalText(e.target.value)}
                placeholder="Declare an action..."
                autoFocus
                className="bg-transparent text-sm text-white focus:outline-none flex-1 min-w-[150px] placeholder:text-dim"
              />
              <button 
                type="button"
                onClick={() => setTimePickerOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded bg-[#111] border ${newGoalTime ? 'border-[#00ff9d] text-[#00ff9d]' : 'border-[#333] text-dim hover:text-white'} text-xs font-mono transition-colors shrink-0`}
              >
                <Clock className="w-3 h-3" />
                {newGoalTime || "Set Time"}
              </button>
              <button type="submit" disabled={!newGoalText.trim() || !newGoalTime} className="text-[10px] mono uppercase font-bold text-[#00ff9d] disabled:opacity-50 shrink-0 px-2 py-1">Save</button>
              <button type="button" onClick={() => setIsAddingGoal(false)} className="text-dim hover:text-white shrink-0 p-1"><X className="w-4 h-4" /></button>
            </form>
          )}
        </div>
      </div>

      {/* Next Recommended Task or Main Action */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] mono uppercase tracking-widest text-dim px-2">
          <span>Priority Queue</span>
          <button onClick={() => navigate('/quests')} className="hover:text-white flex items-center gap-1">
            Browse All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {activeQuests.length > 0 ? (
          <div 
            onClick={() => { if(activeQuestId !== activeQuests[0].id) startQuest(activeQuests[0].id) }}
            className={`bg-card p-5 border border-[#333] rounded-2xl cursor-pointer hover:border-[#00ff9d]/50 transition-all active:scale-[0.98] group ${activeQuestId === activeQuests[0].id ? 'border-[#00ff9d]' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] mono uppercase flex items-center gap-2 text-dim group-hover:text-white transition-colors">
                {activeQuests[0].category}
                {activeQuestId === activeQuests[0].id && <span className="text-[#00ff9d] animate-pulse">Running</span>}
              </div>
              <div className="text-xs font-mono glow-text">+{activeQuests[0].xpReward} XP</div>
            </div>
            <h3 className="text-lg md:text-xl font-bold">{activeQuests[0].title}</h3>
            <p className="text-sm text-dim mt-1">{activeQuests[0].description}</p>
          </div>
        ) : (
          <div 
            onClick={() => navigate('/quests')}
            className="bg-card p-6 border border-[#333] rounded-2xl cursor-pointer hover:border-white transition-all active:scale-[0.98] flex flex-col items-center justify-center text-center gap-3 border-dashed"
          >
            <Play className="w-8 h-8 text-dim mb-2" />
            <h3 className="text-lg font-bold">Generate Next Protocol</h3>
            <p className="text-xs text-dim">Ready for protocol.</p>
          </div>
        )}
      </div>

      {/* Feedback/Verification Modals */}
      <TimePickerModal
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        onSelect={(time) => setNewGoalTime(time)}
        initialTime={newGoalTime}
      />
      
      <GoalVerificationModal
        goal={verifyingGoal}
        onClose={() => setVerifyingGoal(null)}
        onSuccess={() => {
          if (verifyingGoal) {
            updateDailyGoal(verifyingGoal.id, verifyingGoal.text, true);
          }
        }}
      />

      {/* Fear Modal */}
      <AnimatePresence>
        {fearModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-[#ff3333] rounded-2xl p-8 max-w-sm w-full relative cyber-border shadow-[0_0_50px_rgba(255,51,51,0.2)]"
            >
              <button 
                onClick={() => setFearModalOpen(false)}
                className="absolute top-4 right-4 text-dim hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-[#ff3333] mb-6 animate-pulse" />
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Panic Override</h2>
                <div className="text-[10px] mono text-[#ff3333] tracking-widest uppercase mb-8">System Intervention</div>
                
                <p className="text-xl font-medium mb-8">
                  {fearTask}
                </p>
                
                <button 
                  onClick={() => setFearModalOpen(false)}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm tracking-widest uppercase hover:bg-gray-200 transition-colors"
                >
                  Action Completed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

