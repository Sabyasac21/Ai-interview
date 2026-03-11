import React, { useState } from 'react';
import { CheckCircle, XCircle, Trophy, ArrowRight, X, Zap } from 'lucide-react';
import { AlgorithmVisualizer } from './AlgorithmVisualizer';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passed: boolean;
  testsPassed?: number;
  testsTotal?: number;
  xpEarned: number;
  feedback: string;
  onNextQuestion?: () => void;
  onViewSolution?: () => void;
  alreadySolved?: boolean;
  submittedCode?: string;
  questionTitle?: string;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  passed,
  testsPassed,
  testsTotal,
  xpEarned,
  feedback,
  onNextQuestion,
  onViewSolution,
  alreadySolved = false,
  submittedCode = '',
  questionTitle = ''
}) => {
  const [showVisualizer, setShowVisualizer] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className={`p-6 text-center ${
          alreadySolved
            ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10'
            : passed 
              ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10' 
              : 'bg-gradient-to-br from-red-500/20 to-red-600/10'
        }`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
            alreadySolved
              ? 'bg-blue-500/20'
              : passed 
                ? 'bg-emerald-500/20' 
                : 'bg-red-500/20'
          }`}>
            {alreadySolved ? (
              <CheckCircle className="w-10 h-10 text-blue-400" />
            ) : passed ? (
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {alreadySolved 
              ? '✅ Already Submitted' 
              : passed 
                ? 'Congratulations! 🎉' 
                : 'Not Quite Right'}
          </h2>
          
          {testsTotal !== undefined && testsPassed !== undefined && (
            <p className="text-lg text-slate-300">
              {testsPassed}/{testsTotal} Test Cases Passed
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* XP Earned */}
          {passed && !alreadySolved && xpEarned > 0 && (
            <div className="flex items-center justify-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-indigo-400" />
              <div>
                <p className="text-sm text-slate-400">XP Earned</p>
                <p className="text-2xl font-bold text-indigo-400">+{xpEarned}</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Feedback</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {alreadySolved 
                ? "You've already submitted a correct solution for this question. No additional XP earned." 
                : feedback}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {passed && onNextQuestion && (
              <button
                onClick={onNextQuestion}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {!passed && (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            )}

            {passed && submittedCode && (
              <button
                onClick={() => setShowVisualizer(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors"
              >
                <Zap className="w-4 h-4" />
                Visualize Solution
              </button>
            )}

            {onViewSolution && (
              <button
                onClick={onViewSolution}
                className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors"
              >
                View Solution
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Algorithm Visualizer Modal */}
      <AlgorithmVisualizer
        isOpen={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        code={submittedCode}
        questionTitle={questionTitle}
      />
    </div>
  );
};
