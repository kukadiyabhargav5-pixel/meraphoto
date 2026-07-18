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
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#faf9f6',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 40, height: 40, color: '#c5a880', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: '#64748b' }}>Loading...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
