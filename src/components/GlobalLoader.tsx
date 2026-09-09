'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '../lib/api';
import { startKeepAlive, pingBackendAndDatabase } from '../lib/keepAlive';

// Fully Animated Camera Shutter & Logo Centerpiece
const AnimatedLogoCameraLens = ({ progress, isReady }: { progress: number; isReady: boolean }) => {
  const bladeCount = 8;
  const bladeAngle = Math.min(42, (progress / 100) * 42);

  return (
    <motion.div 
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center select-none"
    >
      
      {/* 1. Orbiting Cosmic / Optical Energy Particles */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-4 rounded-full pointer-events-none"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#c5a880] shadow-[0_0_12px_#c5a880,0_0_24px_#c5a880]" />
        <div className="absolute bottom-4 right-8 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
      </motion.div>

      {/* 2. Outer Technical Dial Ring with Focal Markings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-white/10 flex items-center justify-center pointer-events-none"
      >
        <div className="absolute top-1 text-[8px] sm:text-[9px] font-mono tracking-[0.25em] text-[#c5a880]/70 uppercase">
          AI FOCAL MATRIX
        </div>
        <div className="absolute bottom-1 text-[8px] sm:text-[9px] font-mono tracking-[0.25em] text-white/40 uppercase">
          50mm · f/1.2
        </div>
        <div className="absolute left-1.5 text-[8px] font-mono text-white/30">AF-L</div>
        <div className="absolute right-1.5 text-[8px] font-mono text-white/30">OIS</div>
      </motion.div>

      {/* 3. Segmented Holographic HUD Ring */}
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 sm:inset-3 rounded-full border border-dashed border-[#c5a880]/30 pointer-events-none"
      />

      {/* 4. Ambient Pulsing Gold Glow Aura */}
      <motion.div 
        animate={{ 
          scale: isReady ? [1, 1.25, 1.1] : [1, 1.06, 1],
          opacity: isReady ? 0.95 : [0.4, 0.75, 0.4]
        }}
        transition={{ duration: isReady ? 0.5 : 2.2, repeat: isReady ? 0 : Infinity, ease: "easeInOut" }}
        className="absolute inset-4 rounded-full border border-[#c5a880]/50 shadow-[0_0_50px_rgba(197,168,128,0.35)]"
      />

      {/* 5. Precision Metallic Knurled Lens Barrel */}
      <div className="absolute inset-5 sm:inset-6 rounded-full bg-gradient-to-b from-[#1c1917] via-[#11100f] to-[#080808] border border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.95),0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
        
        {/* Optical Glass Chamber */}
        <div className="relative w-full h-full rounded-full bg-[#050507] overflow-hidden flex items-center justify-center border border-white/5">
          
          {/* Prismatic Purple / Cyan Anti-Reflective Flare (Rotating) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
          >
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-600/30 via-cyan-500/15 to-transparent rounded-full blur-[8px]" />
          </motion.div>

          {/* Warm Amber Gold Flare (Counter-Rotating) */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-45 mix-blend-screen pointer-events-none"
          >
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-tl from-[#c5a880]/40 via-amber-600/20 to-transparent rounded-full blur-[6px]" />
          </motion.div>

          {/* 6. Mechanical Aperture Blades (Expanding with Progress) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {[...Array(bladeCount)].map((_, i) => {
              const rotation = (360 / bladeCount) * i;
              return (
                <motion.div
                  key={i}
                  className="absolute w-20 h-[2px] bg-gradient-to-r from-transparent via-[#c5a880]/50 to-white/70 origin-left"
                  style={{
                    transform: `rotate(${rotation}deg) translateX(20px)`,
                  }}
                  animate={{
                    rotate: rotation + bladeAngle,
                    opacity: isReady ? 0.15 : 0.6,
                  }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              );
            })}
          </div>

          {/* 7. Centerpiece: Glowing Core */}
          <motion.div 
            animate={{ 
              scale: isReady ? [1, 2, 1.5] : [0.8, 1.1, 0.8],
              opacity: isReady ? [1, 0, 1] : [0.4, 0.7, 0.4]
            }}
            transition={{ duration: isReady ? 0.4 : 3, repeat: isReady ? 0 : Infinity, ease: "easeInOut" }}
            className="relative z-20 w-6 h-6 rounded-full bg-[#c5a880] shadow-[0_0_30px_#c5a880,0_0_60px_#ffffff]"
          />

          {/* 8. Camera Viewfinder Autofocus Brackets [ + ] */}
          <div className="absolute inset-3 sm:inset-4 pointer-events-none opacity-60 z-30">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#c5a880]/80 shadow-[0_0_6px_#c5a880]" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#c5a880]/80 shadow-[0_0_6px_#c5a880]" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#c5a880]/80 shadow-[0_0_6px_#c5a880]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#c5a880]/80 shadow-[0_0_6px_#c5a880]" />
          </div>

          {/* 9. Camera Shutter Flash Strobe at 100% */}
          {isReady && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1], scale: [0.5, 4, 8] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-white z-50 pointer-events-none shadow-[0_0_100px_#ffffff,0_0_200px_#ffffff]"
            />
          )}

        </div>
      </div>
    </motion.div>
  );
};

export default function GlobalLoader() {
  const router = useRouter();
  const pathname = usePathname() || '/';

  // The loader starts at 1%
  const [displayProgress, setDisplayProgress] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const targetProgressRef = useRef(1);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    // 0. Start anti-sleep keep-alive engine
    startKeepAlive();

    // Loader starts over on every page navigation to ensure full data readiness
    isCancelledRef.current = false;
    setIsDismissed(false);
    setIsReady(false);
    setIsExiting(false);
    setDisplayProgress(1);
    targetProgressRef.current = 1;

    // 2. Smooth Numerical Progress Animation Loop (moves smoothly from 1 to 100 towards targetProgressRef)
    let animId: number;
    let currentVal = 1;

    const updateSmoothProgress = () => {
      if (isCancelledRef.current) return;

      const target = targetProgressRef.current;
      if (currentVal < target) {
        const step = Math.max(1, Math.ceil((target - currentVal) * 0.15));
        currentVal = Math.min(target, currentVal + step);
        setDisplayProgress(currentVal);
      }

      // ONLY when progress hits 100 AND target is confirmed 100:
      if (currentVal >= 100 && target >= 100) {
        setIsReady(true);

        // Flash sequence:
        // 1. isReady triggers lens strobe instantly.
        setTimeout(() => {
          if (isCancelledRef.current) return;
          setIsExiting(true);

          // 2. 400ms after white flash starts, remove loader component (triggers 0.8s fade out to reveal page)
          setTimeout(() => {
            if (isCancelledRef.current) return;
            setIsDismissed(true);
          }, 400);
        }, 300);

        return;
      }

      animId = requestAnimationFrame(updateSmoothProgress);
    };

    animId = requestAnimationFrame(updateSmoothProgress);

    // 3. Complete Current Page & Data Loading Pipeline:
    const executeCurrentPagePipeline = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        // -------------------------------------------------------------
        // STEP 1: INITIALIZE & DATABASE ANTI-SLEEP (Target: 25%)
        // Verify backend & MongoDB are awake and active
        // -------------------------------------------------------------
        await Promise.all([
          pingBackendAndDatabase().catch(() => false),
          new Promise<void>((res) => {
            if (typeof document !== 'undefined' && 'fonts' in document) {
              document.fonts.ready.then(() => res()).catch(() => res());
            } else {
              res();
            }
          }),
        ]);
        targetProgressRef.current = 25;

        await new Promise((r) => setTimeout(r, 200));
        if (isCancelledRef.current) return;

        // -------------------------------------------------------------
        // STEP 2: AUTHENTICATION & SESSION VERIFICATION (Target: 50%)
        // Check token & user state
        // -------------------------------------------------------------
        if (token) {
          try {
            await apiClient.get('/auth/me');
          } catch (e) {}
        }
        targetProgressRef.current = 50;

        await new Promise((r) => setTimeout(r, 200));
        if (isCancelledRef.current) return;

        // -------------------------------------------------------------
        // STEP 3: CURRENT PAGE DATA IS FULLY LOADED (Target: 80%)
        // Crucial: Wait for the specific data of the CURRENT PAGE
        // -------------------------------------------------------------
        const currentDataTasks: Promise<any>[] = [];

        if (pathname.startsWith('/dashboard')) {
          if (token) {
            currentDataTasks.push(apiClient.get('/studio/me').catch(() => null));
            currentDataTasks.push(apiClient.get('/studio/credits').catch(() => null));
            currentDataTasks.push(apiClient.get('/dashboard/stats').catch(() => null));

            if (pathname.includes('/customers')) {
              currentDataTasks.push(apiClient.get('/dashboard/customers').catch(() => null));
            }
            if (pathname.includes('/team')) {
              currentDataTasks.push(apiClient.get('/dashboard/team').catch(() => null));
            }
            if (pathname.includes('/events')) {
              currentDataTasks.push(apiClient.get('/dashboard/shoots').catch(() => null));
            }
            if (pathname.includes('/quotation')) {
              currentDataTasks.push(apiClient.get('/dashboard/quotations').catch(() => null));
            }
            if (pathname.includes('/bill')) {
              currentDataTasks.push(apiClient.get('/dashboard/bills').catch(() => null));
            }
          }
        } else if (pathname === '/' || pathname === '') {
          // Home Page critical assets
          currentDataTasks.push(
            new Promise<void>((res) => {
              if (typeof window === 'undefined') return res();
              const img = new Image();
              img.src = '/logo.png';
              img.onload = img.onerror = () => res();
            })
          );
        } else if (pathname.startsWith('/e/')) {
          const slug = pathname.split('/')[2];
          if (slug) {
            currentDataTasks.push(apiClient.get(`/events/public/${slug}`).catch(() => null));
          }
        }

        // Wait until all current page data has arrived
        await Promise.allSettled(currentDataTasks);
        targetProgressRef.current = 80;

        await new Promise((r) => setTimeout(r, 200));
        if (isCancelledRef.current) return;

        // -------------------------------------------------------------
        // STEP 4: BACKGROUND PRE-WARMING OF OTHER PAGES (Target: 95%)
        // Pre-warm Home, Login/Register, Navbar routes, Dashboard
        // -------------------------------------------------------------
        if (router) {
          router.prefetch('/');
          router.prefetch('/login');
          router.prefetch('/signup');
          router.prefetch('/dashboard');
          router.prefetch('/pricing');
        }
        targetProgressRef.current = 95;

        await new Promise((r) => setTimeout(r, 200));
        if (isCancelledRef.current) return;

        // -------------------------------------------------------------
        // STEP 5: 100% COMPLETE & CURRENT PAGE READY TO SHOW (Target: 100%)
        // -------------------------------------------------------------
        targetProgressRef.current = 100;

      } catch (err) {
        targetProgressRef.current = 100;
      }
    };

    executeCurrentPagePipeline();

    // Absolute Safety Timeout
    const safetyTimer = setTimeout(() => {
      targetProgressRef.current = 100;
    }, 7000);

    return () => {
      isCancelledRef.current = true;
      cancelAnimationFrame(animId);
      clearTimeout(safetyTimer);
    };
  }, [router, pathname]);

  return (
    <AnimatePresence mode="wait">
      {!isDismissed && (
        <motion.div 
          key="global-loader-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070709] text-white select-none overflow-hidden"
        >
          {/* Full Screen Blinding Camera Flash */}
          <AnimatePresence>
            {isExiting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeIn" }}
                className="absolute inset-0 z-[100000] bg-white pointer-events-none flex items-center justify-center"
              >
                 <motion.div 
                   animate={{ scale: [1, 2], opacity: [1, 0] }}
                   transition={{ duration: 0.6 }}
                   className="w-[50vw] h-[50vw] bg-white rounded-full blur-[100px]"
                 />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loader Content */}
          <motion.div
            animate={isExiting ? { scale: 1.4, opacity: 0, filter: "blur(20px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeIn" }}
            className="relative z-10 w-full h-full flex flex-col items-center justify-center"
          >
            {/* Ambient Vignette & Deep Glow Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,168,128,0.15)_0%,_rgba(7,7,9,0.92)_50%,_#070709_100%)] pointer-events-none" />

            {/* Logo on Top */}
            <motion.div 
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="mb-10 relative z-30"
            >
              <div className="relative group">
                <motion.div 
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-[#c5a880]/30 via-white/10 to-[#c5a880]/30 blur-2xl rounded-full pointer-events-none"
                />
                <img 
                  src="/logo.png" 
                  alt="Mara Photo" 
                  className="relative z-10 h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                />
              </div>
            </motion.div>

            {/* Animated Camera Lens */}
            <div className="mb-8 relative z-20">
              <AnimatedLogoCameraLens progress={displayProgress} isReady={isReady} />
            </div>

            {/* Glowing Percentage Counter (1% -> 100%) */}
            <div className="flex flex-col items-center gap-3 relative z-20">
              <motion.div 
                animate={{ scale: isReady ? [1, 1.1, 1.05] : 1 }}
                className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f0e6d6] to-[#c5a880] tabular-nums drop-shadow-[0_0_20px_rgba(197,168,128,0.4)]"
              >
                {displayProgress}%
              </motion.div>

              <div className="w-48 sm:w-56 h-1.5 bg-white/10 rounded-full overflow-hidden p-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#8a7251] via-[#c5a880] to-[#f4ecd8] rounded-full relative"
                  style={{ width: `${displayProgress}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_10px_#ffffff,0_0_20px_#c5a880]" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
