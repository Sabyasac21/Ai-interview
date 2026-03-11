export type DailyContribution = {
  practice_submissions_count: number;
  practice_solved_count: number;
  mock_interviews_completed_count: number;
  active_seconds: number;
  resume_actions_count: number;
  last_updated_at?: string;
};

export type HeatmapContributionDay = {
  dateKey: string;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  actions: number;
};

export type ContributionActionType =
  | 'practice_submission'
  | 'practice_solved'
  | 'mock_interview_completed'
  | 'resume_action'
  | 'active_time';

export type ContributionAction = {
  id: string;
  dateKey: string;
  timestamp: string;
  type: ContributionActionType;
  label: string;
  value?: number;
  inferred?: boolean;
};

const STORE_KEY = 'interviewai_daily_contributions_v1';
const ACTION_STORE_KEY = 'interviewai_contribution_actions_v1';

const DEFAULT_DAY: DailyContribution = {
  practice_submissions_count: 0,
  practice_solved_count: 0,
  mock_interviews_completed_count: 0,
  active_seconds: 0,
  resume_actions_count: 0,
};

export const getLocalDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const readContributionStore = (): Record<string, DailyContribution> => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const writeContributionStore = (store: Record<string, DailyContribution>) => {
  try {
    const keys = Object.keys(store).sort();
    if (keys.length > 730) {
      keys.slice(0, keys.length - 730).forEach((k) => delete store[k]);
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage issues
  }
};

const readContributionActionStore = (): Record<string, ContributionAction[]> => {
  try {
    const raw = localStorage.getItem(ACTION_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeContributionActionStore = (store: Record<string, ContributionAction[]>) => {
  try {
    const dayKeys = Object.keys(store).sort();
    if (dayKeys.length > 730) {
      dayKeys.slice(0, dayKeys.length - 730).forEach((k) => delete store[k]);
    }

    // keep only recent events per day to avoid localStorage bloat
    Object.keys(store).forEach((k) => {
      const events = Array.isArray(store[k]) ? store[k] : [];
      store[k] = events.slice(-300);
    });

    localStorage.setItem(ACTION_STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage issues
  }
};

const pushContributionAction = (
  dateKey: string,
  action: Omit<ContributionAction, 'id' | 'dateKey' | 'timestamp'>,
  at: Date
) => {
  const actionStore = readContributionActionStore();
  const existing = Array.isArray(actionStore[dateKey]) ? actionStore[dateKey] : [];
  const next: ContributionAction = {
    id: `${at.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    dateKey,
    timestamp: at.toISOString(),
    type: action.type,
    label: action.label,
    value: action.value,
  };
  actionStore[dateKey] = [...existing, next];
  writeContributionActionStore(actionStore);
};

export const recordContribution = (
  patch: Partial<DailyContribution>,
  date: Date = new Date()
) => {
  const key = getLocalDateKey(date);
  const store = readContributionStore();
  const prev = { ...DEFAULT_DAY, ...(store[key] || {}) };

  const next: DailyContribution = {
    practice_submissions_count: Math.max(0, prev.practice_submissions_count + Math.floor(patch.practice_submissions_count || 0)),
    practice_solved_count: Math.max(0, prev.practice_solved_count + Math.floor(patch.practice_solved_count || 0)),
    mock_interviews_completed_count: Math.max(0, prev.mock_interviews_completed_count + Math.floor(patch.mock_interviews_completed_count || 0)),
    active_seconds: Math.max(0, prev.active_seconds + Math.floor(patch.active_seconds || 0)),
    resume_actions_count: Math.max(0, prev.resume_actions_count + Math.floor(patch.resume_actions_count || 0)),
    last_updated_at: new Date().toISOString(),
  };

  store[key] = next;
  writeContributionStore(store);

  const solvedCount = Math.max(0, Math.floor(patch.practice_solved_count || 0));
  for (let i = 0; i < solvedCount; i++) {
    pushContributionAction(key, { type: 'practice_solved', label: 'Solved a practice question', value: 1 }, date);
  }

  const submissionCount = Math.max(0, Math.floor(patch.practice_submissions_count || 0));
  for (let i = 0; i < submissionCount; i++) {
    pushContributionAction(key, { type: 'practice_submission', label: 'Submitted a practice attempt', value: 1 }, date);
  }

  const mockCount = Math.max(0, Math.floor(patch.mock_interviews_completed_count || 0));
  for (let i = 0; i < mockCount; i++) {
    pushContributionAction(key, { type: 'mock_interview_completed', label: 'Completed a mock interview', value: 1 }, date);
  }

  const resumeCount = Math.max(0, Math.floor(patch.resume_actions_count || 0));
  for (let i = 0; i < resumeCount; i++) {
    pushContributionAction(key, { type: 'resume_action', label: 'Updated resume builder', value: 1 }, date);
  }

  const activeSeconds = Math.max(0, Math.floor(patch.active_seconds || 0));
  const activeMinutes = Math.floor(activeSeconds / 60);
  if (activeMinutes >= 1) {
    pushContributionAction(
      key,
      { type: 'active_time', label: `Spent ${activeMinutes} min active in app`, value: activeMinutes },
      date
    );
  }
};

export const computeContributionScore = (day: DailyContribution): number => {
  const solved = Math.min(day.practice_solved_count, 8) * 4;
  const submissions = Math.min(day.practice_submissions_count, 12) * 2;
  const mocks = Math.min(day.mock_interviews_completed_count, 3) * 10;
  // Count app activity at 1-minute granularity so short sessions still appear.
  const active = Math.min(Math.floor(day.active_seconds / 60), 60) * 1; // +1 per 1 min
  const resume = Math.min(day.resume_actions_count, 10) * 1;
  return solved + submissions + mocks + active + resume;
};

export const scoreToLevel = (score: number): 0 | 1 | 2 | 3 | 4 => {
  if (score <= 0) return 0;
  if (score < 5) return 1;
  if (score < 10) return 2;
  if (score < 20) return 3;
  return 4;
};

export const getContributionHeatmapDays = (numDays: number = 26 * 7): HeatmapContributionDay[] => {
  const store = readContributionStore();
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (numDays - 1));

  const out: HeatmapContributionDay[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = getLocalDateKey(d);
    const day = { ...DEFAULT_DAY, ...(store[key] || {}) };
    const score = computeContributionScore(day);
    const actions =
      day.practice_submissions_count +
      day.practice_solved_count +
      day.mock_interviews_completed_count +
      day.resume_actions_count;

    out.push({
      dateKey: key,
      score,
      level: scoreToLevel(score),
      actions,
    });
  }
  return out;
};

export const getContributionSummary = (numDays: number = 365) => {
  const days = getContributionHeatmapDays(numDays);
  const activeDays = days.filter((d) => d.score > 0).length;
  const totalScore = days.reduce((sum, d) => sum + d.score, 0);
  const totalActions = days.reduce((sum, d) => sum + d.actions, 0);

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].score > 0) currentStreak++;
    else break;
  }

  let longestStreak = 0;
  let streak = 0;
  for (const day of days) {
    if (day.score > 0) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { activeDays, totalScore, totalActions, currentStreak, longestStreak };
};

export const getContributionActionsForDate = (dateKey: string): ContributionAction[] => {
  if (!dateKey) return [];
  const store = readContributionActionStore();
  const events = Array.isArray(store[dateKey]) ? store[dateKey] : [];
  return [...events].sort((a, b) => {
    const at = new Date(a.timestamp).getTime();
    const bt = new Date(b.timestamp).getTime();
    return at - bt;
  });
};
