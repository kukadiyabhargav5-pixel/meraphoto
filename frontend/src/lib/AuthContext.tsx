'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [studio, setStudio] = useState<AuthStudio | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('studio');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    } catch (err) {
      // Token is invalid or expired
      console.error('Auth check failed:', err);
      setUser(null);
      setStudio(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('studio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

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

    setUser(data.user);
    setStudio(data.studio || null);
  };

  const googleLogin = async (credential: string) => {
    const res = await apiClient.post('/auth/google', { credential });
    const data = res.data;

    // Save tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.studio) {
      localStorage.setItem('studio', JSON.stringify(data.studio));
    }

    setUser(data.user);
    setStudio(data.studio || null);
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

    setUser(data.user);
    setStudio(data.studio || null);
  };

  const logout = async () => {
    setIsLoggingOut(true);

    // Immediately clear authentication credentials
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('studio');

    // Ensure session remembers the app has initialized so GlobalLoader NEVER appears after logout
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_initial_ready', 'true');
    }

    // Run backend logout notification with race timeout so it never hangs
    const logoutNetworkCall = Promise.race([
      apiClient.post('/auth/logout').catch(() => {}),
      new Promise((r) => setTimeout(r, 1200))
    ]);

    // Display the logout page loader for exactly 1.35s
    const displayTimer = new Promise((resolve) => setTimeout(resolve, 1350));

    await Promise.all([logoutNetworkCall, displayTimer]);

    setUser(null);
    setStudio(null);

    // Navigate smoothly to /login without triggering any global loaders
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, studio, isAuthenticated, loading, isLoggingOut, login, googleLogin, register, logout, refreshUser }}>
      {children}
      {isLoggingOut && <LogoutLoader />}
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
