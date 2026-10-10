'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/profile');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f7f4] text-slate-600 text-sm font-bold">
      Redirecting to unified Profile & Studio Settings...
    </div>
  );
}
