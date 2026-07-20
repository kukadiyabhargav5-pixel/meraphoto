'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from './api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthStudio {
  id: string;
  name: string;
  subdomain: string;
}

interface AuthContextType {
  user: AuthUser | null;
  studio: AuthStudio | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [studio, setStudio] = useState<AuthStudio | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!loading) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-loaded'));
      }
    }
  }, [loading]);

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
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore errors during logout
    }
    
    // Always clear local state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('studio');
    setUser(null);
    setStudio(null);
  };

  return (
    <AuthContext.Provider value={{ user, studio, isAuthenticated, loading, login, register, googleLogin, logout, refreshUser }}>
      {children}
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
