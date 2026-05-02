import { motion, AnimatePresence } from 'motion/react';
import { useKairoStore } from '@/store';
import { X, Sparkles, Trophy, Award, TrendingUp, Share2 } from 'lucide-react';
import { TypewriterText } from './TypewriterText';

export function CompletionModal() {
  const { lastCompletedQuest, clearLastCompletedQuest } = useKairoStore();

  if (!lastCompletedQuest) return null;

  const handleShare = () => {
    const textToShare = `I just completed "${lastCompletedQuest.title}" on Kairo OS! Earned +${lastCompletedQuest.xp} XP and +${lastCompletedQuest.coins} Coins. #SelfImprovement #Kairo`;
    if (navigator.share) {
      navigator.share({
        title: 'Mission Complete',
        text: textToShare,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('Copied to clipboard!');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          className="bg-[#111] border border-[#00ff9d]/50 rounded-3xl p-8 max-w-sm w-full relative cyber-border shadow-[0_0_80px_rgba(0,255,157,0.15)] flex flex-col items-center overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00ff9d]/20 via-transparent to-transparent pointer-events-none" />

          <button 
            onClick={clearLastCompletedQuest}
            className="absolute top-4 right-4 text-dim hover:text-white transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-black border border-[#00ff9d]/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
              <Trophy className="w-8 h-8 text-[#00ff9d]" />
            </div>

            <div className="text-[10px] mono text-[#00ff9d] tracking-widest uppercase mb-2 animate-pulse">OVERRIDE SUCCESSFUL</div>
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight line-clamp-2">Mission Complete</h2>
            
            <div className="w-full bg-black/40 border border-[#222] rounded-xl p-4 mb-6">
              <div className="flex justify-around">
                <div className="flex flex-col items-center">
                  <span className="text-dim text-[10px] mono uppercase tracking-widest">XP Gained</span>
                  <span className="font-mono text-xl text-[#00ff9d] font-bold">+{lastCompletedQuest.xp}</span>
                </div>
                <div className="w-px bg-[#333]" />
                <div className="flex flex-col items-center">
                  <span className="text-dim text-[10px] mono uppercase tracking-widest">Coins</span>
                  <span className="font-mono text-xl text-yellow-400 font-bold">+{lastCompletedQuest.coins}</span>
                </div>
              </div>
            </div>

            {lastCompletedQuest.aiFeedback && (
              <div className="w-full text-left text-sm bg-black/60 border border-[#222] p-4 rounded-xl mb-6 relative">
                <Sparkles className="w-4 h-4 text-dim absolute top-4 left-4" />
                <div className="pl-6">
                   <TypewriterText text={lastCompletedQuest.aiFeedback} speed={20} />
                </div>
              </div>
            )}
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleShare}
                className="flex-1 bg-transparent border border-[#333] text-white hover:border-[#00ff9d]/50 hover:bg-[#00ff9d]/10 transition-colors py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button 
                onClick={clearLastCompletedQuest}
                className="flex-1 bg-[#00ff9d] text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#00cc7a] transition-colors shadow-[0_0_20px_rgba(0,255,157,0.3)]"
              >
                Continue
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
