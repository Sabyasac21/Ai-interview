import React from 'react';
import { Question } from '../../data/questions';
import { BookOpen, CheckCircle } from 'lucide-react';

interface QuestionPanelProps {
  question: Question;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({ question }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-3xl">
        {/* Title & Badges */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              +{question.xpReward} XP
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {question.number}. {question.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {question.tags.map((tag, idx) => (
              <span key={idx} className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Description
            </h2>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
              {question.description}
            </p>
          </div>
        </div>

        {/* Examples */}
        {question.examples && question.examples.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Examples
            </h2>
            <div className="space-y-4">
              {question.examples.map((example, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Example {idx + 1}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Input:</span>
                      <pre className="mt-1 text-sm text-emerald-400 bg-slate-950 p-2 rounded overflow-x-auto">
                        {example.input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Output:</span>
                      <pre className="mt-1 text-sm text-indigo-400 bg-slate-950 p-2 rounded overflow-x-auto">
                        {example.output}
                      </pre>
                    </div>
                    {example.explanation && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400">Explanation:</span>
                        <p className="mt-1 text-sm text-slate-300">{example.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {question.constraints && question.constraints.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Constraints
            </h2>
            <ul className="space-y-2">
              {question.constraints.map((constraint, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Cases (for coding questions) */}
        {question.testCases && question.type === 'coding' && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Sample Test Cases
            </h2>
            <div className="space-y-3">
              {question.testCases.filter(tc => !tc.hidden).map((testCase, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    Test Case {idx + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Input:</span>
                      <pre className="mt-1 text-emerald-400 bg-slate-950 p-2 rounded overflow-x-auto">
                        {JSON.stringify(testCase.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Expected:</span>
                      <pre className="mt-1 text-indigo-400 bg-slate-950 p-2 rounded overflow-x-auto">
                        {JSON.stringify(testCase.expected, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};