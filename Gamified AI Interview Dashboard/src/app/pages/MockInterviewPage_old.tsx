import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Clock, Star, MessageSquare, CheckCircle, XCircle, Mic, MicOff, Video, VideoOff } from 'lucide-react';

// API functions
const fetchTemplates = async () => {
  const token = localStorage.getItem('interviewai_token');
  const response = await fetch('http://localhost:8004/templates', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
};

const fetchUserSessions = async () => {
  const token = localStorage.getItem('interviewai_token');
  const response = await fetch('http://localhost:8004/sessions', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
};

const createSession = async (templateId: number) => {
  const token = localStorage.getItem('interviewai_token');
  const response = await fetch(`http://localhost:8004/sessions?template_id=${templateId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
};

const startSession = async (sessionId: number) => {
  const token = localStorage.getItem('interviewai_token');
  const response = await fetch(`http://localhost:8004/sessions/${sessionId}/start`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to start session');
  return response.json();
};

const submitResponse = async (sessionId: number, questionId: number, responseData: any) => {
  const token = localStorage.getItem('interviewai_token');
  const response = await fetch(`http://localhost:8004/sessions/${sessionId}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      question_id: questionId,
      ...responseData
    })
  });
  if (!response.ok) throw new Error('Failed to submit response');
  return response.json();
};

const completeSession = async (sessionId: number) => {
  const token = localStorage.getItem('interviewai_token');
  const response = await fetch(`http://localhost:8004/sessions/${sessionId}/complete`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to complete session');
  return response.json();
};

export const MockInterviewPage: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, sessionsData] = await Promise.all([
        fetchTemplates(),
        fetchUserSessions()
      ]);
      setTemplates(templatesData);
      setUserSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (template: any) => {
    try {
      // Create new session
      const sessionData = await createSession(template.id);
      const sessionId = sessionData.session_id;

      // Start the session
      await startSession(sessionId);

      // Fetch full template with questions
      const token = localStorage.getItem('interviewai_token');
      const templateResponse = await fetch(`http://localhost:8004/templates/${template.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullTemplate = await templateResponse.json();

      setSelectedInterview({ ...template, sessionId });
      setCurrentQuestions(fullTemplate.questions);
      setCurrentQuestion(0);
      setTimeLeft(fullTemplate.questions[0].time_limit_seconds);
      setShowResults(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    }
  };

  const nextQuestion = async () => {
    try {
      // Submit current response (dummy text for now)
      const currentQ = currentQuestions[currentQuestion];
      await submitResponse(selectedInterview.sessionId, currentQ.id, {
        response_text: "Sample response for demonstration purposes.",
        response_time_seconds: currentQ.time_limit_seconds - timeLeft
      });

      if (currentQuestion < currentQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(currentQuestions[currentQuestion + 1].time_limit_seconds);
      } else {
        // Complete the session
        await completeSession(selectedInterview.sessionId);
        setShowResults(true);
        // Reload sessions
        loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'scheduled': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-[var(--color-muted-foreground)]">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedInterview && !showResults) {
    const question = currentQuestions[currentQuestion];
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{selectedInterview.title}</h2>
              <p className="text-[var(--color-muted-foreground)]">{selectedInterview.company}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-[var(--color-muted-foreground)]">Question {currentQuestion + 1} of {currentQuestions.length}</p>
                <p className="text-lg font-semibold text-[var(--color-foreground)]">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} transition-colors`}
              >
                {isRecording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">{question.question}</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(question.question_type === 'technical' ? 'Medium' : 'Easy')}`}>
                {question.question_type}
              </span>
              <span className="text-[var(--color-muted-foreground)] text-sm">
                Time limit: {question.time_limit_seconds}s
              </span>
            </div>
            <div className="bg-[var(--color-background)] rounded-lg p-4 border border-[var(--color-border)]">
              <h4 className="font-semibold text-[var(--color-foreground)] mb-2">Hints:</h4>
              <ul className="text-[var(--color-muted-foreground)] space-y-1">
                {question.hints.map((hint: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedInterview(null)}
              className="px-6 py-3 bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 text-[var(--color-foreground)] rounded-lg transition-colors"
            >
              End Interview
            </button>
            <button
              onClick={nextQuestion}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {currentQuestion === currentQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8 shadow-xl">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">Interview Completed!</h2>
            <p className="text-[var(--color-muted-foreground)]">Here's your performance summary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--color-background)] rounded-lg p-6 border border-[var(--color-border)] text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">85%</div>
              <p className="text-[var(--color-muted-foreground)]">Overall Score</p>
            </div>
            <div className="bg-[var(--color-background)] rounded-lg p-6 border border-[var(--color-border)] text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">8/10</div>
              <p className="text-[var(--color-muted-foreground)]">Questions Answered</p>
            </div>
            <div className="bg-[var(--color-background)] rounded-lg p-6 border border-[var(--color-border)] text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">42min</div>
              <p className="text-[var(--color-muted-foreground)]">Total Duration</p>
            </div>
          </div>

          <div className="bg-[var(--color-background)] rounded-lg p-6 border border-[var(--color-border)] mb-6">
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">AI Feedback</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">Strong Technical Knowledge</p>
                  <p className="text-[var(--color-muted-foreground)]">You demonstrated excellent understanding of core concepts and best practices.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">Communication Skills</p>
                  <p className="text-[var(--color-muted-foreground)]">Work on being more concise and structured in your responses.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setSelectedInterview(null)}
              className="flex-1 px-6 py-3 bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 text-[var(--color-foreground)] rounded-lg transition-colors"
            >
              Back to Interviews
            </button>
            <button
              onClick={() => startInterview(selectedInterview)}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Retake Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">Mock Interviews</h1>
          <p className="text-[var(--color-muted-foreground)]">Practice real interview scenarios with AI-powered feedback</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Completed/Scheduled Sessions */}
          {userSessions.map((session: any) => (
            <motion.div
              key={session.id}
              whileHover={{ scale: 1.02 }}
              className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">{session.template.title}</h3>
                  <p className="text-[var(--color-muted-foreground)] text-sm">{session.template.company}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(session.template.difficulty)}`}>
                  {session.template.difficulty}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <Clock className="w-4 h-4" />
                  {session.template.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <MessageSquare className="w-4 h-4" />
                  {session.template.question_count} questions
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`}></span>
                  <span className="text-[var(--color-muted-foreground)] capitalize">{session.status.replace('_', ' ')}</span>
                </div>
              </div>

              {session.total_score && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[var(--color-muted-foreground)]">Score</span>
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">{session.total_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-muted)] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                      style={{ width: `${session.total_score}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                onClick={() => session.status === 'completed' ? setSelectedInterview(session) : null}
                disabled={session.status !== 'completed'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  session.status !== 'completed'
                    ? 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {session.status === 'completed' ? 'Review Results' : session.status === 'in_progress' ? 'Continue' : 'Scheduled'}
              </button>
            </motion.div>
          ))}

          {/* Available Templates */}
          {templates.map((template: any) => (
            <motion.div
              key={`template-${template.id}`}
              whileHover={{ scale: 1.02 }}
              className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">{template.title}</h3>
                  <p className="text-[var(--color-muted-foreground)] text-sm">{template.company}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <Clock className="w-4 h-4" />
                  {template.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <MessageSquare className="w-4 h-4" />
                  {template.question_count} questions
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full text-green-400"></span>
                  <span className="text-[var(--color-muted-foreground)]">Available</span>
                </div>
              </div>

              <button
                onClick={() => startInterview(template)}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Start Interview
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl border border-indigo-500/20 p-8">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Custom Interview</h3>
            <p className="text-[var(--color-muted-foreground)] mb-6">Create a personalized interview based on your preferences</p>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Create Custom Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};