'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingManager, LoadingState } from '../LoadingManager';

export function useApplicationLoader() {
  const router = useRouter();
  const [state, setState] = useState<LoadingState>(() => LoadingManager.getState());

  useEffect(() => {
    // Register Next.js prefetch capability
    LoadingManager.setRouterPrefetch((href: string) => {
      try {
        router.prefetch(href);
      } catch (e) {
        // Safe fallback
      }
    });

    // Subscribe to state changes
    const unsubscribe = LoadingManager.subscribe((newState) => {
      setState(newState);
    });

    // Initiate loading sequence
    LoadingManager.startLoading();

    return () => {
      unsubscribe();
    };
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
