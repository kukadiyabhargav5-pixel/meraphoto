'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

/* ─────────────── CONFIGURATION ─────────────── */

const FRAME_PREFIX = '/frames/frame_';
const FRAME_EXT = '.png';
const TOTAL_FRAMES = 240;
const HEADER_HEIGHT = 80;

/* ─────────────── HELPERS ─────────────── */

function getFramePath(index: number): string {
  const num = String(index + 1).padStart(6, '0');
  return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
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

/* ─────────────── COMPONENT ─────────────── */

export default function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const rafRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);

  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(8000);

  // Calculate scroll height
  useEffect(() => {
    function calcHeight() {
      const isMobile = window.innerWidth < 768;
      const pxPerFrame = isMobile ? window.innerHeight * 0.07 : window.innerHeight * 0.12;
      setScrollHeight(TOTAL_FRAMES * pxPerFrame);
    }
    calcHeight();
    window.addEventListener('resize', calcHeight);
    return () => window.removeEventListener('resize', calcHeight);
  }, []);

  // Preload images
  const loadImage = useCallback((index: number): Promise<void> => {
    return new Promise((resolve) => {
      if (imagesRef.current[index]) { resolve(); return; }
      const img = new Image();
      img.src = getFramePath(index);
      img.onload = () => { imagesRef.current[index] = img; resolve(); };
      img.onerror = () => { resolve(); };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    window.dispatchEvent(new Event('hero-start'));

    async function preloadAll() {
      let loadedCount = 0;
      const BATCH = 20;
      for (let start = 0; start < TOTAL_FRAMES && !cancelled; start += BATCH) {
        const end = Math.min(start + BATCH, TOTAL_FRAMES);
        const promises: Promise<void>[] = [];
        for (let i = start; i < end; i++) {
          promises.push(
            loadImage(i).then(() => {
              loadedCount++;
              const prog = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
              window.dispatchEvent(new CustomEvent('hero-loading', { detail: { progress: prog } }));
            })
          );
        }
        await Promise.all(promises);
        if (start + BATCH < TOTAL_FRAMES) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      if (cancelled) return;
      setIsLoaded(true);
      window.dispatchEvent(new Event('hero-loaded'));
    }

    preloadAll();
    return () => { cancelled = true; };
  }, [loadImage]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function resize() {
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight - HEADER_HEIGHT;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
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

      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollableDistance = containerHeight - viewportHeight + HEADER_HEIGHT;

      let progress = 0;
      if (scrollableDistance > 0) {
        progress = Math.max(0, Math.min(1, -(rect.top - HEADER_HEIGHT) / scrollableDistance));
      }

      setScrollProgress(progress);

      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(progress * TOTAL_FRAMES))
      );

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
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isLoaded]);

  // Draw first frame
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

  const indicatorHidden = scrollProgress > 0.03;
  const scale = 1.02 - 0.02 * scrollProgress;

  return (
    <>
      {/* ── Fixed viewport: ALWAYS rendered, sits behind page content ── */}
      <div
        style={{
          position: 'fixed',
          top: HEADER_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: '#09090b',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'block',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
        <div className="hero-cinematic-overlay" />

        {/* Intro Text */}
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

        {/* Final Text */}
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
        <div className="hero-progress-bar" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      {/* ── Invisible scroll spacer — drives the animation ── */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: scrollHeight,
          background: 'transparent',
          zIndex: 1,
        }}
      />
    </>
  );
}
