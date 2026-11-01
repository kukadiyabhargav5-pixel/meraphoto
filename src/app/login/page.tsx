'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, Mail, Lock, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import PublicWrapper from '../../components/PublicWrapper';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../../components/GoogleAuthButton';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState('');
  const { user, login, googleLogin, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Prefetch targets
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/admin-choice');
  }, [router]);

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
    setUnregisteredEmail('');
    setLoading(true);

    const emailTrimmed = loginEmail.trim();
    if (!emailTrimmed || !loginPassword) {
      toast.error('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      await login(emailTrimmed, loginPassword);

      // Remember email if checkbox is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', emailTrimmed);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success('Login successful! Entering dashboard...');
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Login failed. Please check your credentials.';

      toast.error(errMsg);

      // If email is not registered in the database, show prominent warning & register prompt
      if (
        err?.response?.status === 404 ||
        errMsg.includes('રજીસ્ટર') ||
        errMsg.toLowerCase().includes('not found') ||
        errMsg.toLowerCase().includes('register')
      ) {
        setUnregisteredEmail(emailTrimmed);
      }

      setLoading(false);
    }
  };

  return (
    <PublicWrapper>
      <div className="min-h-[calc(100vh-64px)] min-h-[calc(100dvh-64px)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#faf9f6] via-[#f5f2eb] to-[#faf9f6] relative overflow-hidden font-poppins">
        {/* Decorative Ambient Background Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-[#c5a880]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-t from-[#c5a880]/10 to-transparent rounded-full blur-[80px] pointer-events-none" />

        {/* Login Card */}
        <div className="w-full max-w-[460px] bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/60 shadow-2xl p-6 sm:p-10 relative z-10 animate-fade-in-up">
          {/* Studio Brand Logo */}
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Mara Photo" className="h-10 sm:h-11 object-contain" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-slate-900 text-center font-serif-luxury mb-1">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 text-center mb-6">
            Sign in to your Mara Photo studio
          </p>

          {/* Active Session Notification (if already logged in) */}
          {isAuthenticated && user && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <p className="font-bold text-slate-800">
                  Signed in as: <span className="font-mono text-slate-950">{user.email}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5 mt-3">
                <Link
                  href={user.role === 'SUPER_ADMIN' ? '/admin-choice' : '/dashboard'}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#c5a880] text-white font-bold text-[11px] transition-colors"
                >
                  Go to Dashboard →
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    toast.success('Logged out successfully');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Switch Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Unregistered Email Alert Banner */}
          {unregisteredEmail && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-rose-900">આ ઈમેલ રજીસ્ટર થયેલ નથી</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    પહેલાં Studio એકાઉન્ટ બનાવો, પછી લોગિન થશે.
                  </p>
                </div>
              </div>
              <Link
                href={`/signup?email=${encodeURIComponent(unregisteredEmail)}`}
                className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#c5a880] text-white text-[11px] font-black uppercase tracking-wider shrink-0 transition-colors shadow-sm"
              >
                Register Now →
              </Link>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-slate-50/90 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-slate-50/90 border border-slate-200 rounded-xl pl-10 pr-11 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#c5a880] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-600">Remember Me</span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-xs font-bold text-[#c5a880] hover:text-slate-900 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-[#c5a880] text-white py-3.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:shadow-[#c5a880]/30 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Google Auth Button */}
          <div className="w-full">
            <GoogleAuthButton
              text="Continue with Google"
              disabled={loading}
              onSuccess={async ({ accessToken, credential }) => {
                setLoading(true);
                try {
                  if (googleLogin) {
                    await googleLogin(credential, accessToken);
                    toast.success('Google login successful!');
                  }
                } catch (err: any) {
                  toast.error(err?.response?.data?.error || 'Google login failed.');
                } finally {
                  setLoading(false);
                }
              }}
            />
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs sm:text-sm font-semibold text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[#c5a880] hover:text-slate-900 font-bold transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </PublicWrapper>
  );
}
