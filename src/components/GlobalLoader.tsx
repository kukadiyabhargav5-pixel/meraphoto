'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pure CSS Aperture Animation Component
const AnimatedAperture = () => {
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
      {/* Outer Glow Ring */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border border-[#c5a880]/30 shadow-[0_0_30px_rgba(197,168,128,0.2)]"
      />
      
      {/* Middle Dark Ring */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#111] to-[#222] border border-white/5 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center z-10">
        
        {/* Inner Lens Glass */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 bg-black rounded-full overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)] flex items-center justify-center">
          
          {/* Animated Reflection */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-40"
          >
            <div className="absolute top-0 left-4 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-[2px]" />
          </motion.div>
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-30 mix-blend-screen"
          >
            <div className="absolute bottom-2 right-2 w-16 h-16 bg-gradient-to-tl from-indigo-500/30 to-transparent rounded-full blur-[4px]" />
          </motion.div>

          {/* Aperture Center Core */}
          <motion.div 
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-4 h-4 bg-[#c5a880] rounded-full shadow-[0_0_15px_#c5a880,0_0_30px_#c5a880]"
          />

          {/* Aperture Blades (Abstract representation) */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1/2 h-[1px] bg-white/10 origin-right"
              style={{ top: '50%', left: 0, rotate: i * 60 }}
              animate={{ rotate: [i * 60, i * 60 + 15, i * 60] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};


export default function GlobalLoader() {
  const [progress, setProgress] = useState(0);
  // phases: 'counting' -> 'exploding' -> 'flashing' -> 'revealing' -> 'done'
  const [phase, setPhase] = useState<'counting' | 'exploding' | 'flashing' | 'revealing' | 'done'>('counting');
  
  // Use refs to avoid stale closures in the animation frame loop
  const domLoadedRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const minTimePassedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'counting') return;

    // ─── Milestone 1: DOM + all assets (images, fonts, scripts) ───
    const handleDomLoad = () => {
      domLoadedRef.current = true;
    };

    if (document.readyState === 'complete') {
      domLoadedRef.current = true;
    } else {
      window.addEventListener('load', handleDomLoad);
    }

    // ─── Milestone 2: All API/dashboard data loaded ───
    // Listen to custom events dispatched by the Axios interceptors in api.ts
    let apiWasActive = false;
    const handleApiActive = () => {
      apiWasActive = true;
      dataLoadedRef.current = false;
    };
    const handleApiIdle = () => {
      dataLoadedRef.current = true;
    };

    window.addEventListener('api-active', handleApiActive);
    window.addEventListener('api-idle', handleApiIdle);

    // Fallback: if no API call is ever made (static page), mark data as loaded after 3s
    const dataFallbackTimer = setTimeout(() => {
      if (!apiWasActive) {
        dataLoadedRef.current = true;
      }
    }, 3000);

    // Hard fallback: no matter what, don't let the loader sit for more than 10s
    const hardFallbackTimer = setTimeout(() => {
      domLoadedRef.current = true;
      dataLoadedRef.current = true;
    }, 10000);

    // ─── Minimum display time: ensure the loader shows for at least 1.5s ───
    const minTimeTimer = setTimeout(() => {
      minTimePassedRef.current = true;
    }, 1500);

    // ─── Progress animation: smooth count up to 100% while waiting ───
    let animFrame: number;
    let current = 0;
    const startTime = Date.now();
    let isCompleting = false;

    const tick = () => {
      if (isCompleting) return;

      const elapsed = Date.now() - startTime;
      const dom = domLoadedRef.current;
      const data = dataLoadedRef.current;
      const minTime = minTimePassedRef.current;

      const allReady = dom && data && minTime;

      let target: number;

      if (allReady) {
        // Everything is ready — rush to 100%
        target = 100;
      } else {
        // Base: start at 10 and slowly creep up based on elapsed time
        target = 10 + Math.min(15, elapsed / 150);

        // DOM loaded adds a big chunk
        if (dom) target += 35;

        // Data loaded adds another chunk (but cap at 92 if DOM isn't done)
        if (data) target += 30;

        // Time-based slow creep for perceived progress
        target += Math.min(10, elapsed / 500);

        // Never exceed 95 until truly allReady
        target = Math.min(target, 95);
      }

      // Ease towards target
      const speed = allReady ? 0.2 : 0.06;
      current += (target - current) * speed;

      // Hard cap at 95 until ready
      if (!allReady && current > 95) current = 95;

      setProgress(Math.floor(current));

      if (allReady && current >= 99.5) {
        isCompleting = true;
        setProgress(100);
        // Wait 500ms at 100% so the user can see it before the transition
        setTimeout(() => setPhase('exploding'), 500);
        return;
      }

      animFrame = requestAnimationFrame(tick);
    };
    
    animFrame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('load', handleDomLoad);
      window.removeEventListener('api-active', handleApiActive);
      window.removeEventListener('api-idle', handleApiIdle);
      clearTimeout(dataFallbackTimer);
      clearTimeout(hardFallbackTimer);
      clearTimeout(minTimeTimer);
      cancelAnimationFrame(animFrame);
    };
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <>
      <AnimatePresence>
        {/* Main Dark Loader Screen */}
        {(phase === 'counting' || phase === 'exploding') && (
          <motion.div
            key="loader-bg"
            className="fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden"
            style={{
              background: 'radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)'
            }}
          >
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6">
              
              {/* Dynamic Animated Central Element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  phase === 'exploding' 
                    ? { scale: 10, opacity: 0, filter: 'blur(20px)' } 
                    : { opacity: 1, scale: 1 }
                }
                transition={{ 
                  duration: phase === 'exploding' ? 0.4 : 0.8,
                  ease: phase === 'exploding' ? "circIn" : "easeOut"
                }}
                onAnimationComplete={() => {
                  if (phase === 'exploding') {
                    setPhase('flashing');
                  }
                }}
                className="mb-12 relative flex items-center justify-center group cursor-pointer"
              >
                {/* Hover effect purely CSS driven via group-hover */}
                <div className="absolute inset-0 rounded-full bg-[#c5a880]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <AnimatedAperture />
              </motion.div>

              {/* Progress Line */}
              <motion.div 
                animate={phase === 'exploding' ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                className="w-full h-1 bg-[#222] rounded-full overflow-hidden relative mb-6 shadow-inner"
              >
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8c7454] via-[#c5a880] to-[#e8d5b5] transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </motion.div>
              
              {/* Loading Percentage Text */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={phase === 'exploding' ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#c5a880]/80"
              >
                {progress < 30 ? 'Loading Assets' : progress < 60 ? 'Loading Experience' : progress < 90 ? 'Preparing Studio' : progress < 100 ? 'Almost Ready' : 'Welcome'}{' '}
                <span className="font-mono ml-2 text-[#c5a880] text-sm">{progress.toString().padStart(2, '0')}%</span>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ The Dramatic Flash Overlay ═══ */}
      <AnimatePresence>
        {(phase === 'flashing' || phase === 'revealing') && (
          <motion.div
            key="flash-overlay"
            className="fixed inset-0 z-[9999] bg-white pointer-events-none mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'flashing' ? 1 : 0 }}
            transition={{ 
              duration: phase === 'flashing' ? 0.05 : 1.2, // Explodes in instantly, fades out slowly
              ease: phase === 'flashing' ? "easeIn" : "circOut"
            }}
            onAnimationComplete={() => {
              if (phase === 'flashing') {
                setPhase('revealing');
              } else if (phase === 'revealing') {
                setPhase('done');
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
