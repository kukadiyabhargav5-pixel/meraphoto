'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Loader, ArrowRight, ArrowLeft, 
  Mail, Lock, User as UserIcon, Phone, Store, Globe, 
  Check, Image as ImageIcon, Upload, Trash2, ShieldCheck,
  AlertCircle, CheckCircle2
} from 'lucide-react';

// Branded Social Media Icons
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.55C8.86 7.55 8.57 7.62 8.33 7.88C8.09 8.14 7.42 8.77 7.42 10.04C7.42 11.31 8.35 12.53 8.48 12.7C8.61 12.88 10.3 15.48 12.89 16.6C13.51 16.87 13.99 17.03 14.37 17.15C15 17.35 15.58 17.32 16.03 17.26C16.53 17.18 17.56 16.63 17.78 16.02C18 15.41 18 14.88 17.93 14.77C17.86 14.66 17.67 14.6 17.39 14.46C17.11 14.32 15.74 13.65 15.48 13.56C15.22 13.47 15.04 13.42 14.85 13.7C14.66 13.98 14.13 14.6 13.97 14.79C13.81 14.98 13.65 15 13.37 14.86C13.09 14.72 12.19 14.43 11.13 13.48C10.3 12.74 9.74 11.83 9.6 11.59C9.46 11.35 9.59 11.22 9.73 11.08C9.85 10.96 10 10.77 10.14 10.61C10.28 10.45 10.33 10.33 10.42 10.15C10.51 9.97 10.47 9.81 10.4 9.67C10.33 9.53 9.77 8.17 9.54 7.62C9.32 7.08 9.09 7.16 8.93 7.15C8.77 7.15 8.59 7.15 8.4 7.15L9.04 7.55Z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

import { useAuth } from '../../lib/AuthContext';
import { apiClient } from '../../lib/api';
import PublicWrapper from '../../components/PublicWrapper';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../../components/GoogleAuthButton';

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // Step 1: Personal Details
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  // Google OAuth state
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleCredential, setGoogleCredential] = useState('');
  const [googlePicture, setGooglePicture] = useState('');

  // Step 2: Studio & Socials
  const [regStudioName, setRegStudioName] = useState('');
  const [regLogo, setRegLogo] = useState('');
  const [regLogoFileName, setRegLogoFileName] = useState('');
  const [regWhatsApp, setRegWhatsApp] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regFacebook, setRegFacebook] = useState('');
  const [regWebsite, setRegWebsite] = useState('');

  // Step 3 / Optional Password for Google
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission & Navigation
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const { register, googleLogin, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // 2 STEPS for Google User, 3 STEPS for Standard Email/Password User
  const totalSteps = isGoogleUser ? 2 : 3;

  // Prefetch dashboard routes for instant loading
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/dashboard/events');
    router.prefetch('/dashboard/plans-billing');
  }, [router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Debounced email check & auto-login if Google user already exists
  useEffect(() => {
    const trimmed = regEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailExists(false);
      return;
    }
    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(trimmed)}`);
        const exists = res.data?.exists || false;
        setEmailExists(exists);

        // If this Google user ALREADY exists in database, auto-login into their studio!
        if (isGoogleUser && exists && (googleCredential || googleAccessToken)) {
          setLoading(true);
          setRedirecting(true);
          toast.success('Existing studio account found! Logging in...');
          try {
            await googleLogin(googleCredential, googleAccessToken);
            router.replace('/dashboard');
            setTimeout(() => {
              if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
                window.location.href = '/dashboard';
              }
            }, 350);
          } catch (loginErr) {
            console.warn('Auto Google login failed:', loginErr);
            setRedirecting(false);
            setLoading(false);
          }
        }
      } catch {
        setEmailExists(false);
      } finally {
        setEmailChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [regEmail, isGoogleUser, googleCredential, googleAccessToken, googleLogin, router]);

  // Strict Mobile Number Handler
  // 1. Max 10 digits
  // 2. First digit MUST be 6, 7, 8, or 9
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    
    // Auto-clean if pasted with country code
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    if (digits.length > 0) {
      const firstDigit = digits[0];
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        setPhoneError('Mobile number must start with 6, 7, 8, or 9');
        return;
      }
    }

    setPhoneError('');
    setRegPhone(digits);
  };

  // Validations for Step 1
  const isNameValid = regName.trim().length >= 2;
  const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim());
  const isEmailValid = isEmailFormatValid && (!emailExists || isGoogleUser);
  const isPhoneValid = /^[6-9]\d{9}$/.test(regPhone);

  // ALL THREE DETAILS MUST BE TRUE TO PROCEED FROM STEP 1
  const isStep1Complete = isNameValid && isEmailValid && isPhoneValid;

  // Step 2 Validation (Studio Name is required)
  const isStep2Complete = regStudioName.trim().length >= 2;

  // Password Requirements (Strictly aligned with backend)
  const passwordRequirements = [
    { label: 'Starts with a Capital letter (A-Z)', valid: /^[A-Z]/.test(regPassword) },
    { label: 'Contains a lowercase letter (a-z)', valid: /[a-z]/.test(regPassword) },
    { label: 'Contains a number (0-9)', valid: /\d/.test(regPassword) },
    { label: 'Contains a special character (@$!%*?&#...)', valid: /[@$!%*?&#_\-~+=/.,><:;^]/.test(regPassword) },
    { label: 'Minimum 6 characters', valid: regPassword.length >= 6 }
  ];
  const allPasswordValid = passwordRequirements.every(r => r.valid);
  const passwordsMatch = regConfirmPassword.length > 0 ? regPassword === regConfirmPassword : false;

  // Can submit check based on workflow mode
  const canSubmit = isGoogleUser 
    ? (isStep1Complete && isStep2Complete && (regPassword.length === 0 || (allPasswordValid && (regConfirmPassword ? passwordsMatch : true))))
    : (isStep1Complete && isStep2Complete && allPasswordValid && passwordsMatch);

  // Step Navigation
  const goToStep = (step: 1 | 2 | 3) => {
    setDirection(step > currentStep ? 'next' : 'prev');
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!isStep1Complete) {
        if (!isNameValid) toast.error('Please enter your full name (minimum 2 characters).');
        else if (!isEmailValid) toast.error(emailExists && !isGoogleUser ? 'Email already registered.' : 'Please enter a valid email address.');
        else if (!isPhoneValid) toast.error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
        return;
      }
      // If studio name is empty, auto-suggest from Name
      if (!regStudioName.trim()) {
        setRegStudioName(`${regName.trim()}'s Studio`);
      }
      goToStep(2);
    } else if (currentStep === 2 && !isGoogleUser) {
      if (!isStep2Complete) {
        toast.error('Please enter your Studio Name (minimum 2 characters).');
        return;
      }
      goToStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 3) goToStep(2);
    else if (currentStep === 2) goToStep(1);
  };

  // Logo upload handler with base64 conversion
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be under 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setRegLogoFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRegLogo(reader.result as string);
      toast.success('Studio logo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setRegLogo('');
    setRegLogoFileName('');
  };

  // Form Submit Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // In Google flow, final step is Step 2; in Standard flow, final step is Step 3
    if (currentStep !== totalSteps) {
      handleNext();
      return;
    }

    // Strict final validations
    if (!isGoogleUser) {
      if (!allPasswordValid) {
        toast.error('Password must fulfill all security requirements.');
        return;
      }
      if (!passwordsMatch) {
        toast.error('Passwords do not match.');
        return;
      }
    } else if (regPassword.length > 0) {
      if (!allPasswordValid) {
        toast.error('Optional password must fulfill all security requirements.');
        return;
      }
    }

    setLoading(true);

    try {
      const registrationPayload = {
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        studioName: regStudioName.trim() || `${regName.trim()}'s Studio`,
        websiteLink: regWebsite.trim() || undefined,
        instagramUrl: regInstagram.trim() || undefined,
        facebookUrl: regFacebook.trim() || undefined,
        whatsappUrl: regWhatsApp.trim() || undefined,
        whatsappNumber: regWhatsApp.trim() || undefined,
        logoUrl: regLogo || undefined,
        password: regPassword || undefined,
      };

      if (isGoogleUser) {
        if (!googleCredential && !googleAccessToken) {
          toast.error('Google session expired. Please connect with Google again.');
          setIsGoogleUser(false);
          goToStep(1);
          setLoading(false);
          return;
        }

        setRedirecting(true);
        if (googleLogin) {
          await googleLogin(googleCredential || undefined, googleAccessToken || undefined, registrationPayload);
        }
        toast.success('Studio account verified! Redirecting...');
        router.replace('/dashboard');
        setTimeout(() => {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/dashboard';
          }
        }, 400);
      } else {
        setRedirecting(true);
        await register(registrationPayload);
        toast.success('Registration successful! Opening your studio dashboard...');
        router.replace('/dashboard');
        setTimeout(() => {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/dashboard';
          }
        }, 400);
      }
    } catch (err: any) {
      setRedirecting(false);
      setLoading(false);
      toast.error(err?.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  // Animation variants
  const stepVariants = {
    initial: (dir: 'next' | 'prev') => ({ x: dir === 'next' ? 45 : -45, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (dir: 'next' | 'prev') => ({ x: dir === 'next' ? -45 : 45, opacity: 0 })
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-9 h-9 text-[#c5a880] animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 font-poppins">Loading Studio Portal...</p>
        </div>
      </div>
    );
  }

  if (redirecting || (isAuthenticated && !authLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] min-h-[calc(100dvh-64px)] bg-[#faf9f6]">
        <div className="w-12 h-12 border-4 border-[#c5a880] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 tracking-wide font-poppins">Entering Studio Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-poppins">Welcome Back...</p>
      </div>
    );
  }

  // Dynamic 2 Steps for Google User, 3 Steps for Standard User
  const stepsMeta = isGoogleUser 
    ? [
        { num: 1, title: 'Personal', subtitle: 'Mobile Verification' },
        { num: 2, title: 'Studio Setup', subtitle: 'Logo & Social Channels' },
      ]
    : [
        { num: 1, title: 'Personal', subtitle: 'Name, Email & Mobile' },
        { num: 2, title: 'Studio & Links', subtitle: 'Logo & Social Channels' },
        { num: 3, title: 'Security', subtitle: 'Password Setup' },
      ];

  return (
    <PublicWrapper>
      <div className="min-h-[calc(100vh-64px)] min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center py-8 px-3 xs:px-4 sm:px-6 bg-gradient-to-br from-[#faf9f6] via-[#f7f4ee] to-[#faf9f6] relative overflow-hidden font-poppins">
        
        {/* Luxury Background Glow Elements */}
        <div className="absolute top-[-15%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-br from-[#c5a880]/20 to-transparent rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] bg-gradient-to-tr from-[#c5a880]/15 to-transparent rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/40 rounded-full blur-[140px] pointer-events-none" />

        {/* Master Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[540px] bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-[#c5a880]/25 shadow-[0_25px_70px_-15px_rgba(197,168,128,0.18),0_10px_30px_-5px_rgba(0,0,0,0.04)] p-5 xs:p-7 sm:p-9 relative z-10"
        >
          {/* Top Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="inline-block transition-transform hover:scale-105 duration-200">
              <img src="/logo.png" alt="Mara Photo" className="h-10 sm:h-11 object-contain mb-3 drop-shadow-sm" />
            </Link>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">Create Studio Account</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Join Mara Photo to deliver client galleries with AI Face Recognition</p>
          </div>

          {/* Stepped Wizard Progress Indicator (2 steps if Google, 3 steps if standard) */}
          <div className="relative mb-7">
            <div className="flex items-center justify-between relative z-10">
              {stepsMeta.map((s) => {
                const isActive = currentStep === s.num;
                const isCompleted = currentStep > s.num;
                return (
                  <div 
                    key={s.num} 
                    className="flex-1 flex flex-col items-center text-center px-1"
                  >
                    <div 
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-300 shadow-sm ${
                        isActive 
                          ? 'bg-gradient-to-br from-[#c5a880] to-[#9c7c56] text-white shadow-lg shadow-[#c5a880]/40 ring-4 ring-[#c5a880]/15 scale-105' 
                          : isCompleted 
                            ? 'bg-slate-900 text-[#c5a880] ring-2 ring-slate-900/10' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-bold mt-2 transition-colors uppercase tracking-wider ${
                      isActive ? 'text-[#9c7c56]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Dynamic Progress line */}
            <div className={`absolute top-4 sm:top-5 h-0.5 bg-slate-100 -z-0 ${isGoogleUser ? 'left-16 right-16' : 'left-10 right-10'}`}>
              <div 
                className="h-full bg-gradient-to-r from-[#c5a880] to-[#9c7c56] transition-all duration-500 ease-out"
                style={{ 
                  width: isGoogleUser 
                    ? (currentStep === 1 ? '0%' : '100%')
                    : (currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%')
                }}
              />
            </div>
          </div>

          {/* Form Content Area */}
          <form onSubmit={handleRegister}>
            <AnimatePresence mode="wait" custom={direction}>
              
              {/* ========================================================= */}
              {/* PAGE 1: PERSONAL DETAILS (Name, Email, Mobile)            */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <motion.div 
                  key="step1" 
                  custom={direction} 
                  variants={stepVariants} 
                  initial="initial" 
                  animate="animate" 
                  exit="exit" 
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  {/* Google Connected Status Pill */}
                  {isGoogleUser && (
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between mb-2 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        {googlePicture ? (
                          <img src={googlePicture} alt="Google" className="w-8 h-8 rounded-full border border-emerald-300 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            {regName.charAt(0) || 'G'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-emerald-950">Google Account Linked</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <p className="text-[11px] font-medium text-emerald-700">{regEmail}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsGoogleUser(false);
                          setGoogleCredential('');
                          setGoogleAccessToken('');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-rose-600 uppercase tracking-wider underline transition-colors"
                      >
                        Unlink
                      </button>
                    </div>
                  )}

                  {/* Immediate Action if Google Account Already Exists */}
                  {isGoogleUser && emailExists && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          Studio Account Already Registered <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          Welcome back! Click below to enter your studio.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setLoading(true);
                          setRedirecting(true);
                          try {
                            await googleLogin(googleCredential, googleAccessToken);
                            toast.success('Opening your Studio Dashboard...');
                            router.replace('/dashboard');
                          } catch {
                            router.replace('/login');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#c5a880] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center gap-1.5"
                      >
                        <span>Enter Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 1. Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Full Name <span className="text-rose-500">*</span></span>
                      {isNameValid && <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Valid</span>}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a880] transition-colors pointer-events-none">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        id="regName"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className={`w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border rounded-2xl pl-10 pr-10 py-3 text-sm font-semibold text-slate-900 focus:outline-none transition-all shadow-sm ${
                          isNameValid 
                            ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-400/20' 
                            : 'border-slate-200 focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20'
                        }`}
                      />
                      {isNameValid && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Email Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Email Address <span className="text-rose-500">*</span></span>
                      {emailChecking ? (
                        <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Checking</span>
                      ) : isEmailValid ? (
                        <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Verified</span>
                      ) : null}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a880] transition-colors pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input 
                        type="email" 
                        id="regEmail"
                        value={regEmail}
                        disabled={isGoogleUser}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className={`w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border rounded-2xl pl-10 pr-10 py-3 text-sm font-semibold text-slate-900 focus:outline-none transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed ${
                          emailExists && !isGoogleUser
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-rose-900'
                            : isEmailValid
                              ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-400/20'
                              : 'border-slate-200 focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20'
                        }`}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {emailChecking ? (
                          <Loader className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : emailExists && !isGoogleUser ? (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        ) : isEmailValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : null}
                      </div>
                    </div>
                    {emailExists && !isGoogleUser && (
                      <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1 pl-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Email already registered. <Link href="/login" className="font-bold underline text-slate-900 ml-1">Sign In instead</Link>
                      </p>
                    )}
                  </div>

                  {/* 3. Mobile Number (Max 10 digits & starts with 6, 7, 8, or 9) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {isPhoneValid ? (
                          <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Valid</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {regPhone.length}/10 digits
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative group">
                      {/* Country prefix badge */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-bold pointer-events-none border border-slate-200">
                        <span className="text-sm">🇮🇳</span> +91
                      </div>
                      <input 
                        type="tel" 
                        id="regPhone"
                        maxLength={10}
                        value={regPhone}
                        onChange={handlePhoneChange}
                        className={`w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border rounded-2xl pl-24 pr-10 py-3 text-sm font-semibold tracking-wider text-slate-900 focus:outline-none transition-all shadow-sm ${
                          phoneError 
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20' 
                            : isPhoneValid
                              ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-400/20'
                              : 'border-slate-200 focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20'
                        }`}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {phoneError ? (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        ) : isPhoneValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : null}
                      </div>
                    </div>

                    {phoneError ? (
                      <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-1 pl-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {phoneError}
                      </p>
                    ) : (
                      <p className="text-[10px] font-medium text-slate-400 pl-1 mt-1">
                        Must be exactly 10 digits starting with 6, 7, 8, or 9
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ========================================================= */}
              {/* PAGE 2: STUDIO PROFILE & SOCIAL CHANNELS                  */}
              {/* (Final step for Google user, Step 2 of 3 for standard)   */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <motion.div 
                  key="step2" 
                  custom={direction} 
                  variants={stepVariants} 
                  initial="initial" 
                  animate="animate" 
                  exit="exit" 
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  {/* Studio Name Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Studio / Brand Name <span className="text-rose-500">*</span></span>
                      {isStep2Complete && <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Ready</span>}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a880] transition-colors pointer-events-none">
                        <Store className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        id="regStudioName"
                        value={regStudioName}
                        onChange={(e) => setRegStudioName(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#c5a880] rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Studio Logo Upload Box */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Studio Logo <span className="text-slate-400 font-medium normal-case">(Optional)</span></span>
                      <span className="text-[10px] text-slate-400 font-medium">PNG, JPG up to 5MB</span>
                    </label>
                    
                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#c5a880] bg-slate-50/60 hover:bg-white transition-all group relative overflow-hidden">
                      {regLogo ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                              <img src={regLogo} alt="Studio Logo Preview" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[190px]">
                                {regLogoFileName || 'Uploaded Studio Logo'}
                              </p>
                              <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                                <Check className="w-3 h-3" /> Logo ready for gallery branding
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <label className="p-2 rounded-xl bg-slate-100 hover:bg-[#c5a880] hover:text-white text-slate-600 text-xs font-bold cursor-pointer transition-colors">
                              Change
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            <button 
                              type="button" 
                              onClick={removeLogo}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Remove Logo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center gap-4 cursor-pointer">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#c5a880] group-hover:border-[#c5a880] transition-colors shadow-sm shrink-0">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-[#9c7c56] transition-colors">
                              Upload Studio Watermark / Logo
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Will appear on event galleries and client share links
                            </p>
                          </div>
                          <span className="px-3 py-1.5 rounded-xl bg-slate-900 group-hover:bg-[#c5a880] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm">
                            Browse
                          </span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Social & Contact Links (WhatsApp, Instagram, Facebook, Website) */}
                  <div className="pt-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      Social & Contact Links <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </p>

                    <div className="space-y-3">
                      {/* WhatsApp */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="text-[#25D366]"><WhatsAppIcon className="w-3.5 h-3.5" /></span> WhatsApp Number / Link
                          </label>
                          {regPhone && regWhatsApp !== regPhone && (
                            <button
                              type="button"
                              onClick={() => setRegWhatsApp(regPhone)}
                              className="text-[10px] font-bold text-[#c5a880] hover:text-[#9c7c56] transition-colors"
                            >
                              Same as mobile (+91 {regPhone})
                            </button>
                          )}
                        </div>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#25D366] pointer-events-none">
                            <WhatsAppIcon className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            id="regWhatsApp"
                            value={regWhatsApp}
                            onChange={(e) => setRegWhatsApp(e.target.value)}
                            className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#25D366] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="text-[#E1306C]"><InstagramIcon className="w-3.5 h-3.5" /></span> Instagram Handle or URL
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E1306C] pointer-events-none">
                            <InstagramIcon className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            id="regInstagram"
                            value={regInstagram}
                            onChange={(e) => setRegInstagram(e.target.value)}
                            className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#E1306C] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E1306C]/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Facebook */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="text-[#1877F2]"><FacebookIcon className="w-3.5 h-3.5" /></span> Facebook Page URL
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1877F2] pointer-events-none">
                            <FacebookIcon className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            id="regFacebook"
                            value={regFacebook}
                            onChange={(e) => setRegFacebook(e.target.value)}
                            className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1877F2] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Website */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="text-[#c5a880]"><Globe className="w-3.5 h-3.5" /></span> Website / Portfolio Link
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c5a880] pointer-events-none">
                            <Globe className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            id="regWebsite"
                            value={regWebsite}
                            onChange={(e) => setRegWebsite(e.target.value)}
                            className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#c5a880] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Optional Password field for Google Users on Step 2 */}
                      {isGoogleUser && (
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-[#c5a880]" /> Set Account Password <span className="text-slate-400 font-normal lowercase">(optional)</span>
                            </label>
                            {regPassword && allPasswordValid && (
                              <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Strong</span>
                            )}
                          </div>
                          <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input 
                              type={showPassword ? 'text' : 'password'}
                              id="regPassword"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#c5a880] rounded-2xl pl-10 pr-12 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 transition-all shadow-sm"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 pl-1">
                            Optional: Allows logging into your studio with email & password in addition to Google.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================= */}
              {/* PAGE 3: SECURITY & PASSWORD (Standard Users Only)         */}
              {/* ========================================================= */}
              {currentStep === 3 && !isGoogleUser && (
                <motion.div 
                  key="step3" 
                  custom={direction} 
                  variants={stepVariants} 
                  initial="initial" 
                  animate="animate" 
                  exit="exit" 
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  {/* Password Field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Set Password <span className="text-rose-500">*</span></span>
                      {allPasswordValid && <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Strong</span>}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a880] transition-colors pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        id="regPassword"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#c5a880] rounded-2xl pl-10 pr-12 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c5a880]/20 transition-all shadow-sm"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      {regConfirmPassword && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                          passwordsMatch ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {passwordsMatch ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {passwordsMatch ? 'Passwords Match' : 'Passwords Do Not Match'}
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c5a880] transition-colors pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="regConfirmPassword"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className={`w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border rounded-2xl pl-10 pr-12 py-3 text-sm font-semibold text-slate-900 focus:outline-none transition-all shadow-sm ${
                          regConfirmPassword && !passwordsMatch 
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20' 
                            : 'border-slate-200 focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20'
                        }`}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Security Requirements Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 mt-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                      Password Requirements
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {passwordRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                          {req.valid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span className={req.valid ? 'text-emerald-800' : 'text-slate-400'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Review Pill */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-amber-950">Review Studio Profile</p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        {regStudioName} &bull; +91 {regPhone}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => goToStep(2)}
                      className="text-[10px] font-bold text-amber-900 underline uppercase tracking-wider hover:text-amber-950"
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wizard Navigation / Action Footer */}
            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={handleBack}
                  disabled={loading}
                  className="px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}

              {/* If on a non-final step: Continue button. If on the final step (Step 2 for Google, Step 3 for Standard): Submit button */}
              {currentStep < totalSteps ? (
                <button 
                  type="button" 
                  onClick={handleNext}
                  disabled={currentStep === 1 ? !isStep1Complete : !isStep2Complete}
                  className={`flex-1 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                    (currentStep === 1 ? isStep1Complete : isStep2Complete)
                      ? 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-[#c5a880] hover:to-[#9c7c56] text-white shadow-slate-900/10 hover:shadow-[#c5a880]/30 hover:scale-[1.01]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {currentStep === 1 ? (
                    <>Continue to Studio Setup <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Continue to Security <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={loading || !canSubmit}
                  className={`flex-1 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                    canSubmit && !loading
                      ? 'bg-gradient-to-r from-[#c5a880] to-[#9c7c56] hover:from-slate-900 hover:to-slate-800 text-white shadow-[#c5a880]/40 hover:scale-[1.01]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Creating Your Studio...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create Studio Account</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Google Sign-Up at the BOTTOM (Only on Step 1, when not yet linked) */}
          {currentStep === 1 && !isGoogleUser && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.15 }}
              className="mt-6 pt-5 border-t border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or sign up with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              
              <GoogleAuthButton
                text="Sign up with Google"
                disabled={loading}
                onSuccess={async ({ accessToken, credential, email, name, picture }) => {
                  setLoading(true);
                  try {
                    // Check if this Google account is ALREADY registered in database!
                    const res = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
                    const exists = res.data?.exists || false;

                    if (exists) {
                      // Already registered studio owner! Directly log them into dashboard!
                      toast.success(`Account verified (${email})! Logging into your Studio...`);
                      setRedirecting(true);
                      await googleLogin(credential, accessToken);
                      router.replace('/dashboard');
                      setTimeout(() => {
                        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
                          window.location.href = '/dashboard';
                        }
                      }, 350);
                      return;
                    }

                    // Brand-new Google user: Start 2-step setup
                    setRegName(name || '');
                    setRegEmail(email || '');
                    if (picture) setGooglePicture(picture);
                    setIsGoogleUser(true);
                    if (accessToken) setGoogleAccessToken(accessToken);
                    if (credential) setGoogleCredential(credential);
                    toast.success(`Google account verified (${email})! Enter your 10-digit mobile number.`);
                  } catch (err: any) {
                    console.error('Google check error:', err);
                    try {
                      await googleLogin(credential, accessToken);
                      toast.success('Logged in successfully!');
                      router.replace('/dashboard');
                    } catch {
                      setRegName(name || '');
                      setRegEmail(email || '');
                      setIsGoogleUser(true);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </motion.div>
          )}

          {/* Terms & Privacy Notice */}
          <p className="text-[10px] text-slate-400 text-center mt-5 leading-relaxed">
            By creating an account, you agree to Mara Photo's{' '}
            <Link href="/terms" className="text-slate-600 underline font-semibold hover:text-[#9c7c56]">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-slate-600 underline font-semibold hover:text-[#9c7c56]">Privacy Policy</Link>.
          </p>

          {/* Existing User Login Prompt */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
            Already have a Studio account?{' '}
            <Link href="/login" className="text-[#9c7c56] hover:text-slate-900 font-bold ml-1 transition-colors">
              Sign In
            </Link>
          </div>

        </motion.div>
      </div>
    </PublicWrapper>
  );
}
