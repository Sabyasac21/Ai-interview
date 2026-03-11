import React from 'react';
import { ArrowRight, Target, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { Topic } from './TopicCard';

interface LevelRoadmapProps {
  topics: Topic[];
  onTopicSelect: (topicId: string) => void;
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

export const LevelRoadmap: React.FC<LevelRoadmapProps> = ({ topics, onTopicSelect }) => {
  const firstUnlockedTopicId = topics.find((topic) => topic.status !== 'locked')?.id || null;
  const practicedTopics = topics
    .filter((topic) => topic.status !== 'locked')
    .filter((topic) => topic.completedQuestions > 0 || topic.strength > 0)
    .sort((a, b) => {
      const aProgress = a.totalQuestions > 0 ? (a.completedQuestions / a.totalQuestions) * 100 : 0;
      const bProgress = b.totalQuestions > 0 ? (b.completedQuestions / b.totalQuestions) * 100 : 0;
      return bProgress - aProgress;
    });

  const averageProgress = practicedTopics.length > 0
    ? Math.round(
        practicedTopics.reduce((sum, topic) => {
          if (!topic.totalQuestions) return sum;
          return sum + (topic.completedQuestions / topic.totalQuestions) * 100;
        }, 0) / practicedTopics.length
      )
    : 0;

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Learning Path</h3>
        <div className="text-xs font-medium text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
          {practicedTopics.length} Active Topic{practicedTopics.length === 1 ? '' : 's'}
        </div>
      </div>

      {practicedTopics.length === 0 ? (
        <div className="min-h-[300px] rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center text-center px-6">
          <Target className="w-10 h-10 text-indigo-400 mb-3" />
          <h4 className="text-slate-200 font-semibold mb-2">No practice activity yet</h4>
          <p className="text-sm text-slate-400 mb-4">Start a topic in Practice and your progress will appear here.</p>
          <button
            onClick={() => {
              if (firstUnlockedTopicId) onTopicSelect(firstUnlockedTopicId);
            }}
            disabled={!firstUnlockedTopicId}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
          >
            Go To Practice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Overall Topic Progress</span>
              <span className="text-sm font-semibold text-white">{averageProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${averageProgress}%` }} />
            </div>
          </div>

          {practicedTopics.map((topic, index) => {
            const progress = topic.totalQuestions > 0
              ? Math.min(100, Math.round((topic.completedQuestions / topic.totalQuestions) * 100))
              : 0;

            return (
              <motion.button
                type="button"
                key={topic.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => onTopicSelect(topic.id)}
                className="w-full text-left rounded-xl border border-slate-700 bg-slate-900/70 hover:border-indigo-500/60 hover:bg-slate-900 p-4 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-100">{topic.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {topic.completedQuestions}/{topic.totalQuestions} solved
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">{topic.strength}%</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getTopicBg(topic.color)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{progress}% complete</span>
                  <span className="inline-flex items-center gap-1 text-indigo-300 group-hover:text-indigo-200">
                    Continue Practice
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
