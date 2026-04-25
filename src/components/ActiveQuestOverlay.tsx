import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKairoStore } from '@/store';
import { X, Check, ShieldCheck, Camera, Loader2, Sparkles } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { GoogleGenAI } from '@google/genai';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : undefined);
const ai = new GoogleGenAI({ apiKey: getApiKey() });

function triggerHaptic(pattern = [10]) {
  const { hapticsEnabled } = useKairoStore.getState();
  if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function ActiveQuestOverlay() {
  const { activeQuestId, questStartTime, quests, completeQuest, addXp, cancelActiveQuest } = useKairoStore();
  const [elapsed, setElapsed] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [proofText, setProofText] = useState('');
  const [aiOpinion, setAiOpinion] = useState('');
  const [isVerifyingProcess, setIsVerifyingProcess] = useState(false);

  const activeQuest = quests.find(q => q.id === activeQuestId);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeQuestId && questStartTime) {
      const { hapticsEnabled } = useKairoStore.getState();
      if (hapticsEnabled) triggerHaptic([1000, 200, 1000]);

      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - questStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuestId, questStartTime]);

  if (!activeQuest) return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const formatTime = (v: number) => v.toString().padStart(2, '0');
  const displayTime = hours > 0 
    ? `${hours}:${formatTime(minutes)}:${formatTime(seconds)}`
    : `${formatTime(minutes)}:${formatTime(seconds)}`;

  const handleVerify = async () => {
    if (!proofText.trim()) return;
    triggerHaptic([15, 30, 20]);
    setIsVerifyingProcess(true);
    
    try {
      const { appLanguage } = useKairoStore.getState();
      const prompt = `You are a strict task evaluator. The user had to complete the task: "${activeQuest.title}" (${activeQuest.description}). They provided the following proof: "${proofText}". Did they actually complete the task? Reply with a short, snarky or encouraging feedback line, and start your response with "APPROVED:" or "REJECTED:" based on your decision.
Language Preference: ${appLanguage}. ${appLanguage === 'Hinglish' ? 'Write the feedback text in conversational Hinglish (Hindi written in English alphabet mixed with English). The APPROVED/REJECTED prefix must remain English.' : 'Write in English.'}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      const result = response.text || '';
      if (result.includes('APPROVED:')) {
        setAiOpinion(result.replace('APPROVED:', '').trim());
        triggerHaptic([50, 50, 50]);
        setTimeout(() => {
          completeQuest(activeQuest.id, result.replace('APPROVED:', '').trim());
          addXp(activeQuest.xpReward);
          setVerifying(false);
          setAiOpinion('');
          setProofText('');
          setIsVerifyingProcess(false);
        }, 3000);
      } else {
        setAiOpinion(result.replace('REJECTED:', '').trim());
        setIsVerifyingProcess(false);
        triggerHaptic([200]); // long negative vibe
      }
    } catch (e) {
      // fallback if AI fails
      completeQuest(activeQuest.id);
      addXp(activeQuest.xpReward);
      setVerifying(false);
      setIsVerifyingProcess(false);
    }
  };

  return (
    <AnimatePresence>
      {activeQuest && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-0 left-0 right-0 top-0 md:top-auto md:bottom-8 md:right-8 md:left-auto md:w-96 z-50 bg-black/90 md:bg-card border-none md:border md:border-[#222] rounded-none md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-5 overflow-y-auto backdrop-blur-3xl touch-none flex flex-col justify-center md:justify-start"
        >
          {/* Background animated pulse */}
          <motion.div 
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff9d] via-transparent to-transparent pointer-events-none"
          />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6 border-b border-[#333] pb-4">
              <div className="flex items-center gap-2 text-[12px] mono uppercase tracking-widest text-[#00ff9d] font-bold">
                <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse" />
                Active Mission Required
              </div>
              {/* Removed Close Button to Enforce Completion */}
            </div>

            <h3 className="font-bold text-lg mb-1">{activeQuest.title}</h3>
            {!verifying ? (
              <>
                <p className="text-dim text-xs mb-6"><TypewriterText text={activeQuest.description} speed={25} /></p>

                <div className="flex justify-between items-end mt-4">
                  <div className="text-4xl font-black mono tabular-nums tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                    {displayTime}
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setVerifying(true);
                    }}
                    className="bg-white text-black px-4 py-2 rounded-lg font-bold tracking-widest uppercase text-[10px] flex items-center gap-2 hover:bg-gray-200 active:scale-95 transition-all shadow-xl"
                  >
                    <Check className="w-3 h-3" /> Execute
                  </button>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-3"
              >
                <div className="text-[10px] mono uppercase text-dim flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> Smart Verification
                </div>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="What did you just do? (Be honest, AI is watching)"
                  className="w-full bg-black/50 border border-[#333] rounded-lg p-3 text-sm focus:outline-none focus:border-[#00ff9d] transition-colors resize-none h-24 placeholder:text-[#444]"
                />
                
                {aiOpinion && (
                  <div className="text-xs bg-[#00ff9d]/10 text-[#00ff9d] p-3 rounded-lg border border-[#00ff9d]/20 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><TypewriterText text={aiOpinion} speed={20} /></span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setVerifying(false);
                      setAiOpinion('');
                    }}
                    className="flex-1 border border-[#333] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#111] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={isVerifyingProcess || !proofText.trim()}
                    className="flex-1 bg-[#00ff9d] text-black py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#00cc7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifyingProcess ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Claim"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
