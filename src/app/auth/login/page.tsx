'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, Mail, Lock, User, Briefcase, Globe, AlertCircle, Loader, Key } from 'lucide-react';
import { apiClient } from '../../../lib/api';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStudioName, setRegStudioName] = useState('');
  const [regSubdomain, setRegSubdomain] = useState('');

  // OTP Form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      saveSession(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        studioName: regStudioName,
        subdomain: regSubdomain,
      });
      saveSession(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/request-otp', { email: otpEmail });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        email: otpEmail,
        code: otpCode,
      });
      saveSession(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const res = await apiClient.post('/auth/google-login', {
          googleId: 'mock_google_id_102030',
          email: 'googleuser@maraphoto.com',
          name: 'Google Client User',
        });
        saveSession(res.data);
      } catch (err: any) {
        setError('Google Login failed.');
        setLoading(false);
      }
    }, 1000);
  };

  const saveSession = (data: any) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.studio) {
      localStorage.setItem('studio', JSON.stringify(data.studio));
    }
    
    if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'STUDIO_OWNER' || data.user.role === 'TEAM_MEMBER') {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Main Card */}
      <div className="w-full max-w-lg glass-panel border-slate-200 bg-white rounded-3xl p-8 shadow-xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-500/20">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Mara Photo
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-850">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">AI Face Recognition Gallery Platform</p>
        </div>

        {/* Tab Headers */}
        <div className="grid grid-cols-3 bg-slate-100 border border-slate-200 p-1 rounded-xl mb-6">
          <button onClick={() => { setActiveTab('login'); setError(''); }} className={`py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}>
            Login
          </button>
          <button onClick={() => { setActiveTab('register'); setError(''); }} className={`py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}>
            Register Studio
          </button>
          <button onClick={() => { setActiveTab('otp'); setError(''); }} className={`py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'otp' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}>
            Guest OTP
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed font-semibold">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Login Tab */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="name@studio.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
              {loading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : 'Log In'}
            </button>
          </form>
        )}

        {/* 2. Register Tab */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="john@doe.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Studio Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                  <input type="text" required value={regStudioName} onChange={(e) => setRegStudioName(e.target.value)} placeholder="Vogue Studios" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Subdomain</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                  <input type="text" required value={regSubdomain} onChange={(e) => setRegSubdomain(e.target.value)} placeholder="vogue" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
              {loading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : 'Register Studio'}
            </button>
          </form>
        )}

        {/* 3. Guest OTP Tab */}
        {activeTab === 'otp' && (
          <div className="flex flex-col gap-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
                <p className="text-xs text-slate-500 mb-2 leading-relaxed font-semibold">
                  Enter your email address to receive a 6-digit verification code. Guests use OTP to authenticate access.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                    <input type="email" required value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} placeholder="guest@email.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
                  {loading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : 'Send OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                <p className="text-xs text-blue-600 mb-2 font-bold">
                  OTP sent to {otpEmail}. Please enter the code below to sign in:
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">Verification Code</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                    <input type="text" required maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-850 focus:outline-none focus:border-blue-600 focus:bg-white text-center tracking-widest font-mono text-lg transition-colors" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2">
                  {loading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : 'Verify & Log In'}
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-slate-500 hover:text-slate-800 underline mt-2 text-center">
                  Change Email Address
                </button>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <hr className="border-slate-100 flex-1" />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Or Continue With</span>
          <hr className="border-slate-100 flex-1" />
        </div>

        {/* Google Login Button */}
        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-3 shadow-sm">
          <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.44 1.83 14.9 1 12 1 7.35 1 3.41 3.68 1.48 7.57l3.85 2.99C6.27 7.02 8.9 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.22-2.3H12v4.35h6.42c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.71-4.94 3.71-8.5z" />
            <path fill="#FBBC05" d="M5.33 14.44c-.23-.68-.36-1.42-.36-2.19s.13-1.51.36-2.19L1.48 7.07C.54 8.96 0 11.08 0 13.3c0 2.22.54 4.34 1.48 6.23l3.85-2.99z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.1 0-5.73-1.98-6.67-4.96l-3.85 2.99C3.41 20.32 7.35 23 12 23z" />
          </svg>
          Google Login
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
