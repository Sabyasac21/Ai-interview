import React from 'react';
import { LayoutDashboard, BookOpen, History, Settings, User, Star, MessageSquare, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const creditsUsed = user?.credits_used ?? 0;
  const creditsLimit = user?.credits_limit ?? 1;
  const creditPercent = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'practice', icon: BookOpen, label: 'Practice' },
    { id: 'interviews', icon: MessageSquare, label: 'Mock Interviews' },
    { id: 'resume', icon: FileText, label: 'Resume Builder' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-full bg-[var(--color-sidebar)] backdrop-blur-md border-r border-[var(--color-sidebar-border)]/60 flex flex-col text-[var(--color-sidebar-foreground)] shadow-2xl shadow-black/30">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-[var(--color-sidebar-border)]/30">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50">
          <Star className="text-white w-6 h-6 fill-current" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-[var(--color-sidebar-foreground)] tracking-tight">InterviewAI</h1>
          <span className="text-xs text-[var(--color-sidebar-foreground)] opacity-70 font-medium">Interview Prep</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative group border backdrop-blur-md overflow-hidden ${
                isActive 
                  ? 'text-white font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 border-indigo-400/60 shadow-lg shadow-indigo-900/50 ring-1 ring-indigo-400/30' 
                  : 'text-[var(--color-sidebar-foreground)] bg-gradient-to-br from-white/8 via-indigo-500/15 to-indigo-500/8 border-indigo-400/25 shadow-sm shadow-indigo-900/20 hover:bg-gradient-to-br hover:from-white/12 hover:via-indigo-500/20 hover:to-indigo-500/12 hover:border-indigo-400/45 hover:shadow-md hover:shadow-indigo-900/30 hover:ring-1 hover:ring-indigo-400/25 ring-1 ring-white/5'
              }`}
              style={{
                backgroundImage: !isActive ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(99,102,241,0.08) 50%, rgba(99,102,241,0.03) 100%)' : undefined
              }}
            >
              <item.icon className={`w-5 h-5 transition-all ${
                isActive 
                  ? 'text-white drop-shadow-lg' 
                  : 'text-[var(--color-sidebar-accent)] group-hover:text-indigo-300'
              }`} />
              <span className="text-[var(--color-sidebar-foreground)] font-medium text-sm">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Credits Section */}
      <div className="p-4 border-t border-[var(--color-sidebar-border)]/30 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 rounded-xl p-4 shadow-lg shadow-indigo-900/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--color-sidebar-foreground)] uppercase tracking-wider">Pro Plan</span>
            <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full font-semibold border border-emerald-400/30 shadow-lg shadow-emerald-900/20">Active</span>
          </div>
          <div className="w-full bg-[var(--color-sidebar-accent)]/30 h-2 rounded-full overflow-hidden mb-3 border border-indigo-400/20">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/50" style={{ width: `${creditPercent}%` }} />
          </div>
          <p className="text-xs text-[var(--color-sidebar-accent)] font-medium">{creditPercent}% of monthly credits used</p>
        </div>
      </div>
    </div>
  );
};
