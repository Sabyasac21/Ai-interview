import { Github, Linkedin, Globe, Trophy, Award, Flame, Zap, MapPin, Lock } from 'lucide-react';
import { SkillRadar } from './SkillRadar';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchPracticeHistory, fetchCategories, Category } from '../../api/questions';
import { fetchUserSessions } from '../api/interviews';
import { getContributionHeatmapDays, getContributionActionsForDate, readContributionStore, HeatmapContributionDay, ContributionAction } from '../utils/contributionTracker';
import { getLastNDaysKeys, getUserTimeZone, parseBackendDate, toDateKey } from '../../utils/dateTime';

type HeatmapDay = HeatmapContributionDay;

const PROFILE_REFRESH_MS = 60000;

const Heatmap = ({
  days,
  selectedDateKey,
  onSelectDate,
}: {
  days: HeatmapDay[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollLeft = node.scrollWidth;
  }, [days]);

  const getColor = (level: HeatmapDay['level']) => {
    switch (level) {
      case 1: return 'bg-emerald-900';
      case 2: return 'bg-emerald-700';
      case 3: return 'bg-emerald-500';
      case 4: return 'bg-emerald-300';
      default: return 'bg-slate-800';
    }
  };

  const monthLabels = Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => {
    const day = days[Math.min(weekIndex * 7, days.length - 1)];
    const date = new Date(day?.dateKey || new Date().toISOString());
    return date.toLocaleDateString(undefined, { month: 'short' });
  });

  const weeklyColumns = Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) =>
    days.slice(weekIndex * 7, weekIndex * 7 + 7)
  );

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Practice Activity</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-300" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div ref={scrollerRef} className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[auto_1fr] gap-3 mb-1 text-[10px] text-slate-500">
            <div />
            <div className="flex justify-between pr-1">
              {monthLabels.map((label, idx) => (
                <span key={`${label}-${idx}`}>{idx % 4 === 0 ? label : ''}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="grid grid-rows-7 gap-1 text-[10px] text-slate-500 pt-[2px]">
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>

            <div className="flex gap-1">
              {weeklyColumns.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const day = week[dayIndex];
                    if (!day) {
                      return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3 rounded-sm bg-transparent" />;
                    }
                    const [yy, mm, dd] = day.dateKey.split('-').map((v) => Number(v));
                    const date = new Date(yy, (mm || 1) - 1, dd || 1);
                    return (
                      <div
                        key={day.dateKey}
                        className={`w-3 h-3 rounded-sm ${getColor(day.level)} transition-colors hover:ring-1 hover:ring-white/50 cursor-pointer ${selectedDateKey === day.dateKey ? 'ring-2 ring-indigo-300 ring-offset-1 ring-offset-slate-800' : ''}`}
                        title={`${day.score} pts (${day.actions} actions) on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        onClick={() => onSelectDate(day.dateKey)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DailyActionTimeline = ({ dateKey, actions }: { dateKey: string; actions: ContributionAction[] }) => {
  const formattedDate = useMemo(() => {
    if (!dateKey) return '';
    const [yy, mm, dd] = dateKey.split('-').map((v) => Number(v));
    return new Date(yy, (mm || 1) - 1, dd || 1).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [dateKey]);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Activity Flow</h3>
        <span className="text-xs text-slate-400">{formattedDate}</span>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-slate-400">No detailed actions logged for this date yet.</p>
      ) : (
        <div className="space-y-0">
          {actions.map((action, index) => {
            const time = action.inferred
              ? 'Approx time (aggregated)'
              : new Date(action.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
            const isLast = index === actions.length - 1;
            return (
              <div key={action.id} className="grid grid-cols-[22px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  {!isLast && <span className="mt-1 w-px flex-1 bg-slate-600" />}
                </div>
                <div className={`${!isLast ? 'pb-4' : ''}`}>
                  <p className="text-sm text-slate-200">{action.label}</p>
                  <p className="text-xs text-slate-400">{time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, subtext }: { icon: any, label: string, value: string, subtext?: string }) => (
  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4">
    <div className="p-3 bg-indigo-500/10 rounded-xl">
      <Icon className="w-6 h-6 text-indigo-400" />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-bold text-white">{value}</h4>
        {subtext && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{subtext}</span>}
      </div>
    </div>
  </div>
);

const Badge = ({
  icon: Icon,
  name,
  description,
  color,
  earned,
}: {
  icon: any,
  name: string,
  description: string,
  color: string,
  earned: boolean,
}) => (
  <div className={`group relative p-4 rounded-xl border transition-all cursor-default ${earned ? 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-900/30 border-slate-700/30 opacity-90'}`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${earned ? color : 'bg-slate-700/50 text-slate-400'} bg-opacity-10`}>
      {earned ? <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} /> : <Lock className="w-5 h-5 text-slate-400" />}
    </div>
    <h4 className="text-sm font-medium text-slate-200 mb-1">{name}</h4>
    <p className="text-xs text-slate-500 leading-tight">{description}</p>
    {!earned && <p className="text-[10px] text-indigo-300 mt-2">Locked</p>}
  </div>
);

export const UserProfile = () => {
  const { user, token } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<string>('Detecting...');
  const [locationError, setLocationError] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<any[]>([]);
  const [contributionTick, setContributionTick] = useState<number>(0);
  const [selectedHeatmapDateKey, setSelectedHeatmapDateKey] = useState<string>('');
  const historySignatureRef = useRef<string>('');
  const categoriesSignatureRef = useRef<string>('');
  const interviewSignatureRef = useRef<string>('');

  const parseServerDate = (value: any): Date | null => parseBackendDate(value);

  // Helper function to normalize URLs
  const normalizeUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  // Function to get location name from coordinates using reverse geocoding
  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      // Extract city and country from the response
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.municipality;
      const country = address.country;
      
      if (city && country) {
        return `${city}, ${country}`;
      } else if (city) {
        return city;
      } else if (country) {
        return country;
      } else {
        return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  };

  // Detect user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation('Location not supported');
      return;
    }

    const getLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        const locationName = await getLocationName(latitude, longitude);
        setCurrentLocation(locationName);
      } catch (error) {
        console.error('Error getting location:', error);
        if (error instanceof GeolocationPositionError) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Location access denied');
              setCurrentLocation('Permission denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('Location unavailable');
              setCurrentLocation('Location unavailable');
              break;
            case error.TIMEOUT:
              setLocationError('Location request timed out');
              setCurrentLocation('Location timeout');
              break;
            default:
              setLocationError('Unknown location error');
              setCurrentLocation('Location error');
          }
        } else {
          setLocationError('Failed to detect location');
          setCurrentLocation('Detection failed');
        }
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    let intervalId: number | null = null;

    const getHistorySignature = (items: any[]) => {
      const first = items?.[0];
      return `${items.length}|${first?._id || first?.session_id || ''}|${first?.created_at || first?.submitted_at || ''}`;
    };

    const getCategoriesSignature = (items: Category[]) => {
      return items.map((c) => `${c.slug}:${c.questions_solved}:${c.score_percentage}`).join('|');
    };

    const getInterviewSignature = (items: any[]) => {
      const first = items?.[0];
      return `${items.length}|${first?.id || ''}|${first?.updated_at || first?.scheduled_at || ''}`;
    };

    const loadProfileData = async () => {
      if (!token) return;
      const [historyRes, categoriesRes, sessionsRes] = await Promise.allSettled([
        // history-service enforces limit <= 100
        fetchPracticeHistory(token, 100),
        fetchCategories(token),
        fetchUserSessions(token),
      ]);

      if (historyRes.status === 'fulfilled') {
        const next = Array.isArray(historyRes.value) ? historyRes.value : [];
        const sig = getHistorySignature(next);
        if (sig !== historySignatureRef.current) {
          historySignatureRef.current = sig;
          setHistoryEntries(next);
        }
      } else {
        console.error('Failed to load practice history for profile:', historyRes.reason);
        if (historySignatureRef.current !== 'ERR') {
          historySignatureRef.current = 'ERR';
          setHistoryEntries([]);
        }
      }

      if (categoriesRes.status === 'fulfilled') {
        const next = Array.isArray(categoriesRes.value) ? categoriesRes.value : [];
        const sig = getCategoriesSignature(next);
        if (sig !== categoriesSignatureRef.current) {
          categoriesSignatureRef.current = sig;
          setCategories(next);
        }
      } else {
        console.error('Failed to load categories for profile:', categoriesRes.reason);
        if (categoriesSignatureRef.current !== 'ERR') {
          categoriesSignatureRef.current = 'ERR';
          setCategories([]);
        }
      }

      if (sessionsRes.status === 'fulfilled') {
        const next = Array.isArray(sessionsRes.value) ? sessionsRes.value : [];
        const sig = getInterviewSignature(next);
        if (sig !== interviewSignatureRef.current) {
          interviewSignatureRef.current = sig;
          setInterviewSessions(next);
        }
      } else {
        console.error('Failed to load interview sessions for profile:', sessionsRes.reason);
        if (interviewSignatureRef.current !== 'ERR') {
          interviewSignatureRef.current = 'ERR';
          setInterviewSessions([]);
        }
      }
    };

    loadProfileData();

    const schedulePolling = () => {
      if (intervalId) window.clearInterval(intervalId);
      if (document.hidden) return;
      intervalId = window.setInterval(loadProfileData, PROFILE_REFRESH_MS);
    };

    schedulePolling();
    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadProfileData();
      }
      schedulePolling();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token]);

  useEffect(() => {
    const refreshTick = () => setContributionTick(Date.now());
    refreshTick();
    const intervalId = window.setInterval(refreshTick, 15000);
    const onVisibility = () => {
      if (!document.hidden) refreshTick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const recentWeekKeys = useMemo(() => {
    const tz = getUserTimeZone();
    return new Set(getLastNDaysKeys(7, new Date(), tz));
  }, [contributionTick]);

  const solvedQuestionIds = useMemo(() => {
    const isSolvedEntry = (entry: any) => {
      const passed = entry?.passed === true || entry?.passed === 'True';
      const correct = entry?.correct === true || entry?.correct === 'True';
      const testsPassed = Number(entry?.tests_passed ?? entry?.testsPassed ?? 0);
      const testsTotal = Number(entry?.tests_total ?? entry?.testsTotal ?? 0);
      const fullyPassedTests = testsTotal > 0 && testsPassed === testsTotal;
      const positiveScore = Number(entry?.score ?? 0) > 0;
      return passed || correct || fullyPassedTests || positiveScore;
    };

    const set = new Set<string>();
    historyEntries.forEach((entry: any) => {
      const solved = isSolvedEntry(entry);
      if (solved && entry?.question_id) {
        set.add(String(entry.question_id));
      }
    });
    return set;
  }, [historyEntries]);

  const solvedQuestionIdsThisWeek = useMemo(() => {
    const isSolvedEntry = (entry: any) => {
      const passed = entry?.passed === true || entry?.passed === 'True';
      const correct = entry?.correct === true || entry?.correct === 'True';
      const testsPassed = Number(entry?.tests_passed ?? entry?.testsPassed ?? 0);
      const testsTotal = Number(entry?.tests_total ?? entry?.testsTotal ?? 0);
      const fullyPassedTests = testsTotal > 0 && testsPassed === testsTotal;
      const positiveScore = Number(entry?.score ?? 0) > 0;
      const evaluatedStatus = String(entry?.status || '').toLowerCase() === 'evaluated';
      return passed || correct || fullyPassedTests || positiveScore || evaluatedStatus;
    };

    const tz = getUserTimeZone();
    const set = new Set<string>();
    historyEntries.forEach((entry: any) => {
      const solved = isSolvedEntry(entry);
      if (!solved) return;
      const when = parseServerDate(entry.submitted_at || entry.created_at) || new Date();
      const dayKey = toDateKey(when, tz);
      if (recentWeekKeys.has(dayKey)) {
        const key = entry?.question_id || entry?.questionId || entry?.session_id || entry?.sessionId;
        if (key) {
          set.add(String(key));
        }
      }
    });
    return set;
  }, [historyEntries, recentWeekKeys]);

  const solvedThisWeekCount = useMemo(() => {
    const fromHistory = solvedQuestionIdsThisWeek.size;
    const fromUser = Number((user as any)?.questions_solved_this_week || 0);
    return Math.max(fromHistory, fromUser);
  }, [solvedQuestionIdsThisWeek.size, user]);

  const completedMockInterviews = useMemo(() => {
    return interviewSessions.filter((session: any) => session?.status === 'completed').length;
  }, [interviewSessions]);

  const totalSolvedProblems = useMemo(() => {
    const fromCategories = categories.reduce((sum, category) => sum + Number(category?.questions_solved || 0), 0);
    if (fromCategories > 0) return fromCategories;
    if (solvedQuestionIds.size > 0) return solvedQuestionIds.size;
    return Number((user as any)?.questions_solved || 0);
  }, [categories, solvedQuestionIds.size, user]);

  const heatmapDays = useMemo<HeatmapDay[]>(() => {
    return getContributionHeatmapDays(26 * 7);
  }, [contributionTick]);

  useEffect(() => {
    if (selectedHeatmapDateKey) return;
    const latestActive = [...heatmapDays].reverse().find((day) => day.score > 0);
    setSelectedHeatmapDateKey(latestActive?.dateKey || heatmapDays[heatmapDays.length - 1]?.dateKey || '');
  }, [heatmapDays, selectedHeatmapDateKey]);

  const selectedDayActions = useMemo(() => {
    if (!selectedHeatmapDateKey) return [];
    const explicitActions = getContributionActionsForDate(selectedHeatmapDateKey).sort((a, b) => {
      const at = new Date(a.timestamp).getTime();
      const bt = new Date(b.timestamp).getTime();
      return at - bt;
    });

    // Backward-compat: older days may have only aggregated counters with no event log.
    const store = readContributionStore();
    const day = store[selectedHeatmapDateKey];
    if (!day) return explicitActions;

    const [yy, mm, dd] = selectedHeatmapDateKey.split('-').map((v) => Number(v));
    const defaultBase = new Date(yy, (mm || 1) - 1, dd || 1, 12, 0, 0);
    let seq = 0;
    const synthetic: ContributionAction[] = [];

    const explicitCountByType: Record<ContributionAction['type'], number> = {
      practice_submission: 0,
      practice_solved: 0,
      mock_interview_completed: 0,
      resume_action: 0,
      active_time: 0,
    };
    explicitActions.forEach((a) => {
      explicitCountByType[a.type] = (explicitCountByType[a.type] || 0) + 1;
    });

    const explicitActiveMinutes = explicitActions
      .filter((a) => a.type === 'active_time')
      .reduce((sum, a) => sum + Math.max(0, Number(a.value || 0)), 0);

    const earliestExplicitTime = explicitActions.length > 0
      ? new Date(explicitActions[0].timestamp).getTime()
      : null;

    const pushMany = (count: number, type: ContributionAction['type'], label: string) => {
      const total = Math.max(0, Math.floor(count || 0));
      for (let i = 0; i < total; i++) {
        // If explicit events exist, place inferred events just before them
        // so ordering remains coherent without inventing a misleading clock time.
        const atMs = earliestExplicitTime !== null
          ? earliestExplicitTime - (seq + 1) * 60 * 1000
          : defaultBase.getTime() + seq * 60 * 1000;
        const at = new Date(atMs);
        synthetic.push({
          id: `fallback-${selectedHeatmapDateKey}-${type}-${i}`,
          dateKey: selectedHeatmapDateKey,
          timestamp: at.toISOString(),
          type,
          label,
          value: 1,
          inferred: true,
        });
        seq++;
      }
    };

    const missingSubmission = Math.max(0, (day.practice_submissions_count || 0) - explicitCountByType.practice_submission);
    const missingSolved = Math.max(0, (day.practice_solved_count || 0) - explicitCountByType.practice_solved);
    const missingMock = Math.max(0, (day.mock_interviews_completed_count || 0) - explicitCountByType.mock_interview_completed);
    const missingResume = Math.max(0, (day.resume_actions_count || 0) - explicitCountByType.resume_action);

    pushMany(missingSubmission, 'practice_submission', 'Submitted a practice attempt');
    pushMany(missingSolved, 'practice_solved', 'Solved a practice question');
    pushMany(missingMock, 'mock_interview_completed', 'Completed a mock interview');
    pushMany(missingResume, 'resume_action', 'Updated resume builder');

    const activeMinutes = Math.floor((day.active_seconds || 0) / 60);
    const missingActiveMinutes = Math.max(0, activeMinutes - explicitActiveMinutes);
    if (missingActiveMinutes > 0) {
      const atMs = earliestExplicitTime !== null
        ? earliestExplicitTime - (seq + 1) * 60 * 1000
        : defaultBase.getTime() + seq * 60 * 1000;
      const at = new Date(atMs);
      synthetic.push({
        id: `fallback-${selectedHeatmapDateKey}-active`,
        dateKey: selectedHeatmapDateKey,
        timestamp: at.toISOString(),
        type: 'active_time',
        label: `Spent ${missingActiveMinutes} min active in app`,
        value: missingActiveMinutes,
        inferred: true,
      });
    }

    return [...explicitActions, ...synthetic].sort((a, b) => {
      const at = new Date(a.timestamp).getTime();
      const bt = new Date(b.timestamp).getTime();
      return bt - at;
    });
  }, [selectedHeatmapDateKey, contributionTick]);

  const profileSkills = useMemo(() => {
    if (categories.length === 0) {
      return [];
    }
    return categories.map((category) => ({
      subject: category.name,
      A: Number(category.score_percentage || 0),
      fullMark: 100,
    }));
  }, [categories]);

  const focusAreas = useMemo(() => {
    return categories
      .filter((category) => !category.is_locked)
      .filter((category) => Number(category.questions_solved || 0) > 0)
      .map((category) => ({
        name: category.name,
        score: Math.max(0, Math.min(100, Number(category.score_percentage || 0))),
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
  }, [categories]);

  const badgeCards = useMemo(() => {
    const solvedCount = solvedQuestionIds.size;
    const streakDays = Number(user?.streak_days || 0);
    const interviewsDone = completedMockInterviews;

    const remainingSolvedForPractice = Math.max(0, 25 - solvedCount);
    const remainingInterviewsForPractice = Math.max(0, 3 - interviewsDone);
    const remainingSolvedForCertificate = Math.max(0, 75 - solvedCount);
    const remainingInterviewsForCertificate = Math.max(0, 10 - interviewsDone);

    return [
      {
        icon: Zap,
        name: 'Practice Starter',
        earned: solvedCount >= 25,
        color: 'bg-sky-500 text-sky-400',
        description: solvedCount >= 25
          ? `Solved ${solvedCount} problems across topics.`
          : `Practice ${remainingSolvedForPractice} more questions to unlock.`,
      },
      {
        icon: Award,
        name: 'Interview Ready',
        earned: solvedCount >= 25 && interviewsDone >= 3,
        color: 'bg-purple-500 text-purple-400',
        description: solvedCount >= 25 && interviewsDone >= 3
          ? `Unlocked with ${interviewsDone} mock interviews completed.`
          : `Practice questions and complete ${remainingInterviewsForPractice} more mock interviews.`,
      },
      {
        icon: Flame,
        name: '30 Day Streak',
        earned: streakDays >= 30,
        color: 'bg-orange-500 text-orange-400',
        description: streakDays >= 30
          ? 'Consistency certificate earned.'
          : `Keep practicing for ${Math.max(0, 30 - streakDays)} more days.`,
      },
      {
        icon: Trophy,
        name: 'Master Certificate',
        earned: solvedCount >= 75 && interviewsDone >= 10,
        color: 'bg-emerald-500 text-emerald-400',
        description: solvedCount >= 75 && interviewsDone >= 10
          ? 'Advanced certificate unlocked.'
          : `Solve ${remainingSolvedForCertificate} more questions and complete ${remainingInterviewsForCertificate} more mock interviews.`,
      },
    ];
  }, [completedMockInterviews, solvedQuestionIds.size, user?.streak_days]);

  if (!user) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Identity Header */}
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700/50 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-900/50 to-slate-900/50" />
        
        <div className="relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden">
            <img 
              src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300"} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left pt-12 md:pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{user.full_name || user.username}</h1>
              <p className="text-indigo-400 font-medium flex items-center justify-center md:justify-start gap-2">
                {user.title || 'Developer'}
                <MapPin className="w-4 h-4" /> 
                <span className={locationError ? 'text-red-400' : 'text-indigo-400'}>
                  {currentLocation}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              {user.github_url && (
                <a 
                  href={normalizeUrl(user.github_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                  title="GitHub Profile"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {user.linkedin_url && (
                <a 
                  href={normalizeUrl(user.linkedin_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-[#0077b5] hover:bg-[#006396] rounded-lg text-white transition-colors"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {user.portfolio_url && (
                <a 
                  href={normalizeUrl(user.portfolio_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                  title="Portfolio Website"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          
          <p className="mt-4 text-slate-400 max-w-2xl text-sm leading-relaxed">
            {user.profile_summary || 'Passionate about building scalable UI systems and accessible web applications. Currently mastering distributed systems and advanced React patterns.'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Trophy} 
          label="Global Percentile" 
          value={`Top ${user.percentile || '-'}%`} 
          subtext={user.tier || 'Active'}
        />
        <StatCard
          icon={Zap}
          label="Problems Solved"
          value={`${totalSolvedProblems}`}
          subtext={`+${solvedThisWeekCount} this week`}
        />
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={`${user.streak_days || 0} Days`} 
          subtext="Keep it up!"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Analytics */}
        <div className="space-y-8">
           <SkillRadar data={profileSkills} />
           
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50">
             <h3 className="text-lg font-semibold text-white mb-4">Focus Areas</h3>
             <div className="space-y-4">
               {focusAreas.length === 0 ? (
                 <p className="text-sm text-slate-400">Start practicing to unlock personalized focus areas.</p>
               ) : (
                 focusAreas.map((area) => (
                   <div key={area.name}>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="text-slate-300">{area.name}</span>
                       <span className="text-slate-400">{Math.round(area.score)}%</span>
                     </div>
                     <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                       <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.round(area.score)}%` }} />
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>

        {/* Right Column: Heatmap & Badges */}
        <div className="lg:col-span-2 space-y-8">
          <Heatmap
            days={heatmapDays}
            selectedDateKey={selectedHeatmapDateKey}
            onSelectDate={setSelectedHeatmapDateKey}
          />
          <DailyActionTimeline dateKey={selectedHeatmapDateKey} actions={selectedDayActions} />

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Badges & Certifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badgeCards.map((badge) => (
                <Badge
                  key={badge.name}
                  icon={badge.icon}
                  name={badge.name}
                  description={badge.description}
                  color={badge.color}
                  earned={badge.earned}
                />
              ))}
            </div>
            {!badgeCards.some((badge) => badge.earned) && (
              <p className="text-xs text-slate-400 mt-4">
                No badges unlocked yet. Practice more questions and complete mock interviews to unlock certificates.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
