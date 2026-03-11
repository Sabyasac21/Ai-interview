import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { fetchQuestionDetail, submitAnswer, startPracticeSession, pollJudgeResult, claimJudgeResult, fetchPracticeHistory } from '../../api/questions';
import { useAuth } from '../../context/AuthContext';
import { QuestionPanel } from '../components/practice/QuestionPanel';
import { CodeEditor } from '../components/practice/CodeEditor';
import { MCQEditor } from '../components/practice/MCQEditor';
import { TextEditor } from '../components/practice/TextEditor';
import { SystemDesignEditor } from '../components/practice/SystemDesignEditor';
import { TestCasePanel } from '../components/practice/TestCasePanel';
import { ResultsModal } from '../components/practice/ResultsModal';
import SubmissionViewerModal from '../components/practice/SubmissionViewerModal';
import SubmissionsListModal from '../components/practice/SubmissionsListModal';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { recordContribution } from '../utils/contributionTracker';

interface PracticeSessionPageProps {
  questionId: string;
  onBack: () => void;
  onQuestionChange: (questionId: string) => void;
}

interface Question {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type?: 'coding' | 'mcq' | 'descriptive' | 'system-design';
  description?: string;
  hints?: string[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  starter_code?: {
    javascript?: string;
    typescript?: string;
    python?: string;
  };
  test_cases?: Array<{
    input: any;
    expected: any;
    hidden?: boolean;
  }>;
  solution?: string;
  solution_explanation?: string;
}

interface TestResult {
  passed: boolean;
  input: any;
  expected: any;
  actual?: any;
  error?: string;
}

interface Submission {
  passed: boolean;
  feedback: string;
  xpEarned: number;
}

export const PracticeSessionPage: React.FC<PracticeSessionPageProps> = ({
  questionId,
  onBack,
  onQuestionChange
}) => {
  const { token, refreshUser } = useAuth();
  const [question, setQuestion] = useState<Question | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [recentSubmission, setRecentSubmission] = useState<any | null>(null);
  const [previouslySolved, setPreviouslySolved] = useState(false);
  const [alreadySolved, setAlreadySolved] = useState(false);
  // derive initial editor values from the latest submission
  // if there is a recent submission, use its code/language; otherwise undefined to trigger starter/template
  const initialCode = recentSubmission?.code ?? undefined;
  const initialLanguage = recentSubmission?.language ?? undefined;
  React.useEffect(() => {
    console.log(`[PracticeSessionPage] CodeEditor props updated: initialCode_len=${initialCode?.length || 0}, initialLanguage=${initialLanguage}, questionId=${questionId}, recentSubmission_id=${recentSubmission?.submission_id}`);
  }, [initialCode, initialLanguage, questionId, recentSubmission?.submission_id]);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [showSubmissionViewer, setShowSubmissionViewer] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [showSubmissionsList, setShowSubmissionsList] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const currentQuestionIdRef = useRef<string>(questionId);

  // Update ref whenever questionId changes
  useEffect(() => {
    currentQuestionIdRef.current = questionId;
  }, [questionId]);

  // Fetch question details from API
  useEffect(() => {
    const loadQuestion = async () => {
      if (!token) return;
      
      console.log(`\n[PracticeSessionPage] ===== LOADING QUESTION ID: ${questionId} =====`);
      
      try {
        setLoading(true);
        setError(null);
        
        // Clear previous question's data immediately
        console.log('[PracticeSessionPage] Clearing previous question data...');
        setRecentSubmission(null);
        setRecentHistory([]);
        setPreviouslySolved(false);
        setAlreadySolved(false);
        setHintsUsed(0);
        
        const q = await fetchQuestionDetail(questionId, token);
        console.log(`[PracticeSessionPage] Loaded question: title="${q.title}", id=${q.id}`);
        setQuestion(q);
        
        // Start a practice session
        const session = await startPracticeSession(questionId, token);
        setSessionId(session.session_id);
        console.log(`[PracticeSessionPage] Started session: ${session.session_id}`);
        
        // Load most recent submission for this question (if any)
        try {
          console.log(`[PracticeSessionPage] Fetching history for questionId=${questionId}`);
          const history = await fetchPracticeHistory(token, 1, questionId);
          console.debug('[PracticeSessionPage] Fetched history for question', questionId, history);
          
          // IMPORTANT: Check if the current question ID still matches
          // If user switched questions while fetch was in progress, ignore the old result
          if (questionId !== currentQuestionIdRef.current) {
            console.log(`[PracticeSessionPage] ⚠️ Question changed during fetch (was ${questionId}, now ${currentQuestionIdRef.current}), ignoring stale result`);
            return;
          }
          
          if (Array.isArray(history)) {
            setRecentHistory(history);
            if (history.length > 0) {
              const latest = history[0];
              console.log(`[PracticeSessionPage] Latest submission found: code_len=${latest.code?.length || 0}, question_id=${latest.question_id}, actual_question=${questionId}`);
              // Verify the returned submission actually belongs to this question
              if (latest.question_id && latest.question_id !== questionId) {
                console.warn(`[PracticeSessionPage] ⚠️ MISMATCH: Returned submission is for question ${latest.question_id}, but we requested ${questionId}!`);
                return;
              }
              // Check if this question was previously solved
              if (latest.passed === true || latest.correct === true) {
                setPreviouslySolved(true);
              }
              // only treat it as a "submission" if it actually contains code/answer
              if (latest.code || latest.answer_text) {
                console.log('[PracticeSessionPage] Setting recentSubmission with code/answer');
                setRecentSubmission(latest);
              } else {
                console.log('[PracticeSessionPage] Latest submission has no code/answer, skipping');
              }
            } else {
              console.log('[PracticeSessionPage] No history found for this question');
            }
          }
        } catch (e) {
          console.debug('Failed to load practice history', e);
        }

        setTestResults([]);
        setTimeElapsed(0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, token]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [questionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Local evaluation logic used for "Run Code" clicks.
  // This executes the user-provided JavaScript/TypeScript in the browser,
  // finds the `solution` or `solve` function, and runs it against the
  // test cases already shipped with the question.  It mimics the judge
  // service so that the run button produces deterministic results.
  const evaluateCode = (code: string, language: string): TestResult[] => {
    if (!question?.test_cases) return [];

    // only support JS/TS locally; other languages simply return errors
    if (language !== 'javascript' && language !== 'typescript') {
      return question.test_cases.map(tc => ({
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: undefined,
        error: `Run not supported for language ${language}`,
      }));
    }

    // strip the autogenerated harness (example invocation) from the code
    let cleaned = code;
    const harnessIdx = cleaned.indexOf('// Test with');
    if (harnessIdx !== -1) {
      cleaned = cleaned.slice(0, harnessIdx);
    }
    cleaned = cleaned
      .split('\n')
      .filter(l => !/^(\s*)(const|let|var)\s+result\b/.test(l))
      .join('\n');

    const results: TestResult[] = [];

    // helper that attempts to invoke the user function with a given input
    const runFunc = (fn: any, input: any) => {
      if (typeof fn !== 'function') {
        throw new Error('No solution/solve function found');
      }
      if (Array.isArray(input)) {
        // Most array questions expect a single array argument.
        // Only spread when function clearly expects multiple params.
        try {
          if (fn.length > 1) {
            return fn(...input);
          }
          return fn(input);
        } catch {
          return fn(input);
        }
      }
      if (input && typeof input === 'object' && !Array.isArray(input)) {
        const keys = Object.keys(input);
        // If input is a wrapper like { arr: [...] }, pass the array directly for single-arg functions.
        if (fn.length <= 1 && keys.length === 1) {
          const onlyKey = keys[0];
          if (onlyKey === 'arr' || onlyKey === 'array' || onlyKey === 'nums') {
            return fn((input as any)[onlyKey]);
          }
        }
        // if the user defined multiple parameters, spread object values
        if (fn.length > 1) {
          return fn(...Object.values(input));
        }
        return fn(input);
      }
      return fn(input);
    };

    // compile user code to obtain the solution/solve function
    let userFn: any = null;
    try {
      const wrapper = new Function(`${cleaned};
        if (typeof solution !== 'undefined') return solution;
        if (typeof solve !== 'undefined') return solve;
        return null;
      `);
      userFn = wrapper();
      if (!userFn) {
        throw new Error('No solution() or solve() function found');
      }
    } catch (err: any) {
      question.test_cases.forEach(tc => {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: undefined,
          error: err.message || String(err),
        });
      });
      return results;
    }

    // log number of test cases when running locally
    // eslint-disable-next-line no-console
    console.debug('[evaluateCode] running', question.test_cases.length, 'test cases');
    question.test_cases.forEach(tc => {
      let passed = false;
      let actual: any = undefined;
      let error: string | undefined;

      // mimic judge parsing of string inputs
      let testInput: any = tc.input;
      if (typeof testInput === 'string') {
        // try JSON first
        try {
          testInput = JSON.parse(testInput);
        } catch {
          // not JSON, attempt to extract common patterns like "nums=[..], target=.."
          const numsMatch = testInput.match(/nums\s*=\s*\[([^\]]*)\]/);
          const targetMatch = testInput.match(/target\s*=\s*(-?\d+)/);
          if (numsMatch) {
            const arr = numsMatch[1]
              .split(',')
              .map(x => Number(x.trim()))
              .filter(x => !isNaN(x));
            testInput = { nums: arr };
            if (targetMatch) {
              testInput.target = Number(targetMatch[1]);
            }
          }
        }
      }

      // convenience destructuring used by some questions
      let nums: any, target: any;
      if (typeof testInput === 'object' && testInput !== null) {
        ({ nums, target } = testInput as any);
      }

      // Parse expected field (may be string in legacy format)
      let testExpected: any = tc.expected;
      if (typeof testExpected === 'string') {
        try {
          testExpected = JSON.parse(testExpected);
        } catch {
          // keep as string if not parseable JSON
        }
      }

      try {
        actual = runFunc(userFn, testInput);
        passed = JSON.stringify(actual) === JSON.stringify(testExpected);
      } catch (e: any) {
        passed = false;
        error = e?.message || String(e);
      }
      results.push({
        passed,
        input: tc.input,
        expected: testExpected,
        actual,
        error,
      });
    });

    return results;
  };

  const evaluateText = (answer: string): boolean => {
    // Mock evaluation - always pass if answer has some content
    return answer.trim().length > 50;
  };
  // Handlers
  const handleRunCode = (code: string, language: string) => {
    setIsRunning(true);
    
    setTimeout(() => {
      const results = evaluateCode(code, language);
      setTestResults(results);
      setIsRunning(false);
    }, 1500);
  };

  const handleSubmitCode = async (code: string, language: string) => {
    if (!sessionId || !token) {
      toast.error('Session not initialized');
      return;
    }

    setIsRunning(true);
    toast.loading('Submitting your code for evaluation...');

    try {
      // Step 1: Submit code and get job ID
      const submitRes = await submitAnswer(sessionId, code, undefined, language as any, timeElapsed, hintsUsed, token);
      const jobId = submitRes.job_id;
      
      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      // Step 2: Poll for results until ready
      let jobResult = null;
      let pollAttempts = 0;
      const maxAttempts = 60; // 30 seconds with 500ms intervals
      
      while (pollAttempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before polling
        const polled = await pollJudgeResult(jobId, token);
        
        if (polled.status === 'completed') {
          jobResult = polled;
          break;
        } else if (polled.status === 'error') {
          throw new Error(polled.error || 'Judge returned error');
        }
        
        pollAttempts++;
      }
      
      if (!jobResult) {
        throw new Error('Judge timeout: No response from evaluation service');
      }

      // Step 3: Claim the result to finalize session and update progress
      const claimRes = await claimJudgeResult(jobId, token);
      
      // Update UI with results
      if (claimRes.results) {
        setTestResults(claimRes.results);
      }
      
      const passed = claimRes.passed ?? false;
      if (passed) {
        setPreviouslySolved(true);
      }
      recordContribution({
        practice_submissions_count: 1,
        practice_solved_count: passed ? 1 : 0,
      });
      // Check if this is a resubmission of an already solved question
      // Only show "Already Submitted" if: (1) question was previously solved, (2) current submission passes
      setAlreadySolved(previouslySolved && passed);
      
      const submission: Submission = {
        passed,
        feedback: passed
          ? `Great job! Your solution scored ${claimRes.score ?? 0}. 🎉`
          : claimRes.testsPassed !== undefined && claimRes.testsTotal !== undefined
            ? `Your solution passed ${claimRes.testsPassed}/${claimRes.testsTotal} test cases. Review the failed cases and try again.`
            : 'Your solution did not pass the tests. Try again.',
        xpEarned: claimRes.xpEarned || 0,
      };
      setSubmissionResult(submission);
      setShowResults(true);

      // Add submission to recent history immediately (don't wait for API)
      const newSubmissionEntry = {
        submission_id: jobId,
        question_id: questionId,
        code,
        language,
        passed: claimRes.passed ?? false,
        correct: claimRes.passed ?? false,
        status: 'completed',
        score: claimRes.score,
        testsPassed: claimRes.testsPassed,
        testsTotal: claimRes.testsTotal,
        feedback: submission.feedback,
        xpEarned: claimRes.xpEarned,
        submitted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        results: claimRes.results,
      };
      setRecentHistory(prev => [newSubmissionEntry, ...prev]);
      setRecentSubmission(newSubmissionEntry);

      // Refresh user profile
      if (refreshUser) {
        await refreshUser();
      }
      // Refresh recent submissions list from API (only latest for this question)
      try {
        const history = await fetchPracticeHistory(token, 1, questionId);
        if (Array.isArray(history)) {
          setRecentHistory(history);
          if (history.length > 0) {
            const latest = history[0];
            if (latest.code || latest.answer_text) {
              setRecentSubmission(latest);
            }
          }
        }
      } catch (e) {
        console.debug('Failed to refresh practice history', e);
      }
      
      toast.dismiss();
      if (passed) {
        toast.success('All tests passed! 🎉');
      } else {
        toast.info('Evaluation complete. Review the test results.');
      }
    } catch (err) {
      toast.dismiss();
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit answer';
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitText = async (answer: string) => {
    if (!sessionId || !token) {
      toast.error('Session not initialized');
      return;
    }

    setIsRunning(true);
    toast.loading('Evaluating your response...');

    try {
      // Step 1: Submit answer and get job ID
      const submitRes = await submitAnswer(sessionId, undefined, answer, undefined, timeElapsed, hintsUsed, token);
      const jobId = submitRes.job_id;
      
      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      // Step 2: Poll for results until ready
      let jobResult = null;
      let pollAttempts = 0;
      const maxAttempts = 60;
      
      while (pollAttempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const polled = await pollJudgeResult(jobId, token);
        
        if (polled.status === 'completed') {
          jobResult = polled;
          break;
        } else if (polled.status === 'error') {
          throw new Error(polled.error || 'Evaluation failed');
        }
        
        pollAttempts++;
      }
      
      if (!jobResult) {
        throw new Error('Evaluation timeout');
      }

      // Step 3: Claim result
      const claimRes = await claimJudgeResult(jobId, token);
      
      const passed = claimRes.passed ?? false;
      if (passed) {
        setPreviouslySolved(true);
      }
      recordContribution({
        practice_submissions_count: 1,
        practice_solved_count: passed ? 1 : 0,
      });
      // Check if this is a resubmission of an already solved question
      // Only show "Already Submitted" if: (1) question was previously solved, (2) current submission passes
      setAlreadySolved(previouslySolved && passed);
      
      const submission: Submission = {
        passed,
        feedback: passed
          ? 'Great answer! Your response demonstrates good understanding.'
          : 'Your answer needs more detail. Try to provide a more comprehensive explanation.',
        xpEarned: claimRes.xpEarned || 0,
      };
      setSubmissionResult(submission);
      setShowResults(true);

      // Add submission to recent history immediately (don't wait for API)
      const newSubmissionEntry = {
        submission_id: jobId,
        question_id: questionId,
        answer_text: answer,
        payload: answer,
        passed: claimRes.passed ?? false,
        correct: claimRes.passed ?? false,
        status: 'completed',
        score: claimRes.score,
        feedback: submission.feedback,
        xpEarned: claimRes.xpEarned,
        submitted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      setRecentHistory(prev => [newSubmissionEntry, ...prev]);
      setRecentSubmission(newSubmissionEntry);

      if (refreshUser) await refreshUser();
      // Refresh recent submissions list from API (only latest for this question)
      try {
        const history = await fetchPracticeHistory(token, 1, questionId);
        if (Array.isArray(history)) {
          setRecentHistory(history);
          if (history.length > 0) {
            const latest = history[0];
            if (latest.code || latest.answer_text) {
              setRecentSubmission(latest);
            }
          }
        }
      } catch (e) {
        console.debug('Failed to refresh practice history', e);
      }
      
      toast.dismiss();
      if (passed) {
        toast.success('Great response! ✨');
      } else {
        toast.info('Evaluation complete. Try to provide more detail.');
      }
    } catch (err) {
      toast.dismiss();
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit answer';
      toast.error(errorMsg);
      console.error('Failed to submit answer:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Keep user on the same question after submission; do not auto-advance.
  const handleNextQuestion = () => {
    // Intentionally do not call onQuestionChange here — just close results
    // so the user remains on the current question and can review the feedback.
    setShowResults(false);
  };

  const renderEditor = () => {
    if (!question) return null;

    switch (question.type) {
      case 'coding':
        return (
          <CodeEditor
            question={question}
            onSubmit={handleSubmitCode}
            onRun={handleRunCode}
            initialCode={initialCode}
            initialLanguage={initialLanguage}
            onHintUsed={(count) => setHintsUsed(count)}
          />
        );
      case 'mcq':
        return (
          <MCQEditor
            question={question}
            onSubmit={handleSubmitText}
            onHintUsed={(count) => setHintsUsed(count)}
          />
        );
      case 'descriptive':
        return (
          <TextEditor
            question={question}
            onSubmit={handleSubmitText}
            onHintUsed={(count) => setHintsUsed(count)}
          />
        );
      case 'system-design':
        return (
          <SystemDesignEditor
            question={question}
            onSubmit={handleSubmitText}
            onHintUsed={(count) => setHintsUsed(count)}
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-slate-400">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-4">{error || 'Question not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-lg font-bold text-white">
              {question.title}
            </h1>
            <span className={`text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeElapsed)}</span>
          </div>
          <div>
            <button
              onClick={() => setShowSubmissionsList(true)}
              className="ml-3 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 hover:bg-slate-700"
            >
              View Submissions
            </button>
          </div>
        </div>
      </div>



      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {question.type === 'coding' ? (
          <PanelGroup direction="horizontal">
            {/* Question Panel */}
            <Panel defaultSize={40} minSize={30}>
              <QuestionPanel question={question} />
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 transition-colors" />

            {/* Editor + Test Results */}
            <Panel defaultSize={60} minSize={40}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={isTerminalCollapsed ? 90 : 65} minSize={40}>
                  {renderEditor()}
                </Panel>

                {!isTerminalCollapsed && (
                  <>
                    <PanelResizeHandle className="h-1 bg-slate-800 hover:bg-indigo-500 transition-colors" />

                    <Panel defaultSize={35} minSize={20}>
                      <TestCasePanel
                        results={testResults}
                        isRunning={isRunning}
                        isCollapsed={isTerminalCollapsed}
                        onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                      />
                    </Panel>
                  </>
                )}
                
                {isTerminalCollapsed && (
                  <div className="h-auto">
                    <TestCasePanel
                      results={testResults}
                      isRunning={isRunning}
                      isCollapsed={isTerminalCollapsed}
                      onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                    />
                  </div>
                )}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        ) : (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} minSize={30}>
              <QuestionPanel question={question} />
            </Panel>

            <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-indigo-500 transition-colors" />

            <Panel defaultSize={60} minSize={40}>
              {renderEditor()}
            </Panel>
          </PanelGroup>
        )}
      </div>

      {/* Results Modal */}
      {submissionResult && (
        <ResultsModal
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          passed={submissionResult.passed}
          testsPassed={submissionResult.testsPassed}
          testsTotal={submissionResult.testsTotal}
          xpEarned={submissionResult.xpEarned}
          feedback={submissionResult.feedback}
          onNextQuestion={handleNextQuestion}
          alreadySolved={alreadySolved}
        />
      )}
      <SubmissionViewerModal
        isOpen={showSubmissionViewer}
        onClose={() => { setShowSubmissionViewer(false); setSelectedSubmission(null); }}
        submission={selectedSubmission}
      />
      <SubmissionsListModal
        isOpen={showSubmissionsList}
        onClose={() => setShowSubmissionsList(false)}
        submissions={recentHistory}
        onView={(s) => { setSelectedSubmission(s); setShowSubmissionViewer(true); setShowSubmissionsList(false); }}
        onOpen={async () => {
          try {
            const h = await fetchPracticeHistory(token || '', 50, questionId);
            if (Array.isArray(h)) {
              setRecentHistory(h);
            }
          } catch (e) {
            console.debug('Failed to fetch submissions when modal opened', e);
          }
        }}
      />
    </div>
  );
};
