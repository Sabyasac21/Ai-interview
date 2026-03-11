import React, { useState, useEffect } from 'react';
import { SkillRadar, SkillData } from './SkillRadar';
import { useAuth } from '../../context/AuthContext';
import { LevelRoadmap } from './LevelRoadmap';
import { Calendar, Zap, TrendingUp, Award, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { getTodayXP, fetchPracticeHistory } from '../../api/questions';
import { fetchUserSessions, cancelInterviewSession } from '../api/interviews';
import { Topic } from './TopicCard';
import { getContributionSummary, readContributionStore, getLocalDateKey, computeContributionScore } from '../utils/contributionTracker';
import { calculateProfileStrength } from '../utils/profileStrength';
import { getLastNDaysKeys, getUserTimeZone, parseBackendDate, toDateKey } from '../../utils/dateTime';

interface DashboardProps {
  skillData: SkillData[];
  topics: Topic[];
  averageScore: number;
  setActiveTab: (tab: string) => void;
  onDailyChallengeSelect?: (challenge: { questionId: string; topicId: string }) => void;
  onPracticeTopicSelect?: (topicId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  skillData,
  topics,
  averageScore,
  setActiveTab,
  onDailyChallengeSelect,
  onPracticeTopicSelect,
}) => {
  const { user, token } = useAuth();
  const displayName = user?.full_name || user?.username || 'there';
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [todayXP, setTodayXP] = useState(0);
  const [loadingXP, setLoadingXP] = useState(true);

  const [sessions, setSessions] = useState<any[]>([]);
  const [scheduledSession, setScheduledSession] = useState<any | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [weeklyStrengthDeltaPct, setWeeklyStrengthDeltaPct] = useState<number | null>(null);
  const [profileStrength, setProfileStrength] = useState(() =>
    calculateProfileStrength({
      averageSkillScore: averageScore,
      solvedQuestions: topics.reduce((sum, t) => sum + Number(t.completedQuestions || 0), 0),
      totalQuestions: topics.reduce((sum, t) => sum + Number(t.totalQuestions || 0), 0),
      streakDays: Number(user?.streak_days || 0),
      completedMockInterviews: 0,
      activeDaysLast30: 0,
      contributionScoreLast30: 0,
    })
  );
  const [profileContext, setProfileContext] = useState({
    solvedQuestions: 0,
    totalQuestions: 0,
    completedMockInterviews: 0,
    activeDaysLast30: 0,
    contributionScoreLast30: 0,
  });

  const startedTopics = topics.filter(
    (t) => t.status !== 'locked' && (Number(t.completedQuestions || 0) > 0 || Number(t.strength || 0) > 0)
  );
  const dominantSkill = startedTopics.length > 0
    ? startedTopics.reduce((best, curr) => (curr.strength > best.strength ? curr : best), startedTopics[0])
    : null;
  const needsWorkSkill = startedTopics.length > 0
    ? startedTopics.reduce((worst, curr) => (curr.strength < worst.strength ? curr : worst), startedTopics[0])
    : null;

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const dt = new Date(iso);
      return dt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  // Fetch today's XP on component mount
  useEffect(() => {
    const loadXPData = async () => {
      if (!token) {
        setLoadingXP(false);
        return;
      }

      try {
        setLoadingXP(true);
        const { totalXP: total, todayXP: today } = await getTodayXP(token);
        setTotalXP(total);
        setTodayXP(today);
      } catch (error) {
        console.error('Error loading XP data:', error);
        setTotalXP(0);
        setTodayXP(0);
      } finally {
        setLoadingXP(false);
      }
    };

    loadXPData();
  }, [token]);

  useEffect(() => {
    const solvedQuestions = topics.reduce((sum, t) => sum + Number(t.completedQuestions || 0), 0);
    const totalQuestions = topics.reduce((sum, t) => sum + Number(t.totalQuestions || 0), 0);
    const completedMockInterviews = sessions.filter((s: any) => s?.status === 'completed').length;
    const contribution30 = getContributionSummary(30);
    setProfileContext({
      solvedQuestions,
      totalQuestions,
      completedMockInterviews,
      activeDaysLast30: contribution30.activeDays,
      contributionScoreLast30: contribution30.totalScore,
    });

    setProfileStrength(
      calculateProfileStrength({
        averageSkillScore: averageScore,
        solvedQuestions,
        totalQuestions,
        streakDays: Number(user?.streak_days || 0),
        completedMockInterviews,
        activeDaysLast30: contribution30.activeDays,
        contributionScoreLast30: contribution30.totalScore,
      })
    );
  }, [averageScore, sessions, topics, user?.streak_days]);

  const loadSessions = async () => {
    if (!token) return;

    try {
      const sessionsData = await fetchUserSessions(token);
      setSessions(sessionsData);

      const now = Date.now();
      const scheduled = sessionsData
        .filter((s: any) => s.status === 'scheduled')
        .map((s: any) => {
          const scheduledAtRaw = s.scheduled_at || s.created_at || null;
          const scheduledAtDate = parseBackendDate(scheduledAtRaw);
          return {
            ...s,
            scheduledAt: scheduledAtDate ? scheduledAtDate.toISOString() : null,
            scheduledAtDate,
          };
        })
        .filter((s: any) => s.scheduledAtDate && s.scheduledAtDate.getTime() >= now)
        .sort((a: any, b: any) => a.scheduledAtDate.getTime() - b.scheduledAtDate.getTime())[0];

      setScheduledSession(scheduled || null);
      setScheduledTime(scheduled?.scheduledAt || null);
    } catch (error) {
      console.error('Failed to load interview sessions', error);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [token]);

  useEffect(() => {
    const getRangeContributionSummary = (start: Date, end: Date) => {
      const store = readContributionStore();
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endDay = new Date(end);
      endDay.setHours(0, 0, 0, 0);

      let activeDays = 0;
      let totalScore = 0;
      while (cursor.getTime() <= endDay.getTime()) {
        const key = getLocalDateKey(cursor);
        const day = store[key] || {
          practice_submissions_count: 0,
          practice_solved_count: 0,
          mock_interviews_completed_count: 0,
          active_seconds: 0,
          resume_actions_count: 0,
        };
        const score = computeContributionScore(day as any);
        totalScore += score;
        if (score > 0) activeDays++;
        cursor.setDate(cursor.getDate() + 1);
      }
      return { activeDays, totalScore };
    };

    const parseDate = (v: any) => parseBackendDate(v);

    const isSolvedEntry = (entry: any) => {
      const passed = entry?.passed === true || entry?.passed === 'True';
      const correct = entry?.correct === true || entry?.correct === 'True';
      const testsPassed = Number(entry?.tests_passed ?? entry?.testsPassed ?? 0);
      const testsTotal = Number(entry?.tests_total ?? entry?.testsTotal ?? 0);
      const fullyPassedTests = testsTotal > 0 && testsPassed === testsTotal;
      const positiveScore = Number(entry?.score ?? 0) > 0;
      return passed || correct || fullyPassedTests || positiveScore;
    };

    const loadWeeklyStrengthDelta = async () => {
      if (!token) return;
      try {
        const historyEntries = await fetchPracticeHistory(token, 100);
        const history = Array.isArray(historyEntries) ? historyEntries : [];

        const now = new Date();
        const tz = getUserTimeZone();
        const weekKeys = new Set(getLastNDaysKeys(7, now, tz));
        const oldestWeekKey = getLastNDaysKeys(7, now, tz)[0];

        const prevWeekEnd = new Date(now);
        prevWeekEnd.setHours(0, 0, 0, 0);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - 6);

        const solvedAll = new Set<string>();
        const solvedBeforeWeek = new Set<string>();
        history.forEach((entry: any) => {
          if (!isSolvedEntry(entry)) return;
          const key = String(entry?.question_id || entry?.questionId || '');
          if (!key) return;
          solvedAll.add(key);
          const when = parseDate(entry?.created_at || entry?.submitted_at);
          const keyDate = when ? toDateKey(when, tz) : '';
          if (keyDate && oldestWeekKey && keyDate < oldestWeekKey) solvedBeforeWeek.add(key);
        });

        const currentSolved = Math.max(
          topics.reduce((sum, t) => sum + Number(t.completedQuestions || 0), 0),
          solvedAll.size
        );
        const previousSolved = Math.min(currentSolved, solvedBeforeWeek.size);

        const completedSessions = sessions.filter((s: any) => s?.status === 'completed');
        const currentMocks = completedSessions.length;
        const previousMocks = completedSessions.filter((s: any) => {
          const when = parseDate(s?.completed_at || s?.updated_at || s?.created_at || s?.scheduled_at);
          const keyDate = when ? toDateKey(when, tz) : '';
          return keyDate && oldestWeekKey && keyDate < oldestWeekKey;
        }).length;

        const currentContribution30 = getContributionSummary(30);
        const previousContribution30 = getRangeContributionSummary(
          (() => {
            const d = new Date(prevWeekEnd);
            d.setDate(d.getDate() - 29);
            return d;
          })(),
          prevWeekEnd
        );

        const activeDaysThisWeek = Array.from(weekKeys).reduce((count, key) => {
          const day = readContributionStore()[key];
          return count + (day && computeContributionScore(day as any) > 0 ? 1 : 0);
        }, 0);
        const currentStreak = Number(user?.streak_days || 0);
        const previousStreakEstimate = Math.max(0, currentStreak - activeDaysThisWeek);

        const totalQuestions = topics.reduce((sum, t) => sum + Number(t.totalQuestions || 0), 0);

        const previousStrength = calculateProfileStrength({
          averageSkillScore: averageScore,
          solvedQuestions: previousSolved,
          totalQuestions,
          streakDays: previousStreakEstimate,
          completedMockInterviews: previousMocks,
          activeDaysLast30: previousContribution30.activeDays,
          contributionScoreLast30: previousContribution30.totalScore,
        }).score;

        const currentStrength = calculateProfileStrength({
          averageSkillScore: averageScore,
          solvedQuestions: currentSolved,
          totalQuestions,
          streakDays: currentStreak,
          completedMockInterviews: currentMocks,
          activeDaysLast30: currentContribution30.activeDays,
          contributionScoreLast30: currentContribution30.totalScore,
        }).score;

        const deltaPct = previousStrength > 0
          ? ((currentStrength - previousStrength) / previousStrength) * 100
          : (currentStrength > 0 ? 100 : 0);

        setWeeklyStrengthDeltaPct(Number(deltaPct.toFixed(1)));
      } catch (error) {
        console.error('Failed to compute weekly profile-strength delta:', error);
        setWeeklyStrengthDeltaPct(null);
      }
    };

    loadWeeklyStrengthDelta();
  }, [averageScore, sessions, token, topics, user?.streak_days]);

  const weakestFactor = (() => {
    const entries = [
      { key: 'mastery', label: 'Mastery', value: profileStrength.breakdown.mastery },
      { key: 'coverage', label: 'Coverage', value: profileStrength.breakdown.coverage },
      { key: 'consistency', label: 'Consistency', value: profileStrength.breakdown.consistency },
      { key: 'interviews', label: 'Interviews', value: profileStrength.breakdown.interviewReadiness },
      { key: 'engagement', label: 'Engagement', value: profileStrength.breakdown.engagement },
    ];
    return entries.sort((a, b) => a.value - b.value)[0];
  })();

  const handleStartDailyChallenge = async () => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    try {
      setIsLoadingChallenge(true);
      
      // Fetch all questions and select a random one for daily challenge
      const response = await fetch('/api/questions?limit=100&offset=0', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      const questions = data.questions || data.data || [];

      if (questions.length === 0) {
        toast.error('No questions available');
        setIsLoadingChallenge(false);
        return;
      }

      // Select a random question for daily challenge
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      const questionId = randomQuestion.id || randomQuestion.title;
      const topicId = randomQuestion.category || randomQuestion.topic || 'general';

      // Notify callback if provided
      if (onDailyChallengeSelect) {
        onDailyChallengeSelect({ questionId, topicId });
      }

      toast.success('Daily challenge loaded!');
    } catch (error) {
      console.error('Error loading daily challenge:', error);
      toast.error('Failed to load daily challenge');
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">Welcome back, {displayName}! 👋</h1>
          <p className="text-[var(--color-muted-foreground)]">
            {weeklyStrengthDeltaPct === null
              ? 'Your profile strength trend will appear once enough activity data is available.'
              : weeklyStrengthDeltaPct > 0
                ? `Your profile strength has increased by ${weeklyStrengthDeltaPct}% this week.`
                : weeklyStrengthDeltaPct < 0
                  ? `Your profile strength is down by ${Math.abs(weeklyStrengthDeltaPct)}% this week. Keep practicing to recover momentum.`
                  : 'Your profile strength is unchanged this week.'}
          </p>
        </div>
        <button 
          onClick={handleStartDailyChallenge}
          disabled={isLoadingChallenge}
          className="bg-white text-indigo-900 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/20"
        >
          {isLoadingChallenge ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-indigo-900" />
          )}
          {isLoadingChallenge ? 'Loading...' : 'Start Daily Challenge'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Profile Strength Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-900/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-indigo-100">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Profile Strength</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
               <span className="text-4xl font-bold">{profileStrength.score}</span>
               <span className="text-xl text-indigo-200">/ 100</span>
            </div>
            
            <div className="text-sm text-indigo-100 mb-1">{profileStrength.percentileText}</div>
            <div className="text-[11px] text-indigo-100/85 mb-3">
              Estimated band from your own activity and performance signals.
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${profileStrength.score}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-md border border-white/20 bg-black/10 px-2 py-1.5">
                <p className="text-indigo-100/80 uppercase tracking-wide">Mastery</p>
                <p className="text-white font-semibold leading-tight">{profileStrength.breakdown.mastery}</p>
                <p className="text-indigo-100/75 mt-0.5">Avg topic score</p>
              </div>
              <div className="rounded-md border border-white/20 bg-black/10 px-2 py-1.5">
                <p className="text-indigo-100/80 uppercase tracking-wide">Coverage</p>
                <p className="text-white font-semibold leading-tight">{profileStrength.breakdown.coverage}</p>
                <p className="text-indigo-100/75 mt-0.5">
                  {profileContext.solvedQuestions}/{profileContext.totalQuestions || 0} solved
                </p>
              </div>
              <div className="rounded-md border border-white/20 bg-black/10 px-2 py-1.5">
                <p className="text-indigo-100/80 uppercase tracking-wide">Consistency</p>
                <p className="text-white font-semibold leading-tight">{profileStrength.breakdown.consistency}</p>
                <p className="text-indigo-100/75 mt-0.5">
                  {Number(user?.streak_days || 0)}d streak • {profileContext.activeDaysLast30}/30 active
                </p>
              </div>
              <div className="rounded-md border border-white/20 bg-black/10 px-2 py-1.5">
                <p className="text-indigo-100/80 uppercase tracking-wide">Interviews</p>
                <p className="text-white font-semibold leading-tight">{profileStrength.breakdown.interviewReadiness}</p>
                <p className="text-indigo-100/75 mt-0.5">{profileContext.completedMockInterviews} completed</p>
              </div>
              <div className="rounded-md border border-white/20 bg-black/10 px-2 py-1.5">
                <p className="text-indigo-100/80 uppercase tracking-wide">Engagement</p>
                <p className="text-white font-semibold leading-tight">{profileStrength.breakdown.engagement}</p>
                <p className="text-indigo-100/75 mt-0.5">{profileContext.contributionScoreLast30} activity pts</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-white/15 bg-black/10 px-2.5 py-2 text-[11px] text-indigo-100/90">
              Priority improvement: <span className="font-semibold text-white">{weakestFactor.label}</span> is currently your lowest signal.
            </div>
            <details className="mt-2 text-[11px] text-indigo-100/85">
              <summary className="cursor-pointer select-none hover:text-white">How this score is calculated</summary>
              <div className="mt-1 leading-relaxed">
                Weighted model: Mastery 35% + Coverage 25% + Consistency 15% + Interviews 15% + Engagement 10%.
              </div>
            </details>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Next Mock Interview</span>
            </div>
            {scheduledSession ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatDateTime(scheduledTime)}
                </div>
                <div className="text-sm text-slate-400 mb-4">
                  {scheduledSession.template?.title || 'Scheduled Interview'}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem(
                          'pendingInterviewStart',
                          JSON.stringify({ sessionId: scheduledSession.id, template: scheduledSession.template })
                        );
                        setActiveTab('interviews');
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Start Now
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('pendingInterviewSchedule', '1');
                        setActiveTab('interviews');
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        if (!token) return;
                        await cancelInterviewSession(token, scheduledSession.id);
                        await loadSessions();
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel Scheduled Interview
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-white mb-1">No interview scheduled</div>
                <div className="text-sm text-slate-400 mb-4">Schedule a mock interview to practice with AI feedback.</div>
                <button
                  onClick={() => {
                    localStorage.setItem('pendingInterviewSchedule', '1');
                    setActiveTab('interviews');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Schedule Interview
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Zap className="w-5 h-5" />
            <span className="font-medium">XP Earned</span>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold text-white">{loadingXP ? '...' : totalXP.toLocaleString()}</span>
            {!loadingXP && (
              <span className={`text-sm font-medium mb-1.5 ${todayXP > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {todayXP > 0 ? `+${todayXP} today` : 'No XP today'}
              </span>
            )}
          </div>
          <div className="flex gap-1 h-9 items-end">
            {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm ${i === 3 ? 'bg-indigo-500' : 'bg-slate-700'}`} 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-full">
          <SkillRadar
            data={skillData}
            className="h-full"
            dominantSkill={
              dominantSkill
                ? { subject: dominantSkill.title, score: Math.round(dominantSkill.strength) }
                : null
            }
            needsWorkSkill={
              needsWorkSkill
                ? { subject: needsWorkSkill.title, score: Math.round(needsWorkSkill.strength) }
                : null
            }
            hasActivity={startedTopics.length > 0}
          />
        </div>
        <div className="lg:col-span-2">
          <LevelRoadmap
            topics={topics}
            onTopicSelect={(topicId) => {
              if (onPracticeTopicSelect && topicId) {
                onPracticeTopicSelect(topicId);
                return;
              }
              setActiveTab('practice');
            }}
          />
        </div>
      </div>
    </div>
  );
};
