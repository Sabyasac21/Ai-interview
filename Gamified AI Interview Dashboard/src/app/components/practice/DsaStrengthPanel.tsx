import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { DsaStrengthItem } from '../../utils/dsaStrength';

const strengthColor = (value: number) => {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 50) return 'bg-sky-500';
  if (value >= 25) return 'bg-amber-500';
  if (value > 0) return 'bg-rose-500';
  return 'bg-slate-600';
};

export const DsaStrengthPanel = ({
  items,
  totalSolved,
  totalQuestions,
}: {
  items: DsaStrengthItem[];
  totalSolved: number;
  totalQuestions: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.strength - a.strength);
  }, [items]);
  const visibleItems = expanded ? sortedItems : sortedItems.slice(0, 8);

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 text-slate-200">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm">DSA Strength by Topic</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            {totalSolved}/{totalQuestions} solved
          </div>
          <span className="text-xs text-indigo-300 flex items-center gap-1">
            {collapsed ? 'Expand' : 'Collapse'}
            {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </span>
        </div>
      </button>

      {collapsed ? null : items.length === 0 ? (
        <div className="text-sm text-slate-400">
          No DSA questions found yet. Start solving to see subtopic strength.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {visibleItems.map((item) => (
            <div key={item.key} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span className="whitespace-nowrap">{item.label}</span>
                <span className="text-slate-400">{item.strength}%</span>
              </div>
              <div className="mt-2 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${strengthColor(item.strength)} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, item.strength))}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                {item.solved}/{item.total} solved
              </div>
            </div>
          ))}
          {sortedItems.length > 8 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
            >
              {expanded ? 'Show less' : 'Show all'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
