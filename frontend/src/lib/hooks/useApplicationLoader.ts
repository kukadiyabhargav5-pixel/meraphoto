'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingManager, LoadingState } from '../LoadingManager';

/**
 * Hook that connects to the centralized LoadingManager.
 *
 * On first mount:
 * - If sessionStorage says the app has already been initialized in this tab,
 *   LoadingManager.startLoading() will short-circuit and return applicationReady=true
 *   immediately, so the GlobalLoader never renders.
 *
 * - Otherwise it runs the full 6-phase loading pipeline.
 *
 * Returns the live LoadingState plus a retry() helper.
 */
export function useApplicationLoader() {
  const router = useRouter();
  const [state, setState] = useState<LoadingState>(() => LoadingManager.getState());

  useEffect(() => {
    // Provide Next.js router.prefetch to the LoadingManager
    LoadingManager.setRouterPrefetch((href: string) => {
      try {
        router.prefetch(href);
      } catch {
        // Prefetch failures are non-critical
      }
    });

    // Subscribe to state updates
    const unsubscribe = LoadingManager.subscribe((newState) => {
      setState(newState);
    });

    // Start loading (no-op if already started or session-flagged)
    LoadingManager.startLoading();

    return unsubscribe;
  }, [router]);

  const retry = useCallback(() => {
    LoadingManager.retry();
  }, []);

  return {
    ...state,
    isReady: state.applicationReady,
    retry,
  };
}

export default useApplicationLoader;
