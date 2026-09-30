'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#faf9f6] p-4 overscroll-none select-none">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4">
            <div className="absolute inset-0 rounded-full bg-[#c5a880]/15 blur-md animate-pulse" />
            <Loader2 className="w-10 h-10 sm:w-11 sm:h-11 text-[#c5a880] animate-spin relative z-10 stroke-[2.25]" />
          </div>
          <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-500 font-sans">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
