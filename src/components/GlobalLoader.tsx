'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { startKeepAlive } from '../lib/keepAlive';
import { useApplicationLoader } from '../lib/hooks/useApplicationLoader';

// ═══════════════════════════════════════════════════════════════════════
// REALISTIC DSLR CAMERA — Full camera body with lens, flash, shutter
// ═══════════════════════════════════════════════════════════════════════
const RealisticCamera = ({ progress, isReady }: { progress: number; isReady: boolean }) => {
  const bladeCount = 9;
  // Aperture opens as progress increases (blades rotate inward)
  const bladeAngle = 45 - Math.min(45, (progress / 100) * 45);

  return (
    <div className="cam-assembly">
      {/* ── Camera Body ── */}
      <div className={`cam-body ${isReady ? 'cam-body--ready' : ''}`}>
        {/* Top plate with pentaprism hump */}
        <div className="cam-top-plate">
          <div className="cam-pentaprism"></div>
          {/* Mode dial */}
          <div className="cam-mode-dial">
            <div className="cam-mode-dial__dot"></div>
          </div>
          {/* Hot shoe */}
          <div className="cam-hotshoe"></div>
          {/* On/Off indicator */}
          <div className="cam-power-led"></div>
        </div>

        {/* Flash unit on top */}
        <div className={`cam-flash-unit ${isReady ? 'cam-flash-unit--fire' : ''}`}>
          <div className="cam-flash-unit__head"></div>
          <div className="cam-flash-unit__burst"></div>
          <div className="cam-flash-unit__rays"></div>
        </div>

        {/* Main body face */}
        <div className="cam-face">
          {/* Lens mount ring */}
          <div className="cam-mount">
            {/* Outer lens ring with text markings */}
            <div className="cam-lens-ring cam-lens-ring--outer">
              <span className="cam-lens-text cam-lens-text--brand">MARA PHOTO</span>
              <span className="cam-lens-text cam-lens-text--spec">50mm 1:1.4</span>
              {/* Focus distance markers */}
              <div className="cam-ring-markers">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="cam-ring-marker" style={{ transform: `rotate(${i * 15}deg)` }}></div>
                ))}
              </div>
            </div>

            {/* Inner focus ring */}
            <div className="cam-lens-ring cam-lens-ring--inner">
              <div className="cam-ring-grip">
                {[...Array(36)].map((_, i) => (
                  <div key={i} className="cam-grip-line" style={{ transform: `rotate(${i * 10}deg)` }}></div>
                ))}
              </div>
            </div>

            {/* Lens glass with reflections */}
            <div className="cam-lens-glass">
              {/* Coating reflections */}
              <div className="cam-lens-coating"></div>
              <div className="cam-lens-coating cam-lens-coating--secondary"></div>

              {/* Aperture blades */}
              <div className="cam-aperture">
                {[...Array(bladeCount)].map((_, i) => {
                  const rotation = (360 / bladeCount) * i;
                  return (
                    <div
                      key={i}
                      className="cam-aperture__blade"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        '--blade-close': `${bladeAngle}deg`
                      } as React.CSSProperties}
                    ></div>
                  );
                })}
              </div>

              {/* Center glass reflection */}
              <div className="cam-lens-center">
                <div className="cam-lens-flare"></div>
              </div>

              {/* AF indicator brackets */}
              <div className="cam-af-brackets">
                <div className="cam-af-bracket cam-af-bracket--tl"></div>
                <div className="cam-af-bracket cam-af-bracket--tr"></div>
                <div className="cam-af-bracket cam-af-bracket--bl"></div>
                <div className="cam-af-bracket cam-af-bracket--br"></div>
              </div>

              {/* Focus ring light ring */}
              <div className="cam-focus-ring-light"></div>
            </div>
          </div>

          {/* Grip texture on right side */}
          <div className="cam-grip-area">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="cam-grip-ridge"></div>
            ))}
          </div>

          {/* Brand badge */}
          <div className="cam-brand-badge">MARA</div>

          {/* Shutter button area */}
          <div className={`cam-shutter-btn ${isReady ? 'cam-shutter-btn--pressed' : ''}`}>
            <div className="cam-shutter-btn__ring"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════
const LoaderErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="preloader-error"
  >
    <div className="preloader-error__icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    </div>
    <h2 className="preloader-error__title">Unable to Load Website</h2>
    <p className="preloader-error__message">{error || 'Some required resources could not be initialized.'}</p>
    <button onClick={onRetry} className="preloader-error__retry" aria-label="Retry loading">
      Retry
    </button>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL PRELOADER — ONE-TIME loader with full CSS animation
// ═══════════════════════════════════════════════════════════════════════
export default function GlobalLoader() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '';

  const { progress, status, isReady, error, isCriticalFailed, retry } = useApplicationLoader();

  const [displayProgress, setDisplayProgress] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const animRef = useRef<number | null>(null);
  const currentValRef = useRef(1);
  const keepAliveStartedRef = useRef(false);

  // Lock body scroll while loader is visible on home page
  useEffect(() => {
    if (isHome && !isDismissed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDismissed, isHome]);

  // Start keep-alive once
  useEffect(() => {
    if (!keepAliveStartedRef.current) {
      keepAliveStartedRef.current = true;
      startKeepAlive();
    }
  }, []);

  // Smooth progress animation from 1% to 100% fast & responsive (2-3s cadence)
  useEffect(() => {
    if (!isHome || isDismissed) return;
    const animate = () => {
      const target = Math.max(1, Math.min(100, progress));
      if (currentValRef.current < target) {
        const diff = target - currentValRef.current;
        const step = diff < 1.5 ? diff : Math.max(1.8, diff * 0.28);
        currentValRef.current = Math.min(target, currentValRef.current + step);
        setDisplayProgress(Math.min(100, Math.round(currentValRef.current)));
      } else if (currentValRef.current >= 100) {
        setDisplayProgress(100);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [progress, isDismissed, isHome]);

  // Flash + dismiss right after displayProgress reaches 100% AND isReady is true
  useEffect(() => {
    if (!isHome || isDismissed) return;

    if (isReady && displayProgress >= 100) {
      const holdTimer = setTimeout(() => {
        setIsFlashing(true);
        const dismissTimer = setTimeout(() => {
          setIsDismissed(true);
        }, 300);
        return () => clearTimeout(dismissTimer);
      }, 100);
      return () => clearTimeout(holdTimer);
    }
  }, [isReady, displayProgress, isDismissed, isHome]);

  // Safety fallback: if isReady is true for 600ms, force dismiss so it can NEVER get stuck
  useEffect(() => {
    if (!isHome || isDismissed || !isReady) return;
    const forceTimer = setTimeout(() => {
      setIsDismissed(true);
    }, 600);
    return () => clearTimeout(forceTimer);
  }, [isReady, isDismissed, isHome]);

  if (!isHome || isDismissed) return null;

  const completionReady = isReady && displayProgress >= 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="global-preloader"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        className="preloader"
        role="progressbar"
        aria-valuenow={displayProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading website: ${displayProgress}%`}
      >
        {/* ── Inline CSS ── */}
        <style dangerouslySetInnerHTML={{ __html: PRELOADER_CSS }} />

        {/* Full-screen camera flash overlay */}
        <AnimatePresence>
          {isFlashing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="preloader-flash"
            >
              <div className="preloader-flash__bloom"></div>
              <div className="preloader-flash__rays"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content wrapper */}
        <motion.div
          animate={isFlashing
            ? { scale: 1.3, opacity: 0, filter: "blur(30px) brightness(3)" }
            : { scale: 1, opacity: 1, filter: "blur(0px) brightness(1)" }
          }
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="preloader-content"
        >
          {/* Ambient background */}
          <div className="preloader-bg" />

          {/* Subtle vignette */}
          <div className="preloader-vignette" />

          {/* Scanning line */}
          <div className="preloader-scanline" />

          {isCriticalFailed && error ? (
            <LoaderErrorState error={error} onRetry={retry} />
          ) : (
            <>
              {/* ─── CAMERA (Center) ─── */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="preloader-camera-wrap"
              >
                <RealisticCamera progress={displayProgress} isReady={completionReady} />
              </motion.div>

              {/* ─── PROGRESS SECTION (Below Camera) ─── */}
              <div className="preloader-progress">
                {/* Status text */}
                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="preloader-progress__status"
                  aria-live="polite"
                >
                  {status}
                </motion.p>

                {/* Percentage */}
                <motion.div
                  animate={{ scale: completionReady ? [1, 1.08, 1.04] : 1 }}
                  className="preloader-progress__percent"
                >
                  {displayProgress}%
                </motion.div>

                {/* Progress bar */}
                <div className="preloader-progress__track">
                  <div
                    className="preloader-progress__fill"
                    style={{ width: `${displayProgress}%` }}
                  >
                    <div className="preloader-progress__glow-dot" />
                  </div>
                </div>

                {/* Tagline */}
                <p className="preloader-progress__tagline">
                  Find Your Moments Instantly
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FULL CSS — Realistic DSLR Camera Preloader
// ═══════════════════════════════════════════════════════════════════════
const PRELOADER_CSS = `
/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Root container ── */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #09090b;
  color: #fff;
  user-select: none;
  overflow: hidden;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* ── Full-screen flash overlay ── */
.preloader-flash {
  position: absolute;
  inset: 0;
  z-index: 100000;
  background: rgba(255, 255, 255, 0.95);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preloader-flash__bloom {
  position: absolute;
  width: 120vmax;
  height: 120vmax;
  background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0.8) 20%, rgba(197,168,128,0.3) 50%, transparent 70%);
  border-radius: 50%;
  animation: flash-bloom 0.6s ease-out forwards;
}
@keyframes flash-bloom {
  0%   { transform: scale(0.1); opacity: 1; }
  50%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
.preloader-flash__rays {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    repeating-conic-gradient(
      from 0deg,
      rgba(255,255,255,0.3) 0deg 5deg,
      transparent 5deg 20deg
    );
  animation: flash-rays 0.5s ease-out forwards;
  opacity: 0;
}
@keyframes flash-rays {
  0%   { opacity: 0.8; transform: scale(0.5) rotate(0deg); }
  100% { opacity: 0; transform: scale(2) rotate(15deg); }
}

/* ── Content wrapper ── */
.preloader-content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}

/* ── Ambient background ── */
.preloader-bg {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 60% 50% at 50% 40%, rgba(197,168,128,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 80% 60% at 30% 70%, rgba(100,80,60,0.05) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Vignette ── */
.preloader-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}

/* ── Scanning line ── */
.preloader-scanline {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(197,168,128,0.3) 30%, rgba(197,168,128,0.6) 50%, rgba(197,168,128,0.3) 70%, transparent 100%);
  opacity: 0.25;
  animation: preloader-scan 2.5s ease-in-out infinite;
  pointer-events: none;
  z-index: 5;
}
@keyframes preloader-scan {
  0%   { top: 15%; opacity: 0; }
  10%  { opacity: 0.25; }
  90%  { opacity: 0.25; }
  100% { top: 85%; opacity: 0; }
}

/* ══════════════════════════════════════
   CAMERA ASSEMBLY — Realistic DSLR
   ══════════════════════════════════════ */
.preloader-camera-wrap {
  position: relative;
  z-index: 20;
  margin-bottom: 2rem;
}

.cam-assembly {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cam-float 4s ease-in-out infinite;
}
@keyframes cam-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* ── Camera Body ── */
.cam-body {
  position: relative;
  width: 280px;
  height: 200px;
  transition: all 0.3s ease;
}
@media (min-width: 640px) {
  .cam-body { width: 340px; height: 240px; }
}
@media (min-width: 768px) {
  .cam-body { width: 380px; height: 260px; }
}

/* ── Top Plate (pentaprism viewfinder hump) ── */
.cam-top-plate {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 22px;
  background: linear-gradient(180deg, #2a2a2e, #1a1a1e);
  border-radius: 6px 6px 0 0;
  border: 1px solid rgba(255,255,255,0.06);
  border-bottom: none;
  z-index: 5;
}

.cam-pentaprism {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 16px;
  background: linear-gradient(180deg, #333338, #222226);
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(255,255,255,0.08);
  border-bottom: none;
}
@media (min-width: 640px) {
  .cam-pentaprism { width: 72px; height: 18px; top: -16px; }
}

.cam-mode-dial {
  position: absolute;
  top: 2px;
  right: 16px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3a3a3e, #2a2a2e);
  border: 1px solid rgba(255,255,255,0.1);
  animation: dial-rotate 8s linear infinite;
}
@keyframes dial-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.cam-mode-dial__dot {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 3px;
  background: #c5a880;
  border-radius: 50%;
}

.cam-hotshoe {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 4px;
  background: linear-gradient(180deg, #555, #444);
  border-radius: 1px;
  z-index: 10;
}

.cam-power-led {
  position: absolute;
  top: 6px;
  left: 16px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e, 0 0 12px rgba(34,197,94,0.5);
  animation: led-blink 2s ease-in-out infinite;
}
@keyframes led-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ── Flash Unit ── */
.cam-flash-unit {
  position: absolute;
  top: -42px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 24px;
  z-index: 6;
  perspective: 200px;
}
.cam-flash-unit__head {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 20px;
  background: linear-gradient(180deg, #3a3a3e 0%, #28282c 100%);
  border-radius: 4px 4px 0 0;
  border: 1px solid rgba(255,255,255,0.08);
  border-bottom: none;
  overflow: hidden;
}
.cam-flash-unit__head::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,200,0.02));
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.06);
}

.cam-flash-unit__burst {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #fff 0%, rgba(255,255,230,0.8) 30%, rgba(197,168,128,0.4) 60%, transparent 80%);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
}
.cam-flash-unit--fire .cam-flash-unit__burst {
  animation: flash-burst 0.6s ease-out forwards;
}
@keyframes flash-burst {
  0%   { transform: translateX(-50%) scale(0); opacity: 0; }
  15%  { transform: translateX(-50%) scale(2); opacity: 1; }
  40%  { transform: translateX(-50%) scale(5); opacity: 0.9; }
  100% { transform: translateX(-50%) scale(12); opacity: 0; }
}

.cam-flash-unit__rays {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  width: 200px;
  height: 200px;
  opacity: 0;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    transparent 0deg, rgba(255,255,255,0.6) 3deg, transparent 6deg,
    transparent 20deg, rgba(255,255,255,0.4) 23deg, transparent 26deg,
    transparent 40deg, rgba(255,255,255,0.5) 43deg, transparent 46deg,
    transparent 60deg, rgba(255,255,255,0.3) 63deg, transparent 66deg,
    transparent 80deg, rgba(255,255,255,0.6) 83deg, transparent 86deg,
    transparent 100deg, rgba(255,255,255,0.4) 103deg, transparent 106deg,
    transparent 120deg, rgba(255,255,255,0.5) 123deg, transparent 126deg,
    transparent 140deg, rgba(255,255,255,0.3) 143deg, transparent 146deg,
    transparent 160deg, rgba(255,255,255,0.6) 163deg, transparent 166deg,
    transparent 180deg, rgba(255,255,255,0.4) 183deg, transparent 186deg,
    transparent 200deg, rgba(255,255,255,0.5) 203deg, transparent 206deg,
    transparent 220deg, rgba(255,255,255,0.3) 223deg, transparent 226deg,
    transparent 240deg, rgba(255,255,255,0.6) 243deg, transparent 246deg,
    transparent 260deg, rgba(255,255,255,0.4) 263deg, transparent 266deg,
    transparent 280deg, rgba(255,255,255,0.5) 283deg, transparent 286deg,
    transparent 300deg, rgba(255,255,255,0.3) 303deg, transparent 306deg,
    transparent 320deg, rgba(255,255,255,0.6) 323deg, transparent 326deg,
    transparent 340deg, rgba(255,255,255,0.4) 343deg, transparent 346deg,
    transparent 360deg
  );
}
.cam-flash-unit--fire .cam-flash-unit__rays {
  animation: flash-rays-cam 0.7s ease-out 0.05s forwards;
}
@keyframes flash-rays-cam {
  0%   { transform: translateX(-50%) scale(0); opacity: 0.8; }
  30%  { transform: translateX(-50%) scale(1.5); opacity: 0.6; }
  100% { transform: translateX(-50%) scale(3); opacity: 0; }
}

/* ── Camera Face ── */
.cam-face {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, #222226 0%, #18181b 40%, #121215 100%);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 20px 60px rgba(0,0,0,0.8),
    0 4px 20px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.05);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cam-face::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.03) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0,0,0,0.2) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* ── Lens Mount ── */
.cam-mount {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
@media (min-width: 640px) {
  .cam-mount { width: 180px; height: 180px; }
}
@media (min-width: 768px) {
  .cam-mount { width: 200px; height: 200px; }
}

/* ── Outer Lens Ring ── */
.cam-lens-ring--outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e2e32, #1e1e22, #2a2a2e);
  border: 2px solid rgba(255,255,255,0.08);
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.5),
    inset 0 2px 4px rgba(255,255,255,0.04),
    inset 0 -2px 4px rgba(0,0,0,0.4);
  animation: outer-ring-rotate 25s linear infinite;
}
@keyframes outer-ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cam-lens-text {
  position: absolute;
  font-family: 'Arial Narrow', 'Helvetica Neue', sans-serif;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  pointer-events: none;
}
.cam-lens-text--brand {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  color: rgba(197,168,128,0.8);
}
.cam-lens-text--spec {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 6px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.2em;
}
@media (min-width: 640px) {
  .cam-lens-text--brand { font-size: 8px; top: 10px; }
  .cam-lens-text--spec { font-size: 7px; bottom: 10px; }
}

/* Ring markers (focus distance) */
.cam-ring-markers {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.cam-ring-marker {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 5px;
  background: rgba(255,255,255,0.15);
  transform-origin: 50% 75px;
}
@media (min-width: 640px) {
  .cam-ring-marker { transform-origin: 50% 90px; }
}
@media (min-width: 768px) {
  .cam-ring-marker { transform-origin: 50% 100px; }
}

/* ── Inner Focus Ring ── */
.cam-lens-ring--inner {
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  background: linear-gradient(145deg, #252528, #1a1a1d, #222225);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow:
    inset 0 1px 3px rgba(255,255,255,0.03),
    inset 0 -1px 3px rgba(0,0,0,0.4);
  animation: inner-ring-rotate 18s linear infinite reverse;
}
@keyframes inner-ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@media (min-width: 640px) {
  .cam-lens-ring--inner { inset: 16px; }
}

.cam-ring-grip {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.cam-grip-line {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 6px;
  background: rgba(255,255,255,0.07);
  transform-origin: 50% 61px;
}
@media (min-width: 640px) {
  .cam-grip-line { transform-origin: 50% 74px; }
}
@media (min-width: 768px) {
  .cam-grip-line { transform-origin: 50% 84px; }
}

/* ── Lens Glass ── */
.cam-lens-glass {
  position: absolute;
  inset: 28px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 35%,
    #1a1825 0%,
    #0f0e18 30%,
    #080812 60%,
    #050508 100%
  );
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    inset 0 0 40px rgba(0,0,0,0.9),
    inset 0 0 20px rgba(80,60,120,0.1),
    0 0 0 2px rgba(0,0,0,0.4);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (min-width: 640px) {
  .cam-lens-glass { inset: 32px; }
}
@media (min-width: 768px) {
  .cam-lens-glass { inset: 36px; }
}

/* ── Lens Coating Reflections ── */
.cam-lens-coating {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    transparent 20%,
    rgba(100,60,200,0.12) 35%,
    rgba(60,180,220,0.08) 45%,
    transparent 55%,
    rgba(180,120,60,0.06) 70%,
    transparent 80%
  );
  pointer-events: none;
  z-index: 3;
  animation: coating-shimmer 6s ease-in-out infinite;
}
@keyframes coating-shimmer {
  0%, 100% { transform: rotate(0deg); opacity: 1; }
  50% { transform: rotate(12deg); opacity: 0.7; }
}
.cam-lens-coating--secondary {
  background: radial-gradient(
    ellipse 40% 60% at 70% 30%,
    rgba(197,168,128,0.08) 0%,
    transparent 60%
  );
  animation: coating-shift 8s ease-in-out infinite reverse;
}
@keyframes coating-shift {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(-8deg) scale(1.05); }
}

/* ── Aperture Blades ── */
.cam-aperture {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  z-index: 5;
}
.cam-aperture__blade {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 55%;
  height: 55%;
  background: linear-gradient(
    180deg,
    #1a1a1e 0%,
    #141418 50%,
    #0e0e12 100%
  );
  transform-origin: 0% 0%;
  clip-path: polygon(0% 0%, 100% 15%, 85% 100%);
  border: 0.5px solid rgba(255,255,255,0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.cam-aperture__blade::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%);
}

/* ── Center Glass + Flare ── */
.cam-lens-center {
  position: relative;
  z-index: 10;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, rgba(197,168,128,0.25), rgba(197,168,128,0.08) 50%, transparent 70%);
  box-shadow: 0 0 20px rgba(197,168,128,0.15), 0 0 40px rgba(197,168,128,0.08);
  animation: core-pulse 2.5s ease-in-out infinite;
}
@keyframes core-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(197,168,128,0.15); }
  50% { transform: scale(1.08); box-shadow: 0 0 30px rgba(197,168,128,0.25), 0 0 50px rgba(197,168,128,0.1); }
}
@media (min-width: 640px) {
  .cam-lens-center { width: 32px; height: 32px; }
}

.cam-lens-flare {
  position: absolute;
  top: 4px;
  left: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  filter: blur(2px);
  animation: flare-twinkle 3s ease-in-out infinite;
}
@keyframes flare-twinkle {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.3); }
}

/* ── AF Brackets ── */
.cam-af-brackets {
  position: absolute;
  inset: 16px;
  z-index: 12;
  pointer-events: none;
  animation: af-focus 2s ease-in-out infinite;
}
@keyframes af-focus {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(0.92); opacity: 1; }
}
.cam-af-bracket {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: rgba(197,168,128,0.7);
}
.cam-af-bracket--tl { top: 0; left: 0; border-top: 1.5px solid; border-left: 1.5px solid; }
.cam-af-bracket--tr { top: 0; right: 0; border-top: 1.5px solid; border-right: 1.5px solid; }
.cam-af-bracket--bl { bottom: 0; left: 0; border-bottom: 1.5px solid; border-left: 1.5px solid; }
.cam-af-bracket--br { bottom: 0; right: 0; border-bottom: 1.5px solid; border-right: 1.5px solid; }

/* ── Focus Ring Light ── */
.cam-focus-ring-light {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: rgba(197,168,128,0.3);
  border-right-color: rgba(197,168,128,0.15);
  animation: focus-ring-spin 3s linear infinite;
  pointer-events: none;
  z-index: 2;
}
@keyframes focus-ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Grip Area ── */
.cam-grip-area {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 3px;
  z-index: 3;
  padding: 12px 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0.02), transparent);
  border-radius: 4px;
}
.cam-grip-ridge {
  width: 14px;
  height: 2px;
  background: rgba(255,255,255,0.06);
  border-radius: 1px;
}

/* ── Brand Badge ── */
.cam-brand-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  font-family: 'Georgia', serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: rgba(197,168,128,0.6);
  text-transform: uppercase;
  z-index: 3;
}
@media (min-width: 640px) {
  .cam-brand-badge { font-size: 10px; top: 16px; left: 16px; }
}

/* ── Shutter Button ── */
.cam-shutter-btn {
  position: absolute;
  top: -8px;
  right: 60px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(145deg, #444, #333);
  border: 2px solid rgba(255,255,255,0.1);
  z-index: 10;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.cam-shutter-btn__ring {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 1px solid rgba(197,168,128,0.4);
}
.cam-shutter-btn--pressed {
  transform: translateY(2px) scale(0.95);
  box-shadow: 0 0 4px rgba(0,0,0,0.8);
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
}

/* ══════════════════════════════════════
   READY STATE EFFECTS
   ══════════════════════════════════════ */
.cam-body--ready .cam-lens-center {
  animation: ready-core 0.4s ease-out forwards;
}
@keyframes ready-core {
  0%   { transform: scale(1); box-shadow: 0 0 20px rgba(197,168,128,0.15); }
  50%  { transform: scale(1.5); box-shadow: 0 0 50px rgba(197,168,128,0.5), 0 0 80px rgba(255,255,255,0.3); }
  100% { transform: scale(1.2); box-shadow: 0 0 40px rgba(197,168,128,0.4); }
}

.cam-body--ready .cam-af-brackets {
  animation: ready-af 0.3s ease-out forwards;
}
@keyframes ready-af {
  0%   { transform: scale(0.92); }
  50%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

.cam-body--ready .cam-power-led {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b, 0 0 16px rgba(245,158,11,0.5);
  animation: none;
}

/* ══════════════════════════════════════
   PROGRESS — Count + bar + status
   ══════════════════════════════════════ */
.preloader-progress {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* Status text */
.preloader-progress__status {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin: 0;
  height: 14px;
}
@media (min-width: 640px) {
  .preloader-progress__status { font-size: 11px; }
}

/* Percentage */
.preloader-progress__percent {
  font-size: 28px;
  font-weight: 900;
  font-family: var(--font-geist-mono), 'SF Mono', 'Consolas', monospace;
  letter-spacing: 0.15em;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(90deg, #fff, #f0e6d6, #c5a880);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 16px rgba(197,168,128,0.3));
}
@media (min-width: 640px) {
  .preloader-progress__percent { font-size: 36px; }
}

/* Track */
.preloader-progress__track {
  width: 180px;
  height: 5px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: visible;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
}
@media (min-width: 640px) {
  .preloader-progress__track { width: 220px; height: 6px; }
}

/* Fill */
.preloader-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #8a7251, #c5a880, #f4ecd8);
  border-radius: 999px;
  position: relative;
  transition: width 0.12s ease-out;
  box-shadow: 0 0 12px rgba(197,168,128,0.4);
}

/* Glow dot */
.preloader-progress__glow-dot {
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 9px;
  height: 9px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 8px #fff, 0 0 16px #c5a880;
  animation: dot-pulse 1.2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { box-shadow: 0 0 8px #fff, 0 0 16px #c5a880; }
  50%      { box-shadow: 0 0 12px #fff, 0 0 24px #c5a880, 0 0 32px rgba(197,168,128,0.2); }
}

/* Tagline */
.preloader-progress__tagline {
  margin-top: 6px;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(197,168,128,0.35);
  animation: tagline-fade 2.5s ease-in-out infinite;
}
@keyframes tagline-fade {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.6; }
}

/* ══════════════════════════════════════
   ERROR STATE
   ══════════════════════════════════════ */
.preloader-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  padding: 0 24px;
  max-width: 400px;
  z-index: 30;
}
.preloader-error__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.preloader-error__title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.preloader-error__message {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin: 0;
}
.preloader-error__retry {
  padding: 12px 32px;
  background: #c5a880;
  color: #09090b;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}
.preloader-error__retry:hover {
  background: #d4bc9a;
  box-shadow: 0 0 30px rgba(197, 168, 128, 0.4);
  transform: translateY(-1px);
}
`;
