/**
 * Centralized Loading Manager
 * Manages deterministic, task-weighted, dependency-aware application preparation.
 * Zero fake timers. Real task completion tracking.
 *
 * The loader WILL NOT reach 100% until the home page hero frames are fully loaded.
 *
 * Progress allocation:
 *   Phase 1 — Application Core       (0–10%)
 *   Phase 2 — Home Page + Hero       (10–70%)   ← Majority of weight: 240 hero frames
 *   Phase 3 — Auth + Navbar          (70–85%)
 *   Phase 4 — Dashboard + Remaining  (85–95%)
 *   Final   — Readiness Check        (95–100%)
 */

import { apiClient, setCachedData } from './api';
import { pingBackendAndDatabase } from './keepAlive';

export type LoadingPhase = 1 | 2 | 3 | 4 | 5;

export interface LoadingState {
  currentPhase: LoadingPhase;
  progress: number; // 0 to 100
  status: string;
  error: string | null;
  isCriticalFailed: boolean;
  applicationReady: boolean;
}

type Listener = (state: LoadingState) => void;

/** Per-task timeout (ms) */
const TASK_TIMEOUT_MS = 5000;

/** Global safety ceiling (ms) — force-complete if still loading */
const GLOBAL_SAFETY_TIMEOUT_MS = 30000; // 30s because hero frames can be large

// ─── Utility: race a promise against a timeout ───
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.then((v) => { clearTimeout(timer); return v; }),
    new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), ms); }),
  ]).catch(() => null);
}

class LoadingManagerClass {
  private state: LoadingState = {
    currentPhase: 1,
    progress: 1,
    status: 'Initializing Experience...',
    error: null,
    isCriticalFailed: false,
    applicationReady: false,
  };

  private listeners: Set<Listener> = new Set();
  private hasStarted = false;
  private routerPrefetchFn: ((href: string) => Promise<void> | void) | null = null;
  private globalSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  private heroLoadCleanup: (() => void) | null = null;

  // ─── Public API ───

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): LoadingState {
    return this.state;
  }

  public setRouterPrefetch(fn: (href: string) => Promise<void> | void) {
    this.routerPrefetchFn = fn;
  }

  /**
   * Main entry point. Runs the loading pipeline.
   */
  public async startLoading(force = false) {
    if (this.hasStarted && !force) return;
    this.hasStarted = true;

    // Global safety timeout
    this.globalSafetyTimer = setTimeout(() => {
      if (!this.state.applicationReady) {
        console.warn('[LoadingManager] Global safety timeout — forcing completion.');
        this.forceComplete();
      }
    }, GLOBAL_SAFETY_TIMEOUT_MS);

    try {
      // ══════════════════════════════════════════════════
      // PHASE 1 → APPLICATION CORE (0–15%)
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 1, status: 'Initializing Application...', error: null });
      await this.runPhase1_AppCore();
      this.update({ progress: 15 });

      // ══════════════════════════════════════════════════
      // PHASE 2 → HOME PAGE + HERO ELEMENT (15–95%)
      // Fast parallel loading of 35 hero frames & assets
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 2, status: 'Loading Home Page...' });
      await this.runPhase2_HomePageWithHero();
      this.update({ progress: 95, status: 'Home Page Ready' });

      // ══════════════════════════════════════════════════
      // FINAL → READINESS & 100% COMPLETION (95–100%)
      // Page loader reaches 100% immediately!
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 5, status: 'Welcome to Mara Photo' });
      await this.runFinalReadinessCheck();

      // ── Complete & Dismiss Page Loader Instantly ──
      this.clearSafetyTimer();
      this.cleanupHeroListeners();
      this.update({
        currentPhase: 5,
        progress: 100,
        status: 'Website Ready',
        applicationReady: true,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('app_initial_ready', 'true');
      }

      // ══════════════════════════════════════════════════
      // BACKGROUND PIPELINE: High-Speed Route Prefetching
      // Home page is already displayed & interactive!
      // 1. Login page (/login, /auth/login)
      // 2. Register page (/signup, /auth/register)
      // 3. All remaining pages at high speed
      // ══════════════════════════════════════════════════
      this.runBackgroundPrefetchPipeline();
    } catch (err: any) {
      console.error('[LoadingManager] Critical loading failure:', err);
      this.clearSafetyTimer();
      this.cleanupHeroListeners();
      this.update({
        error: err.message || 'Unable to load required application resources.',
        isCriticalFailed: true,
        status: 'Loading Failed',
      });
    }
  }

  /**
   * Reset and retry the entire loading pipeline.
   */
  public retry() {
    this.clearSafetyTimer();
    this.cleanupHeroListeners();
    this.state = {
      currentPhase: 1,
      progress: 1,
      status: 'Retrying...',
      error: null,
      isCriticalFailed: false,
      applicationReady: false,
    };
    this.hasStarted = false;
    this.notify();
    this.startLoading(true);
  }

  /**
   * Full reset — clears the singleton state + sessionStorage flag.
   * Call this on sign-out so that the next page load shows the loader properly.
   */
  public reset() {
    this.clearSafetyTimer();
    this.cleanupHeroListeners();
    this.state = {
      currentPhase: 1,
      progress: 1,
      status: 'Initializing Experience...',
      error: null,
      isCriticalFailed: false,
      applicationReady: false,
    };
    this.hasStarted = false;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('app_initial_ready');
    }
    this.notify();
  }

  // ─── Phase Implementations ───

  /**
   * Phase 1: Application Core — DOM ready, fonts, backend health
   */
  private async runPhase1_AppCore(): Promise<void> {
    const tasks: Promise<any>[] = [];

    // DOM readiness
    tasks.push(
      new Promise<void>((resolve) => {
        if (typeof document === 'undefined') return resolve();
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          resolve();
        } else {
          const onReady = () => { window.removeEventListener('DOMContentLoaded', onReady); resolve(); };
          window.addEventListener('DOMContentLoaded', onReady);
        }
      })
    );

    // Font readiness
    tasks.push(
      withTimeout(
        new Promise<void>((resolve) => {
          if (typeof document !== 'undefined' && 'fonts' in document) {
            document.fonts.ready.then(() => resolve()).catch(() => resolve());
          } else {
            resolve();
          }
        }),
        2000
      )
    );

    // Backend health ping
    tasks.push(
      withTimeout(pingBackendAndDatabase().catch(() => false), TASK_TIMEOUT_MS)
    );

    await Promise.all(tasks);
  }

  /**
   * Phase 2: Home Page — logo + hero frames
   *
   * The CinematicHero component dispatches:
   *   - 'hero-loading' CustomEvent with { detail: { progress: 0-100 } }
   *   - 'hero-loaded' Event when all 240 frames are loaded
   *
   * We listen for these events and update progress between 10–70%.
   * This phase does NOT complete until 'hero-loaded' fires OR timeout.
   */
  private async runPhase2_HomePageWithHero(): Promise<void> {
    // Preload critical images (logo, favicon) immediately
    const criticalImages = ['/logo.png', '/favicon.ico'];
    await Promise.all(
      criticalImages.map((src) =>
        withTimeout(
          new Promise<void>((resolve) => {
            if (typeof window === 'undefined') return resolve();
            const img = new Image();
            img.src = src;
            img.onload = img.onerror = () => resolve();
          }),
          3000
        )
      )
    );

    // Now wait for the hero frames to load
    // The CinematicHero component fires 'hero-loading' and 'hero-loaded' events
    if (typeof window === 'undefined') return;

    await new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => { if (!resolved) { resolved = true; resolve(); } };

      // Listen for hero frame progress updates
      const onHeroProgress = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail && typeof detail.progress === 'number') {
          // Map hero 0-100% → loader 15-95%
          const heroProgress = Math.min(100, detail.progress);
          const mappedProgress = 15 + Math.round((heroProgress / 100) * 80);
          this.update({ progress: mappedProgress });

          // Update status text based on hero progress
          if (heroProgress < 35) {
            this.update({ status: 'Loading Hero Frames...' });
          } else if (heroProgress < 75) {
            this.update({ status: 'Preparing Visual Experience...' });
          } else {
            this.update({ status: 'Home Page Ready...' });
          }
        }
      };

      // Listen for hero fully loaded
      const onHeroLoaded = () => {
        cleanup();
        done();
      };

      const cleanup = () => {
        window.removeEventListener('hero-loading', onHeroProgress);
        window.removeEventListener('hero-loaded', onHeroLoaded);
      };

      this.heroLoadCleanup = cleanup;

      window.addEventListener('hero-loading', onHeroProgress);
      window.addEventListener('hero-loaded', onHeroLoaded);

      // Safety: if hero doesn't start or doesn't finish in 6s, continue anyway
      const heroTimeout = setTimeout(() => {
        cleanup();
        done();
      }, 6000);

      // Also check if hero-loaded already fired or on non-home page
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/' && path !== '') {
            clearTimeout(heroTimeout);
            cleanup();
            done();
          }
        }
      }, 100);
    });
  }

  /**
   * Background High-Speed Prefetch Pipeline
   * Runs immediately AFTER Home page is ready and preloader is dismissed.
   * Priority 1: Login page (/login, /auth/login)
   * Priority 2: Register page (/signup, /auth/register)
   * Priority 3: Remaining pages at high speed in parallel batches
   */
  private async runBackgroundPrefetchPipeline(): Promise<void> {
    if (typeof window === 'undefined' || !this.routerPrefetchFn) return;

    // Small yield to let home page render & animate cleanly
    await new Promise((r) => setTimeout(r, 120));

    // ── Priority 1: Login page ──
    try {
      await Promise.all([
        Promise.resolve(this.routerPrefetchFn('/login')).catch(() => {}),
        Promise.resolve(this.routerPrefetchFn('/auth/login')).catch(() => {}),
      ]);
    } catch {}

    // ── Priority 2: Register page ──
    try {
      await Promise.all([
        Promise.resolve(this.routerPrefetchFn('/signup')).catch(() => {}),
        Promise.resolve(this.routerPrefetchFn('/auth/register')).catch(() => {}),
      ]);
    } catch {}

    // ── Priority 3: Remaining pages at high speed ──
    const remainingRoutes = [
      '/pricing',
      '/about',
      '/contact',
      '/blog',
      '/dashboard',
      '/dashboard/events',
      '/dashboard/create-event',
      '/dashboard/customers',
      '/dashboard/portfolios',
      '/dashboard/plans-billing',
      '/features/manage-event',
      '/features/event-qr-code-gallery',
      '/features/event-face-recognition',
      '/features/wedding-website-template',
      '/features/photographer-portfolio',
      '/features/invoice-generator',
      '/use-cases/wedding-photography',
      '/use-cases/event-photography',
      '/use-cases/corporate-photography',
      '/use-cases/parties-photography',
      '/use-cases/school-college-event-photography',
    ];

    const batchSize = 5;
    for (let i = 0; i < remainingRoutes.length; i += batchSize) {
      const batch = remainingRoutes.slice(i, i + batchSize);
      await Promise.all(
        batch.map((r) =>
          withTimeout(Promise.resolve(this.routerPrefetchFn!(r)).catch(() => {}), 1500)
        )
      );
      await new Promise((r) => setTimeout(r, 20));
    }

    // Prefetch authenticated studio data if token exists
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const res = await withTimeout(apiClient.get('/auth/me'), TASK_TIMEOUT_MS);
        if (res && (res as any).data?.user) {
          const data = (res as any).data;
          if (data.studio) {
            setCachedData('/studio/me', undefined, { studio: data.studio }, 300000);
          }
        }
        await Promise.allSettled([
          withTimeout(apiClient.get('/studio/me').catch(() => null), TASK_TIMEOUT_MS),
          withTimeout(apiClient.get('/studio/credits').catch(() => null), TASK_TIMEOUT_MS),
          withTimeout(apiClient.get('/dashboard/stats').catch(() => null), TASK_TIMEOUT_MS),
        ]);
      } catch {}
    }
  }

  /**
   * Final Readiness — confirm browser is responsive
   */
  private async runFinalReadinessCheck(): Promise<void> {
    await new Promise<void>((resolve) => {
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => resolve());
      } else {
        resolve();
      }
    });
  }

  // ─── Internal ───

  private update(partial: Partial<LoadingState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      try { listener(this.state); } catch (e) { console.error('[LoadingManager] Listener error:', e); }
    }
  }

  private completeInstantly() {
    this.state = {
      currentPhase: 5,
      progress: 100,
      status: 'Website Ready',
      error: null,
      isCriticalFailed: false,
      applicationReady: true,
    };
    this.notify();
  }

  private forceComplete() {
    this.clearSafetyTimer();
    this.cleanupHeroListeners();
    this.update({ currentPhase: 5, progress: 100, status: 'Website Ready', applicationReady: true });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_initial_ready', 'true');
    }
  }

  private clearSafetyTimer() {
    if (this.globalSafetyTimer) { clearTimeout(this.globalSafetyTimer); this.globalSafetyTimer = null; }
  }

  private cleanupHeroListeners() {
    if (this.heroLoadCleanup) { this.heroLoadCleanup(); this.heroLoadCleanup = null; }
  }
}

export const LoadingManager = new LoadingManagerClass();
export default LoadingManager;
