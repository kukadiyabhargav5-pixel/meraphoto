'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ─────────────── CONFIGURATION ─────────────── */

const FRAME_PREFIX = '/frames/frame_';
const FRAME_EXT = '.jpg';
const TOTAL_FRAMES = 35;
const HEADER_HEIGHT = 64;

/* ─────────────── HELPERS ─────────────── */

function getFramePath(index: number): string {
  const num = String(index + 1).padStart(3, '0');
  return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0 || cw <= 0 || ch <= 0) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (imgRatio > canvasRatio) {
    sw = ih * canvasRatio;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / canvasRatio;
    sy = (ih - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

function getClosestLoadedImage(index: number, images: (HTMLImageElement | null)[]): HTMLImageElement | null {
  if (images[index]) return images[index];
  for (let i = index - 1; i >= 0; i--) {
    if (images[i]) return images[i];
  }
  for (let i = index + 1; i < images.length; i++) {
    if (images[i]) return images[i];
  }
  return null;
}

/* ─────────────── COMPONENT ─────────────── */

export default function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const wheelAccumulatorRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchAccumulatorRef = useRef<number>(0);
  const isUnlockedRef = useRef<boolean>(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Preload an individual image
  const loadImage = useCallback((index: number): Promise<void> => {
    return new Promise((resolve) => {
      if (imagesRef.current[index]) { resolve(); return; }
      const img = new Image();
      img.src = getFramePath(index);
      img.onload = () => { imagesRef.current[index] = img; resolve(); };
      img.onerror = () => { resolve(); };
    });
  }, []);

  // Draw specific frame on canvas
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = getClosestLoadedImage(frameIdx, imagesRef.current);
    if (img) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, img, canvas.width, canvas.height);
      lastDrawnFrameRef.current = frameIdx;
    }
  }, []);

  // Preload all 35 frames in background
  useEffect(() => {
    let cancelled = false;

    async function preloadAll() {
      // 1. Load initial frame and immediately paint to canvas
      await loadImage(0);
      if (canvasRef.current && imagesRef.current[0]) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          drawCover(ctx, imagesRef.current[0], canvasRef.current.width, canvasRef.current.height);
          lastDrawnFrameRef.current = 0;
        }
      }

      // 2. Preload remaining frames in parallel
      const promises: Promise<void>[] = [];
      for (let i = 1; i < TOTAL_FRAMES && !cancelled; i++) {
        promises.push(loadImage(i));
      }
      await Promise.all(promises);
      if (cancelled) return;
      setIsLoaded(true);
    }

    preloadAll();
    return () => { cancelled = true; };
  }, [loadImage]);

  // Resize canvas according to device pixel ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : (window.innerHeight - HEADER_HEIGHT);
    if (w <= 0 || h <= 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    drawFrame(currentFrameRef.current);
  }, [drawFrame]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // ── SCROLL-PINNED INTERACTION (MOBILE & DESKTOP LOCK) ──
  // The page CANNOT scroll down until the LAST image (Frame 35 / index 34) is reached.
  // Uses touch-action: none + non-passive event listeners to ensure 100% lock on iOS/Android.
  useEffect(() => {
    const WHEEL_THRESHOLD = 18; // wheel delta per frame
    const TOUCH_THRESHOLD = 8;  // 8px swipe distance per frame (fast & responsive)

    const onWheel = (e: WheelEvent) => {
      // If user is scrolled down into page content, let normal scrolling happen
      if (window.scrollY > 15) return;

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (currentFrameRef.current < TOTAL_FRAMES - 1) {
          // Lock page and advance frame
          e.preventDefault();
          wheelAccumulatorRef.current += e.deltaY;
          if (Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD) {
            const step = Math.sign(wheelAccumulatorRef.current);
            wheelAccumulatorRef.current = 0;
            const next = Math.min(TOTAL_FRAMES - 1, currentFrameRef.current + step);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);

            if (next >= TOTAL_FRAMES - 1) {
              isUnlockedRef.current = true;
              setIsUnlocked(true);
            }
          }
        } else {
          // User is at last frame: allow normal scroll down!
          isUnlockedRef.current = true;
          setIsUnlocked(true);
        }
      } else if (e.deltaY < 0) {
        // Scrolling UP at top of page: scrub backwards
        if (window.scrollY <= 10 && currentFrameRef.current > 0) {
          e.preventDefault();
          wheelAccumulatorRef.current += e.deltaY;
          if (Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD) {
            const step = Math.sign(wheelAccumulatorRef.current);
            wheelAccumulatorRef.current = 0;
            const next = Math.max(0, currentFrameRef.current + step);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);

            if (next < TOTAL_FRAMES - 1) {
              isUnlockedRef.current = false;
              setIsUnlocked(false);
            }
          }
        }
      }
    };

    // Mobile touch interaction
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
        touchAccumulatorRef.current = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;

      // If user is already scrolled down into the page body, allow normal scrolling
      if (window.scrollY > window.innerHeight * 0.6) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY; // positive = swiping up (trying to scroll down)
      touchStartYRef.current = currentY;

      if (deltaY > 0) {
        // Swiping UP -> wants to advance down
        if (currentFrameRef.current < TOTAL_FRAMES - 1) {
          // STRICT LOCK: Must preventDefault on mobile so page does NOT scroll down early!
          if (e.cancelable) e.preventDefault();

          touchAccumulatorRef.current += deltaY;
          if (touchAccumulatorRef.current >= TOUCH_THRESHOLD) {
            const framesToAdvance = Math.floor(touchAccumulatorRef.current / TOUCH_THRESHOLD);
            touchAccumulatorRef.current %= TOUCH_THRESHOLD;
            const next = Math.min(TOTAL_FRAMES - 1, currentFrameRef.current + framesToAdvance);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);

            if (next >= TOTAL_FRAMES - 1) {
              isUnlockedRef.current = true;
              setIsUnlocked(true);
            }
          }
        } else {
          // ALREADY AT LAST FRAME:
          // Unlocked! Move window scroll down seamlessly
          isUnlockedRef.current = true;
          setIsUnlocked(true);
          window.scrollBy({ top: Math.max(deltaY * 1.2, 12), behavior: 'auto' });
        }
      } else if (deltaY < 0) {
        // Swiping DOWN -> wants to scroll up
        if (window.scrollY <= 10 && currentFrameRef.current > 0) {
          if (e.cancelable) e.preventDefault();
          touchAccumulatorRef.current += deltaY;
          if (Math.abs(touchAccumulatorRef.current) >= TOUCH_THRESHOLD) {
            const framesToRewind = Math.floor(Math.abs(touchAccumulatorRef.current) / TOUCH_THRESHOLD);
            touchAccumulatorRef.current = -(Math.abs(touchAccumulatorRef.current) % TOUCH_THRESHOLD);
            const next = Math.max(0, currentFrameRef.current - framesToRewind);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);

            if (next < TOTAL_FRAMES - 1) {
              isUnlockedRef.current = false;
              setIsUnlocked(false);
            }
          }
        }
      }
    };

    // Keyboard support (down arrow / spacebar / up arrow)
    const onKeyDown = (e: KeyboardEvent) => {
      if (window.scrollY <= 8) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          if (currentFrameRef.current < TOTAL_FRAMES - 1) {
            e.preventDefault();
            const next = Math.min(TOTAL_FRAMES - 1, currentFrameRef.current + 1);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);
            if (next >= TOTAL_FRAMES - 1) {
              isUnlockedRef.current = true;
              setIsUnlocked(true);
            }
          }
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          if (currentFrameRef.current > 0) {
            e.preventDefault();
            const next = Math.max(0, currentFrameRef.current - 1);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);
            if (next < TOTAL_FRAMES - 1) {
              isUnlockedRef.current = false;
              setIsUnlocked(false);
            }
          }
        }
      }
    };

    const heroSection = sectionRef.current;

    // Attach listeners with passive: false to guarantee preventDefault works
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });

    if (heroSection) {
      heroSection.addEventListener('touchstart', onTouchStart, { passive: true });
      heroSection.addEventListener('touchmove', onTouchMove, { passive: false });
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      if (heroSection) {
        heroSection.removeEventListener('touchstart', onTouchStart);
        heroSection.removeEventListener('touchmove', onTouchMove);
      }
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [drawFrame]);

  const progressPercent = Math.min(100, Math.max(0, ((currentFrameIndex + 1) / TOTAL_FRAMES) * 100));

  return (
    <section
      ref={sectionRef}
      className="hero-section"
      id="hero"
      style={{
        touchAction: isUnlocked ? 'pan-y' : 'none',
        position: 'relative',
        width: '100%',
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        minHeight: '520px',
        maxHeight: '960px',
        overflow: 'hidden',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Zero-latency poster fallback */}
      <img
        src={getFramePath(0)}
        alt="Mara Photo Cinematic Hero"
        className="hero-poster"
        style={{
          opacity: isLoaded ? 0.3 : 0.95,
        }}
      />

      {/* Dynamic Canvas */}
      <canvas
        ref={canvasRef}
        className="hero-canvas"
      />

      {/* Subtle vignette */}
      <div className="hero-cinematic-overlay" />

      {/* Clean luxury progress bar at bottom of hero section */}
      <div
        className="hero-progress-bar"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2.5px',
          background: 'linear-gradient(90deg, #c5a880 0%, #e3d8c8 50%, #f5f2eb 100%)',
          width: `${progressPercent}%`,
          zIndex: 10,
          transition: 'width 0.05s linear',
          boxShadow: '0 0 10px rgba(197, 168, 128, 0.5)',
        }}
      />
    </section>
  );
}
