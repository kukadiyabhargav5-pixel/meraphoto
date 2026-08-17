'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import PublicWrapper from '../../components/PublicWrapper';
import toast from 'react-hot-toast';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj.role === 'SUPER_ADMIN') {
            router.replace('/admin-choice');
            return;
          }
        } catch (e) {}
      }
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!loginEmail || !loginPassword) {
      toast.error('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      await login(loginEmail, loginPassword);
      
      // Remember email if checkbox is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      toast.success('Login successful!');
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.role === 'SUPER_ADMIN') {
          router.push('/admin-choice');
          return;
        }
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      setLoading(true);
      if (googleLogin) {
        await googleLogin(credentialResponse.credential);
        toast.success('Google login successful!');
        router.push('/dashboard');
      } else {
         toast.error("Google login method not implemented in AuthContext.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Don't render login page if already authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#faf9f6]">
        <Loader className="w-8 h-8 text-[#c5a880] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <PublicWrapper>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-gradient-to-br from-[#faf9f6] via-[#f5f2eb] to-[#faf9f6] relative overflow-hidden font-poppins">
        {/* Decorative Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-[#c5a880]/15 to-transparent rounded-full blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-t from-[#c5a880]/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        {/* Login Card */}
        <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-2xl p-8 sm:p-10 relative z-10 animate-fade-in-up">
          
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="Mara Photo" className="h-10 object-contain" />
          </div>
          
          <h1 className="text-[28px] font-light text-slate-900 text-center font-serif-luxury mb-1">
            Welcome Back
          </h1>
          <p className="text-[13px] font-semibold text-slate-400 text-center mb-8">
            Sign in to your Mara Photo studio
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" id="loginEmail" required placeholder="Email Address"
                className="peer w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 pt-6 pb-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email"
              />
              <label htmlFor="loginEmail" className="absolute left-11 top-[6px] text-[9px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[15px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[6px] peer-focus:text-[9px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                Email Address
              </label>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password" id="loginPassword" required placeholder="Password"
                className="peer w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-12 pt-6 pb-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
              />
              <label htmlFor="loginPassword" className="absolute left-11 top-[6px] text-[9px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[15px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-[6px] peer-focus:text-[9px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                Password
              </label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-900 transition-colors bg-white/50 hover:bg-slate-100 rounded-lg">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#c5a880] focus:ring-[#c5a880] transition-colors" />
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Remember Me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-[#c5a880] hover:text-slate-900 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-[#c5a880] text-white py-4 rounded-xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:shadow-[#c5a880]/30 transition-all duration-300 flex items-center justify-center gap-2 mt-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-slate-900">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
          
          <div className="flex justify-center w-full">
             <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
               <GoogleLogin
                 onSuccess={handleGoogleSuccess}
                 onError={() => toast.error('Google Sign-In failed')}
                 theme="outline"
                 size="large"
                 text="continue_with"
                 shape="pill"
                 width={250}
               />
             </GoogleOAuthProvider>
          </div>

          <div className="mt-8 text-center text-[13px] font-semibold text-slate-500">
            Don&apos;t have an account? <Link href="/signup" className="text-[#c5a880] hover:text-slate-900 font-bold ml-1 transition-colors">Create Account</Link>
          </div>

        </div>
      </div>
    </PublicWrapper>
  );
}
