/**
 * Centralized Loading Manager
 * Manages deterministic, task-weighted, dependency-aware 6-phase application preparation.
 * Zero fake timers. Real task completion tracking.
 */

import { apiClient, setCachedData } from './api';

export type LoadingPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface LoadingState {
  currentPhase: LoadingPhase;
  homeReady: boolean;
  routesReady: boolean;
  authReady: boolean;
  dashboardReady: boolean;
  dashboardDataReady: boolean;
  remainingDataReady: boolean;
  applicationReady: boolean;
  progress: number; // 0 to 100
  status: string;
  error: string | null;
  isCriticalFailed: boolean;
  checklist: {
    homePage: boolean;
    navbar: boolean;
    routes: boolean;
    login: boolean;
    register: boolean;
    auth: boolean;
    dashboard: boolean;
    dashboardData: boolean;
    apis: boolean;
    assets: boolean;
    config: boolean;
    interactive: boolean;
  };
}

type Listener = (state: LoadingState) => void;

class LoadingManagerClass {
  private state: LoadingState = {
    currentPhase: 1,
    homeReady: false,
    routesReady: false,
    authReady: false,
    dashboardReady: false,
    dashboardDataReady: false,
    remainingDataReady: false,
    applicationReady: false,
    progress: 0,
    status: 'Initializing...',
    error: null,
    isCriticalFailed: false,
    checklist: {
      homePage: false,
      navbar: false,
      routes: false,
      login: false,
      register: false,
      auth: false,
      dashboard: false,
      dashboardData: false,
      apis: false,
      assets: false,
      config: false,
      interactive: false,
    },
  };

  private listeners: Set<Listener> = new Set();
  private hasStarted = false;
  private isDone = false;
  private routerPrefetchFn: ((href: string) => Promise<void> | void) | null = null;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('LoadingManager listener error:', e);
      }
    }
  }

  public getState(): LoadingState {
    return this.state;
  }

  public setRouterPrefetch(fn: (href: string) => Promise<void> | void) {
    this.routerPrefetchFn = fn;
  }

  private update(partial: Partial<LoadingState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private setChecklistItem(key: keyof LoadingState['checklist'], value: boolean) {
    this.state.checklist[key] = value;
    this.notify();
  }

  /**
   * Main entry point to run the 6-phase loading pipeline.
   */
  public async startLoading(force = false) {
    if (this.hasStarted && !force) return;
    this.hasStarted = true;
    this.isDone = false;

    // Check if initial load already ran in this browser session
    if (typeof window !== 'undefined' && !force) {
      const alreadyLoaded = sessionStorage.getItem('app_initial_ready') === 'true';
      if (alreadyLoaded) {
        this.completeInstantly();
        return;
      }
    }

    try {
      // ══════════════════════════════════════════════════
      // PHASE 1 → HOME PAGE (Weight: 20%)
      // ══════════════════════════════════════════════════
      this.update({
        currentPhase: 1,
        status: 'Loading Home Page...',
        error: null,
      });

      await this.runPhase1_HomePage();
      this.update({ homeReady: true, progress: 20 });
      this.setChecklistItem('homePage', true);
      this.setChecklistItem('navbar', true);

      // ══════════════════════════════════════════════════
      // PHASE 2 → NAVBAR + ALL ROUTES/PAGES (Weight: 20%)
      // ══════════════════════════════════════════════════
      this.update({
        currentPhase: 2,
        status: 'Preparing Website Pages...',
      });

      await this.runPhase2_Routes();
      this.update({ routesReady: true, progress: 40 });
      this.setChecklistItem('routes', true);

      // ══════════════════════════════════════════════════
      // PHASE 3 → LOGIN + REGISTER + AUTH (Weight: 15%)
      // ══════════════════════════════════════════════════
      this.update({
        currentPhase: 3,
        status: 'Preparing Authentication...',
      });

      const authData = await this.runPhase3_Auth();
      this.update({ authReady: true, progress: 55 });
      this.setChecklistItem('login', true);
      this.setChecklistItem('register', true);
      this.setChecklistItem('auth', true);

      // ══════════════════════════════════════════════════
      // PHASE 4 → DASHBOARD COMPONENTS (Weight: 15%)
      // ══════════════════════════════════════════════════
      this.update({
        currentPhase: 4,
        status: 'Preparing Dashboard...',
      });

      await this.runPhase4_Dashboard();
      this.update({ dashboardReady: true, progress: 70 });
      this.setChecklistItem('dashboard', true);

      // ══════════════════════════════════════════════════
      // PHASE 5 → DASHBOARD DATA (Weight: 15%)
      // ══════════════════════════════════════════════════
      this.update({
        currentPhase: 5,
        status: 'Loading Dashboard Data...',
      });

      await this.runPhase5_DashboardData(authData.isAuthenticated);
      this.update({ dashboardDataReady: true, progress: 85 });
      this.setChecklistItem('dashboardData', true);

      // ══════════════════════════════════════════════════
      // PHASE 6 → ALL REMAINING DATA & RESOURCES (Weight: 10%)
      // ══════════════════════════════════════════════════
      this.update({
        currentPhase: 6,
        status: 'Loading Remaining Data...',
      });

      await this.runPhase6_RemainingData(authData.isAuthenticated);
      this.update({ remainingDataReady: true, progress: 95 });
      this.setChecklistItem('apis', true);
      this.setChecklistItem('assets', true);
      this.setChecklistItem('config', true);

      // ══════════════════════════════════════════════════
      // FINAL READINESS CHECK (Weight: 5% → 100%)
      // ══════════════════════════════════════════════════
      await this.runFinalReadinessCheck();

      this.setChecklistItem('interactive', true);
      this.update({
        currentPhase: 7,
        progress: 100,
        status: 'Application Ready',
        applicationReady: true,
      });

      this.isDone = true;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('app_initial_ready', 'true');
      }

    } catch (err: any) {
      console.error('[LoadingManager] Critical loading failure:', err);
      this.update({
        error: err.message || 'Unable to load required application data.',
        isCriticalFailed: true,
      });
    }
  }

  /**
   * Phase 1: Real Home Page Readiness
   */
  private async runPhase1_HomePage(): Promise<void> {
    const tasks: Promise<any>[] = [];

    // Task 1: DOM readiness
    tasks.push(new Promise<void>((resolve) => {
      if (typeof document === 'undefined') return resolve();
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve();
      } else {
        const onDom = () => {
          window.removeEventListener('DOMContentLoaded', onDom);
          resolve();
        };
        window.addEventListener('DOMContentLoaded', onDom);
      }
    }));

    // Task 2: Fonts readiness
    tasks.push(new Promise<void>((resolve) => {
      if (typeof document !== 'undefined' && 'fonts' in document) {
        document.fonts.ready.then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    }));

    // Task 3: Critical Image Preloading (Logo & Hero)
    tasks.push(new Promise<void>((resolve) => {
      if (typeof window === 'undefined') return resolve();
      const imagesToPreload = ['/logo.png', '/favicon.ico'];
      let loaded = 0;
      if (imagesToPreload.length === 0) return resolve();
      
      const timer = setTimeout(() => resolve(), 1500); // 1.5s max wait fallback

      imagesToPreload.forEach((src) => {
        const img = new Image();
        img.src = src;
        img.onload = img.onerror = () => {
          loaded++;
          if (loaded >= imagesToPreload.length) {
            clearTimeout(timer);
            resolve();
          }
        };
      });
    }));

    // Wait for all Phase 1 tasks in parallel
    await Promise.all(tasks);
  }

  /**
   * Phase 2: Next.js Route Prefetching & Preparation
   */
  private async runPhase2_Routes(): Promise<void> {
    const routesToPrefetch = [
      '/',
      '/about',
      '/contact',
      '/pricing',
      '/features/manage-event',
      '/features/event-qr-code-gallery',
      '/features/event-face-recognition',
      '/features/invoice-generator',
      '/features/photographer-portfolio',
      '/features/wedding-website-template',
      '/use-cases/wedding-photography',
      '/use-cases/event-photography',
      '/use-cases/parties-photography',
    ];

    if (!this.routerPrefetchFn) return;

    // Prefetch routes in small concurrent batches
    const batchSize = 4;
    for (let i = 0; i < routesToPrefetch.length; i += batchSize) {
      const batch = routesToPrefetch.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (route) => {
          try {
            await this.routerPrefetchFn!(route);
          } catch {
            // Non-critical: route prefetch failure is harmless
          }
        })
      );
    }
  }

  /**
   * Phase 3: Login, Register, & Authentication Check
   */
  private async runPhase3_Auth(): Promise<{ isAuthenticated: boolean; user: any }> {
    // Prefetch login and register routes
    if (this.routerPrefetchFn) {
      try {
        await Promise.all([
          this.routerPrefetchFn('/login'),
          this.routerPrefetchFn('/signup'),
          this.routerPrefetchFn('/auth/login'),
        ]);
      } catch {
        // Non-critical
      }
    }

    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null };
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.user) {
        if (res.data.studio) {
          setCachedData('/studio/me', undefined, { studio: res.data.studio }, 300000);
        }
        return { isAuthenticated: true, user: res.data.user };
      }
    } catch (e: any) {
      // Invalid/expired token: clear safely
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    return { isAuthenticated: false, user: null };
  }

  /**
   * Phase 4: Preload Dashboard Components & Subroutes
   */
  private async runPhase4_Dashboard(): Promise<void> {
    if (!this.routerPrefetchFn) return;

    const dashboardRoutes = [
      '/dashboard',
      '/dashboard/events',
      '/dashboard/create-event',
      '/dashboard/customers',
      '/dashboard/team',
      '/dashboard/quotation',
      '/dashboard/bill',
      '/dashboard/profile',
      '/dashboard/plans-billing',
      '/dashboard/gallery-visitors',
      '/dashboard/portfolios',
    ];

    const batchSize = 4;
    for (let i = 0; i < dashboardRoutes.length; i += batchSize) {
      const batch = dashboardRoutes.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (route) => {
          try {
            await this.routerPrefetchFn!(route);
          } catch {
            // Non-critical
          }
        })
      );
    }
  }

  /**
   * Phase 5: Parallel Dashboard Critical Data Loading
   */
  private async runPhase5_DashboardData(isAuthenticated: boolean): Promise<void> {
    if (!isAuthenticated) {
      // Guest users don't have dashboard data to fetch
      return;
    }

    // Parallel fetch independent critical dashboard APIs
    const tasks = [
      apiClient.get('/studio/me').catch(err => ({ error: true, message: err.message })),
      apiClient.get('/studio/credits').catch(err => ({ error: true, message: err.message })),
      apiClient.get('/dashboard/stats').catch(err => ({ error: true, message: err.message })),
    ];

    await Promise.allSettled(tasks);
  }

  /**
   * Phase 6: Remaining Paginated Data & Resources Preload
   */
  private async runPhase6_RemainingData(isAuthenticated: boolean): Promise<void> {
    if (!isAuthenticated) {
      return;
    }

    // Preload first page of events & customers (small limit of 10)
    const backgroundTasks = [
      apiClient.get('/dashboard/customers').catch(() => null),
      apiClient.get('/dashboard/team').catch(() => null),
    ];

    await Promise.allSettled(backgroundTasks);
  }

  /**
   * Final Checklist & Readiness Verification
   */
  private async runFinalReadinessCheck(): Promise<void> {
    // Confirm document is responsive and interactive
    await new Promise<void>((resolve) => {
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private completeInstantly() {
    this.update({
      currentPhase: 7,
      homeReady: true,
      routesReady: true,
      authReady: true,
      dashboardReady: true,
      dashboardDataReady: true,
      remainingDataReady: true,
      applicationReady: true,
      progress: 100,
      status: 'Application Ready',
      error: null,
      isCriticalFailed: false,
    });
    this.isDone = true;
  }

  public retry() {
    this.hasStarted = false;
    this.startLoading(true);
  }
}

export const LoadingManager = new LoadingManagerClass();
export default LoadingManager;
