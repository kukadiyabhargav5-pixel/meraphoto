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
        const next = prev + Math.random() * 12;
        if (next >= 98) return 98;
        return next;
      });
    }, 150);

    // Fade out sequence
    const fadeTimer = setTimeout(() => {
      setProgress(100);
      setFadeOut(true);
    }, 2200); 
    
    const hideTimer = setTimeout(() => setVisible(false), 3000);

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
        fadeOut ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: '#09090b',
        overflow: 'hidden'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes line-top {
          0% { height: 0; opacity: 0; }
          40% { height: 50vh; opacity: 1; }
          60% { height: 50vh; opacity: 1; }
          100% { height: 0; opacity: 0; transform: translateY(50vh); }
        }
        @keyframes line-bottom {
          0% { height: 0; opacity: 0; }
          40% { height: 50vh; opacity: 1; }
          60% { height: 50vh; opacity: 1; }
          100% { height: 0; opacity: 0; transform: translateY(-50vh); }
        }
        @keyframes line-left {
          0% { width: 0; opacity: 0; }
          40% { width: 50vw; opacity: 1; }
          60% { width: 50vw; opacity: 1; }
          100% { width: 0; opacity: 0; transform: translateX(50vw); }
        }
        @keyframes line-right {
          0% { width: 0; opacity: 0; }
          40% { width: 50vw; opacity: 1; }
          60% { width: 50vw; opacity: 1; }
          100% { width: 0; opacity: 0; transform: translateX(-50vw); }
        }
        @keyframes logo-reveal {
          0% { opacity: 0; transform: scale(0.5); filter: blur(10px); }
          40% { opacity: 0; transform: scale(0.8); filter: blur(10px); }
          60% { opacity: 1; transform: scale(1.1); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        @keyframes fill-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.2); }
        }
      `}} />

      {/* 4 Sides Lifting / Laser Animation */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent to-[#c5a880]" style={{ animation: 'line-top 2s ease-in-out forwards' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-t from-transparent to-[#c5a880]" style={{ animation: 'line-bottom 2s ease-in-out forwards' }} />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent to-[#c5a880]" style={{ animation: 'line-left 2s ease-in-out forwards' }} />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[2px] bg-gradient-to-l from-transparent to-[#c5a880]" style={{ animation: 'line-right 2s ease-in-out forwards' }} />

      {/* Subtle Background Glow centered on logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c5a880] rounded-full blur-[150px] opacity-[0.1]" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center gap-10" style={{ animation: 'logo-reveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        
        {/* Sleek Logo Presentation - Larger logo, tighter square */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative w-40 h-40 flex items-center justify-center rounded-[2rem] bg-white/[0.03] border border-[#c5a880]/20 shadow-[0_0_40px_rgba(197,168,128,0.15)] overflow-hidden transition-transform hover:scale-105">
            <img src="/logo.png" alt="Mara Photo" className="w-36 h-36 object-contain filter invert opacity-100" />
            
            {/* Elegant glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent" />
          </div>

          {/* Clean Typography */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            Mara Photo
          </h1>
        </div>

        {/* Minimalist Progress Line - Thicker and wider */}
        <div className="flex flex-col items-center gap-4 w-64 md:w-80 mt-2">
          <div className="w-full h-[6px] bg-white/10 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#c5a880] to-[#e6d0a7] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(197,168,128,0.5)]"
              style={{ width: `${progress}%` }}
            >
              {/* Very subtle shimmer on the fill */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ animation: 'shimmer-sweep 1.5s infinite' }} />
            </div>
          </div>
          
          {/* Larger Percentage Text */}
          <span className="text-sm md:text-base tracking-[0.2em] text-[#c5a880] font-bold uppercase">
            Loading {Math.round(progress)}%
          </span>
        </div>

      </div>
    </div>
  );
}
