import { motion } from 'motion/react';
import { useAuth } from '@/lib/AuthContext';
import { TypewriterText } from '@/components/TypewriterText';
import { Monitor, Mail, Lock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password, isRegistering);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff9d] via-black to-black opacity-20 pointer-events-none"
      />
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <Monitor className="w-12 h-12 text-[#00ff9d] mb-4" />
        <h1 className="text-4xl font-black mb-2 tracking-tighter">KAIRO</h1>
        <p className="text-dim text-xs mono tracking-widest uppercase mb-8">
          <TypewriterText text="Identify  Yourself,  Agent" speed={40} />
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4 bg-[#111] p-6 rounded-2xl border border-[#222] cyber-border">
          {error && (
            <div className="bg-[#ff5555]/10 border border-[#ff5555]/30 text-[#ff5555] p-3 rounded-lg text-xs mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] mono uppercase text-dim px-1">Identity (Email)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#050505] border border-[#333] rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00ff9d] transition-colors"
                placeholder="agent@kairo.os"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] mono uppercase text-dim px-1">Passcode</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#050505] border border-[#333] rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00ff9d] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-3 mt-4 rounded-xl text-sm tracking-widest uppercase shadow-2xl relative overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-[#00ff9d] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10">{isLoading ? 'Processing...' : (isRegistering ? 'Initialize' : 'Access')}</span>
          </motion.button>
        </form>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-6 text-xs text-dim hover:text-white transition-colors mono tracking-widest uppercase underline underline-offset-4"
        >
          {isRegistering ? 'Switch to Login' : 'Create New Identity'}
        </button>
      </div>
    </div>
  );
}
