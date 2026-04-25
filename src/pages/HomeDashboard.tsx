import { motion } from 'motion/react';
import { useKairoStore } from '@/store';
import { Flame, Brain, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TypewriterText } from '@/components/TypewriterText';
import { useState, useEffect } from 'react';

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

export function HomeDashboard() {
  const { level, xp, xpRequired, streak, quests, startQuest, activeQuestId, appLanguage } = useKairoStore();
  const navigate = useNavigate();
  const [quote, setQuote] = useState({ text: '', author: '' });

  useEffect(() => {
    const quotes = appLanguage === 'Hinglish' ? HINGLISH_QUOTES : ENGLISH_QUOTES;
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [appLanguage]);

  const xpPercentage = (xp / xpRequired) * 100;
  const activeQuests = quests.filter(q => !q.completed);

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
      <div className="bg-[#111] cyber-border rounded-2xl p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group border border-[#222] min-h-[220px] justify-center">
        <motion.div 
          animate={{ opacity: [0.02, 0.05, 0.02] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[#00ff9d] pointer-events-none"
        />
        
        <div className="relative z-10">
          <div className="text-[10px] mono uppercase tracking-widest flex items-center gap-2 mb-4 text-[#00ff9d]">
            <Brain className="w-4 h-4" /> System Pulse Active
          </div>
          <p className="text-xl md:text-3xl font-medium tracking-tight leading-tight text-white mb-4 min-h-[4rem]">
            "{quote.text && <TypewriterText text={quote.text} speed={30} />}"
          </p>
          {quote.author && (
            <div className="text-[10px] mono uppercase tracking-widest text-[#00ff9d] opacity-80 text-right">
              — {quote.author}
            </div>
          )}
        </div>
      </div>

      {/* Next Recommended Task or Main Action */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] mono uppercase tracking-widest text-dim px-2">
          <span>Priority Queue</span>
          <button onClick={() => navigate('/quests')} className="hover:text-white flex items-center gap-1">
            Nexus <ArrowRight className="w-3 h-3" />
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

    </div>
  );
}

