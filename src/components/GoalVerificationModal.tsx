import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKairoStore, DailyGoal } from '@/store';
import { X, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
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

interface GoalVerificationModalProps {
  goal: DailyGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function GoalVerificationModal({ goal, onClose, onSuccess }: GoalVerificationModalProps) {
  const [proofText, setProofText] = useState('');
  const [aiOpinion, setAiOpinion] = useState('');
  const [isVerifyingProcess, setIsVerifyingProcess] = useState(false);

  const handleVerify = async () => {
    if (!proofText.trim() || !goal) return;
    triggerHaptic([15, 30, 20]);
    setIsVerifyingProcess(true);
    
    try {
      const { appLanguage } = useKairoStore.getState();
      const prompt = `You are a strict daily goal evaluator. The user claimed they completed their goal: "${goal.text}". They provided the following proof: "${proofText}". Did they actually complete the task? Reply with a short, snarky or encouraging feedback line, and start your response with "APPROVED:" or "REJECTED:" based on your decision.
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
          setIsVerifyingProcess(false);
          onSuccess();
          onClose();
        }, 3000);
      } else {
        setAiOpinion(result.replace('REJECTED:', '').trim());
        setIsVerifyingProcess(false);
        triggerHaptic([200]); // long negative vibe
      }
    } catch (e) {
      // fallback if AI fails
      setIsVerifyingProcess(false);
      onSuccess();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {goal && (
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
             className="bg-[#0f0f0f] border border-[#222] rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-md relative flex flex-col"
          >
             <button onClick={onClose} className="absolute top-4 right-4 text-dim hover:text-white transition-colors">
               <X className="w-5 h-5" />
             </button>
             
             <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#00ff9d]" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Cross Verification</h3>
                    <p className="text-[10px] mono text-[#00ff9d] uppercase">AI Audit System</p>
                 </div>
             </div>

             <div className="bg-[#111] border border-[#222] p-4 rounded-xl mb-6">
                 <div className="text-[10px] mono text-dim uppercase tracking-widest mb-1">Target Action:</div>
                 <div className="font-medium text-white">{goal.text}</div>
             </div>

             <div className="space-y-4">
                 <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Provide proof. What exactly did you do? AI will verify."
                  className="w-full bg-[#050505] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-[#00ff9d] transition-colors resize-none h-28 placeholder:text-[#444] text-white font-mono leading-relaxed"
                 />
                
                 {aiOpinion && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs bg-[#00ff9d]/10 text-[#00ff9d] p-4 rounded-xl border border-[#00ff9d]/20 flex items-start gap-3"
                  >
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="leading-relaxed"><TypewriterText text={aiOpinion} speed={20} /></span>
                  </motion.div>
                 )}

                 <button
                  onClick={handleVerify}
                  disabled={isVerifyingProcess || !proofText.trim()}
                  className="w-full bg-[#00ff9d] text-black py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#00cc7a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.2)]"
                 >
                  {isVerifyingProcess ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Completion"}
                 </button>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
