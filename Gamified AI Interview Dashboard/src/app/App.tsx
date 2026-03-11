import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PracticeMode } from './components/PracticeMode';
import { UserProfile } from './components/UserProfile';
import { Settings } from './components/Settings';
import { Code, Database, Layout, Server, Cpu, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { Topic } from './components/TopicCard';
import { Toaster } from './components/ui/sonner';
import { LoginPage } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { mockTopics } from './data/mockTopics';
import { debugAuth } from '../utils/debugAuth';
import { fetchQuestionsByCategory, fetchSolvedQuestions } from '../api/questions';
import { ResumeBuilder } from './components/ResumeBuilder';
import { recordContribution } from './utils/contributionTracker';

// preferences context provides theme/editor state across the app
import { PreferencesProvider } from '../context/PreferencesContext';

type AuthView = 'login' | 'register';

export default function App(): React.ReactElement {
  const { user, token, loading } = useAuth();
  const { showLayout } = useLayout();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [initialChallenge, setInitialChallenge] = useState<{ questionId: string; topicId: string } | null>(null);
  const [initialPracticeTopicId, setInitialPracticeTopicId] = useState<string | null>(null);

  // helper for fetching the latest category/topic data from the server
  const refreshTopics = async () => {
    if (!user || !token) return;
    try {
      const r = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!r.ok) {
        console.warn(`Failed to fetch categories: ${r.status}`);
        setTopics(mockTopics);
        return;
      }

      let data;
      try {
        data = await r.json();
      } catch (e) {
        console.warn('Failed to parse categories JSON response:', e);
        setTopics(mockTopics);
        return;
      }

      if (!data || data.length === 0) {
        setTopics(mockTopics);
        return;
      }
      let mapped: Topic[] = data.map((c: any) => ({
        id: c.slug,
        title: c.name,
        icon: iconMap[c.slug] || Code,
        totalQuestions: c.total_questions,
        completedQuestions: c.questions_solved,
        strength: c.score_percentage,
        status: c.is_locked ? 'locked' : 'unlocked',
        color: colorMap[c.slug] || 'text-slate-400',
      }));

      // if the API response looks suspicious (totalQuestions seems
      // inflated compared to what /questions reports) we'll double-check
      // by hitting the per-category endpoints. This ensures the card values
      // stay correct even when the backend hasn't been restarted or is
      // returning stale totals.
      try {
        const fixes = await Promise.all(
          mapped.map(async (t) => {
            try {
              const detail = await fetchQuestionsByCategory(t.id, token, { limit: 1, offset: 0 });
              const solvedIds = await fetchSolvedQuestions(t.id, token);
              return {
                id: t.id,
                total: detail?.total ?? t.totalQuestions,
                solved: Array.isArray(solvedIds) ? solvedIds.length : t.completedQuestions,
              };
            } catch (e) {
              // ignore individual failures and keep existing values
              return { id: t.id, total: t.totalQuestions, solved: t.completedQuestions };
            }
          })
        );
        // apply corrections if any
        mapped = mapped.map((t) => {
          const fix = fixes.find((f) => f.id === t.id);
          if (fix) {
            return { ...t, totalQuestions: fix.total, completedQuestions: fix.solved };
          }
          return t;
        });
      } catch (e) {
        // if the fallback check itself fails, just proceed with the raw data
        console.warn('failed to verify category totals/solved counts', e);
      }

      setTopics(mapped);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      const mapped: Topic[] = mockTopics.map(mt => ({
        id: mt.id,
        title: mt.title,
        icon: mt.icon,
        totalQuestions: mt.totalQuestions,
        completedQuestions: mt.completedQuestions,
        strength: mt.strength,
        status: mt.status,
        color: mt.color,
      }));
      setTopics(mapped);
    }
  };

  // map slug/icon and colors
  const iconMap: Record<string, React.ComponentType<any>> = {
    reactjs: Code,
    javascript: Layout,
    'system-design': Server,
    'data-structures': Database,
    algorithms: Cpu,
    behavioral: MessageSquare,
  };
  const colorMap: Record<string, string> = {
    reactjs: 'text-sky-400',
    javascript: 'text-yellow-400',
    'system-design': 'text-purple-400',
    'data-structures': 'text-emerald-400',
    algorithms: 'text-red-400',
    behavioral: 'text-pink-400',
  };

  // whenever the user or token change, or the tab switches to practice/dashboard
  // we pull the latest topics so counts stay in sync with activity.
  useEffect(() => {
    if (user && token) {
      console.log('✅ User logged in or tab changed:', user.email, activeTab);
      debugAuth(); // Show debug info in console
      refreshTopics();
    }
  }, [user, token, activeTab]);
  // Track active app usage (visible tab only) for contribution heatmap updates.
  useEffect(() => {
    if (!user) return;

    let lastTick = Date.now();
    let isVisible = !document.hidden;

    const flushElapsed = () => {
      const now = Date.now();
      if (isVisible) {
        const elapsedSeconds = Math.floor((now - lastTick) / 1000);
        if (elapsedSeconds > 0) {
          recordContribution({ active_seconds: elapsedSeconds });
        }
      }
      lastTick = now;
    };

    const intervalId = window.setInterval(flushElapsed, 15000);
    const handleVisibility = () => {
      flushElapsed();
      isVisible = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', flushElapsed);

    return () => {
      flushElapsed();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', flushElapsed);
    };
  }, [user]);

  const skillData = topics.length > 0 
    ? topics.map((t: Topic) => ({ subject: t.title, A: t.strength, fullMark: 100 }))
    : [];
  const averageScore = topics.length > 0 
    ? Math.round(topics.reduce((acc: number, curr: Topic) => acc + curr.strength, 0) / topics.length)
    : 0;

  // ── Loading splash ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center animate-pulse">
            <Code className="w-5 h-5 text-white" />
          </div>
          <p className="text-[var(--color-muted-foreground)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Wrap entire app in PreferencesProvider so theme is available everywhere
  return (
    <PreferencesProvider>
      {/* ── Auth gate ─────────────────────────────────────────────────── */}
      {!user ? (
        <>
          {authView === 'login' ? (
            <LoginPage onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
          )}
          <Toaster position="top-right" />
        </>
      ) : (
        /* ── Main App (authenticated) ──────────────────────────────────── */
        <div className="flex h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-sans overflow-hidden">
          {showLayout && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {showLayout && <Header />}
            <main className="flex-1 overflow-y-auto bg-[var(--color-background)] scrollbar-thin scrollbar-thumb-[var(--color-border)] scrollbar-track-transparent">
              {activeTab === 'dashboard' && (
                <Dashboard
                  skillData={skillData}
                  topics={topics}
                  averageScore={averageScore}
                  setActiveTab={setActiveTab}
                  onDailyChallengeSelect={(challenge) => {
                    setInitialPracticeTopicId(null);
                    setInitialChallenge(challenge);
                    setActiveTab('practice');
                  }}
                  onPracticeTopicSelect={(topicId) => {
                    setInitialChallenge(null);
                    setInitialPracticeTopicId(topicId);
                    setActiveTab('practice');
                  }}
                />
              )}
              {activeTab === 'practice' && (
                <PracticeMode
                  topics={topics}
                  onTopicsRefresh={refreshTopics}
                  initialChallenge={initialChallenge}
                  initialTopicId={initialPracticeTopicId}
                  onChallengeConsumed={() => setInitialChallenge(null)}
                  onInitialTopicConsumed={() => setInitialPracticeTopicId(null)}
                />
              )}
              {activeTab === 'interviews' && <MockInterviewPage />}
              {activeTab === 'resume' && <ResumeBuilder />}
              {activeTab === 'profile' && <UserProfile />}
              {activeTab === 'settings' && <Settings />}
              {!['dashboard', 'practice', 'interviews', 'resume', 'profile', 'settings'].includes(activeTab) && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <div className="bg-[var(--color-card)] p-8 rounded-2xl border border-[var(--color-border)] text-center max-w-md">
                    <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">Coming Soon</h2>
                    <p className="text-[var(--color-muted-foreground)]">The {activeTab} module is currently under development.</p>
                  </div>
                </div>
              )}
            </main>
          </div>
          <Toaster position="top-right" />
        </div>
      )}
    </PreferencesProvider>
  );
}
