import React from 'react';
import { Play, Lock, Trophy, TrendingUp } from 'lucide-react';

export interface Topic {
  id: string;
  title: string;
  icon: React.ElementType;
  totalQuestions: number;
  completedQuestions: number;
  strength: number; // 0-100
  status: 'locked' | 'unlocked';
  color: string;
}

interface TopicCardProps {
  topic: Topic;
  onStart: (id: string) => void;
}

const topicBgMap: Record<string, string> = {
  'text-sky-400': 'bg-sky-400',
  'text-yellow-400': 'bg-yellow-400',
  'text-purple-400': 'bg-purple-400',
  'text-emerald-400': 'bg-emerald-400',
  'text-red-400': 'bg-red-400',
  'text-pink-400': 'bg-pink-400',
  'text-slate-400': 'bg-slate-400',
};

const getTopicBg = (color: string) => topicBgMap[color] || 'bg-indigo-500';

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onStart }) => {
  const progress = (topic.completedQuestions / topic.totalQuestions) * 100;
  const topicBg = getTopicBg(topic.color);
  
  return (
    <div className={`bg-slate-800 rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1 ${topic.status === 'locked' ? 'border-slate-700 opacity-60' : 'border-slate-700 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${topicBg}`}>
          <topic.icon className={`w-6 h-6 ${topic.color}`} />
        </div>
        {topic.status === 'locked' ? (
          <Lock className="w-5 h-5 text-slate-600" />
        ) : (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold text-slate-300">{topic.strength}%</span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{topic.title}</h3>
      <p className="text-sm text-slate-400 mb-4">{topic.completedQuestions}/{topic.totalQuestions} Questions Solved</p>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-4">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${topicBg}`} 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="w-3 h-3" />
            <span>Top {100 - Math.floor(topic.strength * 0.8)}%</span>
         </div>
         
         <button 
           onClick={() => topic.status !== 'locked' && onStart(topic.id)}
           disabled={topic.status === 'locked'}
           className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors
             ${topic.status === 'locked' 
               ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
               : 'bg-white text-slate-900 hover:bg-indigo-50'
             }`}
         >
           {topic.status === 'locked' ? 'Locked' : 'Practice'}
           {topic.status !== 'locked' && <Play className="w-3.5 h-3.5 fill-current" />}
         </button>
      </div>
    </div>
  );
};
