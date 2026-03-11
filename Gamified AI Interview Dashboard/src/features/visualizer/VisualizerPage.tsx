import React, { useState, useEffect } from 'react';
import { Play, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../api/config';
import { TraceViewer } from './TraceViewer';

// Simple code editor component (you can replace with Monaco Editor later)
const CodeEditor: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-80 p-4 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      placeholder="Write Python code here..."
      spellCheck="false"
    />
  );
};

interface VisualizeResponse {
  job_id: string;
  status: string;
}

interface JobStatusResponse {
  job_id: string;
  status: string;
  trace?: {
    steps: Array<{
      line: number;
      code: string;
      locals: Record<string, any>;
      stdout: string;
      call_stack: string[];
    }>;
    stdout: string;
    error?: string;
  };
  error?: string;
}

export const VisualizerPage: React.FC = () => {
  const { token } = useAuth();
  const [code, setCode] = useState(
    `# Example: Fibonacci
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

result = fib(5)
print(result)`
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [trace, setTrace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Poll for job status
  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/code/visualize/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const data: JobStatusResponse = await response.json();

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
          setLoading(false);

          if (data.status === 'failed') {
            setError(data.error || 'Execution failed');
            toast.error('Execution failed');
          } else {
            setTrace(data.trace);
            setError(null);
            toast.success('Execution completed');
          }

          setJobId(null);
        } else {
          setPollCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(pollInterval);
        setLoading(false);
        setError('Failed to retrieve results');
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [jobId]);

  const handleVisualize = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code');
      return;
    }

    setLoading(true);
    setError(null);
    setTrace(null);
    setPollCount(0);

    try {
      const response = await fetch(`${API_BASE_URL}/code/visualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          input_data: input,
          timeout: 3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to visualize code');
      }

      const data: VisualizeResponse = await response.json();
      setJobId(data.job_id);
      toast.loading('Executing code...');
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Python Code Visualizer</h1>
          <p className="text-slate-400">See step-by-step execution of your Python code</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-4">
            {/* Code Editor */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-3">Code</h2>
              <CodeEditor value={code} onChange={setCode} />
            </div>

            {/* Input Box */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-3">Input (Optional)</h2>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-24 p-3 font-mono text-sm bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={"Used by input() calls. Enter values line-by-line, e.g.\n5\n10"}
              />
            </div>

            {/* Visualize Button */}
            <button
              onClick={handleVisualize}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Visualize
                </>
              )}
            </button>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-200">Error</h3>
                    <p className="text-red-300 text-sm mt-1 font-mono whitespace-pre-wrap break-words">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visualization Section */}
          <div className="lg:col-span-2">
            {trace && !loading ? (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Execution Trace</h2>
                <TraceViewer
                  steps={trace.steps || []}
                  error={trace.error}
                  code={code}
                  stdout={trace.stdout || ''}
                />
              </div>
            ) : loading ? (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 flex items-center justify-center h-96">
                <div className="text-center">
                  <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-slate-300 font-semibold">
                    Executing code
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Poll attempt {pollCount}...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/50 rounded-lg border border-slate-600 border-dashed p-8 flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-slate-400">
                    Click "Visualize" to execute and visualize your code
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-3">ℹ️ Features & Limitations</h3>
          <ul className="text-slate-300 text-sm space-y-2">
            <li>✅ Step-by-step execution with variable tracking</li>
            <li>✅ View line-by-line code execution</li>
            <li>✅ Monitor variable changes in real-time</li>
            <li>⏱️ 3-second execution timeout</li>
            <li>📝 Python only (no external libraries)</li>
            <li>🔒 Sandboxed execution for safety</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
