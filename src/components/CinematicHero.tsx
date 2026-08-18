'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

/* ─────────────── CONFIGURATION ─────────────── */

const FRAME_PREFIX = '/frames/frame_';
const FRAME_EXT = '.png';
const TOTAL_FRAMES = 240;
const PRELOAD_BATCH_INITIAL = 240; // Preload all frames for 100% completion before hiding loader
const PRELOAD_BATCH_SIZE = 25;
const PRELOAD_BATCH_DELAY = 100; // ms between batches

// Scroll indicator threshold
const INDICATOR_HIDE_AT = 0.03;

/* ─────────────── HELPERS ─────────────── */

function getFramePath(index: number): string {
  const num = String(index + 1).padStart(6, '0');
  return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
}

/** Draw image onto canvas with cover-fit behavior */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;

  let sx = 0, sy = 0, sw = iw, sh = ih;

  if (imgRatio > canvasRatio) {
    // Image wider than canvas — crop sides
    sw = ih * canvasRatio;
    sx = (iw - sw) / 2;
  } else {
    // Image taller than canvas — crop top/bottom
    sh = iw / canvasRatio;
    sy = (ih - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

/* ─────────────── COMPONENT ─────────────── */

export default function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);

  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollHeightPx, setScrollHeightPx] = useState(8000); // Default fallback
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Preload images
  const loadImage = useCallback((index: number): Promise<void> => {
    return new Promise((resolve) => {
      if (imagesRef.current[index]) {
        resolve();
        return;
      }
      const img = new Image();
      img.src = getFramePath(index);
      img.onload = () => {
        imagesRef.current[index] = img;
        resolve();
      };
      img.onerror = () => {
        // Still resolve to avoid blocking — will just skip this frame
        resolve();
      };
    });
  }, []);

  // Progressive preloading
  useEffect(() => {
    let cancelled = false;

    async function preloadAll() {
      // Batch 1: Load first N frames immediately
      const initialPromises: Promise<void>[] = [];
      const initialBatchSize = Math.min(PRELOAD_BATCH_INITIAL, TOTAL_FRAMES);
      let initialLoadedCount = 0;
      
      for (let i = 0; i < initialBatchSize; i++) {
        initialPromises.push(
          loadImage(i).then(() => {
            initialLoadedCount++;
            setLoadingProgress(Math.floor((initialLoadedCount / initialBatchSize) * 100));
          })
        );
      }
      await Promise.all(initialPromises);

      if (cancelled) return;
      setIsLoaded(true);

      // Batch 2+: Load remaining frames progressively
      let loaded = PRELOAD_BATCH_INITIAL;
      while (loaded < TOTAL_FRAMES && !cancelled) {
        const batchEnd = Math.min(loaded + PRELOAD_BATCH_SIZE, TOTAL_FRAMES);
        const batchPromises: Promise<void>[] = [];
        for (let i = loaded; i < batchEnd; i++) {
          batchPromises.push(loadImage(i));
        }
        await Promise.all(batchPromises);
        loaded = batchEnd;

        // Small delay between batches to avoid overwhelming the browser
        if (loaded < TOTAL_FRAMES) {
          await new Promise(r => setTimeout(r, PRELOAD_BATCH_DELAY));
        }
      }
    }

    preloadAll();

    return () => {
      cancelled = true;
    };
  }, [loadImage]);

  // Canvas resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const container = containerRef.current;
      const sticky = container?.querySelector('.hero-sticky') || container;
      if (!canvas || !sticky) return;
      const dpr = Math.max(2, window.devicePixelRatio || 1); // minimum 2x for crisp rendering
      
      const w = sticky.clientWidth;
      const h = sticky.clientHeight;
      
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // We don't set inline style width/height so CSS 100% takes over, avoiding gap issues.
      
      // Calculate responsive scroll height in pixels (avoids vh jumping on mobile)
      const isMobile = window.innerWidth < 768;
      // 7% of screen height per frame on mobile (fast scroll), 12% on desktop
      const pxPerFrame = isMobile ? window.innerHeight * 0.07 : window.innerHeight * 0.12;
      setScrollHeightPx(TOTAL_FRAMES * pxPerFrame);

      // Force redraw on resize
      lastDrawnFrameRef.current = -1;
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Scroll-driven render loop
  useEffect(() => {
    if (!isLoaded) return;

    function tick() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Calculate scroll progress within the hero container
      const rect = container.getBoundingClientRect();
      const scrollableHeight = container.offsetHeight - window.innerHeight;

      let progress = 0;
      if (scrollableHeight > 0) {
        progress = Math.max(0, Math.min(1, -rect.top / scrollableHeight));
      }

      // Map progress to frame index
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(progress * TOTAL_FRAMES))
      );

      currentFrameRef.current = frameIndex;
      setScrollProgress(progress);

      // Only redraw if frame changed
      if (frameIndex !== lastDrawnFrameRef.current) {
        const img = imagesRef.current[frameIndex];
        if (img) {
          const cw = canvas.width;
          const ch = canvas.height;
          ctx.clearRect(0, 0, cw, ch);
          drawCover(ctx, img, cw, ch);
          lastDrawnFrameRef.current = frameIndex;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isLoaded]);

  // Draw first frame once loaded
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imagesRef.current[0];
    if (img) {
      drawCover(ctx, img, canvas.width, canvas.height);
      lastDrawnFrameRef.current = 0;
    }
  }, [isLoaded]);

  // Compute visibility
  const indicatorHidden = scrollProgress > INDICATOR_HIDE_AT;

  // Subtle cinematic scale (1.02 → 1.00 over sequence)
  const scale = 1.02 - 0.02 * scrollProgress;

  return (
    <div
      ref={containerRef}
      className="hero-scroll-container"
      style={{ height: `${scrollHeightPx}px` }}
    >
      <div className="hero-sticky">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="hero-canvas"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        />

        {/* Cinematic Overlay */}
        <div className="hero-cinematic-overlay" />

        {/* Loading Overlay */}
        <div className={`hero-loading-overlay ${isLoaded ? 'hero-loading-done' : ''}`}>
          <div className="hero-loading-spinner" />
          <span className="hero-loading-text">Loading Experience... {loadingProgress}%</span>
        </div>

        {/* Intro Text Overlay */}
        <div className={`hero-text-intro ${scrollProgress > 0.05 ? 'hero-text-hidden' : ''}`}>
          <h1 className="hero-intro-headline">
            Crafting Timeless<br /><em>Memories</em>
          </h1>
          <p className="hero-intro-sub">Exquisite Wedding Photography</p>
          <button 
            className="hero-intro-cta" 
            onClick={() => window.scrollTo({ top: window.innerHeight * 1.5, behavior: 'smooth' })}
          >
            View Portfolio
            <ChevronDown />
          </button>
        </div>

        {/* Final Text Overlay */}
        <div className={`hero-text-final ${scrollProgress > 0.95 ? 'hero-text-visible' : ''}`}>
          <span className="hero-final-brand">Mara Photo</span>
          <h2 className="hero-final-headline">Your Story,<br /><em>Beautifully Told</em>.</h2>
          <p className="hero-final-sub">Book your experience today.</p>
          <a href="/pricing" className="hero-final-cta">
            Get Started
            <ChevronDown />
          </a>
        </div>



        {/* Scroll Indicator */}
        <div className={`hero-scroll-indicator ${indicatorHidden ? 'hero-indicator-hidden' : ''}`}>
          <span className="hero-scroll-indicator-text">Scroll to Explore</span>
          <ChevronDown className="hero-scroll-indicator-arrow" />
        </div>



        {/* Progress Bar */}
        <div
          className="hero-progress-bar"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
