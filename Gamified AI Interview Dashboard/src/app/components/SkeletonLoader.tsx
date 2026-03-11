import React from 'react';

/**
 * Skeleton loader for question cards
 */
export const QuestionSkeletonLoader: React.FC = () => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className="mt-1 w-5 h-5 bg-slate-800 rounded-full" />

        {/* Question Info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              {/* Title */}
              <div className="h-5 bg-slate-800 rounded mb-3 w-3/4" />

              {/* Tags row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-6 w-16 bg-slate-800 rounded" />
                <div className="h-6 w-12 bg-slate-800 rounded" />
                <div className="h-6 w-20 bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for multiple question cards
 */
export const QuestionsSkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <QuestionSkeletonLoader key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton loader for header stats
 */
export const StatsSkeletonLoader: React.FC = () => {
  return (
    <div className="flex items-center gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-6 w-24 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for filters
 */
export const FiltersSkeletonLoader: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 animate-pulse">
      <div className="h-10 w-64 bg-slate-800 rounded-lg" />
      <div className="h-10 w-40 bg-slate-800 rounded-lg" />
      <div className="h-10 w-40 bg-slate-800 rounded-lg" />
    </div>
  );
};
