'use client';

import Link from 'next/link';
import { ArrowRight, ScanFace, CheckCircle2, Zap, Shield, Sparkles, ChevronDown, Download, Heart } from 'lucide-react';

export default function MobileHero() {
  const scrollToWorkflow = () => {
    const el = document.getElementById('workflow');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full bg-white text-[#09090b] pt-6 pb-12 px-4 overflow-hidden font-poppins border-b border-[#e3d8c8]/30">
      {/* ── Soft Champagne / Gold Ambient Gradient Orbs (White Luxury Aesthetic) ── */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-[#c5a880]/10 rounded-full blur-[90px]"
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-1/3 -right-20 w-[220px] h-[220px] bg-[#f5f2eb] rounded-full blur-[80px]"
      />

      <div className="relative max-w-md mx-auto flex flex-col items-center text-center">

        {/* ── Editorial Serif Headline ── */}
        <h1 className="font-serif-luxury text-[#09090b] text-[34px] xs:text-[40px] leading-[1.12] font-light tracking-tight mb-3">
          Find Your Moments <br />
          <span className="italic text-[#c5a880] font-normal">Instantly</span> With AI
        </h1>

        {/* ── Subtitle ── */}
        <p className="text-[#52525b] text-[13.5px] leading-relaxed max-w-[330px] font-medium mb-6">
          Guests snap a quick selfie and get all their event memories in under 2 seconds. No manual sorting. No WhatsApp chaos.
        </p>

        {/* ── Dual CTAs ── */}
        <div className="w-full flex flex-col xs:flex-row items-center gap-2.5 mb-7">
          <Link
            href="/signup"
            className="w-full xs:flex-1 py-3.5 px-6 rounded-full bg-[#c5a880] hover:bg-[#b0936b] text-[#09090b] font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-[#c5a880]/20 active:scale-[0.98]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={scrollToWorkflow}
            type="button"
            className="w-full xs:w-auto py-3.5 px-6 rounded-full bg-[#f5f2eb] hover:bg-[#e3d8c8]/40 text-[#09090b] border border-[#e3d8c8] font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
          >
            How It Works
          </button>
        </div>

        {/* ── THE HERO CENTERPIECE: Luxury Image with Text & AI Badges Inside ── */}
        <div className="w-full relative mb-6">
          <div className="relative w-full aspect-[4/5] xs:aspect-[3/4] rounded-[28px] overflow-hidden border-2 border-[#e3d8c8] shadow-[0_20px_50px_rgba(197,168,128,0.22),0_10px_20px_rgba(0,0,0,0.08)] bg-[#09090b]">
            {/* The Main High-Resolution Photo */}
            <img
              src="/wedding.jpg"
              alt="Mara Photo AI Wedding Event Moments"
              className="w-full h-full object-cover object-center"
            />

            {/* Cinematic Gradient: ensures all text inside the photo is crisp, luminous, and legible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

            {/* ── TOP INSIDE THE IMAGE: Badges ── */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
              <div className="backdrop-blur-md bg-black/45 border border-white/20 text-white text-[10.5px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Priya & Rohan's Gala</span>
              </div>
              <div className="backdrop-blur-md bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live AI Active</span>
              </div>
            </div>

            {/* ── CENTER INSIDE THE IMAGE: AI Face Recognition Focus Brackets ── */}
            <div className="absolute top-[28%] left-[30%] w-[32%] h-[30%] border-2 border-[#c5a880] rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(197,168,128,0.7)] flex items-center justify-center">
              {/* Corner accent markers */}
              <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
              <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
              
              <div className="absolute -bottom-3.5 whitespace-nowrap bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[9.5px] font-bold text-[#c5a880] border border-[#c5a880]/50 shadow-lg">
                ✨ 99.8% Match
              </div>
            </div>

            {/* ── BOTTOM INSIDE THE IMAGE: Integrated Text & Match Bar ── */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex flex-col gap-2.5">
              {/* Text inside the image */}
              <div className="text-left px-1">
                <h3 className="font-serif-luxury text-white text-[24px] xs:text-[26px] font-normal leading-tight drop-shadow-md">
                  Find Your Memories <span className="italic text-[#c5a880]">Live</span>
                </h3>
                <p className="text-white/85 text-[11.5px] font-normal leading-snug drop-shadow-sm">
                  1,200+ photos indexed • Instant guest download
                </p>
              </div>

              {/* Floating Instant Result Glassmorphic Bar */}
              <div className="backdrop-blur-xl bg-black/75 border border-[#c5a880]/40 rounded-2xl p-2.5 flex items-center justify-between text-left shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#c5a880] text-[#09090b] flex items-center justify-center font-bold shadow-md shrink-0">
                    <ScanFace className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11.5px] font-bold text-white flex items-center gap-1">
                      <span>24 Moments Found</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[9.5px] text-gray-300">Ready in 1.4s via selfie</div>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="px-3 py-1.5 rounded-xl bg-[#c5a880] hover:bg-white text-[#09090b] font-extrabold text-[10.5px] uppercase tracking-wider flex items-center gap-1 transition-all shadow-md"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-Column Trust Strip (Clean Luxury White Style) ── */}
        <div className="w-full grid grid-cols-3 gap-2 py-3 px-2 rounded-2xl bg-[#faf9f6] border border-[#e3d8c8]/70 mb-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[#9c7c56] font-bold text-xs mb-0.5">
              <Zap className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>&lt; 2s</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Instant AI Match</span>
          </div>

          <div className="flex flex-col items-center text-center border-x border-[#e3d8c8]/70">
            <div className="flex items-center gap-1 text-[#9c7c56] font-bold text-xs mb-0.5">
              <Shield className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>100%</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Private & Secure</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-[#9c7c56] font-bold text-xs mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Original</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">High-Res 4K</span>
          </div>
        </div>

        {/* ── Subtle Scroll Cue ── */}
        <button
          onClick={scrollToWorkflow}
          type="button"
          aria-label="Scroll down to workflow"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#09090b] transition-colors cursor-pointer group"
        >
          <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#9c7c56] group-hover:text-[#c5a880]">
            How It Works
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#c5a880] animate-bounce" />
        </button>
      </div>
    </section>
  );
}
