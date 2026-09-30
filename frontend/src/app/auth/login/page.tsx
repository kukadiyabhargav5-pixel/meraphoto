'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      router.replace('/signup');
    } else {
      router.replace('/login');
    }
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf9f6' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e3d8c8', borderTopColor: '#c5a880', borderRadius: '50%', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>Redirecting...</p>
      </div>
    </div>
  );
}

export default function AuthLoginRedirect() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf9f6' }}>
        <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>Loading...</p>
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
}
