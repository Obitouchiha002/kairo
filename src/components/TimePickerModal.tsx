import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X } from 'lucide-react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  initialTime?: string;
}

export function TimePickerModal({ isOpen, onClose, onSelect, initialTime }: TimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  useEffect(() => {
    if (initialTime && isOpen) {
      const [h, m] = initialTime.split(':').map(Number);
      setSelectedHour(h || 0);
      setSelectedMinute(m || 0);
    } else if (isOpen) {
      const now = new Date();
      now.setHours(now.getHours() + 1); // default 1 hour from now
      setSelectedHour(now.getHours());
      setSelectedMinute(now.getMinutes() - (now.getMinutes() % 5));
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(`${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`);
    onClose();
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55
//   const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
        >
          <motion.div 
             initial={{ scale: 0.95, y: 20 }}
             animate={{ scale: 1, y: 0 }}
             exit={{ scale: 0.95, y: 20 }}
             className="bg-[#0f0f0f] border border-[#222] rounded-3xl p-6 shadow-[0_0_40px_rgba(0,255,157,0.05)] w-full max-w-xs relative flex flex-col items-center"
          >
             <button onClick={onClose} className="absolute top-4 right-4 text-dim hover:text-white transition-colors">
               <X className="w-5 h-5" />
             </button>
             
             <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-black border border-[#333] rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <Clock className="w-5 h-5 text-[#00ff9d]" />
                </div>
                <h3 className="text-[10px] mono uppercase tracking-widest text-dim font-bold">Set Deadline</h3>
             </div>

             {/* Minimal Watch UI */}
             <div className="flex justify-center items-center gap-4 w-full mb-8 relative">
                {/* Center selector highlight */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 border-y border-[#333] bg-white/5 pointer-events-none rounded-sm" />

                {/* Hours column */}
                <div className="h-40 overflow-y-auto no-scrollbar w-16 snap-y snap-mandatory relative scroll-smooth flex flex-col items-center"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}
                >
                    <div className="h-[60px] shrink-0" /> {/* Padding */}
                    {hours.map(h => (
                        <div 
                         key={`h-${h}`} 
                         onClick={() => setSelectedHour(h)}
                         className={`h-10 shrink-0 flex items-center justify-center text-xl font-mono snap-center cursor-pointer transition-all w-full
                            ${selectedHour === h ? 'text-white font-bold scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-dim hover:text-white/70'}
                         `}
                        >
                            {h.toString().padStart(2, '0')}
                        </div>
                    ))}
                    <div className="h-[60px] shrink-0" />
                </div>
               
                <div className="text-xl font-mono text-dim pb-1 animate-pulse">:</div>

                {/* Minutes column */}
                <div className="h-40 overflow-y-auto no-scrollbar w-16 snap-y snap-mandatory relative scroll-smooth flex flex-col items-center"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}
                >
                    <div className="h-[60px] shrink-0" /> {/* Padding */}
                    {minutes.map(m => (
                        <div 
                         key={`m-${m}`} 
                         onClick={() => setSelectedMinute(m)}
                         className={`h-10 shrink-0 flex items-center justify-center text-xl font-mono snap-center cursor-pointer transition-all w-full
                            ${selectedMinute === m ? 'text-[#00ff9d] font-bold scale-110 drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'text-dim hover:text-white/70'}
                         `}
                        >
                            {m.toString().padStart(2, '0')}
                        </div>
                    ))}
                    <div className="h-[60px] shrink-0" />
                </div>
             </div>

             <button 
                onClick={handleConfirm}
                className="w-full bg-white text-black font-bold py-3 text-xs tracking-widest uppercase rounded-xl hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
             >
                 Lock Deadline
             </button>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
