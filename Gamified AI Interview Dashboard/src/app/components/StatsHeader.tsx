import React from 'react';
import { Flame, Zap, Trophy, TrendingUp } from 'lucide-react';

export function StatsHeader() {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-1">Welcome back, Alex!</h2>
          <p className="text-[var(--color-muted-foreground)]">You're on a 5-day streak. Keep the momentum going!</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
            View Report
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
            Daily Challenge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value="5 Days" 
          color="text-orange-500" 
          bg="bg-orange-500/10"
          border="border-orange-500/20"
        />
        <StatCard 
          icon={Zap} 
          label="Total XP" 
          value="12,450" 
          color="text-yellow-400" 
          bg="bg-yellow-500/10"
          border="border-yellow-500/20"
        />
        <StatCard 
          icon={Trophy} 
          label="Achievements" 
          value="12/50" 
          color="text-purple-400" 
          bg="bg-purple-500/10"
          border="border-purple-500/20"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Win Rate" 
          value="68%" 
          color="text-emerald-400" 
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, border }: { icon: any, label: string, value: string, color: string, bg: string, border: string }) {
  return (
    <div className={`p-4 rounded-xl border bg-slate-900 ${border} flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`${color}`} size={24} />
      </div>
      <div>
        <p className="text-[var(--color-muted-foreground)] text-xs uppercase font-bold tracking-wider">{label}</p>
        <p className="text-[var(--color-foreground)] text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
