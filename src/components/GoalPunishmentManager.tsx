import { useState, useEffect } from 'react';
import { useKairoStore, DailyGoal } from '@/store';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, Skull } from 'lucide-react';

export function GoalPunishmentManager() {
  const { dailyGoals, updateDailyGoal } = useKairoStore();
  const [breachedGoal, setBreachedGoal] = useState<DailyGoal | null>(null);
  const [apology, setApology] = useState('');
  
  const REQUIRED_APOLOGY = "I WILL NOT FAIL MY MISSIONS AGAIN";

  useEffect(() => {
    const checkGoals = () => {
      const now = Date.now();
      const breached = dailyGoals?.find(
        (g) => !g.completed && !g.failed && g.deadline && now > g.deadline
      );
      if (breached && (!breachedGoal || breached.id !== breachedGoal.id)) {
        setBreachedGoal(breached);
        setApology('');
      } else if (!breached) {
        setBreachedGoal(null);
      }
    };

    checkGoals();
    const interval = setInterval(checkGoals, 5000);
    return () => clearInterval(interval);
  }, [dailyGoals, breachedGoal]);

  if (!breachedGoal) return null;

  const handleApologize = () => {
    if (apology.toUpperCase() === REQUIRED_APOLOGY) {
      updateDailyGoal(breachedGoal.id, breachedGoal.text, false, breachedGoal.deadline, true);
    } else {
      alert("INCORRECT PHRASE. TRY AGAIN.");
    }
  };

  return (
    <AnimatePresence>
      {breachedGoal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[999] bg-[#050000] flex flex-col items-center justify-center p-6 text-center pointer-events-auto"
        >
          {/* Glitch Overlay Effect */}
          <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM1MDAiLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-md w-full flex flex-col items-center">
            <motion.div 
              animate={{ rotate: [-2, 2, -2] }} 
              transition={{ repeat: Infinity, duration: 0.1 }}
            >
              <Skull className="w-24 h-24 text-[#ff1111] mb-6 drop-shadow-[0_0_20px_rgba(255,17,17,0.8)]" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-black text-[#ff1111] uppercase tracking-tighter mb-2 font-mono drop-shadow-[0_0_10px_rgba(255,17,17,0.5)]">
              Deadline Breached
            </h1>
            <p className="text-[#ff5555] font-mono text-sm tracking-widest uppercase mb-8">
              Kairo OS is extremely disappointed in you.
            </p>

            <div className="bg-[#110000] border border-[#ff1111] p-6 rounded-xl w-full mb-8 shadow-[0_0_30px_rgba(255,17,17,0.2)]">
              <div className="text-[10px] mono text-[#ff5555] uppercase tracking-widest mb-2">Failed Mission:</div>
              <div className="text-xl font-bold text-white mb-2">{breachedGoal.text}</div>
              <div className="text-xs text-dim">
                Deadline was: {new Date(breachedGoal.deadline!).toLocaleTimeString()}
              </div>
            </div>

            <div className="w-full space-y-4">
              <label className="text-sm font-mono text-white/80 block">
                Type the exact phrase below to unlock your device:
                <br/>
                <strong className="text-[#00ff9d] block mt-2 text-lg">"{REQUIRED_APOLOGY}"</strong>
              </label>
              
              <input 
                type="text" 
                value={apology}
                onChange={(e) => setApology(e.target.value)}
                autoFocus
                className="w-full bg-[#110000] border-2 border-[#ff1111] text-[#ff1111] px-4 py-4 rounded-xl text-center font-mono focus:outline-none focus:border-[#00ff9d] focus:text-[#00ff9d] transition-colors"
                placeholder="Type the phrase..."
              />
              
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleApologize}
                disabled={apology.toUpperCase() !== REQUIRED_APOLOGY}
                className="w-full bg-[#ff1111] text-white py-4 rounded-xl font-black tracking-widest uppercase disabled:opacity-50 disabled:bg-[#330000] transition-colors shadow-[0_0_20px_rgba(255,17,17,0.3)] mt-4"
              >
                Submit Apology
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
