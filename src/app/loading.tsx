'use client';
import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-[#09090b] z-[9999] flex items-center justify-center transition-opacity duration-150">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-[#c5a880]/20 rounded-full"></div>
          <div className="absolute h-16 w-16 border-4 border-transparent border-t-[#c5a880] rounded-full animate-spin"></div>
        </div>
        <p className="text-[#c5a880] text-sm font-bold tracking-[0.2em] uppercase animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
