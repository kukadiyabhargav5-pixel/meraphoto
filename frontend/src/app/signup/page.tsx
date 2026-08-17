'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, ArrowLeft, Upload, Mail, Lock, User as UserIcon, Phone, Store, Globe, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { apiClient } from '../../lib/api';
import PublicWrapper from '../../components/PublicWrapper';
import toast from 'react-hot-toast';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Step 1 fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Step 2 fields
  const [regStudioName, setRegStudioName] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regFacebook, setRegFacebook] = useState('');
  const [regLogo, setRegLogo] = useState('');

  // Step 3 fields
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleCredential, setGoogleCredential] = useState('');

  const { register, googleLogin, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reqList = [
    { label: 'Starts with a Capital letter', valid: /^[A-Z]/.test(regPassword) },
    { label: 'Contains a lowercase letter', valid: /[a-z]/.test(regPassword) },
    { label: 'Contains a number', valid: /\d/.test(regPassword) },
    { label: 'Contains a special character', valid: /[@$!%*?&#]/.test(regPassword) },
    { label: 'Minimum 6 characters', valid: regPassword.length >= 6 }
  ];
  const allPasswordValid = reqList.every(r => r.valid);
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

  const canProceedStep1 = () => {
    if (isGoogleUser) {
      return regPhone && /^[6-9]\d{9}$/.test(regPhone);
    }
    return regName && regEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && !emailExists && regPhone && /^[6-9]\d{9}$/.test(regPhone);
  };

  const canProceedStep2 = () => {
    return regStudioName.trim().length > 0;
  };

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 'next' : 'prev');
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep === 1 && canProceedStep1()) {
      goToStep(2);
    } else if (currentStep === 2 && canProceedStep2()) {
      goToStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;
    setLoading(true);

    if (!isGoogleUser) {
      if (!regPassword || !regConfirmPassword) {
        toast.error('Password is required.');
        setLoading(false);
        return;
      }
      if (regPassword !== regConfirmPassword) {
        toast.error('Passwords do not match.');
        setLoading(false);
        return;
      }
      const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{5,}$/;
      if (!passwordRegex.test(regPassword)) {
        toast.error('Password does not meet requirements.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isGoogleUser && googleCredential) {
        if (googleLogin) {
          await googleLogin(googleCredential);
          try {
            await apiClient.put('/auth/update-profile', {
              phone: regPhone,
              studioName: regStudioName,
              websiteLink: regWebsite,
              instagramUrl: regInstagram,
              facebookUrl: regFacebook,
              logoUrl: regLogo,
              password: regPassword || undefined,
            });
          } catch (updateErr) {
            console.warn('Profile update after Google signup:', updateErr);
          }
          toast.success('Account created successfully!');
          router.push('/dashboard');
        }
      } else {
        await register({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          studioName: regStudioName,
          websiteLink: regWebsite,
          instagramUrl: regInstagram,
          facebookUrl: regFacebook,
          logoUrl: regLogo,
        });
        toast.success('Registration successful!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      setRegName(payload.name || '');
      setRegEmail(payload.email || '');
      setIsGoogleUser(true);
      setGoogleCredential(credentialResponse.credential);
      goToStep(1);
      toast.success('Google account connected! Please complete your profile.');
    } catch (err: any) {
      toast.error('Google sign-up failed.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be under 5MB');
        return;
      }
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

  const stepLabels = ['Personal Details', 'Studio Details', 'Password'];

  return (
    <PublicWrapper>
      <style dangerouslySetInnerHTML={{__html: `
        .su-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          padding: 40px 16px;
          background: linear-gradient(135deg, #faf9f6 0%, #f5f2eb 50%, #faf9f6 100%);
          position: relative;
          overflow: hidden;
        }
        .su-page::before {
          content: '';
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: su-floatOrb 8s ease-in-out infinite;
        }
        .su-page::after {
          content: '';
          position: absolute;
          bottom: -150px;
          left: -150px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.1) 0%, transparent 70%);
          pointer-events: none;
          animation: su-floatOrb 10s ease-in-out infinite reverse;
        }
        @keyframes su-floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes su-slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes su-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes su-slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes su-slideInReverse {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes su-fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Card */
        .su-card {
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
          padding: 44px 40px;
          animation: su-slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Logo */
        .su-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .su-logo img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }

        /* Step Tabs */
        .su-step-tabs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 28px;
          border-bottom: 1.5px solid #e3d8c8;
          position: relative;
        }
        .su-step-tab {
          flex: 1;
          text-align: center;
          padding: 12px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          cursor: default;
          position: relative;
          transition: color 0.3s ease;
          white-space: nowrap;
        }
        .su-step-tab.active {
          color: #09090b;
        }
        .su-step-tab.completed {
          color: #c5a880;
        }
        .su-step-tab::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: transparent;
          border-radius: 2px 2px 0 0;
          transition: background 0.3s ease;
        }
        .su-step-tab.active::after {
          background: #c5a880;
        }
        .su-step-tab.completed::after {
          background: rgba(197,168,128,0.4);
        }
        .su-step-tab-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 800;
          margin-right: 6px;
          transition: all 0.3s ease;
          vertical-align: middle;
        }
        .su-step-tab.active .su-step-tab-num {
          background: #c5a880;
          color: #fff;
        }
        .su-step-tab.completed .su-step-tab-num {
          background: rgba(197,168,128,0.2);
          color: #c5a880;
        }
        .su-step-tab.upcoming .su-step-tab-num {
          background: #e2e8f0;
          color: #94a3b8;
        }

        /* Step Content */
        .su-step-content {
          animation: su-slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .su-step-content.reverse {
          animation: su-slideInReverse 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Input Group */
        .su-input-group {
          margin-bottom: 16px;
        }
        .su-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .su-required {
          color: #dc2626;
          margin-left: 2px;
        }
        .su-optional {
          color: #94a3b8;
          font-weight: 600;
          text-transform: none;
          letter-spacing: normal;
          margin-left: 4px;
          font-size: 10px;
        }
        .su-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .su-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.3s;
          z-index: 2;
        }
        .su-input-wrap:focus-within .su-input-icon {
          color: #c5a880;
        }
        .su-input {
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
        .su-input:hover {
          border-color: #c5a880;
          background: rgba(250, 249, 246, 1);
        }
        .su-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197,168,128,0.15);
          background: #fff;
        }
        .su-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
        .su-input.su-no-icon {
          padding-left: 16px;
        }
        .su-input.su-error {
          border-color: #ef4444;
        }
        .su-input.su-success {
          border-color: #22c55e;
        }
        .su-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status */
        .su-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }

        /* Password Toggle */
        .su-pw-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          z-index: 2;
        }
        .su-pw-toggle:hover {
          color: #09090b;
          background: rgba(197,168,128,0.1);
        }

        /* Password Checklist */
        .su-pw-checklist {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .su-pw-check-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          transition: color 0.2s;
        }
        .su-pw-check-item.valid {
          color: #22c55e;
        }
        .su-pw-check-item.invalid {
          color: #94a3b8;
        }
        .su-pw-check-box {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .su-pw-check-box.valid {
          background: rgba(34,197,94,0.1);
          border: 1.5px solid #22c55e;
        }
        .su-pw-check-box.invalid {
          background: transparent;
          border: 1.5px solid #cbd5e1;
        }

        /* Logo Upload */
        .su-logo-upload {
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
        .su-logo-upload:hover {
          border-color: #c5a880;
          background: #f5f2eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .su-logo-preview {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #e3d8c8;
        }
        .su-logo-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #e3d8c8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          flex-shrink: 0;
        }
        .su-logo-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .su-logo-text-main {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }
        .su-logo-text-sub {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Section Label */
        .su-section-label {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
          margin-top: 8px;
          border-top: 1px solid #e3d8c8;
          padding-top: 16px;
        }

        /* Buttons */
        .su-btn-row {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }
        .su-btn {
          flex: 1;
          padding: 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .su-btn-primary {
          color: #09090b;
          background: #c5a880;
        }
        .su-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .su-btn-primary:hover::before {
          opacity: 1;
          animation: su-shimmer 1.5s infinite;
        }
        .su-btn-primary:hover {
          background: #09090b;
          color: #c5a880;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(9,9,11,0.2);
        }
        .su-btn-primary:active {
          transform: translateY(0);
        }
        .su-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .su-btn-primary:disabled:hover {
          background: #c5a880;
          color: #09090b;
          box-shadow: none;
        }
        .su-btn-primary:disabled:hover::before {
          opacity: 0;
        }
        .su-btn-secondary {
          background: transparent;
          color: #64748b;
          border: 1.5px solid #e3d8c8;
          flex: 0 0 auto;
          padding: 16px 18px;
        }
        .su-btn-secondary:hover {
          background: #f5f2eb;
          color: #09090b;
          border-color: #c5a880;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        /* Divider */
        .su-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .su-divider::before,
        .su-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        .su-divider:not(:empty)::before { margin-right: .5em; }
        .su-divider:not(:empty)::after { margin-left: .5em; }

        /* Google */
        .su-google-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Footer */
        .su-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }
        .su-footer a {
          color: #c5a880;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s;
        }
        .su-footer a:hover {
          color: #09090b;
        }

        /* Google Badge */
        .su-google-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(66,133,244,0.06);
          border: 1px solid rgba(66,133,244,0.15);
          border-radius: 10px;
          margin-bottom: 16px;
          animation: su-fadeUp 0.3s ease forwards;
        }
        .su-google-badge-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4285f4, #34a853);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .su-google-badge-text {
          flex: 1;
        }
        .su-google-badge-name {
          font-size: 12px;
          font-weight: 700;
          color: #09090b;
        }
        .su-google-badge-email {
          font-size: 10px;
          color: #64748b;
          font-weight: 500;
        }

        /* Mobile */
        @media (max-width: 520px) {
          .su-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
          .su-step-tab {
            font-size: 9px;
            padding: 10px 4px;
            letter-spacing: 0.04em;
          }
          .su-step-tab-num {
            width: 16px;
            height: 16px;
            font-size: 8px;
            margin-right: 4px;
          }
          .su-btn-row {
            flex-direction: column-reverse;
          }
          .su-btn-secondary {
            flex: 1;
          }
        }
      `}} />

      <div className="su-page font-poppins">
        <div className="su-card">
          {/* Logo */}
          <div className="su-logo">
            <img src="/logo.png" alt="Mara Photo" />
          </div>

          {/* Step Tabs with Labels */}
          <div className="su-step-tabs">
            {stepLabels.map((label, i) => {
              const step = i + 1;
              const status = currentStep > step ? 'completed' : currentStep === step ? 'active' : 'upcoming';
              return (
                <div key={step} className={`su-step-tab ${status}`}>
                  <span className="su-step-tab-num">
                    {currentStep > step ? <Check style={{ width: 12, height: 12 }} /> : step}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleRegister}>
            {/* ========== STEP 1: Personal Details ========== */}
            {currentStep === 1 && (
              <div className={`su-step-content ${direction === 'prev' ? 'reverse' : ''}`} key="step1">
                {/* Google User Badge */}
                {isGoogleUser && (
                  <div className="su-google-badge">
                    <div className="su-google-badge-icon">
                      <Check style={{ width: 14, height: 14, color: '#fff' }} />
                    </div>
                    <div className="su-google-badge-text">
                      <div className="su-google-badge-name">{regName}</div>
                      <div className="su-google-badge-email">{regEmail}</div>
                    </div>
                  </div>
                )}

                {!isGoogleUser && (
                  <>
                    {/* Full Name */}
                    <div className="su-input-group">
                      <label className="su-label">Full Name <span className="su-required">*</span></label>
                      <div className="su-input-wrap">
                        <UserIcon className="su-input-icon" style={{ width: 16, height: 16 }} />
                        <input
                          id="signup-name"
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}

                          className="su-input"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="su-input-group">
                      <label className="su-label">Email Address <span className="su-required">*</span></label>
                      <div className="su-input-wrap">
                        <Mail className="su-input-icon" style={{ width: 16, height: 16 }} />
                        <input
                          id="signup-email"
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}

                          className={`su-input ${emailExists ? 'su-error' : regEmail && !emailChecking && !emailExists && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) ? 'su-success' : ''}`}
                          autoComplete="email"
                        />
                      </div>
                      {regEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && (
                        <div className="su-status">
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
                  </>
                )}

                {/* Mobile Number */}
                <div className="su-input-group">
                  <label className="su-label">Mobile Number <span className="su-required">*</span></label>
                  <div className="su-input-wrap">
                    <Phone className="su-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      id="signup-phone"
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}

                      className={`su-input ${regPhone && !/^[6-9]\d{9}$/.test(regPhone) ? 'su-error' : regPhone && /^[6-9]\d{9}$/.test(regPhone) ? 'su-success' : ''}`}
                      autoComplete="tel"
                    />
                  </div>
                  {regPhone && !/^[6-9]\d{9}$/.test(regPhone) && (
                    <div className="su-status">
                      <AlertCircle style={{ width: 12, height: 12, color: '#ef4444' }} />
                      <span style={{ color: '#ef4444' }}>Must be 10 digits starting with 6-9</span>
                    </div>
                  )}
                </div>

                {/* Next Button */}
                <div className="su-btn-row">
                  <button type="button" className="su-btn su-btn-primary" disabled={!canProceedStep1()} onClick={handleNext}>
                    Continue <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Google / Login Options */}
                {!isGoogleUser && (
                  <>
                    <div className="su-divider">or continue with Google</div>
                    <div className="su-google-wrap">
                      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => toast.error('Google Sign-Up failed')}
                          theme="outline"
                          size="large"
                          text="continue_with"
                          shape="pill"
                          width={350}
                        />
                      </GoogleOAuthProvider>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ========== STEP 2: Studio Details ========== */}
            {currentStep === 2 && (
              <div className={`su-step-content ${direction === 'prev' ? 'reverse' : ''}`} key="step2">
                {/* Studio Name */}
                <div className="su-input-group">
                  <label className="su-label">Studio Name <span className="su-required">*</span></label>
                  <div className="su-input-wrap">
                    <Store className="su-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      id="signup-studio"
                      type="text"
                      required
                      value={regStudioName}
                      onChange={(e) => setRegStudioName(e.target.value)}

                      className="su-input"
                    />
                  </div>
                </div>

                {/* Optional Section */}
                <div className="su-section-label">Optional</div>

                {/* Website */}
                <div className="su-input-group">
                  <label className="su-label">Studio Website Link <span className="su-optional">(Optional)</span></label>
                  <div className="su-input-wrap">
                    <Globe className="su-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type="url"
                      value={regWebsite}
                      onChange={(e) => setRegWebsite(e.target.value)}

                      className="su-input"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div className="su-input-group">
                  <label className="su-label">Instagram Link <span className="su-optional">(Optional)</span></label>
                  <div className="su-input-wrap">
                    <svg className="su-input-icon" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    <input
                      type="url"
                      value={regInstagram}
                      onChange={(e) => setRegInstagram(e.target.value)}

                      className="su-input"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="su-input-group">
                  <label className="su-label">Facebook Link <span className="su-optional">(Optional)</span></label>
                  <div className="su-input-wrap">
                    <svg className="su-input-icon" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    <input
                      type="url"
                      value={regFacebook}
                      onChange={(e) => setRegFacebook(e.target.value)}

                      className="su-input"
                    />
                  </div>
                </div>

                {/* Studio Logo */}
                <div className="su-input-group">
                  <label className="su-label">Studio Logo <span className="su-optional">(Optional)</span></label>
                  <label className="su-logo-upload">
                    {regLogo ? (
                      <img src={regLogo} alt="Logo" className="su-logo-preview" />
                    ) : (
                      <div className="su-logo-placeholder">
                        <Upload style={{ width: 16, height: 16 }} />
                      </div>
                    )}
                    <div className="su-logo-text">
                      <span className="su-logo-text-main">{regLogo ? 'Change logo' : 'Upload your studio logo'}</span>
                      <span className="su-logo-text-sub">PNG, JPG up to 5MB</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Navigation */}
                <div className="su-btn-row">
                  <button type="button" className="su-btn su-btn-secondary" onClick={handleBack}>
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                  </button>
                  <button type="button" className="su-btn su-btn-primary" disabled={!canProceedStep2()} onClick={handleNext}>
                    Continue <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ========== STEP 3: Password ========== */}
            {currentStep === 3 && (
              <div className={`su-step-content ${direction === 'prev' ? 'reverse' : ''}`} key="step3">
                {/* Password */}
                <div className="su-input-group">
                  <label className="su-label">
                    Password {!isGoogleUser && <span className="su-required">*</span>}
                    {isGoogleUser && <span className="su-optional">(Optional)</span>}
                  </label>
                  <div className="su-input-wrap">
                    <Lock className="su-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required={!isGoogleUser}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}

                      className="su-input"
                      style={{ paddingRight: '48px' }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="su-pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  {regPassword && (
                    <div className="su-pw-checklist">
                      {reqList.map((req, i) => (
                        <div key={i} className={`su-pw-check-item ${req.valid ? 'valid' : 'invalid'}`}>
                          <div className={`su-pw-check-box ${req.valid ? 'valid' : 'invalid'}`}>
                            {req.valid && <Check style={{ width: 10, height: 10 }} />}
                          </div>
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                {(regPassword || !isGoogleUser) && (
                  <div className="su-input-group">
                    <label className="su-label">Confirm Password {!isGoogleUser && <span className="su-required">*</span>}</label>
                    <div className="su-input-wrap">
                      <Lock className="su-input-icon" style={{ width: 16, height: 16 }} />
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required={!isGoogleUser}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}

                        className={`su-input ${regConfirmPassword ? (passwordsMatch ? 'su-success' : 'su-error') : ''}`}
                        style={{ paddingRight: '48px' }}
                        autoComplete="new-password"
                      />
                      <button type="button" className="su-pw-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                    {regConfirmPassword && (
                      <div className="su-status">
                        {passwordsMatch ? (
                          <><Check style={{ width: 12, height: 12, color: '#22c55e' }} /> <span style={{ color: '#22c55e' }}>Passwords match</span></>
                        ) : (
                          <><X style={{ width: 12, height: 12, color: '#ef4444' }} /> <span style={{ color: '#ef4444' }}>Passwords do not match</span></>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="su-btn-row">
                  <button type="button" className="su-btn su-btn-secondary" onClick={handleBack}>
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    id="signup-submit"
                    type="submit"
                    disabled={loading || (!isGoogleUser && (!allPasswordValid || !passwordsMatch || !regConfirmPassword))}
                    className="su-btn su-btn-primary"
                  >
                    {loading ? (
                      <Loader style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Create Account <ArrowRight style={{ width: 16, height: 16 }} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="su-footer">
            Already have an account? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </PublicWrapper>
  );
}
