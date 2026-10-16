'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

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

function drawAdaptive(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0 || cw <= 0 || ch <= 0) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Seamless 100% full cover scaling without letterboxing or black gaps
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  // Direct paint overwrites the canvas completely (no clearRect blanking flash)
  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
}

function getClosestLoadedImage(index: number, images: (HTMLImageElement | null)[]): HTMLImageElement | null {
  if (images[index] && images[index]?.complete && images[index]?.naturalWidth !== 0) {
    return images[index];
  }
  for (let i = index - 1; i >= 0; i--) {
    if (images[i] && images[i]?.complete && images[i]?.naturalWidth !== 0) {
      return images[i];
    }
  }
  for (let i = index + 1; i < images.length; i++) {
    if (images[i] && images[i]?.complete && images[i]?.naturalWidth !== 0) {
      return images[i];
    }
  }
  return null;
}

/* ─────────────── COMPONENT ─────────────── */

export default function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollBtnRef = useRef<HTMLButtonElement>(null);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const lastPinStateRef = useRef<'TOP' | 'FIXED' | 'BOTTOM' | null>(null);

  // Preload an individual image with hardware decode
  const loadImage = useCallback((index: number): Promise<void> => {
    return new Promise((resolve) => {
      if (imagesRef.current[index]) { resolve(); return; }
      const img = new Image();
      img.src = getFramePath(index);
      img.onload = async () => {
        try {
          if (img.decode) await img.decode();
        } catch {
          // fallback if decode not supported
        }
        imagesRef.current[index] = img;
        resolve();
      };
      img.onerror = () => { resolve(); };
    });
  }, []);

  // Draw specific frame on both ambient background and sharp foreground
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = getClosestLoadedImage(frameIdx, imagesRef.current);
    if (!img) return;

    // 1. Draw warm ambient glow to background canvas (low-res, instant, blurred via CSS)
    if (bgCanvasRef.current) {
      const bgCtx = bgCanvasRef.current.getContext('2d');
      if (bgCtx) {
        bgCtx.drawImage(img, 0, 0, bgCanvasRef.current.width, bgCanvasRef.current.height);
      }
    }

    // 2. Activate luxury gold radial aura for logo outro frames (23 to 34)
    if (auraRef.current) {
      if (frameIdx >= 23) {
        auraRef.current.classList.add('active');
      } else {
        auraRef.current.classList.remove('active');
      }
    }

    // 3. Draw main foreground adaptive frame (100% full cover on desktop)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawAdaptive(ctx, img, canvas.width, canvas.height);
    lastDrawnFrameRef.current = frameIdx;
  }, []);

  // Resize canvas according to device pixel ratio and viewport dimensions
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight - HEADER_HEIGHT;
    if (w <= 0 || h <= 0) return;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    if (bgCanvas) {
      bgCanvas.width = 160;
      bgCanvas.height = 90;
    }

    drawFrame(currentFrameRef.current);
  }, [drawFrame]);

  // Preload all frames immediately in parallel for instant laptop response
  useEffect(() => {
    let cancelled = false;

    async function preloadAll() {
      // 1. Load initial frame and immediately paint to canvas & background
      await loadImage(0);
      if (imagesRef.current[0]) {
        drawFrame(0);
        if (posterRef.current) {
          posterRef.current.style.opacity = '0';
        }
      }

      // 2. Preload all remaining frames in parallel for instant scrub capability
      const promises: Promise<void>[] = [];
      for (let i = 1; i < TOTAL_FRAMES && !cancelled; i++) {
        promises.push(loadImage(i));
      }
      await Promise.all(promises);
    }

    preloadAll();
    return () => { cancelled = true; };
  }, [loadImage, drawFrame]);

  // ── SCROLL-DRIVEN SEQUENCE WITH BULLETPROOF FIXED PINNING ──
  useEffect(() => {
    const container = containerRef.current;
    const section = sectionRef.current;
    if (!container || !section) return;

    const updateOnScroll = () => {
      const heroHeight = window.innerHeight - HEADER_HEIGHT;
      const maxScroll = container.offsetHeight - heroHeight;
      if (maxScroll <= 0) return;

      const rect = container.getBoundingClientRect();
      // Distance user has scrolled into container relative to header line
      const scrolled = HEADER_HEIGHT - rect.top;

      // ── DETERMINISTIC VIEWPORT PINNING ──
      // State 'FIXED': Hero is locked at top: 64px, filling entire viewport. Never scrolls up.
      // State 'BOTTOM': User finished all 35 frames; hero is locked at bottom of container and scrolls away smoothly.
      // State 'TOP': User is at or above start of container.
      let nextState: 'TOP' | 'FIXED' | 'BOTTOM';
      if (scrolled < 0) {
        nextState = 'TOP';
      } else if (scrolled >= maxScroll) {
        nextState = 'BOTTOM';
      } else {
        nextState = 'FIXED';
      }

      if (lastPinStateRef.current !== nextState) {
        lastPinStateRef.current = nextState;
        if (nextState === 'FIXED') {
          section.style.position = 'fixed';
          section.style.top = `${HEADER_HEIGHT}px`;
          section.style.bottom = 'auto';
          section.style.left = '0px';
          section.style.width = '100%';
          section.style.height = `${heroHeight}px`;
        } else if (nextState === 'BOTTOM') {
          section.style.position = 'absolute';
          section.style.top = 'auto';
          section.style.bottom = '0px';
          section.style.left = '0px';
          section.style.width = '100%';
          section.style.height = `${heroHeight}px`;
        } else {
          section.style.position = 'absolute';
          section.style.top = '0px';
          section.style.bottom = 'auto';
          section.style.left = '0px';
          section.style.width = '100%';
          section.style.height = `${heroHeight}px`;
        }
      }

      const progress = Math.min(1, Math.max(0, scrolled / maxScroll));

      // Segmented frame progression:
      // 0.00 to 0.70 -> Frames 0 to 22 (Upload, AI Scan, Guest Matching)
      // 0.70 to 0.85 -> Frames 23 to 34 (Mara Photo outro logo reveal)
      // 0.85 to 1.00 -> Frame 34 (Holds the final brand frame firmly)
      // >= 1.00      -> Hero unpins at bottom and next page section enters cleanly
      let target = 0;
      if (progress >= 0.85) {
        target = TOTAL_FRAMES - 1; // Frame 34 (Final Logo)
      } else if (progress >= 0.70) {
        const outroProgress = (progress - 0.70) / (0.85 - 0.70);
        target = 23 + Math.floor(outroProgress * (TOTAL_FRAMES - 1 - 23));
      } else {
        const demoProgress = progress / 0.70;
        target = Math.floor(demoProgress * 23);
      }
      targetFrameRef.current = Math.min(TOTAL_FRAMES - 1, Math.max(0, target));

      // Update progress bar width directly (0ms overhead, zero React re-renders)
      if (progressBarRef.current) {
        const pct = Math.min(100, Math.max(0, progress * 100));
        progressBarRef.current.style.width = `${pct}%`;
      }

      // Update scroll-down indicator directly
      if (scrollBtnRef.current) {
        if (progress > 0.04) {
          scrollBtnRef.current.style.opacity = '0';
          scrollBtnRef.current.style.pointerEvents = 'none';
        } else {
          scrollBtnRef.current.style.opacity = '1';
          scrollBtnRef.current.style.pointerEvents = 'auto';
        }
      }
    };

    // Responsive 60fps/120fps render loop with snappy desktop response
    const renderLoop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.01) {
        if (Math.abs(diff) < 0.25) {
          currentFrameRef.current = targetFrameRef.current;
        } else {
          currentFrameRef.current += diff * 0.85;
        }

        const rounded = Math.round(currentFrameRef.current);
        const clamped = Math.min(TOTAL_FRAMES - 1, Math.max(0, rounded));

        if (clamped !== lastDrawnFrameRef.current) {
          drawFrame(clamped);
        }
      }
      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    const handleResize = () => {
      lastPinStateRef.current = null;
      resizeCanvas();
      updateOnScroll();
    };

    resizeCanvas();
    updateOnScroll();

    rafIdRef.current = requestAnimationFrame(renderLoop);
    window.addEventListener('scroll', updateOnScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('scroll', updateOnScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [drawFrame, resizeCanvas]);

  const handleSmoothScrollDown = () => {
    const container = containerRef.current;
    if (container) {
      const heroHeight = window.innerHeight - HEADER_HEIGHT;
      const maxScroll = container.offsetHeight - heroHeight;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const targetScroll = containerTop - HEADER_HEIGHT + maxScroll + 50;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      const workflowSection = document.getElementById('workflow');
      if (workflowSection) workflowSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className="hero-scroll-container"
    >
      <section
        ref={sectionRef}
        className="hero-section"
        id="hero"
      >
        {/* Ambient background canvas - paints warm blurred frame colors across 100% of viewport */}
        <canvas
          ref={bgCanvasRef}
          className="hero-ambient-canvas"
          aria-hidden="true"
        />

        {/* Luxury radial gold aura for brand outro frames */}
        <div
          ref={auraRef}
          className="hero-radial-aura"
          aria-hidden="true"
        />

        {/* 0ms initial frame poster fallback before JS canvas paints */}
        <img
          ref={posterRef}
          src={getFramePath(0)}
          alt="Mara Photo Cinematic Hero"
          className="hero-poster"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Dynamic Foreground Canvas with GPU Compositing */}
        <canvas
          ref={canvasRef}
          className="hero-canvas"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            willChange: 'transform',
            transform: 'translateZ(0)',
            touchAction: 'pan-y',
            zIndex: 2,
          }}
        />

        {/* Subtle cinematic vignette */}
        <div className="hero-cinematic-overlay" />

        {/* Luxury Pulsing Scroll Down Indicator */}
        <button
          ref={scrollBtnRef}
          onClick={handleSmoothScrollDown}
          type="button"
          aria-label="Scroll to explore"
          style={{
            transition: 'opacity 0.3s ease',
          }}
          className="flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-1.5 text-white/70 hover:text-white transition-all cursor-pointer group select-none hero-scroll-btn"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5a880] drop-shadow-sm group-hover:tracking-[0.25em] transition-all">
            Scroll to Explore
          </span>
          <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-[#c5a880]/30 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-[#c5a880] transition-all animate-bounce">
            <ChevronDown className="w-4 h-4 text-[#c5a880]" />
          </div>
        </button>

        {/* Clean luxury gold progress bar at bottom of hero section */}
        <div
          ref={progressBarRef}
          className="hero-progress-bar"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #c5a880 0%, #e3d8c8 50%, #f5f2eb 100%)',
            width: '0%',
            zIndex: 10,
            boxShadow: '0 0 12px rgba(197, 168, 128, 0.6)',
          }}
        />
      </section>
    </div>
  );
}
