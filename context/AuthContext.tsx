import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { API_BASE } from '../src/config/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  signup: (userData: SignupData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<AuthResult>;
  updatePassword: (passwords: { currentPassword: string; newPassword: string }) => Promise<AuthResult>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string | { message: string; status: number };
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

function toForm(obj: Record<string, any>) {
  const formData = new FormData();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      formData.append(k, String(v));
    }
  });
  return formData;
}

async function fetchJSON(url: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };

  // Always include credentials so PHP session cookies work across requests (web + native)
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : (null as any);
  const timeoutId = setTimeout(() => {
    try { controller?.abort(); } catch {}
  }, 10000);

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'include' as RequestCredentials,
      ...init,
      headers,
      // mode 'cors' is implicitly set on web when cross-origin; harmless elsewhere
      // @ts-ignore - RN fetch ignores mode
      mode: (Platform.OS === 'web' ? 'cors' : (init as any).mode),
      signal: controller?.signal,
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.warn('fetchJSON network warning:', { url, message: e?.message });
    const err = new Error(e?.message || 'Network request failed');
    (err as any).status = 0;
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  
  let data: any = {};
  try { 
    data = await res.json(); 
  } catch {}
  
  if (!res.ok || data?.success === false) {
    console.warn('fetchJSON response warning:', { url, status: res.status, data });
    const err = new Error(data?.error || `Request failed (${res.status})`) as any;
    err.status = res.status;
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(k => { 
        if (k !== 'success') err[k] = data[k]; 
      });
    }
    throw err;
  }
  return data;
}

function makeAbsoluteUrl(relativeOrAbsolute: string): string {
  if (!relativeOrAbsolute) return relativeOrAbsolute;
  try {
    const u = new URL(relativeOrAbsolute);
    return u.href;
  } catch {
    try { 
      return new URL(relativeOrAbsolute.replace(/^\/+/, ''), API_BASE + '/').href; 
    } catch { 
      return relativeOrAbsolute; 
    }
  }
}

function normalizeUser(user: any): User {
  if (!user) return user;
  const u: any = { ...user };
  // Fix inconsistent casing from backend (signup.php uses LastName)
  if (u.LastName && !u.lastName) {
    u.lastName = u.LastName;
    delete u.LastName;
  }
  if (!u.fullName && (u.firstName || u.lastName)) {
    u.fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  }
  if (u.avatarUrl) u.avatarUrl = makeAbsoluteUrl(u.avatarUrl);
  return u;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Query backend session regardless of token; PHP uses cookie-based auth
        const { user: backendUser } = await fetchJSON(`${API_BASE}/me.php`, { method: 'GET' });
        const normalizedUser = normalizeUser(backendUser);
        setCurrentUser(normalizedUser);
      } catch (err) {
        // Silent fail: no blocking error if session cannot be restored on startup
        console.warn('Auth init: no session restored');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Email/password signup
  const signup = async ({ firstName, lastName, username, email, password }: SignupData): Promise<AuthResult> => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password required' };
      }

      const body = toForm({ 
        firstName, 
        lastName, 
        username, 
        email, 
        password, 
        autoLogin: 1 
      });
      
      const { user: backendUser } = await fetchJSON(`${API_BASE}/signup.php`, { 
        method: 'POST', 
        body 
      });

      const normalizedUser = normalizeUser(backendUser);
      setCurrentUser(normalizedUser);
      return { success: true, user: normalizedUser };
    } catch (err: any) {
      if (err?.status === 409 || /already registered/i.test(err?.message || '')) {
        return { success: false, error: { message: 'email or username already registered', status: 409 } };
      }
      return { success: false, error: err.message || 'Signup failed' };
    }
  };

  // Email/password login
  const login = async ({ email, password }: LoginCredentials): Promise<AuthResult> => {
    const body = toForm({ email, password });
    try {
      const { user } = await fetchJSON(`${API_BASE}/login.php`, { 
        method: 'POST', 
        body 
      });

      const normalized = normalizeUser(user);
      setCurrentUser(normalized);
      return { success: true, user: normalized };
    } catch (err: any) {
      const raw = (err?.message || '').toLowerCase();
      if (raw.includes('not found') || raw.includes('no account') || err.status === 404) {
        return { success: false, error: { message: 'user not found', status: 404 } };
      }
      if (raw.includes('invalid password') || raw.includes('incorrect password') || err.status === 401) {
        return { success: false, error: { message: 'invalid password', status: 401 } };
      }
      if (raw.includes('invalid credentials')) {
        return { success: false, error: { message: 'invalid password', status: 401 } };
      }
      // Bubble the actual backend error for visibility (e.g., unexpected 409)
      return { success: false, error: { message: err?.message || 'login failed', status: err?.status || 400 } };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetchJSON(`${API_BASE}/logout.php`, { method: 'POST' });
    } finally {
      setCurrentUser(null);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<AuthResult> => {
    const body = toForm(updates);
    try {
      const { user } = await fetchJSON(`${API_BASE}/profile_update.php`, { 
        method: 'POST', 
        body 
      });
      const normalized = normalizeUser(user);
      setCurrentUser(normalized);
      return { success: true, user: normalized };
    } catch (error: any) {
      return { success: false, error: error.message || 'Update failed' };
    }
  };

  const updatePassword = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<AuthResult> => {
    const body = toForm({ currentPassword, newPassword });
    try {
      await fetchJSON(`${API_BASE}/password_update.php`, { 
        method: 'POST', 
        body 
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Password update failed' };
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
