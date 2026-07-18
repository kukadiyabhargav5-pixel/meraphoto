'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, Loader, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import PublicWrapper from '../../../components/PublicWrapper';

// --- Professional Outlined Input Component ---
const GlassInput = ({ id, type, value, onChange, label, required = true, isPassword = false, disabled = false }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const isFloating = isFocused || (value && value.length > 0);

  return (
    <motion.div className="relative mb-6 z-10 pt-2">
      <div 
        className={`relative border-2 rounded-xl transition-all duration-300 ease-out bg-white/50 backdrop-blur-sm
          ${isFocused ? 'border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'border-slate-300 hover:border-slate-400'}`}
      >
        <label
          htmlFor={id}
          className={`absolute left-3 transition-all duration-300 ease-out pointer-events-none font-bold
            ${isFloating 
              ? '-top-3.5 text-xs text-blue-600 bg-white px-2 rounded-full' 
              : 'top-3.5 text-sm text-slate-500'}`}
        >
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          disabled={disabled}
          className={`w-full bg-transparent border-none outline-none text-slate-900 font-medium px-4 h-12 text-sm disabled:opacity-50`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
          >
            {showPassword ? <Lock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      await apiClient.post('/auth/forgot-password-otp', { email });
      setStep(2);
      setSuccessMsg('OTP has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      await apiClient.post('/auth/verify-reset-otp', { email, otp });
      setStep(3);
      setSuccessMsg('OTP Verified! Please enter your new password.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Validate password
    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{5,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must start with a Capital letter, and contain at least 1 number, 1 special character, and small letters.');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      setStep(4);
      setSuccessMsg('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  // Smooth Stagger Animations
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } } as const;
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.5 } } } as const;

  return (
    <PublicWrapper>
      <div className="flex-1 flex items-center justify-center p-6 relative min-h-[calc(100vh-80px)] font-sans overflow-hidden bg-slate-50">
        
        {/* Glassmorphism Card */}
        <div className="relative z-10 w-full max-w-[460px]">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white rounded-[24px] p-8 md:p-10 shadow-xl border border-slate-200 relative overflow-hidden"
          >
            <div className="relative z-10">
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>

              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Forgot Password?</h1>
              <p className="text-slate-500 font-medium text-sm mb-8">
                {step === 1 && "Don't worry! It happens. Please enter the email associated with your account."}
                {step === 2 && "Enter the 6-digit verification code sent to your email."}
                {step === 3 && "Please set your new password. It must be strong."}
                {step === 4 && "Awesome! Your password has been successfully reset."}
              </p>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="mb-6 bg-red-50/80 backdrop-blur-md text-red-600 px-4 py-4 rounded-2xl flex items-start gap-3 text-sm font-bold border border-red-200/50 shadow-sm"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {successMsg && (step === 2 || step === 3) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="mb-6 bg-green-50/80 backdrop-blur-md text-green-700 px-4 py-4 rounded-2xl flex items-start gap-3 text-sm font-bold border border-green-200/50 shadow-sm"
                  >
                    <Mail className="h-5 w-5 shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forms Container */}
              <div className="relative overflow-visible">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: Request OTP */}
                  {step === 1 && (
                    <motion.form key="step1" variants={containerVars} initial="hidden" animate="show" exit="hidden" onSubmit={handleSendOTP}>
                      <motion.div variants={itemVars}>
                        <GlassInput id="fEmail" type="email" label="Email Address" value={email} onChange={(e:any)=>setEmail(e.target.value)} />
                      </motion.div>
                      
                      <motion.button 
                        variants={itemVars} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                        type="submit" disabled={loading} 
                        className="w-full mt-2 bg-blue-600 rounded-[12px] text-white font-bold h-[56px] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300"
                      >
                        {loading ? <Loader className="h-6 w-6 animate-spin" /> : <>Send Verification Code <ArrowRight className="h-5 w-5" /></>}
                      </motion.button>
                    </motion.form>
                  )}

                  {/* STEP 2: Verify OTP */}
                  {step === 2 && (
                    <motion.form key="step2" variants={containerVars} initial="hidden" animate="show" exit="hidden" onSubmit={handleVerifyOTP}>
                      <motion.div variants={itemVars}>
                        <GlassInput id="fEmailDis" type="email" label="Email Address" value={email} disabled={true} />
                      </motion.div>
                      <motion.div variants={itemVars}>
                        <GlassInput id="fOtp" type="text" label="6-Digit OTP" value={otp} onChange={(e:any)=>setOtp(e.target.value)} />
                      </motion.div>
                      
                      <motion.button 
                        variants={itemVars} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                        type="submit" disabled={loading} 
                        className="w-full mt-2 bg-blue-600 rounded-[12px] text-white font-bold h-[56px] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300"
                      >
                        {loading ? <Loader className="h-6 w-6 animate-spin" /> : <>Verify OTP <ArrowRight className="h-5 w-5" /></>}
                      </motion.button>
                    </motion.form>
                  )}

                  {/* STEP 3: Reset Password */}
                  {step === 3 && (
                    <motion.form key="step3" variants={containerVars} initial="hidden" animate="show" exit="hidden" onSubmit={handleResetPassword}>
                      <motion.div variants={itemVars}>
                        <GlassInput id="fPass" type="password" label="New Password" isPassword value={newPassword} onChange={(e:any)=>setNewPassword(e.target.value)} />
                      </motion.div>
                      <motion.div variants={itemVars}>
                        <GlassInput id="fConfPass" type="password" label="Confirm Password" isPassword value={confirmPassword} onChange={(e:any)=>setConfirmPassword(e.target.value)} />
                      </motion.div>
                      
                      <motion.button 
                        variants={itemVars} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                        type="submit" disabled={loading} 
                        className="w-full mt-2 bg-blue-600 rounded-[12px] text-white font-bold h-[56px] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300"
                      >
                        {loading ? <Loader className="h-6 w-6 animate-spin" /> : <>Reset Password <KeyRound className="h-5 w-5" /></>}
                      </motion.button>
                    </motion.form>
                  )}

                  {/* STEP 4: Success */}
                  {step === 4 && (
                    <motion.div key="step4" variants={containerVars} initial="hidden" animate="show" exit="hidden" className="text-center py-6">
                      <motion.div variants={itemVars} className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <KeyRound className="h-10 w-10 text-green-600" />
                      </motion.div>
                      <motion.button 
                        variants={itemVars} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                        onClick={() => router.push('/auth/login')}
                        className="w-full bg-slate-900 rounded-[12px] text-white font-bold h-[56px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all duration-300"
                      >
                        Return to Login
                      </motion.button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </PublicWrapper>
  );
}
