import React, { useState } from 'react';
import { Send, Lightbulb, FileText } from 'lucide-react';
import { Question } from '../../data/questions';

interface TextEditorProps {
  question: Question;
  onSubmit: (answer: string) => void;
  onHintUsed?: (count: number) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ question, onSubmit, onHintUsed }) => {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const effectiveHints = (question.hints || []).slice(0, 3);

  React.useEffect(() => {
    setShowHint(false);
    setCurrentHintIndex(0);
    onHintUsed?.(0);
  }, [question.id]);

  const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = answer.length;

  const handleShowHint = () => {
    if (effectiveHints.length > 0) {
      setShowHint(true);
      const used = Math.max(1, currentHintIndex + 1);
      onHintUsed?.(used);
    }
  };

  const handleNextHint = () => {
    if (currentHintIndex < effectiveHints.length - 1) {
      const nextIndex = currentHintIndex + 1;
      setCurrentHintIndex(nextIndex);
      onHintUsed?.(nextIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* STAR Method Guide for Behavioral Questions */}
          {question.topic === 'behavioral' && (
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-indigo-300 mb-2">STAR Method Framework</h3>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p><span className="font-semibold text-indigo-400">Situation:</span> Set the context and background</p>
                    <p><span className="font-semibold text-indigo-400">Task:</span> Describe the challenge or goal</p>
                    <p><span className="font-semibold text-indigo-400">Action:</span> Explain the steps you took</p>
                    <p><span className="font-semibold text-indigo-400">Result:</span> Share the outcome and what you learned</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-[400px] p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            
            {/* Word Count */}
            <div className="absolute bottom-3 right-3 flex items-center gap-3 text-xs text-slate-500">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>

          {/* Hint Section */}
          {showHint && effectiveHints.length > 0 && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-200">
                    <span className="font-semibold">Hint {currentHintIndex + 1}:</span>{' '}
                    {effectiveHints[currentHintIndex]}
                  </p>
                  <p className="text-xs text-amber-300/80 mt-1">
                    XP impact: {question.difficulty === 'hard' ? 100 : question.difficulty === 'medium' ? 50 : 25} base, -20% per hint used.
                  </p>
                  {currentHintIndex < effectiveHints.length - 1 && (
                    <button
                      onClick={handleNextHint}
                      className="text-xs text-amber-400 hover:text-amber-300 mt-1 underline"
                    >
                      Show next hint
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 text-xs text-slate-500">
            <p>💡 Tip: Aim for 150-250 words for a comprehensive answer. Be specific and provide examples.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
        <button
          onClick={handleShowHint}
          disabled={effectiveHints.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          Get Hint
        </button>

        <button
          onClick={() => onSubmit(answer)}
          disabled={answer.trim().length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Send className="w-4 h-4" />
          Submit Answer
        </button>
      </div>
    </div>
  );
};
