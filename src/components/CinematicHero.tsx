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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const wheelAccumulatorRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

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

  // Preload all 35 frames
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

  // Wheel and Touch scroll interception:
  // While user is on the hero at top, keep page pinned until the LAST image (frame 35) is reached!
  // Once the last image is reached, allow normal scroll down!
  useEffect(() => {
    const WHEEL_THRESHOLD = 26; // Wheel delta required to advance one frame

    const onWheel = (e: WheelEvent) => {
      // If user is at the top of the page
      if (window.scrollY <= 10) {
        if (e.deltaY > 0) {
          // Scrolling down: until last image arrives, PIN the page and change image!
          if (currentFrameRef.current < TOTAL_FRAMES - 1) {
            e.preventDefault();
            wheelAccumulatorRef.current += e.deltaY;
            if (Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD) {
              const step = Math.sign(wheelAccumulatorRef.current);
              wheelAccumulatorRef.current = 0;
              const next = Math.min(TOTAL_FRAMES - 1, currentFrameRef.current + step);
              currentFrameRef.current = next;
              setCurrentFrameIndex(next);
              drawFrame(next);
            }
          }
          // Once last image (frame 34) is reached, do NOT preventDefault!
          // Page scrolls down naturally to next sections!
        } else if (e.deltaY < 0) {
          // Scrolling up: if not at first image, scrub backwards!
          if (currentFrameRef.current > 0) {
            e.preventDefault();
            wheelAccumulatorRef.current += e.deltaY;
            if (Math.abs(wheelAccumulatorRef.current) >= WHEEL_THRESHOLD) {
              const step = Math.sign(wheelAccumulatorRef.current);
              wheelAccumulatorRef.current = 0;
              const next = Math.max(0, currentFrameRef.current + step);
              currentFrameRef.current = next;
              setCurrentFrameIndex(next);
              drawFrame(next);
            }
          }
        }
      }
    };

    // Touch support for mobile swipe
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY <= 10 && e.touches.length > 0) {
        const deltaY = touchStartYRef.current - e.touches[0].clientY;
        if (deltaY > 14) {
          // Swiping up (scrolling down): pin until last frame!
          if (currentFrameRef.current < TOTAL_FRAMES - 1) {
            e.preventDefault();
            touchStartYRef.current = e.touches[0].clientY;
            const next = Math.min(TOTAL_FRAMES - 1, currentFrameRef.current + 1);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);
          }
        } else if (deltaY < -14) {
          // Swiping down (scrolling up): scrub backwards!
          if (currentFrameRef.current > 0) {
            e.preventDefault();
            touchStartYRef.current = e.touches[0].clientY;
            const next = Math.max(0, currentFrameRef.current - 1);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);
          }
        }
      }
    };

    // Keyboard support (down arrow / spacebar)
    const onKeyDown = (e: KeyboardEvent) => {
      if (window.scrollY <= 10) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          if (currentFrameRef.current < TOTAL_FRAMES - 1) {
            e.preventDefault();
            const next = Math.min(TOTAL_FRAMES - 1, currentFrameRef.current + 1);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);
          }
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          if (currentFrameRef.current > 0) {
            e.preventDefault();
            const next = Math.max(0, currentFrameRef.current - 1);
            currentFrameRef.current = next;
            setCurrentFrameIndex(next);
            drawFrame(next);
          }
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawFrame]);

  const progressPercent = Math.min(100, Math.max(0, ((currentFrameIndex + 1) / TOTAL_FRAMES) * 100));

  return (
    <section
      className="hero-section"
      id="hero"
      style={{
        position: 'relative',
        width: '100%',
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        minHeight: '520px',
        maxHeight: '920px',
        overflow: 'hidden',
        background: '#faf9f6',
      }}
    >
      {/* Zero-latency poster fallback */}
      <img
        src={getFramePath(0)}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 0.35 : 0.9,
          pointerEvents: 'none',
        }}
      />

      {/* Dynamic Canvas: Scrubbed on scroll until last image */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
        }}
      />

      {/* Subtle vignette */}
      <div className="hero-cinematic-overlay" />

      {/* Visual progress bar at bottom of frame (pure visual, NO text) */}
      <div
        className="hero-progress-bar"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2.5px',
          background: 'linear-gradient(90deg, #c5a880, #e3d8c8)',
          width: `${progressPercent}%`,
          zIndex: 5,
          transition: 'width 0.05s linear',
        }}
      />
    </section>
  );
}
