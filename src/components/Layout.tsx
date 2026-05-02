import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Target, Focus, Camera, LineChart, BookHeart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActiveQuestOverlay } from './ActiveQuestOverlay';
import { CompletionModal } from './CompletionModal';
import { GoalPunishmentManager } from './GoalPunishmentManager';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Target, label: 'Quests', path: '/quests' },
    { icon: Camera, label: 'Mirror', path: '/mirror' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Sidebar for desktop, bottom bar for mobile */}
      <nav className="hidden md:flex flex-col w-64 border-r border-[#222] bg-card z-50">
        <div className="p-8">
          <h1 className="text-4xl font-bold tracking-tighter">KAIRO <span className="text-sm font-light text-dim">カイロ</span></h1>
        </div>
        <div className="flex-1 flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative",
                  isActive ? "text-white" : "text-dim hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 border border-[#222] bg-[#151515] rounded-xl cyber-border"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("font-bold relative z-10 tracking-widest uppercase text-xs mono", isActive ? "text-white" : "")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="p-4 text-[10px] mono text-dim border-t border-[#222]">
          © 2024 KAIRO_OS // ASCEND FURTHER
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        <div className="relative z-10 p-4 md:p-6 lg:p-8 pb-32 md:pb-8 min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Global Overlays */}
      <ActiveQuestOverlay />
      <CompletionModal />
      <GoalPunishmentManager />

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-[#222] z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-3 relative rounded-xl active:scale-90 transition-transform",
                isActive ? "text-white" : "text-dim"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-bg"
                  className="absolute inset-0 border border-[#222] bg-[#111] rounded-xl cyber-border"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
