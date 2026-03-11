import API_BASE_URL from './config';
import { getUserTimeZone, parseBackendDate, toDateKey } from '../utils/dateTime';
const PRACTICE_SERVICE_FALLBACK_URL = 'http://localhost:8002';

const shouldUsePracticeFallback = (status: number) => status === 404 || status === 405;

const fetchWithPracticeFallback = async (
  path: string,
  init: RequestInit
) => {
  const primaryResponse = await fetch(`${API_BASE_URL}${path}`, init);
  if (!shouldUsePracticeFallback(primaryResponse.status)) {
    return primaryResponse;
  }

  // Gateway can be stale/routed incorrectly in local setups; retry against practice service directly.
  return fetch(`${PRACTICE_SERVICE_FALLBACK_URL}${path}`, init);
};

// Category ID mapping
const CATEGORY_SLUG_TO_ID: Record<string, number> = {
  'reactjs': 1,
  'react': 1,
  'javascript': 2,
  'js': 2,
  'system-design': 3,
  'sysdes': 3,
  'data-structures': 4,
  'dsa': 4,
  'algorithms': 5,
  'algo': 5,
  'behavioral': 6,
};

/**
 * Convert category slug to numeric ID
 */
export const getCategoryIdFromSlug = (slug: string): number => {
  return CATEGORY_SLUG_TO_ID[slug.toLowerCase()] || 1;
};

export interface Question {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
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

export interface PaginatedResponse<T> {
  total: number;
  count: number;
  offset: number;
  limit: number;
  has_more: boolean;
  data: T[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  total_questions: number;
  questions_solved: number;
  score_percentage: number;
  percentile_rank: number;
  is_locked: boolean;
  last_practiced?: string;
}

export interface QuestionTestResult {
  passed: boolean;
  input: any;
  expected: any;
  actual?: any;
  error?: string;
}

export interface SubmissionResponse {
  // new simplified fields
  correct?: boolean;
  score?: number;

  // old-style detailed results (still returned for compatibility)
  submission_id?: string;
  status?: string;
  results?: QuestionTestResult[];
  passed?: boolean;
  testsPassed?: number;
  testsTotal?: number;
  xpEarned?: number;

  // profile info may include basic user data after evaluation
  profile?: {
    id: string;
    username: string;
    level?: number;
    streak_days?: number;
    // additional fields from profile-service can be added later
  };
}

export interface JudgeJobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface JudgeResultResponse {
  status: 'queued' | 'processing' | 'completed' | 'error' | 'unknown';
  progress?: string;
  results?: QuestionTestResult[];
  passed?: boolean;
  testsPassed?: number;
  testsTotal?: number;
  score?: number;
  xpEarned?: number;
  completed_at?: string;
}

/**
 * Fetch all categories with user progress
 */
export const fetchCategories = async (token: string): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or expired token. Please login again.');
    }

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch categories (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Fetch questions for a specific category with pagination
 */
export const fetchQuestionsByCategory = async (
  categorySlug: string,
  token: string,
  options?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResponse<Question>> => {
  try {
    const { difficulty, limit = 20, offset = 0 } = options || {};
    
    // Convert slug to numeric ID
    const categoryId = getCategoryIdFromSlug(categorySlug);
    
    let url = `${API_BASE_URL}/categories/${categoryId}/questions?limit=${limit}&offset=${offset}`;
    if (difficulty) {
      url += `&difficulty=${difficulty}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or expired token. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('Forbidden: You do not have access to this resource.');
    }

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch questions (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    
    // Handle old format (array) vs new format (paginated response)
    if (Array.isArray(data)) {
      // Old format - convert to paginated response
      return {
        total: data.length,
        count: data.length,
        offset: 0,
        limit: data.length,
        has_more: false,
        data
      };
    }
    
    // New paginated format
    return data as PaginatedResponse<Question>;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

/**
 * Fetch list of question IDs that user has solved in a category
 */
export const fetchSolvedQuestions = async (
  categorySlug: string,
  token: string
): Promise<string[]> => {
  try {
    const categoryId = getCategoryIdFromSlug(categorySlug);
    
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/solved`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or expired token. Please login again.');
    }

    if (!response.ok) {
      console.warn(`Failed to fetch solved questions (${response.status})`);
      return [];
    }

    const data = await response.json();
    return data.solved_question_ids || [];
  } catch (error) {
    console.error('Error fetching solved questions:', error);
    return [];
  }
};

/**
 * Fetch detailed question content
 */
export const fetchQuestionDetail = async (
  questionId: string,
  token: string
): Promise<Question> => {
  try {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Invalid or expired token. Please login again.');
    }

    if (response.status === 404) {
      throw new Error('Question not found.');
    }

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch question (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    // ensure type exists; default to coding if any code/testcases present
    if (!data.type) {
      if (data.starter_code || (data.test_cases && data.test_cases.length > 0)) {
        data.type = 'coding';
      } else if (data.examples || data.constraints) {
        // simple heuristic
        data.type = 'descriptive';
      } else {
        data.type = 'coding';
      }
    }
    return data;
  } catch (error) {
    console.error('Error fetching question detail:', error);
    throw error;
  }
};

/**
 * Start a practice session
 */
export const startPracticeSession = async (
  questionId: string,
  token: string
): Promise<{ session_id: string; started_at: string }> => {
  try {
    const response = await fetchWithPracticeFallback('/sessions/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question_id: questionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
};

/**
 * Submit answer/code for evaluation
 */
export const submitAnswer = async (
  sessionId: string,
  code: string | undefined,
  answerText: string | undefined,
  language: 'javascript' | 'typescript' | 'python' | undefined,
  timeSpent: number,
  hintsUsed: number,
  token: string
): Promise<SubmissionResponse> => {
  try {
    const response = await fetchWithPracticeFallback('/sessions/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        code,
        answer_text: answerText,
        language,
        time_spent: timeSpent,
        hints_used: hintsUsed,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to submit answer: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.detail) {
          errorMessage = String(errorBody.detail);
        }
      } catch {
        // keep default message when body is not JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

/**
 * Poll judge job result
 */
export const pollJudgeResult = async (
  jobId: string,
  token: string
): Promise<JudgeResultResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/judge/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll judge result: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error polling judge result:', error);
    throw error;
  }
};

/**
 * Claim judge result and update session
 */
export const claimJudgeResult = async (
  jobId: string,
  token: string
): Promise<JudgeResultResponse & { profile?: any }> => {
  try {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const response = await fetch(`${API_BASE_URL}/judge/${jobId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Timezone': userTz,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to claim judge result: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error claiming judge result:', error);
    throw error;
  }
};

/**
 * Get practice session history
 */
export const fetchPracticeHistory = async (
  token: string,
  limit: number = 10,
  questionId?: string
): Promise<any[]> => {
  try {
    let url = `${API_BASE_URL}/history?limit=${limit}`;
    if (questionId) {
      url += `&question_id=${questionId}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    let data = await response.json();
    // Handle both array format and paginated object format
    if (Array.isArray(data)) {
      return data;
    }
    // Handle paginated response variants
    return data.results || data.data || data.items || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

/**
 * Calculate total XP earned today from user's session history
 */
export const getTodayXP = async (token: string): Promise<{ totalXP: number; todayXP: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    const data = await response.json();
    const sessions = Array.isArray(data) ? data : data.results || [];

    const tz = getUserTimeZone();
    const todayKey = toDateKey(new Date(), tz);

    // De-duplicate XP by question so repeated submissions of the same solved question
    // don't inflate XP cards on the dashboard.
    const maxXpPerQuestionAllTime = new Map<string, number>();
    const maxXpPerQuestionToday = new Map<string, number>();

    sessions.forEach((session: any, index: number) => {
      const xpEarned = Number(session.xp_earned ?? session.xpEarned ?? 0) || 0;
      const questionKey = session.question_id || session.questionId || `session:${session.session_id || session.sessionId || index}`;

      const prevAllTime = maxXpPerQuestionAllTime.get(questionKey) ?? 0;
      if (xpEarned > prevAllTime) {
        maxXpPerQuestionAllTime.set(questionKey, xpEarned);
      }

      const when = parseBackendDate(session.submitted_at || session.created_at) || new Date();
      if (toDateKey(when, tz) === todayKey) {
        const prevToday = maxXpPerQuestionToday.get(questionKey) ?? 0;
        if (xpEarned > prevToday) {
          maxXpPerQuestionToday.set(questionKey, xpEarned);
        }
      }
    });

    const totalXP = Array.from(maxXpPerQuestionAllTime.values()).reduce((sum, xp) => sum + xp, 0);
    const todayXP = Array.from(maxXpPerQuestionToday.values()).reduce((sum, xp) => sum + xp, 0);

    return { totalXP, todayXP };
  } catch (error) {
    console.error('Error calculating XP:', error);
    // Return default values on error instead of throwing
    return { totalXP: 0, todayXP: 0 };
  }
};
