'use client';

import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState<'entering' | 'loading' | 'focusing' | 'flashing' | 'revealing' | 'done'>('entering');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('loading'), 100);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = prev < 70 ? Math.random() * 5 : Math.random() * 2;
        const next = prev + increment;
        return next >= 99 ? 99 : next;
      });
    }, 100);

    const handleLoad = () => {
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setStage('focusing'); // 3D lens turns to face the user
        
        setTimeout(() => {
          setStage('flashing'); // Flash explosion
          
          setTimeout(() => {
            setStage('revealing'); // Fade to website
            setTimeout(() => setVisible(false), 1500);
          }, 800);
        }, 1200); // Wait for the 3D turn to complete
      }, 400);
    };

    if (document.readyState === 'complete') {
      setTimeout(handleLoad, 3000);
    } else {
      const maxTimeout = setTimeout(handleLoad, 5000);
      window.addEventListener('load', () => {
        clearTimeout(maxTimeout);
        handleLoad();
      });
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(maxTimeout);
      };
    }

    return () => {
      clearTimeout(t1);
      clearInterval(progressInterval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
        stage === 'revealing' ? 'opacity-0 scale-[1.5] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #09090b 0%, #111116 50%, #050508 100%)',
        overflow: 'hidden'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .scene-container {
          perspective: 1200px;
          width: 100%;
          height: 40vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lens-assembly {
          position: relative;
          width: 0;
          height: 0;
          transform-style: preserve-3d;
          animation: cinematic-float 8s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
        }

        /* Override animation when focusing */
        .lens-assembly.focusing {
          animation: snap-to-front 1.2s cubic-bezier(0.85, 0, 0.15, 1) forwards !important;
        }

        @keyframes cinematic-float {
          0% { transform: rotateX(65deg) rotateY(15deg) rotateZ(0deg) translateZ(-50px); }
          100% { transform: rotateX(40deg) rotateY(-15deg) rotateZ(180deg) translateZ(50px); }
        }

        @keyframes snap-to-front {
          0% { transform: rotateX(55deg) rotateY(0deg) rotateZ(90deg) translateZ(0px); }
          50% { transform: rotateX(0deg) rotateY(0deg) rotateZ(180deg) translateZ(100px); }
          100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(360deg) translateZ(300px); }
        }

        .ring {
          position: absolute;
          border-radius: 50%;
          transform-style: preserve-3d;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }

        .ring-outer {
          width: 340px; height: 340px;
          border: 2px solid rgba(197, 168, 128, 0.2);
          transform: translate(-50%, -50%) translateZ(0px);
          box-shadow: inset 0 0 50px rgba(197,168,128,0.1), 0 0 30px rgba(0,0,0,0.8);
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(5px);
        }

        .ring-mid-1 {
          width: 270px; height: 270px;
          border: 4px dashed rgba(197, 168, 128, 0.4);
          transform: translate(-50%, -50%) translateZ(40px);
          animation: spin-reverse 20s linear infinite;
        }

        .ring-mid-2 {
          width: 200px; height: 200px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid #c5a880;
          border-bottom: 3px solid #c5a880;
          transform: translate(-50%, -50%) translateZ(80px);
          animation: spin 10s linear infinite;
          box-shadow: 0 0 40px rgba(197,168,128,0.3);
        }

        .ring-inner {
          width: 130px; height: 130px;
          border: 6px solid #c5a880;
          transform: translate(-50%, -50%) translateZ(120px);
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, rgba(0,0,0,0.9) 80%);
          box-shadow: inset 0 0 25px #000, 0 0 50px rgba(197,168,128,0.7);
        }

        .core-lens {
          width: 40px; height: 40px;
          background: #fff;
          border-radius: 50%;
          transform: translate(-50%, -50%) translateZ(150px);
          box-shadow: 0 0 60px 20px rgba(255,255,255,0.9), 0 0 120px 50px rgba(197,168,128,0.7);
          animation: core-pulse 2s ease-in-out infinite alternate;
        }

        @keyframes spin { 100% { transform: translate(-50%, -50%) translateZ(80px) rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: translate(-50%, -50%) translateZ(40px) rotate(-360deg); } }
        
        @keyframes core-pulse {
          0% { transform: translate(-50%, -50%) translateZ(150px) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) translateZ(150px) scale(1.3); opacity: 1; }
        }

        @keyframes supernova-flash {
          0% { opacity: 0; transform: scale(0.1); }
          15% { opacity: 1; transform: scale(5); background: #ffffff; }
          50% { opacity: 1; transform: scale(50); background: #ffffff; }
          100% { opacity: 0; transform: scale(100); background: #ffffff; }
        }

        .text-3d {
          text-shadow: 0 10px 30px rgba(197,168,128,0.6);
        }
      `}} />

      {/* FLASH LAYER */}
      {stage === 'flashing' && (
        <div 
          className="absolute inset-0 z-50 rounded-full origin-center mix-blend-screen"
          style={{ animation: 'supernova-flash 1.5s cubic-bezier(0.1, 0.8, 0.1, 1) forwards' }}
        />
      )}

      {/* 3D SCENE */}
      <div className="scene-container">
        <div className={`lens-assembly ${stage === 'focusing' || stage === 'flashing' ? 'focusing' : ''}`}>
          <div className="ring ring-outer" />
          <div className="ring ring-mid-1" />
          <div className="ring ring-mid-2" />
          <div className="ring ring-inner" />
          <div className="ring core-lens" />
        </div>
      </div>

      {/* TEXT & PROGRESS (Hidden during focus/flash) */}
      <div 
        className={`relative z-20 flex flex-col items-center gap-10 mt-16 transition-all duration-700 ${
          stage === 'focusing' || stage === 'flashing' ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
        }`}
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-[0.4em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-[#c5a880] to-white text-3d ml-[0.2em]">
          Mara Photo
        </h1>

        <div className="flex flex-col items-center gap-4 w-72 md:w-[400px]">
          {/* Progress Bar Container */}
          <div className="w-full h-[3px] bg-white/5 rounded-full relative overflow-visible">
            {/* Glow Track */}
            <div 
              className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#c5a880] to-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%`, boxShadow: '0 0 20px rgba(197,168,128,0.8)' }}
            />
            {/* Leading Dot */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_#fff,_0_0_40px_#c5a880]"
              style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          
          <div className="flex justify-between w-full mt-2 text-[10px] md:text-sm font-semibold tracking-[0.4em] text-[#c5a880] uppercase">
            <span>Initializing</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

    </div>
  );
}
