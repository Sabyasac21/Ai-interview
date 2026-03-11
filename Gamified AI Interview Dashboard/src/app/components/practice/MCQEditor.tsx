import React, { useState } from 'react';
import { Send, Lightbulb } from 'lucide-react';
import { Question } from '../../data/questions';

interface MCQEditorProps {
  question: Question;
  onSubmit: (selectedOptions: number[]) => void;
  onHintUsed?: (count: number) => void;
}

export const MCQEditor: React.FC<MCQEditorProps> = ({ question, onSubmit, onHintUsed }) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const effectiveHints = (question.hints || []).slice(0, 3);

  React.useEffect(() => {
    setShowHint(false);
    setCurrentHintIndex(0);
    onHintUsed?.(0);
  }, [question.id]);

  const handleOptionToggle = (index: number) => {
    if (question.multipleCorrect) {
      if (selectedOptions.includes(index)) {
        setSelectedOptions(selectedOptions.filter(i => i !== index));
      } else {
        setSelectedOptions([...selectedOptions, index]);
      }
    } else {
      setSelectedOptions([index]);
    }
  };

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
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">
            {question.multipleCorrect ? 'Select all that apply:' : 'Select the correct answer:'}
          </h3>

          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionToggle(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedOptions.includes(index)
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedOptions.includes(index)
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-600'
                  }`}>
                    {selectedOptions.includes(index) && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-500">
                        Option {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{option}</p>
                  </div>
                </div>
              </button>
            ))}
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
          onClick={() => onSubmit(selectedOptions)}
          disabled={selectedOptions.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Send className="w-4 h-4" />
          Submit Answer
        </button>
      </div>
    </div>
  );
};
