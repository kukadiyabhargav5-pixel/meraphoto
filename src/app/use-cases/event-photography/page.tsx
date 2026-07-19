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
        <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-[#e3d8c8]/30">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-6 font-poppins shadow-sm">
              All Event Types
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-6">
              Premium Delivery for Professional Event Photographers
            </h1>
            <p className="font-poppins text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              From baby showers to festivals, Mara Photo gives professional event photographers the ultimate toolkit to deliver photos and automate client sales.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Start Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#contact"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-9 py-4 rounded-full hover:bg-slate-100 transition-all duration-300"
              >
                Consult Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Symmetrical Details Grid */}
        <section className="py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Mockup wrapper */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[360px] bg-[#faf9f6] border border-slate-100 rounded-3xl p-3 shadow-md relative flex items-center justify-center min-h-[300px]">
                  
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div>
          <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium Event Delivery</span>
          <p className="text-[12px] font-black text-slate-800 mt-1">Baby Shower Ceremony</p>
        </div>
        <div className="h-24 rounded-lg overflow-hidden border border-slate-100">
          <img src="/gala.jpg" className="w-full h-full object-cover" />
        </div>
        <div className="text-[8px] text-slate-400 font-bold">
          Deliver client galleries instantly
        </div>
      </div>

                </div>
              </div>

              {/* Right Column: Bullets */}
              <div className="lg:col-span-7 space-y-8 text-left font-poppins">
                <div>
                  <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full">
                    Core Benefits
                  </span>
                  <h2 className="font-serif-luxury text-3xl sm:text-4xl font-light text-[#09090b] leading-tight mt-4">
                    Designed to give you <span className="italic text-[#c5a880]">complete control</span>
                  </h2>
                </div>

                <ul className="space-y-5">
                    <li className="flex items-start gap-3" key={0}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Sleek and responsive white-label interfaces</span>
                    </li>
                    <li className="flex items-start gap-3" key={1}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Auto payment collection and contracts</span>
                    </li>
                    <li className="flex items-start gap-3" key={2}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Instant guest delivery with facial index systems</span>
                    </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Call To Action Banner */}
        <section className="bg-[#09090b] py-24 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-white">
              Ready to elevate your <span className="italic text-[#c5a880]">client experience?</span>
            </h2>
            <p className="text-gray-400 font-poppins text-sm sm:text-base max-w-lg mx-auto font-medium">
              Join elite photography studios delivering live moments instantly. Start free today.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] bg-[#c5a880] hover:bg-white px-9 py-4 rounded-full transition-all duration-300 shadow-md"
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
