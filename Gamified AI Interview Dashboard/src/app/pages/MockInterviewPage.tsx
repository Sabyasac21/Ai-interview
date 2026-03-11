import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, MessageSquare, CheckCircle, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { AIVoiceAnimation } from '../components/AIVoiceAnimation';
import VoiceInteractionService from '../utils/voiceInteractionService';
import { useLayout } from '../../context/LayoutContext';
import { useAuth } from '../../context/AuthContext';
import { recordContribution } from '../utils/contributionTracker';
import {
  fetchInterviewTemplates,
  fetchUserSessions,
  createInterviewSession,
  startInterviewSession,
  cancelInterviewSession,
  rescheduleInterviewSession,
} from '../api/interviews';
import { parseBackendDate } from '../../utils/dateTime';

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const dt = new Date(iso);
    return dt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const toDateTimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const dt = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const normalizeScheduleTime = (when: string) => {
  if (!when) return '';
  const dt = new Date(when);
  if (isNaN(dt.getTime())) return when;
  return toDateTimeLocal(dt.toISOString());
};

// Mock interview flow uses only the AI/voice layer; we do not submit code via this page.
const submitResponse = async (sessionId: number, questionId: number, responseData: any) => {
  return { status: 'ok' };
};

const completeSession = async (sessionId: number) => {
  return { status: 'ok' };
};

// Dummy interview responses
const DUMMY_QUESTIONS_WITH_ANSWERS = [
  {
    question: "Tell me about yourself and your experience.",
    aiResponse: "Thank you for the opportunity. Please share your professional background, key projects you've worked on, and what skills you'd like to highlight.",
    expectation: "A concise 2-3 minute introduction covering your experience and background."
  },
  {
    question: "What are your strengths?",
    aiResponse: "Great question. Can you tell me about your top 3 strengths and provide examples of how you've used them in your work?",
    expectation: "Specific strengths with real-world examples from your experience."
  },
  {
    question: "Why are you interested in this role?",
    aiResponse: "Excellent. What aspects of this position and our company attract you the most?",
    expectation: "Research-backed answer showing genuine interest in the company and role."
  },
  {
    question: "How do you handle challenges and failures?",
    aiResponse: "That's an important quality. Can you share a specific example of a challenge you faced and how you overcame it?",
    expectation: "Concrete example using STAR method showing resilience and learning."
  }
];

interface VoiceInterviewState {
  isAISpeaking: boolean;
  isUserListening: boolean;
  userTranscript: string;
  interimTranscript: string;
  aiTranscript: string;
  showFeedback: boolean;
}

export const MockInterviewPage: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const nextSession = scheduledSessions[0] || null;
  const editingSession = editingSessionId ? scheduledSessions.find(s => s.id === editingSessionId) : null;
  const activeSession = editingSession;

  const sessionsByDate = scheduledSessions.reduce((acc: Record<string, any[]>, session) => {
    const dt = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
    const dateKey = dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {});

  const sortedDates: string[] = [];
  scheduledSessions.forEach(session => {
    const dt = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
    const dateKey = dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!sortedDates.includes(dateKey)) {
      sortedDates.push(dateKey);
    }
  });

  const getFirstAvailableTemplateId = () => {
    const availableTemplate = templates.find((template: any) =>
      !scheduledSessions.some((session: any) => session.template?.id === template.id)
    );
    return availableTemplate?.id ?? null;
  };

  const [scheduleTemplateId, setScheduleTemplateId] = useState<number | null>(null);
  const [scheduleWhen, setScheduleWhen] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [voiceMode, setVoiceMode] = useState(false); // New: voice mode toggle
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const voiceServiceRef = useRef<VoiceInteractionService | null>(null);
  const silentTimeoutRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const [voiceState, setVoiceState] = useState<VoiceInterviewState>({
    isAISpeaking: false,
    isUserListening: false,
    userTranscript: '',
    interimTranscript: '',
    aiTranscript: '',
    showFeedback: false
  });
  const voiceStateRef = useRef<VoiceInterviewState>(voiceState);

  const currentQuestionRef = useRef<number>(currentQuestion);
  const selectedInterviewRef = useRef<any>(selectedInterview);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    selectedInterviewRef.current = selectedInterview;
  }, [selectedInterview]);

  const { setShowLayout } = useLayout();
  const { token } = useAuth();

  useEffect(() => {
    loadData();
    return () => {
      voiceServiceRef.current?.destroy();
    };
  }, [token]);

  useEffect(() => {
    // If another part of the app requested starting a scheduled interview,
    // honor it when we load the interviews page.
    const pendingStart = localStorage.getItem('pendingInterviewStart');
    const pendingSchedule = localStorage.getItem('pendingInterviewSchedule');

    if (pendingStart && token && !selectedInterview) {
      try {
        const data = JSON.parse(pendingStart);
        if (data?.sessionId && data?.template) {
          startScheduledInterview({ id: data.sessionId, template: data.template });
        }
      } catch {
        // ignore
      }
      localStorage.removeItem('pendingInterviewStart');
      return;
    }

    if (pendingSchedule) {
      setIsScheduling(true);
      localStorage.removeItem('pendingInterviewSchedule');
    }
  }, [token, selectedInterview]);

  useEffect(() => {
    // Hide global layout when in the full-screen voice interview or results view.
    setShowLayout(!(selectedInterview && (voiceMode || showResults)));
    return () => {
      setShowLayout(true);
    };
  }, [selectedInterview, voiceMode, showResults, setShowLayout]);

  useEffect(() => {
    // Build a sorted list of all scheduled sessions for the user
    const now = Date.now();
    const scheduledList = userSessions
      .filter(s => s.status === 'scheduled')
      .map(s => {
        const scheduledAtRaw = s.scheduled_at || s.created_at || null;
        const scheduledAtDate = parseBackendDate(scheduledAtRaw);
        return {
          ...s,
          scheduledAt: scheduledAtDate ? scheduledAtDate.toISOString() : null,
          scheduledAtDate,
        };
      })
      .filter(s => s.scheduledAtDate && s.scheduledAtDate.getTime() >= now)
      .sort((a, b) => a.scheduledAtDate.getTime() - b.scheduledAtDate.getTime());

    setScheduledSessions(scheduledList);

    // If the user is currently editing a session that has been removed/cancelled, reset edit mode.
    if (editingSessionId && !scheduledList.some(s => s.id === editingSessionId)) {
      setEditingSessionId(null);
    }
  }, [userSessions, editingSessionId]);

  useEffect(() => {
    // When entering scheduling mode, prefill the schedule form with the current session data (if available)
    if (!isScheduling) return;
    if (scheduleWhen || scheduleTemplateId) return; // preserve any user edits

    if (editingSessionId) {
      const editingSession = scheduledSessions.find(s => s.id === editingSessionId);
      if (editingSession) {
        setScheduleTemplateId(editingSession.template?.id || null);
        setScheduleWhen(
          toDateTimeLocal(editingSession.scheduledAt || null) ||
            new Date().toISOString().slice(0, 16)
        );
        return;
      }
    }

    // Default to a fresh schedule form when creating a new interview
    if (templates.length > 0) {
      setScheduleTemplateId(getFirstAvailableTemplateId());
      setScheduleWhen(new Date().toISOString().slice(0, 16));
    }
  }, [isScheduling, scheduledSessions, editingSessionId, templates, scheduleWhen, scheduleTemplateId]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [templatesData, sessionsData] = await Promise.all([
        fetchInterviewTemplates(token),
        fetchUserSessions(token)
      ]);
      setTemplates(templatesData);
      setUserSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (template: any, useVoiceMode: boolean = false) => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    try {
      const sessionData = await createInterviewSession(token, template.id);
      const sessionId = sessionData.session_id;

      await startInterviewSession(token, sessionId);

      setSelectedInterview({ ...template, sessionId });
      setVoiceMode(useVoiceMode);
      setCurrentQuestion(0);
      setShowResults(false);
      setVoiceState({
        isAISpeaking: false,
        isUserListening: false,
        userTranscript: '',
        interimTranscript: '',
        aiTranscript: '',
        showFeedback: false
      });

      if (useVoiceMode) {
        voiceServiceRef.current = new VoiceInteractionService();
        setTimeout(() => startVoiceInterview(), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    }
  };

  const startScheduledInterview = async (session: any, useVoiceMode: boolean = true) => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    try {
      await startInterviewSession(token, session.id);

      // Keep the same template data we already have from the session
      setSelectedInterview({ ...session.template, sessionId: session.id });
      setVoiceMode(useVoiceMode);
      setCurrentQuestion(0);
      setShowResults(false);
      setVoiceState({
        isAISpeaking: false,
        isUserListening: false,
        userTranscript: '',
        interimTranscript: '',
        aiTranscript: '',
        showFeedback: false
      });

      // Refresh list so the scheduled session doesn't reappear after starting
      setIsScheduling(false);
      setEditingSessionId(null);
      loadData();

      if (useVoiceMode) {
        voiceServiceRef.current = new VoiceInteractionService();
        setTimeout(() => startVoiceInterview(), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scheduled interview');
    }
  };

  const scheduleInterview = async () => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    if (!scheduleTemplateId || !scheduleWhen) {
      setError('Please select a topic and time');
      return;
    }

    const duplicateTopicSession = scheduledSessions.find(
      s => s.template?.id === scheduleTemplateId
    );

    if (duplicateTopicSession) {
      const message = 'You already have this interview topic scheduled. Please choose a different topic.';
      setError(message);
      toast.error(message);
      return;
    }

    const normalizedWhen = normalizeScheduleTime(scheduleWhen);
    const conflict = scheduledSessions.find(s =>
      normalizeScheduleTime(s.scheduledAt || '') === normalizedWhen
    );

    if (conflict) {
      const sameTopic = conflict.template?.id === scheduleTemplateId;
      const message = sameTopic
        ? 'You already have an interview scheduled for this topic at that time.'
        : 'You already have another interview scheduled at that time.';
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      await createInterviewSession(token, scheduleTemplateId, scheduleWhen);

      await loadData();
      setScheduleTemplateId(null);
      setScheduleWhen('');
      setEditingSessionId(null);
      setError(null);
      setIsScheduling(false);
      toast.success('Interview scheduled!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule interview';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const rescheduleInterview = async (sessionId: number, when: string) => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    const normalizedWhen = normalizeScheduleTime(when);
    const conflict = scheduledSessions.find(s =>
      s.id !== sessionId &&
      normalizeScheduleTime(s.scheduledAt || '') === normalizedWhen
    );

    if (conflict) {
      const currentSession = scheduledSessions.find(s => s.id === sessionId);
      const sameTopic = conflict.template?.id === currentSession?.template?.id;
      const message = sameTopic
        ? 'You already have an interview scheduled for this topic at that time.'
        : 'You already have another interview scheduled at that time.';
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      await rescheduleInterviewSession(token, sessionId, when);
      await loadData();
      setEditingSessionId(null);
      setError(null);
      setIsScheduling(false);
      toast.success('Interview rescheduled!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule interview';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const startVoiceInterview = async () => {
    try {
      const dummyData = DUMMY_QUESTIONS_WITH_ANSWERS[currentQuestion];
      
      // AI speaks first
      setVoiceState(prev => ({ ...prev, isAISpeaking: true, aiTranscript: dummyData.aiResponse }));
      
      voiceServiceRef.current?.speak(
        dummyData.aiResponse,
        () => {
          setVoiceState(prev => ({ ...prev, isAISpeaking: true }));
        },
        () => {
          setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
          // Start listening after AI stops speaking
          setTimeout(() => startUserListening(), 500);
        },
        (error) => {
          setError(error);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start voice interview');
    }
  };

  const clearSilentTimeout = () => {
    if (silentTimeoutRef.current !== null) {
      window.clearTimeout(silentTimeoutRef.current);
      silentTimeoutRef.current = null;
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    clearSilentTimeout();
    voiceServiceRef.current?.stopListening();
    setVoiceState(prev => ({ ...prev, isUserListening: false }));
  };

  const startUserListening = () => {
    if (!voiceServiceRef.current) return;

    setVoiceState(prev => ({ ...prev, isUserListening: true, userTranscript: '', interimTranscript: '' }));
    isListeningRef.current = true;

    // If no final transcript arrives within a few seconds, auto-submit whatever we have.
    clearSilentTimeout();
    silentTimeoutRef.current = window.setTimeout(() => {
      if (isListeningRef.current) {
        stopListening();
        submitUserResponse();
      }
    }, 3000);

    voiceServiceRef.current.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          setVoiceState(prev => ({
            ...prev,
            userTranscript: prev.userTranscript + transcript,
            interimTranscript: ''
          }));
          // Stop listening and auto-submit after user finishes speaking
          stopListening();
          setTimeout(() => submitUserResponse(), 1000);
        } else {
          setVoiceState(prev => ({
            ...prev,
            interimTranscript: transcript
          }));

          // Reset the silent-timeout whenever we receive new interim results.
          clearSilentTimeout();
          silentTimeoutRef.current = window.setTimeout(() => {
            if (isListeningRef.current) {
              stopListening();
              submitUserResponse();
            }
          }, 3000);
        }
      },
      (error) => {
        stopListening();
        setError(error);
      }
    );
  };

  const submitUserResponse = async () => {
    try {
      stopListening();

      // Guard against cases where the interview has already ended or been cleared
      if (!selectedInterviewRef.current) {
        console.warn('submitUserResponse: no active interview session');
        return;
      }

      const questionIndex = currentQuestionRef.current;
      const fullTranscript = voiceStateRef.current.userTranscript + voiceStateRef.current.interimTranscript;

      // Submit response
      await submitResponse(selectedInterviewRef.current.sessionId, questionIndex, {
        response_text: fullTranscript || 'No response provided'
      });

      // Show feedback
      setVoiceState(prev => ({ ...prev, showFeedback: true }));

      // Provide AI feedback
      const feedbackText = `Good answer. ${fullTranscript ? 'Your response shows good understanding. ' : 'Remember to provide more detailed responses. '}Let's move to the next question.`;
      
      voiceServiceRef.current?.speak(
        feedbackText,
        () => {
          setVoiceState(prev => ({ ...prev, isAISpeaking: true, aiTranscript: feedbackText }));
        },
        () => {
          setVoiceState(prev => ({ ...prev, isAISpeaking: false, showFeedback: false }));

          if (!selectedInterviewRef.current) {
            console.warn('No active session when trying to advance question');
            return;
          }

          if (questionIndex < DUMMY_QUESTIONS_WITH_ANSWERS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setTimeout(() => startVoiceInterview(), 1000);
          } else {
            // Interview complete
            completeSession(selectedInterviewRef.current.sessionId);
            recordContribution({ mock_interviews_completed_count: 1 });
            setShowResults(true);
            loadData();
          }
        },
        (error) => {
          setError(error);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    }
  };

  const endInterview = () => {
    voiceServiceRef.current?.destroy();
    voiceServiceRef.current = null;
    clearSilentTimeout();
    setSelectedInterview(null);
    setVoiceMode(false);
    setShowLayout(true);
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

  // Voice Interview Mode - Full screen
  if (selectedInterview && voiceMode) {
    const dummyData = DUMMY_QUESTIONS_WITH_ANSWERS[currentQuestion];
    const fullUserTranscript = voiceState.userTranscript + voiceState.interimTranscript;

    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden">
        <AIVoiceAnimation 
          isListening={voiceState.isUserListening} 
          isSpeaking={voiceState.isAISpeaking}
        />

        {/* Overlay controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          {/* Top bar (back + topic + progress) */}
          <div className="flex items-center justify-between pointer-events-auto">
            <button
              onClick={endInterview}
              className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">End</span>
            </button>

            <div className="text-right text-sm text-white/70">
              <div className="font-semibold">{selectedInterview.title || 'Voice Interview'}</div>
              <div className="text-xs">Question {currentQuestion + 1} of {DUMMY_QUESTIONS_WITH_ANSWERS.length}</div>
            </div>
          </div>

          {/* Transcript panels (bottom) */}
          <div className="absolute left-1/2 bottom-28 w-full max-w-xl -translate-x-1/2 flex flex-col gap-2 pointer-events-none text-center">
            {voiceState.isAISpeaking && voiceState.aiTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full px-2 text-center text-white text-sm drop-shadow-lg"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">AI Response</span>
                <p className="text-white text-sm leading-relaxed">{voiceState.aiTranscript}</p>
              </motion.div>
            )}

            {(voiceState.isUserListening || fullUserTranscript) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full px-2 text-center text-white text-sm drop-shadow-lg"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Your Answer</span>
                <p className="text-white text-sm leading-relaxed">
                  {fullUserTranscript}
                  {voiceState.interimTranscript && <span className="text-white/60">{voiceState.interimTranscript}</span>}
                </p>
              </motion.div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-center gap-6 pointer-events-auto">
            <motion.div
              animate={{ scale: voiceState.isUserListening ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: voiceState.isUserListening ? Infinity : 0 }}
              className={`flex items-center justify-center w-20 h-20 rounded-full transition-colors ${
                voiceState.isUserListening
                  ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                  : 'bg-green-500 shadow-lg shadow-green-500/50'
              }`}
            >
              {voiceState.isUserListening ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-white" />
              )}
            </motion.div>

            <div className="text-center text-white">
              <p className="text-sm text-white/70">
                {voiceState.isAISpeaking ? 'AI Speaking' : voiceState.isUserListening ? 'Listening...' : 'Ready'}
              </p>
            </div>
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
              <div className="text-3xl font-bold text-blue-500 mb-2">{DUMMY_QUESTIONS_WITH_ANSWERS.length}/{DUMMY_QUESTIONS_WITH_ANSWERS.length}</div>
              <p className="text-[var(--color-muted-foreground)]">Questions Answered</p>
            </div>
            <div className="bg-[var(--color-background)] rounded-lg p-6 border border-[var(--color-border)] text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">{DUMMY_QUESTIONS_WITH_ANSWERS.length}min</div>
              <p className="text-[var(--color-muted-foreground)]">Total Duration</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setSelectedInterview(null);
                setShowResults(false);
              }}
              className="flex-1 px-6 py-3 bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 text-[var(--color-foreground)] rounded-lg transition-colors"
            >
              Back to Interviews
            </button>
            <button
              onClick={() => startInterview(selectedInterview, true)}
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

        <div className="mb-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-lg">
            {isScheduling ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                      {activeSession ? 'Reschedule Interview' : 'Schedule Interview'}
                    </h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {activeSession
                        ? 'Select a new time for your upcoming mock interview.'
                        : 'Pick a topic and time for your mock interview.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Topic</label>
                      <select
                        value={scheduleTemplateId ?? ''}
                        onChange={(e) => setScheduleTemplateId(Number(e.target.value) || null)}
                        className="w-full mt-1 rounded-lg bg-black/40 border border-white/10 text-white px-3 py-2"
                      >
                        <option value="">Select a topic</option>
                        {templates.map((template: any) => (
                          <option
                            key={template.id}
                            value={template.id}
                            disabled={scheduledSessions.some(
                              (session: any) =>
                                session.template?.id === template.id && session.id !== editingSessionId
                            )}
                          >
                            {template.title}
                            {scheduledSessions.some(
                              (session: any) =>
                                session.template?.id === template.id && session.id !== editingSessionId
                            )
                              ? ' (Already scheduled)'
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--color-muted-foreground)]">When</label>
                      <input
                        type="datetime-local"
                        value={scheduleWhen}
                        onChange={(e) => setScheduleWhen(e.target.value)}
                        className="w-full mt-1 rounded-lg bg-black/40 border border-white/10 text-white px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (activeSession) {
                          rescheduleInterview(activeSession.id, scheduleWhen);
                        } else {
                          scheduleInterview();
                        }
                      }}
                      disabled={isSubmittingSchedule}
                      className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      {activeSession
                        ? isSubmittingSchedule
                          ? 'Updating...'
                          : 'Update Schedule'
                        : isSubmittingSchedule
                        ? 'Scheduling...'
                        : 'Confirm Schedule'}
                    </button>
                    <button
                      onClick={() => {
                        setIsScheduling(false);
                        setEditingSessionId(null);
                        setScheduleTemplateId(null);
                        setScheduleWhen('');
                        setError(null);
                      }}
                      className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : scheduledSessions.length > 0 ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Upcoming Mock Interview</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Manage your upcoming sessions or schedule another interview.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsScheduling(true);
                      setEditingSessionId(null);
                      setScheduleWhen(toDateTimeLocal(new Date().toISOString()));
                      setScheduleTemplateId(getFirstAvailableTemplateId());
                    }}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.18)] hover:shadow-[0_0_24px_rgba(79,70,229,0.35)]"
                  >
                    Schedule Another
                  </button>
                </div>

                <div className="space-y-4">
                  {sortedDates.map(dateKey => (
                    <div key={dateKey}>
                      <h3 className="text-sm font-semibold text-[var(--color-muted-foreground)] mb-2">{dateKey}</h3>
                      <div className="space-y-3">
                        {sessionsByDate[dateKey].map((session: any) => (
                          <div
                            key={session.id}
                            className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                          >
                            <div>
                              <div className="text-sm font-semibold text-[var(--color-foreground)]">
                                {session.template?.title || 'Scheduled Interview'}
                              </div>
                              <div className="text-xs text-[var(--color-muted-foreground)]">
                                {formatDateTime(session.scheduledAt)}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => startScheduledInterview(session)}
                                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.18)] hover:shadow-[0_0_24px_rgba(79,70,229,0.35)]"
                              >
                                Start Now
                              </button>
                              <button
                                onClick={() => {
                                  setIsScheduling(true);
                                  setEditingSessionId(session.id);
                                  setScheduleTemplateId(session.template?.id || null);
                                  setScheduleWhen(toDateTimeLocal(session.scheduledAt || new Date().toISOString()));
                                }}
                                className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    if (!token) return;
                                    await cancelInterviewSession(token, session.id);
                                    await loadData();
                                    toast.success('Interview cancelled');
                                  } catch (err) {
                                    console.error(err);
                                    toast.error('Failed to cancel interview');
                                  }
                                }}
                                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)]">No Interview Scheduled</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">Schedule a mock interview to practice with AI feedback.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsScheduling(true);
                    setScheduleWhen(toDateTimeLocal(new Date().toISOString()));
                    setScheduleTemplateId(getFirstAvailableTemplateId());
                  }}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.18)] hover:shadow-[0_0_24px_rgba(79,70,229,0.35)]"
                >
                  Schedule Interview
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template: any) => (
            <motion.div
              key={`template-${template.id}`}
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 ring-1 ring-white/10 hover:ring-white/20 p-6 shadow-lg hover:shadow-[0_0_20px_rgba(128,92,255,0.28)] transition-all duration-300"
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

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <Clock className="w-4 h-4" />
                  {template.duration_minutes || 10} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <MessageSquare className="w-4 h-4" />
                  {template.question_count || 4} questions
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-[var(--color-muted-foreground)]">Available</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => startInterview(template, true)}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.18)] hover:shadow-[0_0_24px_rgba(79,70,229,0.35)]"
                >
                  Start
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">No Interviews Available</h3>
            <p className="text-[var(--color-muted-foreground)]">Check back later for new interview templates</p>
          </div>
        )}
      </div>
    </div>
  );
};
