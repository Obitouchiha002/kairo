import { motion } from 'motion/react';
import { useKairoStore } from '@/store';
import { useAuth } from '@/lib/AuthContext';
import { User, Clock, Bell, LogOut, ChevronRight, Save, Edit2, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function Profile() {
  const { level, levelName, syncFromFirebase } = useKairoStore();
  const { user, logout } = useAuth();
  const kairoState = useKairoStore();

  const [saving, setSaving] = useState(false);
  const [taskWindowStart, setTaskWindowStart] = useState('09:00');
  const [taskWindowEnd, setTaskWindowEnd] = useState('21:00');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [appLanguage, setAppLanguage] = useState<'English' | 'Hinglish'>('Hinglish');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [profileImage, setProfileImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // We can assume it is on kairoState via syncFromFirebase
    const state = kairoState as any;
    if (state.taskWindowStart) setTaskWindowStart(state.taskWindowStart);
    if (state.taskWindowEnd) setTaskWindowEnd(state.taskWindowEnd);
    if (state.displayName) setDisplayName(state.displayName);
    if (state.appLanguage) setAppLanguage(state.appLanguage);
    if (state.hapticsEnabled !== undefined) setHapticsEnabled(state.hapticsEnabled);
    if (state.profileImage) setProfileImage(state.profileImage);
  }, [kairoState]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // compress heavily to fit in firestore doc easily
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setProfileImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        taskWindowStart,
        taskWindowEnd,
        displayName,
        appLanguage,
        hapticsEnabled,
        profileImage,
        updatedAt: Date.now()
      });
      syncFromFirebase({ taskWindowStart, taskWindowEnd, displayName, appLanguage, hapticsEnabled, profileImage } as any);
      
      if (hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 10, 10]);
    } catch(e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleHardReset = async () => {
    if (!user) return;
    if (!window.confirm("WARNING: This will completely wipe all your quests, logs, and reset your level to 1. Are you sure?")) return;
    
    setSaving(true);
    try {
      const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
      
      const questsRef = collection(db, 'users', user.uid, 'quests');
      const qDocs = await getDocs(questsRef);
      await Promise.all(qDocs.docs.map(d => deleteDoc(d.ref)));

      const logsRef = collection(db, 'users', user.uid, 'logs');
      const lDocs = await getDocs(logsRef);
      await Promise.all(lDocs.docs.map(d => deleteDoc(d.ref)));

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: 0,
        level: 1,
        streak: 0,
        energyScore: 0,
        focusScore: 0,
        socialScore: 0,
        confidenceScore: 0,
        updatedAt: Date.now()
      });

      // Also reset local store
      useKairoStore.setState({
        xp: 0,
        level: 1,
        streak: 0,
        quests: [],
        logs: [],
        energyScore: 0,
        focusScore: 0,
        socialScore: 0,
        confidenceScore: 0,
      });

      alert("System Reset Complete.");
    } catch (e) {
      console.error(e);
      alert("Error resetting data.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-6 border-b border-[#222] pb-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-[#111] border border-[#333] flex items-center justify-center relative overflow-hidden cursor-pointer group"
        >
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-white/50" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            <span className="text-[10px] mono uppercase font-bold text-white">Edit</span>
          </div>
        </div>
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
        
        <div className="flex-1">
          <input 
            type="text" 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)}
            onBlur={handleSave}
            placeholder="Your Name"
            className="font-bold tracking-tight text-3xl mb-1 mt-2 bg-transparent border-b border-transparent hover:border-[#333] focus:border-[#00ff9d] focus:outline-none transition-all block w-full px-1"
          />
          <p className="text-dim mono text-[10px] uppercase tracking-widest flex items-center gap-2 pl-1 mb-1">
            Status: Active <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </p>
          <p className="text-dim mono text-[10px] uppercase pl-1">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card cyber-border p-6 rounded-xl flex flex-col justify-between">
          <span className="mono text-[10px] uppercase tracking-widest text-dim">Current Title</span>
          <span className="font-bold text-lg md:text-2xl mt-2 tracking-tight uppercase truncate">{levelName}</span>
        </div>
        <div className="bg-card cyber-border p-6 rounded-xl flex flex-col justify-between">
          <span className="mono text-[10px] uppercase tracking-widest text-dim">Level</span>
          <span className="font-black mono italic text-2xl mt-2 glow-text">{level}</span>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="mono text-[10px] uppercase tracking-widest text-dim mb-4">Device & App Controls</h3>
        
        <div className="bg-card cyber-border p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#222]">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest">Haptic Feedback</div>
              <div className="text-[10px] mono text-dim mt-1">Enable tactile vibration responses</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={hapticsEnabled} onChange={e => setHapticsEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-[#222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff9d]"></div>
            </label>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest">AI Content Language</div>
              <div className="text-[10px] mono text-dim mt-1">Language for AI generated tasks & feedback</div>
            </div>
            <div className="flex bg-[#111] border border-[#333] rounded-lg p-1">
              <button 
                onClick={() => setAppLanguage('Hinglish')}
                className={`text-[10px] mono uppercase px-3 py-1.5 rounded-md transition-colors ${appLanguage === 'Hinglish' ? 'bg-[#333] text-white font-bold' : 'text-dim hover:text-white'}`}
              >
                Hinglish
              </button>
              <button 
                onClick={() => setAppLanguage('English')}
                className={`text-[10px] mono uppercase px-3 py-1.5 rounded-md transition-colors ${appLanguage === 'English' ? 'bg-[#333] text-white font-bold' : 'text-dim hover:text-white'}`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <h3 className="mono text-[10px] uppercase tracking-widest text-dim mb-4 mt-8 flex justify-between items-center">
          Task Delegation Window
          <button onClick={() => setIsEditingTime(!isEditingTime)} className="text-white hover:text-[#00ff9d] transition-colors flex items-center gap-1">
            <Edit2 className="w-3 h-3" /> Edit Window
          </button>
        </h3>
        
        <div className="bg-card cyber-border p-5 rounded-xl space-y-4">
          <p className="text-xs text-dim mb-4">Set the time window when Kairo Artificial Intelligence is allowed to assign you automatic tasks.</p>
          
          {isEditingTime ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="text-[10px] mono uppercase tracking-widest text-dim block mb-2">Start Time</label>
                <input 
                  type="time" 
                  value={taskWindowStart}
                  onChange={e => setTaskWindowStart(e.target.value)}
                  className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none transition-colors mono text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] mono uppercase tracking-widest text-dim block mb-2">End Time</label>
                <input 
                  type="time" 
                  value={taskWindowEnd}
                  onChange={e => setTaskWindowEnd(e.target.value)}
                  className="w-full bg-black border border-[#333] rounded-lg p-3 text-white focus:border-[#00ff9d] focus:outline-none transition-colors mono text-sm"
                />
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-between items-center py-2 px-4 bg-[#111] rounded-lg border border-[#333] mb-4">
              <div className="text-xl font-bold mono">{taskWindowStart}</div>
              <div className="h-px bg-[#333] w-12"></div>
              <div className="text-xl font-bold mono">{taskWindowEnd}</div>
            </div>
          )}
          
          <button 
            onClick={() => {
              handleSave();
              setIsEditingTime(false);
            }}
            disabled={saving}
            className="w-full mt-4 bg-white text-black font-bold text-xs uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <button onClick={() => logout()} className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all active:scale-[0.98] mt-8 group cyber-border">
          <div className="flex items-center gap-4 text-left">
            <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition"><LogOut className="w-4 h-4" /></div>
            <div>
              <div className="font-bold uppercase text-[10px] tracking-widest mono">Logout Protocol</div>
              <div className="text-[10px] opacity-70 mt-1">Sign out of local session</div>
            </div>
          </div>
        </button>

        {user?.email === 'vk1234888i@gmail.com' && (
          <div className="bg-red-500/10 border border-red-500/50 p-5 rounded-xl space-y-4 mt-8">
            <h3 className="mono text-[10px] uppercase tracking-widest text-red-500 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ADMIN SYSTEM OVERRIDE
            </h3>
            <p className="text-xs text-red-400 opacity-80 mb-4">Complete module purge. Destroys all currently logged tasks, progress, and memory.</p>
            <button 
              onClick={handleHardReset} 
              disabled={saving} 
              className="w-full bg-red-500 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {saving ? "WIPING DATA..." : "INITIATE HARD RESET"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
