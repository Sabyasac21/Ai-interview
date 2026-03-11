import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { twMerge } from 'tailwind-merge';

export interface SkillData {
  subject: string;
  A: number; // Current Score
  fullMark: number;
}

interface SkillRadarProps {
  data: SkillData[];
  className?: string;
  dominantSkill?: { subject: string; score: number } | null;
  needsWorkSkill?: { subject: string; score: number } | null;
  hasActivity?: boolean;
}

export const SkillRadar: React.FC<SkillRadarProps> = ({
  data,
  className,
  dominantSkill,
  needsWorkSkill,
  hasActivity,
}) => {
  const sortedData = [...data].sort((a, b) => b.A - a.A);
  const strongest = dominantSkill
    ? { subject: dominantSkill.subject, A: dominantSkill.score }
    : (sortedData[0] || { subject: 'N/A', A: 0 });
  const weakest = needsWorkSkill
    ? { subject: needsWorkSkill.subject, A: needsWorkSkill.score }
    : (sortedData[sortedData.length - 1] || { subject: 'N/A', A: 0 });
  const showEmpty = hasActivity === false;

  return (
    <div className={twMerge("bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 flex flex-col", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Profile Analysis</h3>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">
          Live Stats
        </span>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full flex items-center justify-center -ml-4">
        {showEmpty ? (
          <div className="text-center max-w-xs ml-4">
            <p className="text-sm text-slate-400">No skill data yet.</p>
            <p className="text-xs text-slate-500 mt-1">Solve a few questions to unlock your radar chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="My Strength"
                dataKey="A"
                stroke="#818cf8"
                strokeWidth={3}
                fill="#6366f1"
                fillOpacity={0.4}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Dominant Skill</div>
          <div className="text-emerald-400 font-bold text-sm flex items-center justify-between">
            {showEmpty ? '—' : strongest.subject}
            <span className="bg-emerald-500/10 px-1.5 rounded">{showEmpty ? 0 : strongest.A}</span>
          </div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Needs Work</div>
          <div className="text-amber-400 font-bold text-sm flex items-center justify-between">
            {showEmpty ? '—' : weakest.subject}
            <span className="bg-amber-500/10 px-1.5 rounded">{showEmpty ? 0 : weakest.A}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
