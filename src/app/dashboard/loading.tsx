'use client';
import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="flex-1 bg-white p-8 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-[#c5a880]/30 border-t-[#c5a880] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
