import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface TestResult {
  passed: boolean;
  input: any;
  expected: any;
  actual?: any;
  error?: string;
}

interface TestCasePanelProps {
  results: TestResult[];
  isRunning: boolean;
  output?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TestCasePanel: React.FC<TestCasePanelProps> = ({ results, isRunning, output, isCollapsed = false, onToggleCollapse }) => {
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  if (isCollapsed) {
    return (
      <div className="h-12 flex items-center justify-between px-4 bg-slate-900 border-t border-slate-800">
        <span className="text-xs text-slate-400">Terminal</span>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Expand terminal"
        >
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-950 border-t border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className="text-xs font-semibold text-slate-300">Terminal</span>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          title="Collapse terminal"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isRunning && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-slate-400">Running test cases...</p>
            </div>
          </div>
        )}

        {!isRunning && results.length === 0 && !output && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Run your code to see test results</p>
            </div>
          </div>
        )}

        {!isRunning && (results.length > 0 || output) && (
          <>
            {/* Summary */}
            {results.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Results</h3>
                  <span className={`text-sm font-semibold ${
                    passedCount === totalCount ? 'text-emerald-400' : 'text-yellow-400'
                  }`}>
                    {passedCount}/{totalCount} Passed
                  </span>
                </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  passedCount === totalCount ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${(passedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Test Cases */}
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 ${
                result.passed
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-semibold text-white">
                    Test Case {idx + 1}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  result.passed
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Input:</span>
                  <pre className="mt-1 bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
                    {typeof result.input === 'object' 
                      ? JSON.stringify(result.input, null, 2)
                      : String(result.input)
                    }
                  </pre>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold">Expected:</span>
                  <pre className="mt-1 bg-slate-900 p-2 rounded overflow-x-auto text-emerald-400">
                    {typeof result.expected === 'object'
                      ? JSON.stringify(result.expected, null, 2)
                      : String(result.expected)
                    }
                  </pre>
                </div>

                {result.actual !== undefined && (
                  <div>
                    <span className="text-slate-400 font-semibold">Your Output:</span>
                    <pre className={`mt-1 bg-slate-900 p-2 rounded overflow-x-auto ${
                      result.passed ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {typeof result.actual === 'object'
                        ? JSON.stringify(result.actual, null, 2)
                        : String(result.actual)
                      }
                    </pre>
                  </div>
                )}

                {result.error && (
                  <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-red-300 font-semibold mb-1">Error:</p>
                      <p className="text-red-200">{result.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

            {/* Console Output */}
            {output && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-white mb-2">Console Output</h3>
                <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                  {output}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
