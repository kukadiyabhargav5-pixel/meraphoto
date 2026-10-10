'use client';

import React from 'react';
import PublicWrapper from '../../components/PublicWrapper';
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

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-6 font-poppins shadow-sm">
              About Mara Photo
            </span>
            <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-6">
              Delivering Experiences, Not Links
            </h1>
            <p className="font-poppins text-sm sm:text-lg text-gray-500 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Mara Photo is India's leading AI-powered guest gallery platform. We empower professional event photographers to automate delivery, simplify billing, and scale studios.
            </p>
            <div className="flex flex-col xs:flex-row justify-center items-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
              <Link
                href="/signup"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-7 sm:px-9 py-3.5 sm:py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5 w-full xs:w-auto min-h-[44px]"
              >
                Start Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#contact"
                className="font-poppins inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full hover:bg-slate-100 transition-all duration-300 w-full xs:w-auto min-h-[44px]"
              >
                Consult Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Symmetrical Details Grid */}
        <section className="py-16 sm:py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Mockup wrapper */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[360px] bg-[#faf9f6] border border-slate-100 rounded-3xl p-3 shadow-md relative flex items-center justify-center min-h-[300px]">
                  
      <div className="w-full bg-[#09090b] text-white rounded-xl shadow-lg border border-white/10 p-4 text-center font-poppins relative flex flex-col justify-between h-[240px] overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a880]/10 rounded-full blur-xl" />
        <div className="space-y-1 mt-4">
          <span className="text-[9px] bg-[#c5a880]/15 text-[#c5a880] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-[#c5a880]/20">Our Story</span>
          <p className="text-[12px] font-serif-luxury font-light text-white pt-2">Mara Photo Studio Tech</p>
        </div>
        <div className="text-[8px] text-gray-400 leading-relaxed max-w-[140px] mx-auto mb-4">
          Helping creators scale their business with premium cloud tools.
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
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Fastest guest face matching AI technology in India</span>
                    </li>
                    <li className="flex items-start gap-3" key={1}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Loved by 600+ premium photography studios</span>
                    </li>
                    <li className="flex items-start gap-3" key={2}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Committed to student privacy and corporate secure galleries</span>
                    </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Creator & Founder Spotlight Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-[#faf9f6] to-[#f5f2eb] border-b border-[#e3d8c8]/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-poppins">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 text-[11px] font-black uppercase tracking-widest rounded-full mb-4 shadow-xs">
              Founder & Engineering
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl font-light text-[#09090b] leading-snug mb-6">
              Crafted with Innovation & <span className="italic text-[#c5a880]">Vision</span>
            </h2>

            <div className="bg-white border border-[#c5a880]/30 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#c5a880]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#09090b]/5 rounded-full blur-2xl pointer-events-none" />

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium mb-6 max-w-2xl mx-auto">
                This website is made and engineered by <strong className="text-[#09090b] font-bold">Bhargav Kukadiya</strong>, tech company <strong className="text-[#c5a880] font-bold">Techaarambh</strong>, and the founder of <strong className="text-[#09090b] font-bold">Bhartiglooms</strong>. Dedicated to building state-of-the-art digital infrastructure, high-performance web applications, and seamless cloud solutions.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <a
                  href="https://bhartiglooms.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#09090b] text-[#c5a880] hover:bg-[#c5a880] hover:text-[#09090b] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:-translate-y-0.5"
                >
                  <Globe className="w-4 h-4" />
                  Visit bhartiglooms.in
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Call To Action Banner */}
        <section className="bg-[#09090b] py-16 sm:py-24 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-w-full h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-white">
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
