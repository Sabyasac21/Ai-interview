import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = '/api'; // uses Vite proxy

// ─── Types ────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  plan_active: boolean;
  credits_used: number;
  credits_limit: number;
  streak_days: number;
  level: number;
  level_title: string;
  title?: string | null;
  profile_summary?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, username: string, password: string, fullName: string) => Promise<User>;
  logout: () => void;
  updateProfile: (fullName: string, avatarFile?: File, socialLinks?: { github?: string; linkedin?: string; portfolio?: string }, title?: string, profileSummary?: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ─── API Helpers ──────────────────────────────────────────────
const fetchMe = async (token: string): Promise<User> => {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errorMsg = 'Failed to fetch user';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // empty or invalid response body
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data;
};

const syncStreak = async (token: string): Promise<void> => {
  try {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    await fetch(`${API_BASE}/users/me/sync-streak`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-User-Timezone': userTz,
      },
    });
  } catch (e) {
    // fail-open: streak sync should not block auth init
    console.debug('streak sync failed', e);
  }
};

// ─── Provider ─────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('interviewai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          await syncStreak(token);
          const userData = await fetchMe(token);
          setUser(userData);
        } catch {
          localStorage.removeItem('interviewai_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let errorMsg = 'Invalid credentials';
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // empty or invalid response body
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    localStorage.setItem('interviewai_token', data.access_token);
    setToken(data.access_token);
    await syncStreak(data.access_token);
    const userData = await fetchMe(data.access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email: string, username: string, password: string, fullName: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, full_name: fullName }),
    });

    if (!res.ok) {
      let errorMsg = 'Registration failed';
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // empty or invalid response body
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    localStorage.setItem('interviewai_token', data.access_token);
    setToken(data.access_token);
    await syncStreak(data.access_token);
    const userData = await fetchMe(data.access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('interviewai_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const updated = await fetchMe(token);
        setUser(updated);
      } catch (e) {
        console.error('Failed to refresh user', e);
      }
    }
  };

  const updateProfile = async (fullName: string, avatarFile?: File, socialLinks?: { github?: string; linkedin?: string; portfolio?: string }, title?: string, profileSummary?: string): Promise<User> => {
    if (!token) throw new Error('Not authenticated');
    
    const formData = new FormData();
    formData.append('full_name', fullName);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    if (socialLinks?.github) {
      formData.append('github_url', socialLinks.github);
    }
    if (socialLinks?.linkedin) {
      formData.append('linkedin_url', socialLinks.linkedin);
    }
    if (socialLinks?.portfolio) {
      formData.append('portfolio_url', socialLinks.portfolio);
    }
    if (title !== undefined) {
      formData.append('title', title);
    }
    if (profileSummary !== undefined) {
      formData.append('profile_summary', profileSummary);
    }
    
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = 'Failed to update profile';
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // empty or invalid response body
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    
    // Update user in state with all fields including social links
    const updatedUser = data.user || data;
    setUser({
      ...user,
      ...updatedUser,
      github_url: socialLinks?.github || user?.github_url || null,
      linkedin_url: socialLinks?.linkedin || user?.linkedin_url || null,
      portfolio_url: socialLinks?.portfolio || user?.portfolio_url || null,
      title: title !== undefined ? title : user?.title || null,
      profile_summary: profileSummary !== undefined ? profileSummary : user?.profile_summary || null,
    } as User);
    
    // Refresh user data to ensure all fields are synced
    await refreshUser();
    
    return updatedUser;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to change password';
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // empty or invalid response body
      }
      throw new Error(errorMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
