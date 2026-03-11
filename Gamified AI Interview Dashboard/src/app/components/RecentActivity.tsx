import React from 'react';
import { Calendar, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const activities = [
  { id: 1, title: 'Mock Interview: Google L4', date: 'Today, 2:00 PM', score: '85%', result: 'pass' },
  { id: 2, title: 'Algorithm Challenge: DFS', date: 'Yesterday', score: '100%', result: 'pass' },
  { id: 3, title: 'System Design: TinyURL', date: 'Feb 10', score: '60%', result: 'fail' },
  { id: 4, title: 'Behavioral: Leadership', date: 'Feb 08', score: '92%', result: 'pass' },
];

export function RecentActivity() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Recent Missions</h3>
        <button className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1 transition-colors">
          View All <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {activities.map((item) => (
          <div key={item.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                item.result === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {item.result === 'pass' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <p className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={12} />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-mono font-bold text-sm ${
                item.result === 'pass' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {item.score}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 w-[75%]" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Weekly Goal</span>
          <span>75% Completed</span>
        </div>
      </div>
    </div>
  );
}
