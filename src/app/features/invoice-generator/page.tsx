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
              GST Compliant Billing
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-6">
              Professional Invoicing & Payment Automation
            </h1>
            <p className="font-poppins text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              Create and send premium branded invoices to clients instantly. Accept online payments, UPI, and track transaction status in real-time.
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
                  
      <div className="w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-slate-800 text-left font-poppins relative flex flex-col justify-between h-[240px] select-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Studio Invoice</span>
          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Paid</span>
        </div>
        <div className="space-y-2 flex-1 mt-3">
          <div className="flex justify-between text-[8px] text-slate-400 font-semibold">
            <span>Bill To: Mehta Family</span>
            <span>Date: 24 May 2026</span>
          </div>
          <div className="border border-slate-100 rounded-lg p-2 bg-slate-50 space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-700">
              <span>Wedding Photography Cover</span>
              <span>₹85,000</span>
            </div>
            <div className="flex justify-between text-[7px] text-slate-400 font-medium">
              <span>Pre-Wedding + 2 Day Event Shoot</span>
              <span>Qty: 1</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
            <span className="text-[8px] text-slate-400 font-bold">Total Received</span>
            <span className="text-xs font-black text-slate-800">₹85,000</span>
          </div>
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
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Generate GST-compliant invoices in one click</span>
                    </li>
                    <li className="flex items-start gap-3" key={1}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Accept secure digital payments and credit cards</span>
                    </li>
                    <li className="flex items-start gap-3" key={2}>
                      <div className="w-5.5 h-5.5 rounded-full bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">⚡</div>
                      <span className="text-sm sm:text-[15px] font-bold text-slate-700 leading-snug">Automated payment reminders and tracking</span>
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
