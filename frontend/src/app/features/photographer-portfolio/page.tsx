'use client';

import React from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, ChevronRight, QrCode, Calendar, ScanFace, Smile, Settings, CreditCard, Globe, LayoutDashboard, Camera } from 'lucide-react';

export default function Page() {
  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b]">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 sm:pt-24 pb-12 sm:pb-20 border-b border-[#e3d8c8]/30">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden max-w-full">
            <div className="absolute top-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl max-w-full" />
            <div className="absolute bottom-0 left-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl max-w-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-6 font-poppins shadow-sm">
              Branded Portfolios
            </span>
            <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-6">
              Stunning White-Label Portfolios
            </h1>
            <p className="font-poppins text-sm sm:text-lg text-gray-500 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Showcase your best event work under your own custom domain. Give clients a high-end, premium gallery interface customized to match your studio logo.
            </p>
            <div className="flex flex-col xs:flex-row justify-center gap-3 sm:gap-4 w-full xs:w-auto">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-6 sm:px-9 py-3.5 sm:py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5 min-h-[44px] w-full xs:w-auto"
              >
                Start Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#contact"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-6 sm:px-9 py-3.5 sm:py-4 rounded-full hover:bg-slate-100 transition-all duration-300 min-h-[44px] w-full xs:w-auto"
              >
                Consult Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Symmetrical Details Grid */}
        <section className="py-16 sm:py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              
              {/* Left Column: Mockup wrapper */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[360px] bg-[#faf9f6] border border-slate-100 rounded-3xl p-3 shadow-md relative flex items-center justify-center min-h-[300px]">
                  
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="h-20 w-full overflow-hidden relative rounded-lg bg-slate-200">
          <img src="/portrait.jpg" alt="Portfolio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
            <span className="text-[9px] bg-slate-900/90 text-[#c5a880] font-black px-3 py-1 rounded-full shadow-md">yourstudio.com</span>
          </div>
        </div>
        <div className="p-1 flex flex-col justify-between flex-1 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-black text-slate-700 uppercase tracking-wider">Featured Galleries</span>
            <span className="text-[6px] bg-[#c5a880]/15 text-[#c5a880] px-1 rounded font-bold">View All</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            <div className="h-[44px] rounded-lg overflow-hidden border border-slate-200"><img src="/wedding.jpg" alt="Wedding" className="w-full h-full object-cover" /></div>
            <div className="h-[44px] rounded-lg overflow-hidden border border-slate-200"><img src="/party.jpg" alt="Party" className="w-full h-full object-cover" /></div>
            <div className="h-[44px] rounded-lg overflow-hidden border border-slate-200"><img src="/gala.jpg" alt="Gala" className="w-full h-full object-cover" /></div>
          </div>
        </div>
      </div>

                </div>
              </div>

              {/* Right Column: Bullets */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left font-poppins">
                <div>
                  <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full">
                    Core Benefits
                  </span>
                  <h2 className="font-serif-luxury text-2xl sm:text-4xl font-light text-[#09090b] leading-tight mt-4">
                    Designed to give you <span className="italic text-[#c5a880]">complete control</span>
                  </h2>
                </div>

                <ul className="space-y-4 sm:space-y-5">
                    <li className="flex items-start gap-3" key={0}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Map your custom domain (e.g. yourstudio.com)</span>
                    </li>
                    <li className="flex items-start gap-3" key={1}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">High-resolution, fast-loading modern layout grids</span>
                    </li>
                    <li className="flex items-start gap-3" key={2}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Integrated client inquiry and booking forms</span>
                    </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Call To Action Banner */}
        <section className="bg-[#09090b] py-16 sm:py-24 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden max-w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[200px] sm:h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl max-w-full" />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
            <h2 className="font-serif-luxury text-2xl sm:text-4xl lg:text-5xl font-light text-white">
              Ready to elevate your <span className="italic text-[#c5a880]">client experience?</span>
            </h2>
            <p className="text-gray-400 font-poppins text-xs sm:text-base max-w-lg mx-auto font-medium">
              Join elite photography studios delivering live moments instantly. Start free today.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] bg-[#c5a880] hover:bg-white px-7 sm:px-9 py-3.5 sm:py-4 rounded-full transition-all duration-300 shadow-md min-h-[44px] w-full xs:w-auto"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </PublicWrapper>
  );
}
