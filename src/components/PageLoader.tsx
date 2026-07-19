'use client';

import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Elegant, smooth progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8;
        if (next >= 95) return 95;
        return next;
      });
    }, 150);

    // Fade out sequence
    const fadeTimer = setTimeout(() => {
      setProgress(100);
      setFadeOut(true);
    }, 2000); // Shorter, snappier loading time (2 seconds)
    
    const hideTimer = setTimeout(() => setVisible(false), 2600);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(to bottom, #09090b, #111116)' // Extremely clean, dark background
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes subtle-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes fill-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />

      {/* Subtle Background Glow centered on logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#c5a880] rounded-full blur-[150px] opacity-[0.05] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center gap-8" style={{ animation: 'fade-up 0.8s ease-out forwards' }}>
        
        {/* Sleek Logo Presentation */}
        <div className="relative flex flex-col items-center gap-8">
          <div className="relative w-48 h-48 flex items-center justify-center rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] shadow-2xl overflow-hidden" style={{ animation: 'subtle-scale 4s ease-in-out infinite' }}>
            <img src="/logo.png" alt="Mara Photo" className="w-32 h-32 object-contain filter invert opacity-90" />
            
            {/* Elegant glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.08] to-transparent" />
          </div>

          {/* Clean Typography */}
          <h1 className="text-4xl font-light tracking-[0.3em] uppercase text-white/90">
            Mara Photo
          </h1>
        </div>

        {/* Minimalist Progress Line */}
        <div className="flex flex-col items-center gap-3 w-48 mt-4">
          <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-[#c5a880] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Very subtle shimmer on the fill */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: 'shimmer-sweep 2s infinite' }} />
            </div>
          </div>
          <span className="text-[9px] tracking-widest text-[#c5a880]/70 font-medium uppercase">
            Loading {Math.round(progress)}%
          </span>
        </div>

      </div>
    </div>
  );
}
