'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, Upload, Mail, Lock, User as UserIcon, Phone, Store, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { apiClient } from '../../lib/api';
import PublicWrapper from '../../components/PublicWrapper';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

// getPasswordStrength removed in favor of checklist

export default function SignupPage() {
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regStudioName, setRegStudioName] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regLogo, setRegLogo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const { register, googleLogin, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const reqList = [
    { label: 'Starts with a Capital letter', valid: /^[A-Z]/.test(regPassword) },
    { label: 'Contains a lowercase letter', valid: /[a-z]/.test(regPassword) },
    { label: 'Contains a number', valid: /\d/.test(regPassword) },
    { label: 'Contains a special character', valid: /[@$!%*?&#]/.test(regPassword) },
    { label: 'Minimum 6 characters', valid: regPassword.length >= 6 }
  ];
  const passwordsMatch = regConfirmPassword ? regPassword === regConfirmPassword : true;

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Debounced email check
  useEffect(() => {
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setEmailExists(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(regEmail)}`);
        setEmailExists(res.data.exists);
      } catch {
        setEmailExists(false);
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [regEmail]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!regName || !regEmail || !regPhone || !regStudioName || !regPassword) {
      toast.error('All required fields must be filled.');
      setLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(regPhone)) {
      toast.error('Mobile number must be 10 digits starting with 6-9.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{5,}$/;
    if (!passwordRegex.test(regPassword)) {
      toast.error('Password must start with a Capital letter, contain at least 1 number, 1 special character, and small letters.');
      setLoading(false);
      return;
    }

    if (emailExists) {
      toast.error('This email is already registered. Please login instead.');
      setLoading(false);
      return;
    }

    try {
      const subdomain = regStudioName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        studioName: regStudioName,
        subdomain,
        websiteLink: regWebsite,
        logoUrl: regLogo,
      });
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed.');
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
        toast.success('Google sign-up successful!');
        router.push('/dashboard');
      } else {
         toast.error("Google login method not implemented in AuthContext.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRegLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
        .signup-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          padding: 40px 16px;
          background: linear-gradient(135deg, #faf9f6 0%, #f5f2eb 50%, #faf9f6 100%);
          position: relative;
          overflow: hidden;
        }
        .signup-page::before {
          content: '';
          position: absolute;
          top: -200px;
          left: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: floatOrb 8s ease-in-out infinite;
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signup-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(227,216,200,0.4);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
          padding: 40px 36px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .signup-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .signup-logo img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }
        .signup-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: #09090b;
          text-align: center;
          margin-bottom: 4px;
        }
        .signup-subtitle {
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 28px;
        }
        .signup-input-group {
          margin-bottom: 16px;
        }
        .signup-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .signup-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .signup-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.3s;
        }
        .signup-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
          background: rgba(250, 249, 246, 0.8);
          border: 1.5px solid #e3d8c8;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
        }
        .signup-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197,168,128,0.15);
          background: #fff;
        }
        .signup-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
        .signup-input.input-error {
          border-color: #ef4444;
        }
        .signup-input.input-success {
          border-color: #22c55e;
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
        .pw-toggle:hover { color: #09090b; }
        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .strength-segment {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          background: #e2e8f0;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
          text-align: right;
        }
        .email-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }
        .match-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }
        .signup-btn {
          width: 100%;
          padding: 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #09090b;
          background: #c5a880;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .signup-btn:hover {
          background: #09090b;
          color: #c5a880;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(9,9,11,0.2);
        }
        .signup-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .signup-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }
        .signup-footer a {
          color: #c5a880;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s;
        }
        .signup-footer a:hover { color: #09090b; }
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
        .logo-upload-area {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(250, 249, 246, 0.8);
          border: 1.5px dashed #e3d8c8;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .logo-upload-area:hover {
          border-color: #c5a880;
          background: #f5f2eb;
        }
        .logo-preview {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #e3d8c8;
        }
        .logo-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #e3d8c8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        .section-divider {
          border-top: 1px solid #e3d8c8;
          margin-top: 8px;
          padding-top: 16px;
          margin-bottom: 4px;
        }
        .section-label {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }
        @media (max-width: 480px) {
          .signup-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
          .signup-title {
            font-size: 24px;
          }
        }
      `}} />

      <div className="signup-page font-poppins">
        <div className="signup-card">
          <div className="signup-logo">
            <img src="/logo.png" alt="Mara Photo" />
          </div>
          <h1 className="signup-title">Create Your Studio</h1>
          <p className="signup-subtitle">Start delivering photos with AI in minutes</p>

          <form onSubmit={handleRegister}>
            <div className="signup-input-group">
              <label className="signup-label">Full Name <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input id="signup-name" type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}  className="signup-input" autoComplete="name" />
                <UserIcon className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  
                  className={`signup-input ${emailExists ? 'input-error' : regEmail && !emailChecking && !emailExists && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) ? 'input-success' : ''}`}
                  autoComplete="email"
                />
                <Mail className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
              {regEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && (
                <div className="email-status">
                  {emailChecking ? (
                    <><Loader style={{ width: 12, height: 12, animation: 'spin 1s linear infinite', color: '#94a3b8' }} /> <span style={{ color: '#94a3b8' }}>Checking...</span></>
                  ) : emailExists ? (
                    <><AlertCircle style={{ width: 12, height: 12, color: '#ef4444' }} /> <span style={{ color: '#ef4444' }}>Email already registered</span></>
                  ) : (
                    <><Check style={{ width: 12, height: 12, color: '#22c55e' }} /> <span style={{ color: '#22c55e' }}>Email available</span></>
                  )}
                </div>
              )}
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Mobile Number <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input id="signup-phone" type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)}  className="signup-input" autoComplete="tel" />
                <Phone className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Studio Name <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input id="signup-studio" type="text" required value={regStudioName} onChange={(e) => setRegStudioName(e.target.value)}  className="signup-input" />
                <Store className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="section-divider">
              <p className="section-label">Optional</p>
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Studio Website Link</label>
              <div className="signup-input-wrap">
                <input type="url" value={regWebsite} onChange={(e) => setRegWebsite(e.target.value)}  className="signup-input" style={{ paddingLeft: '16px' }} />
              </div>
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Studio Logo</label>
              <label className="logo-upload-area">
                {regLogo ? (
                  <img src={regLogo} alt="Logo" className="logo-preview" />
                ) : (
                  <div className="logo-placeholder">
                    <Upload className="w-4 h-4" />
                  </div>
                )}
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  {regLogo ? 'Change logo' : 'Upload your studio logo'}
                </span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Password Section */}
            <div className="section-divider"></div>

            <div className="signup-input-group">
              <label className="signup-label">Password <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  
                  className="signup-input"
                  style={{ paddingRight: '48px' }}
                  autoComplete="new-password"
                />
                <Lock className="signup-input-icon" style={{ width: 16, height: 16 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regPassword && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {reqList.map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: req.valid ? '#22c55e' : '#94a3b8', fontWeight: 600, transition: 'color 0.2s' }}>
                      {req.valid ? (
                        <Check style={{ width: 14, height: 14 }} />
                      ) : (
                        <div style={{ width: 12, height: 12, border: '1.5px solid currentColor', borderRadius: '3px', marginLeft: '1px', marginRight: '1px' }} />
                      )}
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  
                  className={`signup-input ${regConfirmPassword ? (passwordsMatch ? 'input-success' : 'input-error') : ''}`}
                  style={{ paddingRight: '48px' }}
                  autoComplete="new-password"
                />
                <Lock className="signup-input-icon" style={{ width: 16, height: 16 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regConfirmPassword && (
                <div className="match-status">
                  {passwordsMatch ? (
                    <><Check style={{ width: 12, height: 12, color: '#22c55e' }} /> <span style={{ color: '#22c55e' }}>Passwords match</span></>
                  ) : (
                    <><X style={{ width: 12, height: 12, color: '#ef4444' }} /> <span style={{ color: '#ef4444' }}>Passwords do not match</span></>
                  )}
                </div>
              )}
            </div>

            <button id="signup-submit" type="submit" disabled={loading || emailExists} className="signup-btn">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="auth-divider" style={{ marginTop: '24px' }}>or create account with Google</div>

          <div className="google-auth-wrapper">
             <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={() => toast.error('Google Sign-Up failed')}
               theme="outline"
               size="large"
               text="signup_with"
               shape="rectangular"
               width="100%"
             />
          </div>

          <div className="signup-footer">
            Already have an account? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </PublicWrapper>
  );
}
