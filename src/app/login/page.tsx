'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import PublicWrapper from '../../components/PublicWrapper';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#faf9f6' }}>
        <Loader style={{ width: 32, height: 32, color: '#c5a880', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <PublicWrapper>
      <style dangerouslySetInnerHTML={{__html: `
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          padding: 40px 16px;
          background: linear-gradient(135deg, #faf9f6 0%, #f5f2eb 50%, #faf9f6 100%);
          position: relative;
          overflow: hidden;
        }
        .login-page::before {
          content: '';
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: floatOrb 8s ease-in-out infinite;
        }
        .login-page::after {
          content: '';
          position: absolute;
          bottom: -150px;
          left: -150px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.1) 0%, transparent 70%);
          pointer-events: none;
          animation: floatOrb 10s ease-in-out infinite reverse;
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(227,216,200,0.4);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
          padding: 48px 40px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .login-logo img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }
        .login-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: #09090b;
          text-align: center;
          margin-bottom: 4px;
        }
        .login-subtitle {
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 32px;
        }
        .login-input-group {
          margin-bottom: 20px;
        }
        .login-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.3s;
        }
        .login-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
          background: rgba(250, 249, 246, 0.8);
          border: 1.5px solid #e3d8c8;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
        }
        .login-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197,168,128,0.15);
          background: #fff;
        }
        .login-input:focus + .login-input-icon,
        .login-input:focus ~ .login-input-icon {
          color: #c5a880;
        }
        .login-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
        .pw-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .pw-toggle:hover {
          color: #09090b;
        }
        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .remember-me input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #c5a880;
          cursor: pointer;
        }
        .remember-me span {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }
        .login-forgot a {
          font-size: 12px;
          color: #c5a880;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-forgot a:hover {
          color: #09090b;
        }
        .login-btn {
          width: 100%;
          padding: 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
          background: #09090b;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(197,168,128,0.2) 50%, transparent 100%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .login-btn:hover::before {
          opacity: 1;
          animation: shimmer 1.5s infinite;
        }
        .login-btn:hover {
          background: #c5a880;
          color: #09090b;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(197,168,128,0.3);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .login-btn:disabled:hover::before {
          opacity: 0;
        }
        .login-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }
        .login-footer a {
          color: #c5a880;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-footer a:hover {
          color: #09090b;
        }
        .google-auth-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 24px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        .auth-divider:not(:empty)::before {
          margin-right: .5em;
        }
        .auth-divider:not(:empty)::after {
          margin-left: .5em;
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
            border-radius: 20px;
          }
          .login-title {
            font-size: 24px;
          }
        }
      `}} />

      <div className="login-page font-poppins">
        <div className="login-card">
          <div className="login-logo">
            <img src="/logo.png" alt="Mara Photo" />
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your Mara Photo studio</p>

          <form onSubmit={handleLogin}>
            <div className="login-input-group">
              <label className="login-label">Email Address</label>
              <div className="login-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  
                  className="login-input"
                  autoComplete="email"
                />
                <Mail className="login-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  
                  className="login-input"
                  style={{ paddingRight: '48px' }}
                  autoComplete="current-password"
                />
                <Lock className="login-input-icon" style={{ width: 16, height: 16 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
              <div className="login-forgot">
                <Link href="/auth/forgot-password">Forgot Password?</Link>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="login-btn">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="auth-divider" style={{ marginTop: '24px' }}>or sign in with Google</div>
          
          <div className="google-auth-wrapper">
             <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => toast.error('Google Sign-In failed')}
               theme="outline"
               size="large"
               text="signin_with"
               shape="rectangular"
               width="100%"
             />
          </div>

          <div className="login-footer">
            Don&apos;t have an account? <Link href="/signup">Create Account</Link>
          </div>
        </div>
      </div>
    </PublicWrapper>
  );
}
