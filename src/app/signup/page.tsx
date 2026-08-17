'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Loader, ArrowRight, ArrowLeft, 
  Mail, Lock, User as UserIcon, Phone, Store, Globe, 
  Check, Image as ImageIcon, Upload
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

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
      <div className="flex items-center justify-center h-screen bg-[#faf9f6]">
        <Loader className="w-8 h-8 text-[#c5a880] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  const stepLabels = ['Personal', 'Studio', 'Security'];

  const variants = {
    initial: (direction: 'next' | 'prev') => ({ x: direction === 'next' ? 40 : -40, opacity: 0 }),
    in: { x: 0, opacity: 1 },
    out: (direction: 'next' | 'prev') => ({ x: direction === 'next' ? -40 : 40, opacity: 0 })
  };
  const transition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  return (
    <PublicWrapper>
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-[#faf9f6] via-[#f5f2eb] to-[#faf9f6] relative overflow-hidden font-poppins">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-[#c5a880]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-t from-[#c5a880]/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        {/* Signup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[500px] bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 sm:p-10 relative z-10"
        >
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img src="/logo.png" alt="Mara Photo" className="h-10 object-contain mb-4" />
            <h1 className="text-2xl font-light text-slate-900 font-serif-luxury tracking-wide">Create an Account</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Join Mara Photo Studio</p>
          </div>
          
          {/* Progress Tabs */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-100 -translate-y-1/2 z-0 hidden sm:block" />
            {stepLabels.map((label, i) => {
              const step = i + 1;
              const isActive = currentStep === step;
              const isPast = currentStep > step;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-2 relative z-10 bg-white/0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                    isActive ? 'bg-[#c5a880] text-white shadow-lg shadow-[#c5a880]/40 ring-4 ring-white' : 
                    isPast ? 'bg-slate-900 text-[#c5a880] ring-4 ring-white' : 
                    'bg-slate-100 text-slate-400 ring-4 ring-white'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : step}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                    isActive ? 'text-slate-900' : isPast ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleRegister} className="relative min-h-[300px]">
            <AnimatePresence mode="wait" custom={direction}>
              
              {currentStep === 1 && (
                <motion.div key="step1" custom={direction} variants={variants} initial="initial" animate="in" exit="out" transition={transition} className="space-y-5">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" id="regName" required placeholder="Full Name"
                      disabled={isGoogleUser}
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent disabled:opacity-70 disabled:cursor-not-allowed" 
                      value={regName} onChange={(e) => setRegName(e.target.value)} 
                    />
                    <label htmlFor="regName" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email" id="regEmail" required placeholder="Email Address"
                      disabled={isGoogleUser}
                      className={`peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 transition-all outline-none shadow-sm placeholder-transparent disabled:opacity-70 disabled:cursor-not-allowed ${emailExists ? 'border-rose-400 focus:ring-rose-400/20' : 'border-slate-200 focus:border-[#c5a880] focus:ring-[#c5a880]/20'}`}
                      value={regEmail} onChange={(e) => setRegEmail(e.target.value)} 
                    />
                    <label htmlFor="regEmail" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    {emailChecking && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
                  </div>
                  {emailExists && <p className="text-rose-500 text-[10px] font-bold pl-2 -mt-3 uppercase tracking-wider">Email already registered</p>}

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input 
                      type="tel" id="regPhone" required placeholder="Mobile Number"
                      maxLength={10}
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                      value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))} 
                    />
                    <label htmlFor="regPhone" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" custom={direction} variants={variants} initial="initial" animate="in" exit="out" transition={transition} className="space-y-5">
                  
                  <div className="flex items-center gap-5 p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-white hover:border-[#c5a880] hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                     <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                       {regLogo ? <img src={regLogo} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-[#c5a880] transition-colors" />}
                     </div>
                     <div className="flex-1">
                       <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wider group-hover:text-[#c5a880] transition-colors">Studio Logo</h4>
                       <p className="text-[10px] font-semibold text-slate-400 mt-1">Optional &bull; Max 5MB PNG/JPG</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#c5a880]/10 flex items-center justify-center text-slate-400 group-hover:text-[#c5a880] transition-colors">
                       <Upload className="w-4 h-4" />
                     </div>
                     <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                      <Store className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" id="regStudioName" required placeholder="Studio Name"
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                      value={regStudioName} onChange={(e) => setRegStudioName(e.target.value)} 
                    />
                    <label htmlFor="regStudioName" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                      Studio Name <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" id="regWebsite" placeholder="Website / Portfolio Link"
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                      value={regWebsite} onChange={(e) => setRegWebsite(e.target.value)} 
                    />
                    <label htmlFor="regWebsite" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                      Website URL <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span>
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#E1306C] transition-colors z-10">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" id="regInstagram" placeholder="Instagram URL"
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#E1306C]/20 focus:border-[#E1306C] transition-all outline-none shadow-sm placeholder-transparent" 
                      value={regInstagram} onChange={(e) => setRegInstagram(e.target.value)} 
                    />
                    <label htmlFor="regInstagram" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#E1306C]">
                      Instagram <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span>
                    </label>
                  </div>

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#1877F2] transition-colors z-10">
                      <FacebookIcon className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" id="regFacebook" placeholder="Facebook URL"
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-4 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2] transition-all outline-none shadow-sm placeholder-transparent" 
                      value={regFacebook} onChange={(e) => setRegFacebook(e.target.value)} 
                    />
                    <label htmlFor="regFacebook" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#1877F2]">
                      Facebook <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span>
                    </label>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" custom={direction} variants={variants} initial="initial" animate="in" exit="out" transition={transition} className="space-y-5">
                  
                  {isGoogleUser && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0"><Check className="w-5 h-5" /></div>
                      <div>
                        <h4 className="text-[12px] font-black text-emerald-900 uppercase tracking-wider">Google Connected</h4>
                        <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{regEmail}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} id="regPassword" required={!isGoogleUser} placeholder="Set Password"
                      className="peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl pl-12 pr-12 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#c5a880]/20 focus:border-[#c5a880] transition-all outline-none shadow-sm placeholder-transparent" 
                      value={regPassword} onChange={(e) => setRegPassword(e.target.value)} 
                    />
                    <label htmlFor="regPassword" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                      Set Password {isGoogleUser ? <span className="text-slate-400 font-medium normal-case ml-1">(Optional)</span> : <span className="text-rose-500">*</span>}
                    </label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white/50 hover:bg-slate-100 rounded-xl">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {!isGoogleUser && (
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none text-slate-400 peer-focus:text-[#c5a880] transition-colors z-10">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} id="regConfirmPassword" required placeholder="Confirm Password"
                        className={`peer w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border rounded-2xl pl-12 pr-12 pt-7 pb-2.5 text-sm font-semibold text-slate-900 focus:ring-2 transition-all outline-none shadow-sm placeholder-transparent ${!passwordsMatch ? 'border-rose-400 focus:ring-rose-400/20' : 'border-slate-200 focus:border-[#c5a880] focus:ring-[#c5a880]/20'}`}
                        value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} 
                      />
                      <label htmlFor="regConfirmPassword" className="absolute left-12 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-[17px] peer-placeholder-shown:text-[13px] peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#c5a880]">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white/50 hover:bg-slate-100 rounded-xl">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {(!isGoogleUser || regPassword.length > 0) && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Password Requirements</p>
                      <div className="space-y-3">
                        {reqList.map((req, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs font-semibold">
                            {req.valid ? (
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0" />
                            )}
                            <span className={req.valid ? 'text-slate-700' : 'text-slate-400'}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100">
              {currentStep > 1 && (
                <button type="button" onClick={handleBack} className="w-[120px] shrink-0 border-2 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              
              {currentStep < 3 ? (
                <button 
                  type="button" onClick={handleNext}
                  disabled={(currentStep === 1 && !canProceedStep1()) || (currentStep === 2 && !canProceedStep2())}
                  className="flex-1 bg-slate-900 hover:bg-[#c5a880] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:shadow-[#c5a880]/30 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  type="submit" disabled={loading || (!isGoogleUser && (!allPasswordValid || !passwordsMatch))}
                  className="flex-1 bg-[#c5a880] hover:bg-slate-900 text-slate-900 hover:text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#c5a880]/30 hover:shadow-slate-900/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          {currentStep === 1 && !isGoogleUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or signup with</span>
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
            </motion.div>
          )}

          <div className="mt-8 text-center text-sm font-semibold text-slate-500">
            Already have an account? <Link href="/login" className="text-[#c5a880] hover:text-slate-900 font-bold ml-1 transition-colors">Sign In</Link>
          </div>

        </motion.div>
      </div>
    </PublicWrapper>
  );
}
