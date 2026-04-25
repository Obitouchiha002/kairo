import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKairoStore } from '@/store';
import { Smile, Frown, Meh, Sparkles, Send, Mic, MicOff } from 'lucide-react';
import { format } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { TypewriterText } from '@/components/TypewriterText';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function Journal() {
  const { logs, addLog, addXp } = useKairoStore();
  const [note, setNote] = useState('');
  const [voiceNote, setVoiceNote] = useState('');
  const [mood, setMood] = useState(3);
  const [wins, setWins] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setVoiceNote(prev => prev + (prev.length > 0 ? ' ' : '') + event.results[i][0].transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async () => {
    if (!note && !voiceNote) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    
    let combinedNote = note;
    if (voiceNote) {
      combinedNote += (combinedNote ? '\n\n' : '') + '🎙️ Voice Note:\n' + voiceNote;
    }

    // Add local log
    const winArray = wins.split(',').map(w => w.trim()).filter(Boolean);
    addLog({ notes: combinedNote, mood, wins: winArray });
    addXp(30);
    
    setNote('');
    setVoiceNote('');
    setWins('');
    
    // Get AI insight
    setIsAnalyzing(true);
    try {
      const { appLanguage } = useKairoStore.getState();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I just wrote a journal entry. Mood: ${mood}/5. Wins: ${wins}. Notes: "${combinedNote}". Act as Kairo, my personal AI growth system. Give me a very short, deep, analytical but supportive 2-sentence perspective on my entry.
Language Preference: ${appLanguage}. ${appLanguage === 'Hinglish' ? 'Write the response in conversational Hinglish (Hindi written in English alphabet mixed with English).' : 'Write in English.'}`,
      });
      setAiInsight(response.text);
    } catch (e) {
      console.error("AI Insight failed (offline):", e);
      const { appLanguage } = useKairoStore.getState();
      setAiInsight(appLanguage === 'Hinglish' ? 'System filhal offline hai, par tumhari baat memory me likh li gayi hai. Keep going!' : 'System offline, but your memory has been logged securely. Keep progressing!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      
      <div className="border-b border-[#222] pb-4 md:pb-6">
        <h2 className="font-bold tracking-tight text-4xl mb-2">Daily Sync</h2>
        <p className="text-dim mono text-[10px] uppercase tracking-widest">Self-Reflection // Active</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Entry Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-card cyber-border p-6 rounded-xl space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent opacity-20"></div>
            
            <div>
              <label className="text-[10px] mono uppercase tracking-widest text-dim block mb-3">How is the neural state today?</label>
              <div className="flex justify-between items-center bg-[#050505] p-2 rounded-lg border border-[#222]">
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`p-3 rounded-md transition-all ${mood === m ? 'bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-dim hover:bg-white/10'}`}
                  >
                    {m < 3 ? <Frown className="w-5 h-5" /> : m > 3 ? <Smile className="w-5 h-5" /> : <Meh className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] mono uppercase tracking-widest text-dim block mb-3">Any major wins?</label>
              <input 
                type="text"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="Spoke up in meeting, skipped junk food..."
                className="w-full bg-[#050505] border border-[#222] rounded-lg p-4 focus:outline-none focus:border-[#00ff9d] transition-colors mono text-sm shadow-inner"
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="text-[10px] mono uppercase tracking-widest text-dim">Brain dump (Text or Voice)</label>
                <button 
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 text-[10px] mono uppercase px-3 py-1.5 rounded-full border transition-all ${isRecording ? 'bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055] animate-pulse' : 'bg-[#111] text-dim hover:text-white border-[#333]'}`}
                >
                  {isRecording ? <><MicOff className="w-3 h-3" /> Stop Dictation</> : <><Mic className="w-3 h-3" /> Dictate</>}
                </button>
              </div>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What is on your mind? Don't filter it."
                className={`w-full h-32 bg-[#050505] border border-[#222] rounded-lg p-4 focus:outline-none focus:border-[#00ff9d] transition-colors resize-none leading-relaxed text-sm shadow-inner`}
              />
              {(voiceNote || isRecording) && (
                <div className={`mt-3 p-4 rounded-lg border text-sm ${isRecording ? 'border-[#ff0055]/50 bg-[#ff0055]/5 text-white/90' : 'border-[#333] bg-[#111] text-dim'}`}>
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold tracking-widest text-white/50">
                    <Mic className="w-3 h-3" /> Voice Note {isRecording && <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-pulse" />}
                  </div>
                  {voiceNote || 'Listening...'}
                </div>
              )}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isAnalyzing || (!note && !voiceNote && !isRecording)}
              className="w-full bg-white text-black rounded-lg py-4 font-bold tracking-widest text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-gray-200 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isAnalyzing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Commit to Memory
            </button>

          </div>

          <AnimatePresence>
            {aiInsight && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-[#111] cyber-border p-5 rounded-xl text-white/90 leading-relaxed relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles className="w-16 h-16" /></div>
                <div className="flex items-center gap-2 mb-2 text-[10px] mono tracking-widest uppercase text-dim">
                  <Sparkles className="w-4 h-4 text-white" /> AI System Pulse
                </div>
                <p className="text-sm italic text-gray-300">"<TypewriterText text={aiInsight} speed={25} />"</p>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

        {/* Previous Logs */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h3 className="mono text-[10px] uppercase tracking-widest text-dim">Archive ({logs.length})</h3>
          
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[#333] rounded-xl text-dim mono text-[10px] uppercase">
                No logs recorded yet.
              </div>
            ) : (
              logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  key={log.id} 
                  className="p-5 rounded-xl cyber-border bg-[#0a0a0a]"
                >
                  <div className="flex justify-between items-start mb-4 border-b border-[#222] pb-3">
                    <span className="text-[10px] mono text-dim uppercase">{format(new Date(log.date), 'MMM do, h:mm a')}</span>
                    <span className="text-[10px] mono px-2 py-1 bg-black rounded-lg border border-[#333] flex items-center gap-1">Mode: {log.mood}/5</span>
                  </div>
                  
                  {log.wins.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {log.wins.map((w, j) => (
                        <span key={j} className="text-[10px] uppercase mono px-2 py-1 bg-white text-black rounded font-bold tracking-wide">
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">{log.notes}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
