'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api';
import { LoadingManager } from './LoadingManager';
import LogoutLoader from '../components/LogoutLoader';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthStudio {
  id: string;
  name: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionStartDate?: string | Date;
  subscriptionExpiresAt?: string | Date;
  logoUrl?: string;
  customDomain?: string;
  instagramUrl?: string;
  facebookUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  studio: AuthStudio | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoggingOut: boolean;
  isLoggingIn?: boolean;
  login: (email: string, pass: string) => Promise<any>;
  googleLogin: (credential?: string, accessToken?: string, extraData?: any) => Promise<any>;
  register: (formData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [studio, setStudio] = useState<AuthStudio | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const s = localStorage.getItem('studio');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const t = localStorage.getItem('accessToken');
      const u = localStorage.getItem('user');
      return !(t && u);
    } catch { return true; }
  });

  const [authTransition, setAuthTransition] = useState<{
    active: boolean;
    mode: 'login' | 'logout';
    targetUrl: string;
  } | null>(null);

  const isLoggingOut = Boolean(authTransition && authTransition.mode === 'logout');
  const isLoggingIn = Boolean(authTransition && authTransition.mode === 'login');

  const isAuthenticated = !!user;

  // Load user from token on mount
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setStudio(null);
        setLoading(false);
        return;
      }

      const res = await apiClient.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
        if (res.data.studio) {
          setStudio(res.data.studio);
          localStorage.setItem('studio', JSON.stringify(res.data.studio));
        }
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        // Invalid response, clear tokens
        setUser(null);
        setStudio(null);
      }
    } catch (err: any) {
      console.warn('Auth check status/warning:', err?.message);
      // Only clear credentials if backend explicitly rejected auth (401 / 403)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setUser(null);
        setStudio(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('studio');
      } else {
        // Cold start, server offline or network blip: preserve existing local user session
        console.log('[AuthContext] Preserving active session during backend wake-up / network retry.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedStudio = localStorage.getItem('studio');
      const token = localStorage.getItem('accessToken');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        if (savedStudio) setStudio(JSON.parse(savedStudio));
        setLoading(false);
      }
    } catch {}

    refreshUser();
  }, [refreshUser]);

  const handleTransitionComplete = useCallback(() => {
    const current = authTransition;
    const mode = current?.mode || 'logout';
    const destination = current?.targetUrl || (mode === 'logout' ? '/login' : '/dashboard');

    if (mode === 'logout') {
      setUser(null);
      setStudio(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('studio');
        sessionStorage.setItem('app_initial_ready', 'true');
        window.location.href = destination;
        return;
      }
    }

    try {
      router.replace(destination);
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = destination;
      }
    }

    setTimeout(() => {
      setAuthTransition(null);
    }, 150);
  }, [authTransition, router]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const data = res.data;
    
    // Save tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.studio) {
      localStorage.setItem('studio', JSON.stringify(data.studio));
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_initial_ready', 'true');
    }

    setUser(data.user);
    setStudio(data.studio || null);
    setLoading(false);

    const targetUrl = data.user?.role === 'SUPER_ADMIN' ? '/admin-choice' : '/dashboard';

    // Activate the 1% -> 100% Page Loader
    setAuthTransition({
      active: true,
      mode: 'login',
      targetUrl,
    });

    return data;
  };

  const googleLogin = async (credential?: string, accessToken?: string, extraData?: any) => {
    const res = await apiClient.post('/auth/google', { credential, accessToken, ...(extraData || {}) });
    const data = res.data;

    // Save tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.studio) {
      localStorage.setItem('studio', JSON.stringify(data.studio));
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_initial_ready', 'true');
    }

    setUser(data.user);
    setStudio(data.studio || null);
    setLoading(false);

    const targetUrl = data.user?.role === 'SUPER_ADMIN' ? '/admin-choice' : '/dashboard';

    // Activate the 1% -> 100% Page Loader
    setAuthTransition({
      active: true,
      mode: 'login',
      targetUrl,
    });

    return data;
  };

  const register = async (formData: any) => {
    const res = await apiClient.post('/auth/register', formData);
    const data = res.data;

    // Save tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.studio) {
      localStorage.setItem('studio', JSON.stringify(data.studio));
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_initial_ready', 'true');
    }

    setUser(data.user);
    setStudio(data.studio || null);
    setLoading(false);

    const targetUrl = data.user?.role === 'SUPER_ADMIN' ? '/admin-choice' : '/dashboard';

    // Activate the 1% -> 100% Page Loader
    setAuthTransition({
      active: true,
      mode: 'login',
      targetUrl,
    });

    return data;
  };

  const logout = useCallback(async () => {
    // 1. Immediately clear authentication credentials
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('studio');

    // Ensure session remembers the app has initialized so GlobalLoader NEVER appears after logout
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_initial_ready', 'true');
    }

    // 2. Fire backend logout in background
    apiClient.post('/auth/logout').catch(() => {});

    // 3. Activate the 1% -> 100% Page Loader
    setAuthTransition({
      active: true,
      mode: 'logout',
      targetUrl: '/login',
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, studio, isAuthenticated, loading, isLoggingOut, isLoggingIn, login, googleLogin, register, logout, refreshUser }}>
      {children}
      {authTransition && authTransition.active && (
        <LogoutLoader
          mode={authTransition.mode}
          targetUrl={authTransition.targetUrl}
          onComplete={handleTransitionComplete}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
