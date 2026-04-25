import { motion } from 'motion/react';
import { useKairoStore } from '@/store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockData = [
  { name: 'Mon', confidence: 30, focus: 40, social: 20 },
  { name: 'Tue', confidence: 35, focus: 55, social: 25 },
  { name: 'Wed', confidence: 32, focus: 45, social: 22 },
  { name: 'Thu', confidence: 40, focus: 60, social: 30 },
  { name: 'Fri', confidence: 45, focus: 50, social: 35 },
  { name: 'Sat', confidence: 55, focus: 75, social: 40 },
  { name: 'Sun', confidence: 58, focus: 65, social: 45 },
];

export function Analytics() {
  const { xp, xpRequired, level, streak } = useKairoStore();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      <div className="border-b border-[#222] pb-4 md:pb-6">
        <h2 className="font-bold tracking-tight text-4xl mb-2">Metrics & Growth</h2>
        <p className="text-dim mono text-[10px] uppercase tracking-widest">System Analysis // Last 7 Days</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Graph */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card cyber-border p-6 rounded-xl md:col-span-2 h-96 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="mono text-[10px] uppercase tracking-widest">Evolution Trajectory</h3>
            <div className="flex gap-4 mono text-[10px] uppercase">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white" /> Confidence</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/40" /> Focus</span>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#333" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#333" tick={{ fill: '#888', fontSize: 12, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f0f0f', borderRadius: '8px', border: '1px solid #222', fontFamily: 'monospace', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="confidence" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorConf)" />
                <Area type="monotone" dataKey="focus" stroke="rgba(255,255,255,0.4)" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Small Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card cyber-border p-6 rounded-xl flex flex-col justify-between"
        >
          <h3 className="mono text-[10px] uppercase tracking-widest text-dim">Total XP</h3>
          <div className="text-5xl font-black mono my-4 tracking-tighter">{xp.toLocaleString()} <span className="text-2xl text-dim">/ {xpRequired.toLocaleString()}</span></div>
          <p className="text-sm text-dim leading-relaxed italic">"You are in the top 15% of users for consistency this week. Keep pushing."</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card cyber-border p-6 rounded-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[120px] font-black opacity-5 leading-none mono italic">{streak}</div>
          <h3 className="mono text-[10px] uppercase tracking-widest text-dim">Current Streak</h3>
          <div className="text-5xl font-black mono my-4 tracking-tighter">{streak} <span className="text-2xl text-dim uppercase">Days</span></div>
          <p className="text-sm text-dim leading-relaxed italic">"Discipline is not motivation. It is system execution."</p>
        </motion.div>
      </div>

    </div>
  );
}
