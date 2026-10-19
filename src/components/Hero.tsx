'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Check,
  Star,
  Sparkles,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';

export default function Hero() {
  const scrollToWorkflow = () => {
    const el = document.getElementById('workflow');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full bg-white text-[#09090b] pt-10 pb-16 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-12 overflow-hidden font-poppins border-b border-[#e3d8c8]/30">

      {/* ── Soft Champagne / Gold Ambient Gradient Orbs (White Luxury Aesthetic) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/4 w-[500px] h-[500px] bg-[#c5a880]/10 rounded-full blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-24 w-[450px] h-[450px] bg-[#f5f2eb] rounded-full blur-[100px]"
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">

          {/* ══════════════ LEFT COLUMN: CLEAN LUXURY EDITORIAL TEXT & CTAS ══════════════ */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* ── Grand Luxury Serif Headline ── */}
            <h1 className="font-serif-luxury text-[#09090b] text-[40px] xs:text-[48px] sm:text-[58px] lg:text-[64px] xl:text-[72px] leading-[1.05] font-normal tracking-tight uppercase mb-6">
              FIND YOUR MOMENTS <br />
              <span className="text-[#c5a880] italic lowercase font-normal">instantly</span> WITH AI
            </h1>

            {/* ── Elegant Description Paragraph ── */}
            <p className="text-[#52525b] text-[15.5px] sm:text-[17px] lg:text-[18px] leading-relaxed max-w-xl font-normal mb-9">
              Experience the next era of luxury event photography. Guests upload a quick selfie and receive all their matched high-resolution photos in under 2 seconds. Zero manual sorting. Zero WhatsApp compression.
            </p>

            {/* ── Big Rounded Gold CTA Button ── */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 mb-9">
              <Link
                href="/signup"
                className="w-full sm:w-auto py-4 px-9 rounded-full bg-[#c5a880] hover:bg-[#b0936b] text-[#09090b] font-extrabold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#c5a880]/30 hover:shadow-xl hover:shadow-[#c5a880]/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={scrollToWorkflow}
                type="button"
                className="w-full sm:w-auto py-4 px-8 rounded-full bg-[#faf9f6] hover:bg-[#f3f0e8] text-[#09090b] border border-[#e3d8c8] font-bold text-xs sm:text-sm uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm"
              >
                How It Works
              </button>
            </div>

            {/* ── Checkmark Trust Perks ── */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-semibold text-[#52525b]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#c5a880]/15 flex items-center justify-center text-[#c5a880]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>100% Private & PIN Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#c5a880]/15 flex items-center justify-center text-[#c5a880]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Original 4K High-Res Downloads</span>
              </div>
            </div>

          </div>

          {/* ══════════════ RIGHT COLUMN: MARA PHOTO IMAGE WITH SMOOTH HOVER ZOOM ══════════════ */}
          <div className="lg:col-span-5 w-full max-w-md lg:max-w-none mx-auto relative px-3 sm:px-6 lg:px-0">

            {/* ── The Luxury Main Rounded Card (Interactive Smooth Zoom In / Zoom Out) ── */}
            <div className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden bg-[#faf9f6] border-2 border-[#e3d8c8] shadow-[0_25px_60px_rgba(197,168,128,0.22),0_15px_30px_rgba(0,0,0,0.06)] aspect-[3/4] group cursor-pointer transition-all duration-500 hover:shadow-[0_32px_75px_rgba(197,168,128,0.32),0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1">

              {/* Generated Luxury Royal Indian Wedding Image with 'MARA PHOTO' watermark */}
              <img
                src="/mara-photo-hero.jpg"
                alt="Mara Photo AI Wedding Photography Celebration"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 will-change-transform select-none pointer-events-none"
              />

              {/* Subtle gradient vignette to blend with badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15 pointer-events-none transition-opacity duration-500 group-hover:opacity-75" />
            </div>

            {/* ── FLOATING BADGE 1: TOP-RIGHT (like Masterpiece in reference screenshot) ── */}
            <div className="absolute -top-4 sm:-top-5 -right-2 sm:-right-4 backdrop-blur-xl bg-black/85 border border-[#c5a880]/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center gap-3 z-20 animate-fade-in hover:scale-105 transition-transform select-none">
              <div className="w-10 h-10 rounded-xl bg-[#c5a880] text-[#09090b] flex items-center justify-center font-bold shadow-md shrink-0">
                <Star className="w-5 h-5 fill-[#09090b]" />
              </div>
              <div className="text-left pr-2">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>MARA PHOTO</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#c5a880] font-semibold">
                  Live AI Recognition
                </div>
              </div>
            </div>

            {/* ── FLOATING BADGE 2: BOTTOM-LEFT (like Premium Quality in reference screenshot) ── */}
            <div className="absolute -bottom-4 sm:-bottom-5 -left-2 sm:-left-4 backdrop-blur-xl bg-black/85 border border-[#c5a880]/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center gap-3 z-20 animate-fade-in hover:scale-105 transition-transform select-none">
              <div className="w-10 h-10 rounded-xl bg-[#c5a880] text-[#09090b] flex items-center justify-center font-bold shadow-md shrink-0">
                <Zap className="w-5 h-5 text-[#09090b]" />
              </div>
              <div className="text-left pr-2">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                  <span>Instant Match</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-300 font-semibold">
                  99.8% Accuracy
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Scroll Down Indicator at Bottom ── */}
        <div className="mt-12 sm:mt-16 flex justify-center">
          <button
            onClick={scrollToWorkflow}
            type="button"
            aria-label="Scroll down to workflow"
            className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-[#09090b] transition-all cursor-pointer group select-none"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9c7c56] group-hover:text-[#c5a880] transition-colors">
              How It Works
            </span>
            <div className="w-7 h-7 rounded-full bg-[#faf9f6] border border-[#e3d8c8] flex items-center justify-center shadow-sm group-hover:border-[#c5a880] transition-colors animate-bounce">
              <ChevronDown className="w-3.5 h-3.5 text-[#c5a880]" />
            </div>
          </button>
        </div>

      </div>
    </section>
  );
}
