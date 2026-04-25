import { motion } from 'motion/react';
import { useAuth } from '@/lib/AuthContext';
import { TypewriterText } from '@/components/TypewriterText';
import { Monitor } from 'lucide-react';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff9d] via-black to-black opacity-20 pointer-events-none"
      />
      
      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <Monitor className="w-12 h-12 text-[#00ff9d] mb-8" />
        <h1 className="text-4xl font-black mb-2 tracking-tighter">KAIRO</h1>
        <p className="text-dim text-xs mono tracking-widest uppercase mb-12">
          <TypewriterText text="Initialize  Protocol  Sequence" speed={40} />
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={login}
          className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm tracking-widest uppercase cyber-border shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[#00ff9d] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10">Access System</span>
        </motion.button>
      </div>
    </div>
  );
}
