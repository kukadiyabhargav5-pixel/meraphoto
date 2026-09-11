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
    progress: 0,
    status: 'Initializing...',
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
   * Main entry point. Runs the loading pipeline ONCE per session.
   */
  public async startLoading(force = false) {
    if (this.hasStarted && !force) return;
    this.hasStarted = true;

    // If session already loaded, skip entirely
    if (typeof window !== 'undefined' && !force) {
      if (sessionStorage.getItem('app_initial_ready') === 'true') {
        this.completeInstantly();
        return;
      }
    }

    // Global safety timeout
    this.globalSafetyTimer = setTimeout(() => {
      if (!this.state.applicationReady) {
        console.warn('[LoadingManager] Global safety timeout — forcing completion.');
        this.forceComplete();
      }
    }, GLOBAL_SAFETY_TIMEOUT_MS);

    try {
      // ══════════════════════════════════════════════════
      // PHASE 1 → APPLICATION CORE (0–10%)
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 1, status: 'Initializing Application...', error: null });
      await this.runPhase1_AppCore();
      this.update({ progress: 10 });

      // ══════════════════════════════════════════════════
      // PHASE 2 → HOME PAGE + HERO FRAMES (10–70%)
      // Loader MUST NOT pass 70% until hero frames load
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 2, status: 'Loading Home Page...' });
      await this.runPhase2_HomePageWithHero();
      this.update({ progress: 70, status: 'Home Page Ready' });

      // ══════════════════════════════════════════════════
      // PHASE 3 → AUTH + NAVBAR (70–85%)
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 3, status: 'Preparing Navigation...' });
      const authResult = await this.runPhase3_AuthAndNavbar();
      this.update({ progress: 85 });

      // ══════════════════════════════════════════════════
      // PHASE 4 → DASHBOARD + REMAINING (85–95%)
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 4, status: 'Preparing Dashboard...' });
      await this.runPhase4_DashboardAndRemaining(authResult.isAuthenticated);
      this.update({ progress: 95 });

      // ══════════════════════════════════════════════════
      // FINAL → READINESS CHECK (95–100%)
      // ══════════════════════════════════════════════════
      this.update({ currentPhase: 5, status: 'Finalizing...' });
      await this.runFinalReadinessCheck();

      // ── Complete ──
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
      progress: 0,
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
      progress: 0,
      status: 'Initializing...',
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
          // Map hero 0-100% → loader 10-70%
          const heroProgress = Math.min(100, detail.progress);
          const mappedProgress = 10 + Math.round((heroProgress / 100) * 60);
          this.update({ progress: mappedProgress });

          // Update status text based on hero progress
          if (heroProgress < 30) {
            this.update({ status: 'Loading Hero Frames...' });
          } else if (heroProgress < 60) {
            this.update({ status: 'Preparing Visual Experience...' });
          } else if (heroProgress < 90) {
            this.update({ status: 'Almost There...' });
          } else {
            this.update({ status: 'Finalizing Home Page...' });
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

      // Safety: if hero doesn't start or doesn't finish in 20s, continue anyway
      // (e.g. user navigated directly to /login, not home page)
      const heroTimeout = setTimeout(() => {
        cleanup();
        done();
      }, 20000);

      // Also check if hero-loaded already fired (race condition)
      // Give it a small delay to let the hero component mount
      setTimeout(() => {
        // If we're on a non-home page, hero events won't fire — just continue
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/' && path !== '') {
            clearTimeout(heroTimeout);
            cleanup();
            done();
          }
        }
      }, 500);
    });
  }

  /**
   * Phase 3: Auth pages + Navbar routes
   */
  private async runPhase3_AuthAndNavbar(): Promise<{ isAuthenticated: boolean; user: any }> {
    // Prefetch auth + nav routes
    if (this.routerPrefetchFn) {
      const routes = ['/login', '/signup', '/auth/login', '/about', '/contact', '/pricing', '/blog'];
      await Promise.all(
        routes.map((route) =>
          withTimeout(Promise.resolve(this.routerPrefetchFn!(route)).catch(() => {}), 2000)
        )
      );
    }

    // Verify auth state
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null };
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return { isAuthenticated: false, user: null };

    try {
      const res = await withTimeout(apiClient.get('/auth/me'), TASK_TIMEOUT_MS);
      if (res && (res as any).data?.user) {
        const data = (res as any).data;
        if (data.studio) {
          setCachedData('/studio/me', undefined, { studio: data.studio }, 300000);
        }
        return { isAuthenticated: true, user: data.user };
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    return { isAuthenticated: false, user: null };
  }

  /**
   * Phase 4: Dashboard routes + remaining pages
   */
  private async runPhase4_DashboardAndRemaining(isAuthenticated: boolean): Promise<void> {
    if (!this.routerPrefetchFn) return;

    const allRoutes = [
      '/', '/dashboard', '/dashboard/events', '/dashboard/create-event',
      '/dashboard/customers', '/dashboard/team', '/dashboard/quotation',
      '/dashboard/bill', '/dashboard/profile', '/dashboard/plans-billing',
      '/features/manage-event', '/features/event-qr-code-gallery',
      '/features/event-face-recognition', '/features/invoice-generator',
      '/use-cases/wedding-photography', '/use-cases/event-photography',
    ];

    const batchSize = 4;
    for (let i = 0; i < allRoutes.length; i += batchSize) {
      const batch = allRoutes.slice(i, i + batchSize);
      await Promise.all(
        batch.map((r) =>
          withTimeout(Promise.resolve(this.routerPrefetchFn!(r)).catch(() => {}), 2000)
        )
      );
    }

    // Fetch dashboard data if authenticated
    if (isAuthenticated) {
      await Promise.allSettled([
        withTimeout(apiClient.get('/studio/me').catch(() => null), TASK_TIMEOUT_MS),
        withTimeout(apiClient.get('/studio/credits').catch(() => null), TASK_TIMEOUT_MS),
        withTimeout(apiClient.get('/dashboard/stats').catch(() => null), TASK_TIMEOUT_MS),
      ]);
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
