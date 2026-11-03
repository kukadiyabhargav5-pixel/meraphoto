'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LogoutLoaderProps {
  mode?: 'login' | 'logout';
  targetUrl?: string;
  onComplete?: () => void;
}

export default function LogoutLoader({
  mode = 'logout',
  targetUrl = '/login',
  onComplete,
}: LogoutLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date without restarting the animation effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 380; // Fast & crisp 380ms transition: 1% -> 100%

    const triggerComplete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      setIsFlashing(true);
      setTimeout(() => {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        } else if (typeof window !== 'undefined') {
          window.location.href = targetUrl || '/login';
        }
      }, 70);
    };

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.max(1, Math.round(1 + (elapsed / duration) * 99)));
      setDisplayProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        triggerComplete();
      }
    }, 16);

    // Hard safety timeout: unconditionally trigger completion after 500ms so it NEVER freezes at 1%
    const safetyTimer = setTimeout(() => {
      clearInterval(interval);
      triggerComplete();
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [targetUrl]); // Stable dependency: runs once per mount, never restarts on parent re-renders!

  const isLogin = mode === 'login';
  const title = isLogin ? 'Logging In' : 'Logging Out';

  // Dynamic status messages based on percentage
  let statusText = '';
  if (isLogin) {
    if (displayProgress < 35) statusText = 'Verifying Studio Credentials...';
    else if (displayProgress < 75) statusText = 'Loading Studio Dashboard & Tools...';
    else statusText = 'Welcome to Mara Photo • 100%';
  } else {
    if (displayProgress < 35) statusText = 'Securing session & clearing credentials...';
    else if (displayProgress < 75) statusText = 'Closing studio workspace safely...';
    else statusText = 'Signed Out Successfully • 100%';
  }

  return (
    <AnimatePresence>
      <motion.div
        key="auth-action-loader-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#070709]/92 backdrop-blur-2xl select-none px-4"
      >
        {/* Ambient warm gold radial background lighting */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#c5a880]/20 blur-[140px] pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#b89665]/15 blur-[100px] pointer-events-none -bottom-10" />

        {/* Camera Flash Burst on 100% Complete */}
        <AnimatePresence>
          {isFlashing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.95, 0.85] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-0 z-50 bg-gradient-to-t from-[#c5a880]/30 via-white to-white pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Center Luxury Card */}
        <motion.div
          key="auth-action-card"
          initial={{ opacity: 0, scale: 0.92, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center w-full max-w-[420px] p-8 sm:p-10 rounded-[32px] bg-[#0f0f14]/90 border border-[#c5a880]/35 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(197,168,128,0.2)] text-center"
        >
          {/* Rotating Camera Lens / Aperture Animation */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-5 flex items-center justify-center">
            {/* Outer Spinning Ring */}
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 animate-spin"
              style={{ animationDuration: '3s' }}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#c5a880"
                strokeWidth="2.5"
                strokeDasharray="6 8"
                opacity="0.35"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="url(#auth-gold-grad)"
                strokeWidth="3.5"
                strokeDasharray="90 180"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="auth-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#dfcdb5" />
                  <stop offset="100%" stopColor="#c5a880" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Camera / Aperture Graphic */}
            <div className="absolute inset-0 flex items-center justify-center text-[#c5a880]">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>

            {/* Glow burst */}
            <div className="absolute inset-2 rounded-full bg-[#c5a880]/15 blur-md pointer-events-none" />
          </div>

          {/* Studio Brand Eyebrow */}
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c5a880] mb-1 drop-shadow-sm">
            MARA PHOTO STUDIO
          </span>

          {/* Action Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white font-sans drop-shadow-md mb-2">
            {title}
          </h2>

          {/* Large Crystal-Clear Percentage Counter */}
          <div className="my-2 flex items-baseline justify-center gap-0.5">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight bg-gradient-to-r from-white via-[#dfcdb5] to-[#c5a880] bg-clip-text text-transparent drop-shadow-lg">
              {displayProgress}
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#c5a880]">
              %
            </span>
          </div>

          {/* Glowing Gold Progress Track */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] h-2.5 rounded-full bg-white/10 border border-[#c5a880]/30 overflow-hidden relative shadow-[0_0_20px_rgba(197,168,128,0.15)] my-4">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#c5a880] via-[#e5d4be] to-white relative shadow-[0_0_12px_rgba(197,168,128,0.7)]"
              style={{ width: `${displayProgress}%` }}
              transition={{ ease: 'linear' }}
            >
              {/* Glow Dot at Leading Tip */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
            </motion.div>
          </div>

          {/* Dynamic Status Text */}
          <p className="text-xs font-semibold text-slate-300 tracking-wide min-h-[20px] animate-fade-in">
            {statusText}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
