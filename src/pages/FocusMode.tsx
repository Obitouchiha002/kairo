import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Headphones, Settings2 } from 'lucide-react';
import { useKairoStore } from '@/store';

export function FocusMode() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<'Timer' | 'Stopwatch'>('Timer');
  const [customInputTime, setCustomInputTime] = useState(25); // in minutes
  const { addXp } = useKairoStore();

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (sessionType === 'Timer') {
          if (timeLeft > 0) {
            setTimeLeft(timeLeft - 1);
          } else {
            clearInterval(interval);
            setIsActive(false);
            addXp(120);
          }
        } else {
          // Stopwatch counts up
          setTimeLeft(t => t + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, sessionType, addXp]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(sessionType === 'Stopwatch' ? 0 : customInputTime * 60);
  };
  
  const handleSessionTypeChange = (type: 'Timer' | 'Stopwatch') => {
    setSessionType(type);
    setIsActive(false);
    setTimeLeft(type === 'Stopwatch' ? 0 : customInputTime * 60);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const val = parseInt(e.target.value) || 1;
    setCustomInputTime(val);
    setTimeLeft(val * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalSeconds = sessionType === 'Timer' ? Math.max(1, Math.floor(customInputTime * 60)) : 3600;
  const progress = sessionType === 'Timer' ? (timeLeft / totalSeconds) * 100 : (timeLeft / totalSeconds) * 100;
  const dashArray = 2 * Math.PI * 140; // 140 is radius
  const dashOffset = dashArray - ((progress / 100) * dashArray);

  return (
    <div className={`fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center transition-all duration-1000 ${isActive ? 'bg-[#000]' : 'bg-[#050505]'}`}>
      
      {/* Immersive Breathing Circle */}
      {isActive && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-[60vw] h-[60vw] rounded-full bg-[#00ff9d]/10 blur-[100px]"
          />
        </motion.div>
      )}

      {/* Top Header */}
      {!isActive && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-8 left-8 right-8 flex justify-between items-center z-10 border-[#222]">
          <div className="font-bold text-2xl tracking-tighter">KAIRO <span className="text-sm font-light text-dim">FOCUS</span></div>
          <button className="p-3 bg-[#111] hover:bg-[#222] border border-[#222] rounded-lg transition"><Settings2 className="w-5 h-5" /></button>
        </motion.div>
      )}

      {/* Main Timer Display */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xl cyber-border bg-card p-12 rounded-xl shadow-2xl scale-95 md:scale-100">
        
        <AnimatePresence mode="wait">
          {!isActive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-4 mb-12 items-center"
            >
              <div className="flex gap-4">
                {['Timer', 'Stopwatch'].map(m => (
                  <button 
                    key={m}
                    onClick={() => handleSessionTypeChange(m as any)}
                    className={`px-4 py-2 rounded-lg mono text-[10px] uppercase tracking-widest transition-colors border ${sessionType === m ? 'bg-white text-black border-white font-bold' : 'bg-[#111] border-[#333] text-dim hover:text-white hover:border-[#555]'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              
              {sessionType === 'Timer' && (
                <div className="flex flex-col items-center gap-4 mt-4 text-xs mono text-dim uppercase w-full">
                  <span>Custom Target Time</span>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] opacity-70">Min</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="180" 
                        value={Math.floor(customInputTime)} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const sec = customInputTime % 1;
                          const newTime = val + sec;
                          setCustomInputTime(newTime);
                          setTimeLeft(Math.floor(newTime * 60));
                        }}
                        className="w-16 bg-[#111] border border-[#333] rounded px-2 py-3 text-white text-center text-xl focus:outline-none focus:border-[#00ff9d] transition-colors shadow-inner"
                      />
                    </div>
                    <span className="text-2xl font-bold pb-2">:</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] opacity-70">Sec</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="59" 
                        value={Math.round((customInputTime % 1) * 60)} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const min = Math.floor(customInputTime);
                          const newTime = min + (val / 60);
                          setCustomInputTime(newTime);
                          setTimeLeft(Math.floor(newTime * 60));
                        }}
                        className="w-16 bg-[#111] border border-[#333] rounded px-2 py-3 text-white text-center text-xl focus:outline-none focus:border-[#00ff9d] transition-colors shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="relative flex items-center justify-center group w-full mb-8">
          
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Animated Watch Dial */}
            <svg className="w-full h-full absolute transform -rotate-90">
              <circle cx="144" cy="144" r="140" stroke="#111" strokeWidth="8" fill="none" />
              <motion.circle 
                cx="144" cy="144" r="140" 
                stroke="#00ff9d" 
                strokeWidth="8" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray={dashArray}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: "linear" }}
                className="drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]"
              />
            </svg>
            
            <div className="absolute flex flex-col items-center justify-center z-10">
              <h1 className="text-6xl md:text-7xl font-black mono leading-none tracking-tighter tabular-nums glow-text">
                {formattedTime}
              </h1>
              <p className="mono text-[10px] tracking-widest text-dim uppercase mt-4 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-[#333]">
                {sessionType}
              </p>
            </div>
          </div>
          
        </motion.div>

        <div className="flex items-center gap-6 mt-16 pb-4">
          <button onClick={toggleTimer} className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition backdrop-blur-md bg-[#111] hover:scale-105 active:scale-95">
            {isActive ? <Pause className="w-8 h-8 focus:outline-none" fill="currentColor" /> : <Play className="w-8 h-8 ml-1 focus:outline-none" fill="currentColor" />}
          </button>
          
          <button onClick={resetTimer} className="w-14 h-14 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:bg-[#222] transition backdrop-blur-md hover:scale-105 active:scale-95">
            <Square className="w-4 h-4 focus:outline-none" fill="currentColor" />
          </button>
        </div>

        {isActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute -bottom-12 flex items-center gap-3 text-dim">
            <Headphones className="w-4 h-4" />
            <span className="mono text-[10px] uppercase tracking-widest">Ambient Mode Active</span>
          </motion.div>
        )}

      </div>
    </div>
  );
}
