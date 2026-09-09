'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startKeepAlive } from '../lib/keepAlive';
import { useApplicationLoader } from '../lib/hooks/useApplicationLoader';

// ═══════════════════════════════════════════════════════════════════════
// ANIMATED CAMERA LENS — Premium aperture + optical glass animation
// ═══════════════════════════════════════════════════════════════════════
const AnimatedCameraLens = ({ progress, isReady }: { progress: number; isReady: boolean }) => {
  const bladeCount = 8;
  const bladeAngle = Math.min(42, (progress / 100) * 42);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="preloader-camera"
      aria-hidden="true"
    >
      {/* Orbiting particles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="preloader-camera__orbit preloader-animate"
      >
        <div className="preloader-camera__particle preloader-camera__particle--gold" />
        <div className="preloader-camera__particle preloader-camera__particle--white" />
      </motion.div>

      {/* Outer dial ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="preloader-camera__dial preloader-animate"
      >
        <span className="preloader-camera__dial-text preloader-camera__dial-text--top">AI FOCAL MATRIX</span>
        <span className="preloader-camera__dial-text preloader-camera__dial-text--bottom">50mm · f/1.2</span>
        <span className="preloader-camera__dial-text preloader-camera__dial-text--left">AF-L</span>
        <span className="preloader-camera__dial-text preloader-camera__dial-text--right">OIS</span>
      </motion.div>

      {/* Dashed HUD ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="preloader-camera__hud preloader-animate"
      />

      {/* Pulsing gold glow */}
      <motion.div
        animate={{
          scale: isReady ? [1, 1.25, 1.1] : [1, 1.06, 1],
          opacity: isReady ? 0.95 : [0.4, 0.75, 0.4]
        }}
        transition={{ duration: isReady ? 0.5 : 2.2, repeat: isReady ? 0 : Infinity, ease: "easeInOut" }}
        className="preloader-camera__glow preloader-animate"
      />

      {/* Lens barrel */}
      <div className="preloader-camera__barrel">
        <div className="preloader-camera__glass">

          {/* Prismatic flare */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="preloader-camera__flare preloader-camera__flare--purple preloader-animate"
          >
            <div className="preloader-camera__flare-blob preloader-camera__flare-blob--purple" />
          </motion.div>

          {/* Gold flare */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="preloader-camera__flare preloader-camera__flare--gold preloader-animate"
          >
            <div className="preloader-camera__flare-blob preloader-camera__flare-blob--gold" />
          </motion.div>

          {/* Aperture blades */}
          <div className="preloader-camera__blades">
            {[...Array(bladeCount)].map((_, i) => {
              const rotation = (360 / bladeCount) * i;
              return (
                <motion.div
                  key={i}
                  className="preloader-camera__blade"
                  style={{ transform: `rotate(${rotation}deg) translateX(20px)` }}
                  animate={{ rotate: rotation + bladeAngle, opacity: isReady ? 0.15 : 0.6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              );
            })}
          </div>

          {/* Glowing core */}
          <motion.div
            animate={{
              scale: isReady ? [1, 2, 1.5] : [0.8, 1.1, 0.8],
              opacity: isReady ? [1, 0, 1] : [0.4, 0.7, 0.4]
            }}
            transition={{ duration: isReady ? 0.4 : 3, repeat: isReady ? 0 : Infinity, ease: "easeInOut" }}
            className="preloader-camera__core preloader-animate"
          />

          {/* Autofocus brackets */}
          <div className="preloader-camera__brackets">
            <div className="preloader-camera__bracket preloader-camera__bracket--tl" />
            <div className="preloader-camera__bracket preloader-camera__bracket--tr" />
            <div className="preloader-camera__bracket preloader-camera__bracket--bl" />
            <div className="preloader-camera__bracket preloader-camera__bracket--br" />
          </div>

          {/* Flash at 100% */}
          {isReady && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1], scale: [0.5, 4, 8] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="preloader-camera__flash"
            />
          )}
        </div>
      </div>
    </motion.div>
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
  const { progress, status, isReady, error, isCriticalFailed, retry } = useApplicationLoader();

  const [displayProgress, setDisplayProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const animRef = useRef<number | null>(null);
  const currentValRef = useRef(0);
  const keepAliveStartedRef = useRef(false);

  // Start keep-alive once
  useEffect(() => {
    if (!keepAliveStartedRef.current) {
      keepAliveStartedRef.current = true;
      startKeepAlive();
    }
  }, []);

  // Check sessionStorage synchronously on mount
  const [shouldShow] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('app_initial_ready') !== 'true';
  });

  // Smooth progress animation
  useEffect(() => {
    if (!shouldShow || isDismissed) return;
    const animate = () => {
      const target = progress;
      if (currentValRef.current < target) {
        const step = Math.max(0.5, (target - currentValRef.current) * 0.1);
        currentValRef.current = Math.min(target, currentValRef.current + step);
        setDisplayProgress(Math.round(currentValRef.current));
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [progress, shouldShow, isDismissed]);

  // Flash + dismiss when ready
  useEffect(() => {
    if (!isReady || !shouldShow || isDismissed) return;
    const waitInterval = setInterval(() => {
      if (currentValRef.current >= 99.5) {
        clearInterval(waitInterval);
        setDisplayProgress(100);
        setTimeout(() => {
          setIsFlashing(true);
          setTimeout(() => setIsDismissed(true), 500);
        }, 350);
      }
    }, 30);
    return () => clearInterval(waitInterval);
  }, [isReady, shouldShow, isDismissed]);

  if (!shouldShow || isDismissed) return null;

  const completionReady = isReady && displayProgress >= 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="global-preloader"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
        className="preloader"
        role="progressbar"
        aria-valuenow={displayProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading website: ${displayProgress}%`}
      >
        {/* ── Inline CSS for the entire preloader ── */}
        <style dangerouslySetInnerHTML={{ __html: PRELOADER_CSS }} />

        {/* Full-screen camera flash */}
        <AnimatePresence>
          {isFlashing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeIn" }}
              className="preloader-flash"
            >
              <motion.div
                animate={{ scale: [1, 2], opacity: [1, 0] }}
                transition={{ duration: 0.6 }}
                className="preloader-flash__bloom"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content wrapper */}
        <motion.div
          animate={isFlashing
            ? { scale: 1.4, opacity: 0, filter: "blur(20px)" }
            : { scale: 1, opacity: 1, filter: "blur(0px)" }
          }
          transition={{ duration: 0.4, ease: "easeIn" }}
          className="preloader-content"
        >
          {/* Ambient background */}
          <div className="preloader-bg" />

          {/* Scanning line animation */}
          <div className="preloader-scanline preloader-animate" />

          {isCriticalFailed && error ? (
            <LoaderErrorState error={error} onRetry={retry} />
          ) : (
            <>
              {/* ─── LOGO (Top, Medium, White) ─── */}
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="preloader-logo"
              >
                <div className="preloader-logo__glow preloader-animate" />
                <img
                  src="/logo.png"
                  alt="Mara Photo"
                  className="preloader-logo__img"
                />
              </motion.div>

              {/* ─── CAMERA (Center) ─── */}
              <div className="preloader-camera-wrap">
                <AnimatedCameraLens progress={displayProgress} isReady={completionReady} />
              </div>

              {/* ─── PROGRESS SECTION (Bottom) ─── */}
              <div className="preloader-progress">
                {/* Status text */}
                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="preloader-progress__status"
                  aria-live="polite"
                >
                  {status}
                </motion.p>

                {/* Percentage */}
                <motion.div
                  animate={{ scale: completionReady ? [1, 1.1, 1.05] : 1 }}
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

                {/* Subtle tagline */}
                <p className="preloader-progress__tagline preloader-animate">
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
// FULL CSS — All preloader styles
// ═══════════════════════════════════════════════════════════════════════
const PRELOADER_CSS = `
/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .preloader-animate,
  .preloader-animate * {
    animation: none !important;
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
  background: #070709;
  color: #fff;
  user-select: none;
  overflow: hidden;
}

/* ── Full-screen flash ── */
.preloader-flash {
  position: absolute;
  inset: 0;
  z-index: 100000;
  background: #fff;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preloader-flash__bloom {
  width: 50vw;
  height: 50vw;
  background: #fff;
  border-radius: 50%;
  filter: blur(100px);
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

/* ── Ambient vignette background ── */
.preloader-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(197, 168, 128, 0.12) 0%,
    rgba(7, 7, 9, 0.92) 50%,
    #070709 100%
  );
  pointer-events: none;
}

/* ── Scanning line ── */
.preloader-scanline {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(197, 168, 128, 0.4) 20%,
    rgba(197, 168, 128, 0.8) 50%,
    rgba(197, 168, 128, 0.4) 80%,
    transparent 100%
  );
  opacity: 0.3;
  animation: preloader-scan 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 5;
}

@keyframes preloader-scan {
  0%   { top: 10%; opacity: 0; }
  10%  { opacity: 0.3; }
  50%  { top: 90%; opacity: 0.3; }
  90%  { opacity: 0.3; }
  100% { top: 10%; opacity: 0; }
}

/* ══════════════════════════════════════
   LOGO — Medium size, white color
   ══════════════════════════════════════ */
.preloader-logo {
  position: relative;
  z-index: 30;
  margin-bottom: 2rem;
}
.preloader-logo__glow {
  position: absolute;
  inset: -8px;
  background: linear-gradient(90deg,
    rgba(197, 168, 128, 0.25) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(197, 168, 128, 0.25) 100%
  );
  filter: blur(24px);
  border-radius: 50%;
  pointer-events: none;
  animation: preloader-logo-pulse 2.5s ease-in-out infinite;
}
@keyframes preloader-logo-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%      { opacity: 0.85; transform: scale(1.05); }
}

.preloader-logo__img {
  position: relative;
  z-index: 10;
  height: 56px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
  drop-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}
@media (min-width: 640px) {
  .preloader-logo__img { height: 64px; }
}
@media (min-width: 768px) {
  .preloader-logo__img { height: 72px; }
}

/* ══════════════════════════════════════
   CAMERA — Centered lens assembly
   ══════════════════════════════════════ */
.preloader-camera-wrap {
  position: relative;
  z-index: 20;
  margin-bottom: 2rem;
}

.preloader-camera {
  position: relative;
  width: 192px;
  height: 192px;
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (min-width: 640px) {
  .preloader-camera { width: 224px; height: 224px; }
}
@media (min-width: 768px) {
  .preloader-camera { width: 256px; height: 256px; }
}

/* Orbit */
.preloader-camera__orbit {
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  pointer-events: none;
}
.preloader-camera__particle {
  position: absolute;
  border-radius: 50%;
}
.preloader-camera__particle--gold {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: #c5a880;
  box-shadow: 0 0 12px #c5a880, 0 0 24px #c5a880;
}
.preloader-camera__particle--white {
  bottom: 16px;
  right: 32px;
  width: 6px;
  height: 6px;
  background: #fff;
  box-shadow: 0 0 10px #fff;
}

/* Dial */
.preloader-camera__dial {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.preloader-camera__dial-text {
  position: absolute;
  font-family: monospace;
  font-size: 8px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
@media (min-width: 640px) {
  .preloader-camera__dial-text { font-size: 9px; }
}
.preloader-camera__dial-text--top    { top: 4px; color: rgba(197, 168, 128, 0.7); }
.preloader-camera__dial-text--bottom { bottom: 4px; color: rgba(255, 255, 255, 0.4); }
.preloader-camera__dial-text--left   { left: 6px; color: rgba(255, 255, 255, 0.3); font-size: 8px; letter-spacing: normal; }
.preloader-camera__dial-text--right  { right: 6px; color: rgba(255, 255, 255, 0.3); font-size: 8px; letter-spacing: normal; }

/* HUD ring */
.preloader-camera__hud {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1px dashed rgba(197, 168, 128, 0.3);
  pointer-events: none;
}
@media (min-width: 640px) {
  .preloader-camera__hud { inset: 12px; }
}

/* Glow aura */
.preloader-camera__glow {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  border: 1px solid rgba(197, 168, 128, 0.5);
  box-shadow: 0 0 50px rgba(197, 168, 128, 0.35);
}

/* Barrel */
.preloader-camera__barrel {
  position: absolute;
  inset: 20px;
  border-radius: 50%;
  background: linear-gradient(to bottom, #1c1917, #11100f, #080808);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.95), 0 10px 30px rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
@media (min-width: 640px) {
  .preloader-camera__barrel { inset: 24px; }
}

/* Glass */
.preloader-camera__glass {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #050507;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Flares */
.preloader-camera__flare {
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  pointer-events: none;
}
.preloader-camera__flare--purple { opacity: 0.4; }
.preloader-camera__flare--gold   { opacity: 0.45; }
.preloader-camera__flare-blob {
  position: absolute;
  border-radius: 50%;
}
.preloader-camera__flare-blob--purple {
  top: -16px;
  left: -16px;
  width: 128px;
  height: 128px;
  background: linear-gradient(to bottom right, rgba(147, 51, 234, 0.3), rgba(6, 182, 212, 0.15), transparent);
  filter: blur(8px);
}
.preloader-camera__flare-blob--gold {
  bottom: -16px;
  right: -16px;
  width: 128px;
  height: 128px;
  background: linear-gradient(to top left, rgba(197, 168, 128, 0.4), rgba(217, 119, 6, 0.2), transparent);
  filter: blur(6px);
}

/* Blades */
.preloader-camera__blades {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}
.preloader-camera__blade {
  position: absolute;
  width: 80px;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(197, 168, 128, 0.5), rgba(255, 255, 255, 0.7));
  transform-origin: left center;
}

/* Core */
.preloader-camera__core {
  position: relative;
  z-index: 20;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #c5a880;
  box-shadow: 0 0 30px #c5a880, 0 0 60px #fff;
}

/* Brackets */
.preloader-camera__brackets {
  position: absolute;
  inset: 12px;
  pointer-events: none;
  opacity: 0.6;
  z-index: 30;
}
@media (min-width: 640px) {
  .preloader-camera__brackets { inset: 16px; }
}
.preloader-camera__bracket {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(197, 168, 128, 0.8);
  box-shadow: 0 0 6px #c5a880;
}
.preloader-camera__bracket--tl { top: 0; left: 0; border-top: 2px solid; border-left: 2px solid; }
.preloader-camera__bracket--tr { top: 0; right: 0; border-top: 2px solid; border-right: 2px solid; }
.preloader-camera__bracket--bl { bottom: 0; left: 0; border-bottom: 2px solid; border-left: 2px solid; }
.preloader-camera__bracket--br { bottom: 0; right: 0; border-bottom: 2px solid; border-right: 2px solid; }

/* Flash */
.preloader-camera__flash {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #fff;
  z-index: 50;
  pointer-events: none;
  box-shadow: 0 0 100px #fff, 0 0 200px #fff;
}

/* ══════════════════════════════════════
   PROGRESS — Count + bar + status text
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
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
  height: 16px;
}
@media (min-width: 640px) {
  .preloader-progress__status { font-size: 12px; }
}

/* Percentage */
.preloader-progress__percent {
  font-size: 32px;
  font-weight: 900;
  font-family: var(--font-geist-mono), monospace;
  letter-spacing: 0.15em;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(90deg, #fff, #f0e6d6, #c5a880);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(197, 168, 128, 0.4));
}
@media (min-width: 640px) {
  .preloader-progress__percent { font-size: 40px; }
}

/* Track */
.preloader-progress__track {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: visible;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.8);
}
@media (min-width: 640px) {
  .preloader-progress__track { width: 240px; }
}

/* Fill */
.preloader-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #8a7251, #c5a880, #f4ecd8);
  border-radius: 999px;
  position: relative;
  transition: width 0.15s ease-out;
  box-shadow: 0 0 12px rgba(197, 168, 128, 0.5);
}

/* Glow dot */
.preloader-progress__glow-dot {
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 10px #fff, 0 0 20px #c5a880, 0 0 30px #c5a880;
  animation: preloader-dot-pulse 1.5s ease-in-out infinite;
}

@keyframes preloader-dot-pulse {
  0%, 100% { box-shadow: 0 0 10px #fff, 0 0 20px #c5a880; }
  50%      { box-shadow: 0 0 15px #fff, 0 0 30px #c5a880, 0 0 40px rgba(197, 168, 128, 0.3); }
}

/* Tagline */
.preloader-progress__tagline {
  margin-top: 8px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(197, 168, 128, 0.4);
  animation: preloader-tagline-fade 3s ease-in-out infinite;
}

@keyframes preloader-tagline-fade {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
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
