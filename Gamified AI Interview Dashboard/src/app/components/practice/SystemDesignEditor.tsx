import React, { useState } from 'react';
import { Send, Lightbulb, Layout } from 'lucide-react';
import { Question } from '../../data/questions';

interface SystemDesignEditorProps {
  question: Question;
  onSubmit: (answer: string) => void;
  onHintUsed?: (count: number) => void;
}

export const SystemDesignEditor: React.FC<SystemDesignEditorProps> = ({ question, onSubmit, onHintUsed }) => {
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
          {/* System Design Guide */}
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Layout className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-2">System Design Approach</h3>
                <div className="space-y-1 text-xs text-slate-300">
                  <p>1. <span className="font-semibold text-purple-400">Clarify requirements</span> - Functional & non-functional</p>
                  <p>2. <span className="font-semibold text-purple-400">Estimate scale</span> - Users, requests, storage</p>
                  <p>3. <span className="font-semibold text-purple-400">High-level design</span> - Core components & data flow</p>
                  <p>4. <span className="font-semibold text-purple-400">Deep dive</span> - Database schema, APIs, caching</p>
                  <p>5. <span className="font-semibold text-purple-400">Trade-offs</span> - Discuss scalability, reliability, consistency</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Area for Design Explanation */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Your Design Solution:</h3>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={`Describe your system design here...

Example structure:
1. Requirements
   - Functional: ...
   - Non-functional: ...

2. Capacity Estimation
   - Users: ...
   - Storage: ...

3. High-Level Architecture
   - Components: ...
   - Data flow: ...

4. Detailed Design
   - Database schema: ...
   - API endpoints: ...
   - Caching strategy: ...

5. Trade-offs & Considerations
   - ...`}
              className="w-full h-[500px] p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono"
            />
            
            <div className="mt-2 text-xs text-slate-500">
              {wordCount} words • Use markdown-style formatting for better readability
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

          {/* Additional Tips */}
          <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
            <p className="text-xs text-slate-400 mb-2 font-semibold">💡 Design Tips:</p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li>Start with requirements clarification and scale estimation</li>
              <li>Draw diagrams or describe component interactions clearly</li>
              <li>Discuss database choices (SQL vs NoSQL) with justification</li>
              <li>Address caching, load balancing, and CDN if applicable</li>
              <li>Consider failure scenarios and monitoring</li>
            </ul>
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
          Submit Design
        </button>
      </div>
    </div>
  );
};
