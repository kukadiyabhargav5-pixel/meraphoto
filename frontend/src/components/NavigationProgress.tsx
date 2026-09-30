'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    const prevPath = prevPathRef.current;

    if (currentPath !== prevPath) {
      // Navigation started
      setLoading(true);
      setProgress(10);
      prevPathRef.current = currentPath;

      // Animate progress quickly to 90%
      let p = 10;
      timerRef.current = setInterval(() => {
        p = Math.min(p + Math.random() * 15, 90);
        setProgress(p);
        if (p >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 80);

      // Complete after a short delay
      const completeTimer = setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 300);
      }, 400);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearTimeout(completeTimer);
      };
    }
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="nav-progress-container">
      <div
        className="nav-progress-bar"
        style={{ width: `${progress}%`, opacity: loading || progress > 0 ? 1 : 0 }}
      />
      <div
        className="nav-progress-glow"
        style={{ left: `calc(${progress}% - 60px)`, opacity: loading ? 1 : 0 }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
