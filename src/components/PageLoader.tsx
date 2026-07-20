'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let authLoaded = false;
    let dashboardLoaded = false;
    let isDataLoaded = false;
    let progressInterval: NodeJS.Timeout;
    let fadeTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    const checkLoaded = () => {
      // If we are on a dashboard page, wait for both auth and dashboard data
      if (pathname && pathname.startsWith('/dashboard')) {
        if (authLoaded && dashboardLoaded) isDataLoaded = true;
      } else {
        // Otherwise just wait for auth data
        if (authLoaded) isDataLoaded = true;
      }
    };

    const handleAuthLoaded = () => { authLoaded = true; checkLoaded(); };
    const handleDashboardLoaded = () => { dashboardLoaded = true; checkLoaded(); };

    window.addEventListener('auth-loaded', handleAuthLoaded);
    window.addEventListener('dashboard-loaded', handleDashboardLoaded);

    // Elegant, smooth progress simulation
    const duration = 1200; // 1.2 seconds total to hit 100% normally
    const interval = 30; // update every 30ms
    const step = 95 / (duration / interval); // Aim for 95% maximum until data loads

    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (isDataLoaded) {
          clearInterval(progressInterval);
          
          // Data is fully loaded, trigger completion sequence
          const remainingTime = 200;
          fadeTimer = setTimeout(() => {
            setProgress(100);
            setFadeOut(true);
          }, remainingTime); 
          
          hideTimer = setTimeout(() => setVisible(false), remainingTime + 700);
          
          return 100;
        }

        // Add slight randomness, cap at 95% while waiting for data
        const next = prev + step + (Math.random() * 2);
        if (next >= 95) return 95;
        return next;
      });
    }, interval);

    // Fallback: If data doesn't load within 10 seconds, force complete
    const fallbackTimer = setTimeout(() => {
      isDataLoaded = true;
    }, 10000);

    return () => {
      window.removeEventListener('auth-loaded', handleAuthLoaded);
      window.removeEventListener('dashboard-loaded', handleDashboardLoaded);
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 scale-[1.05] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #09090b 0%, #1a1a24 100%)' // Premium dark gradient background
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes fade-up-stagger {
          0% { opacity: 0; transform: translateY(20px); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}} />

      {/* 4-Corner Dynamic Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#c5a880] rounded-full blur-[120px] pointer-events-none mix-blend-screen -translate-x-1/2 -translate-y-1/2" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#c5a880] rounded-full blur-[120px] pointer-events-none mix-blend-screen translate-x-1/2 -translate-y-1/2" style={{ animation: 'pulse-glow 3s ease-in-out infinite 1s' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#c5a880] rounded-full blur-[120px] pointer-events-none mix-blend-screen -translate-x-1/2 translate-y-1/2" style={{ animation: 'pulse-glow 3.5s ease-in-out infinite 0.5s' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#c5a880] rounded-full blur-[120px] pointer-events-none mix-blend-screen translate-x-1/2 translate-y-1/2" style={{ animation: 'pulse-glow 4.5s ease-in-out infinite 1.5s' }} />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        
        {/* Sleek Logo Presentation */}
        <div 
          className="relative flex flex-col items-center gap-6" 
          style={{ animation: 'fade-up-stagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <div 
            className="relative w-[130px] h-[130px] flex items-center justify-center rounded-[1.5rem] bg-white/[0.03] border border-white/[0.08] shadow-[0_0_40px_rgba(197,168,128,0.15)] overflow-hidden backdrop-blur-xl" 
            style={{ animation: 'subtle-float 4s ease-in-out infinite' }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#c5a880]/10 to-transparent opacity-50" />
            
            <img src="/logo.png" alt="Mara Photo" className="w-[110px] h-[110px] object-contain filter invert opacity-95 relative z-10" />
            
            {/* Elegant glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent transform -skew-y-12" />
          </div>

          {/* Clean Typography */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl md:text-4xl font-extralight tracking-[0.35em] uppercase text-white shadow-black/50 drop-shadow-lg">
              Mara <span className="font-medium text-[#c5a880]">Photo</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-[0.2em] uppercase">Premium Event Experience</p>
          </div>
        </div>

        {/* Minimalist Premium Progress Line */}
        <div 
          className="flex flex-col items-center w-64 md:w-80"
          style={{ animation: 'fade-up-stagger 1s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.2s', opacity: 0 }}
        >
          <div className="w-full flex justify-between items-end mb-2 px-1">
            <span className="text-[10px] tracking-widest text-gray-400 font-bold uppercase">
              Loading App
            </span>
            <span className="text-lg tracking-wider text-[#c5a880] font-black font-mono">
              {Math.min(100, Math.round(progress))}%
            </span>
          </div>
          
          <div className="w-full h-[1px] bg-white/[0.15] rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#a38760] via-[#c5a880] to-[#e6d0a7] transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${Math.min(100, progress)}%` }}
            >
              {/* Shimmer effect on the progress bar */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{ 
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite linear'
                }} 
              />
              
              {/* Head glow */}
              <div className="absolute top-0 right-0 h-full w-10 bg-white opacity-50 blur-[2px]" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
