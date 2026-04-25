import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, StopCircle, RefreshCw, Sparkles, Brain, CheckCircle2, Play, Video } from 'lucide-react';
import { useKairoStore } from '@/store';
import { GoogleGenAI } from '@google/genai';
import { set, keys, get } from 'idb-keyval';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MISSIONS = [
  "Introduce yourself and state one thing you are proud of today.",
  "Explain what you did this morning in 30 seconds.",
  "Tell a short story about a time you overcame a fear.",
  "Maintain eye contact with the lens and breathe deeply for 15 seconds."
];

interface SavedVideo {
  id: string;
  blob: Blob;
  date: number;
}

export function MirrorMode() {
  const [mission, setMission] = useState(MISSIONS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  
  const { addXp } = useKairoStore();

  useEffect(() => {
    loadSavedVideos();
    // Start camera
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera access denied", err);
        setCameraError(err?.message || "Failed to access camera or microphone. Please enable them and reload.");
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadSavedVideos = async () => {
    try {
      const allKeys = await keys();
      const videos: SavedVideo[] = [];
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith('kairo-vid-')) {
          const blob = await get(key);
          if (blob instanceof Blob) {
            videos.push({ id: key, blob, date: parseInt(key.replace('kairo-vid-', '')) });
          }
        }
      }
      setSavedVideos(videos.sort((a,b) => b.date - a.date));
    } catch(e) {
      console.error('Failed to load videos', e);
    }
  };

  const handleStart = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    setFeedback(null);
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9,opus' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const id = `kairo-vid-${Date.now()}`;
      try {
        await set(id, blob);
        await loadSavedVideos();
      } catch (e) {
        console.error("Failed to save video", e);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
  };

  const handleStop = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsAnalyzing(true);
    
    // Capture a frame to send to AI
    let frameBase64 = '';
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        frameBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
      }
      
      const { appLanguage } = useKairoStore.getState();

      const promptString = `You are Kairo, a supportive AI growth coach. 
The user just completed a speaking mission: "${mission}". 
I am providing a snapshot frame of them during the recording. 
Analyze their posture, eye contact, and expression, and give them a very supportive, encouraging, short review (under 50 words) to help reduce their social anxiety. Focus on their courage.
Language Preference: ${appLanguage}. ${appLanguage === 'Hinglish' ? 'Write the review in conversational Hinglish (Hindi written in English alphabet mixed with English).' : 'Write in English.'}`;

      let parts: any[] = [{ text: promptString }];
      
      if (frameBase64) {
        parts.unshift({
          inlineData: {
            mimeType: "image/jpeg",
            data: frameBase64
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts }
      });

      setFeedback(response.text);
      addXp(100);
    } catch (error) {
      console.error(error);
      setFeedback("Great job pushing your comfort zone! Keep holding that eye contact.");
      addXp(50);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextMission = () => {
    setMission(MISSIONS[Math.floor(Math.random() * MISSIONS.length)]);
    setFeedback(null);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col pt-4">
      
      <div className="flex justify-between items-center mb-6 border-b border-[#222] pb-6">
        <div>
          <h2 className="font-bold tracking-tight text-4xl mb-1">Mirror Mode</h2>
          <p className="text-dim mono text-[10px] uppercase tracking-widest mt-1">Confidence Training // Active Context</p>
        </div>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden bg-card cyber-border flex flex-col mb-8">
        {/* Video Background */}
        {!cameraError ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center z-20">
            <Video className="w-16 h-16 text-[#ff5555] mb-4 opacity-50" />
            <h3 className="font-bold text-xl mb-2">Camera Access Required</h3>
            <p className="text-dim text-sm max-w-sm mb-4">
              {cameraError}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Gradients to ensure text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />

        <div className="relative z-10 flex-1 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
          
          <div className="flex justify-between items-start pointer-events-auto">
            <div className="bg-[#111]/80 backdrop-blur-md border border-[#222] rounded-xl p-4 max-w-sm">
              <div className="text-[10px] mono uppercase text-dim mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-white" />
                Current Mission
              </div>
              <p className="text-sm font-bold leading-snug">{mission}</p>
            </div>
            
            {!isRecording && !isAnalyzing && (
              <button onClick={nextMission} className="p-3 rounded-xl bg-[#111] hover:bg-[#222] border border-[#222] transition">
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-6 pointer-events-auto">
            
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="bg-[#111] border border-[#222] p-6 rounded-xl flex items-center gap-4 cyber-border"
                >
                  <Brain className="w-6 h-6 animate-pulse" />
                  <span className="mono uppercase tracking-widest text-[10px]">Analyzing Expression & Confidence...</span>
                </motion.div>
              )}

              {feedback && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111]/90 backdrop-blur-lg border border-[#222] p-8 rounded-xl max-w-lg text-center cyber-border"
                >
                  <div className="flex justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-white" /></div>
                  <h3 className="font-bold text-2xl mb-2 tracking-tight">Mission Complete</h3>
                  <p className="text-white/80 leading-relaxed text-sm">"{feedback}"</p>
                  <div className="mt-6 mono text-[10px] uppercase text-dim tracking-widest">+100 XP Gained</div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isAnalyzing && !feedback && (
              <button 
                onClick={isRecording ? handleStop : handleStart}
                className={`w-20 h-20 rounded-full flex items-center justify-center border transition-all ${isRecording ? 'bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055] animate-pulse backdrop-blur-md' : 'bg-white text-black border-white hover:bg-gray-200 shadow-xl'}`}
              >
                {isRecording ? <StopCircle className="w-10 h-10" /> : <Camera className="w-8 h-8" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Library */}
      {savedVideos.length > 0 && (
        <div className="mb-12">
          <h3 className="mono text-[10px] uppercase tracking-widest text-dim mb-4">Secure Archive ({savedVideos.length})</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {savedVideos.map((vid) => (
              <div key={vid.id} className="snap-start shrink-0 w-64 bg-card cyber-border rounded-xl p-4 flex flex-col gap-3 relative">
                {playingVideo === vid.id ? (
                  <video 
                    src={URL.createObjectURL(vid.blob)} 
                    controls 
                    autoPlay 
                    className="w-full aspect-video rounded-lg object-cover bg-black"
                  />
                ) : (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center border border-[#333] relative overflow-hidden">
                    <Video className="w-8 h-8 text-white/20" />
                    <button 
                      onClick={() => setPlayingVideo(vid.id)}
                      className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors group"
                    >
                      <Play className="w-10 h-10 text-white opacity-50 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                    </button>
                  </div>
                )}
                <div className="text-[10px] mono uppercase text-dim">{new Date(vid.date).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
