'use client';

import React from 'react';
import PublicWrapper from '../../components/PublicWrapper';
import Link from 'next/link';
import { Check, Sparkles, Shield, ArrowRight, HelpCircle } from 'lucide-react';
import { usePricingPlans } from '@/lib/pricing';

export default function PricingPage() {
  const { plans, loading } = usePricingPlans();

  // Paid membership plans
  const displayPlans = plans.filter((p) => p.planKey !== 'BASIC');
  const basicPlan = plans.find((p) => p.planKey === 'BASIC');

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b] min-h-screen font-poppins relative pb-24">
        {/* Background glow filters */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
        </div>

        {/* Section 1: Hero Header */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-10 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-4 sm:mb-5 shadow-sm">
            Membership Plans
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-4 sm:mb-6">
            Simple, Transparent Studio Pricing
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-base font-medium">
            Start delivering photos dynamically with AI face recognition. Upgrade smoothly as your studio volume scales.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            All prices in INR • Annual billing • 18% GST calculated at checkout
          </div>

          {/* Pricing cards grid wrapper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 sm:mt-14 max-w-6xl mx-auto items-stretch">
            {displayPlans.map((plan) => {
              const isPopular = plan.isRecommended || plan.planKey === 'STANDARD';
              const formattedPrice = plan.priceInr === 0 ? 'Free' : `₹${plan.priceInr.toLocaleString('en-IN')}`;

              return (
                <div 
                  key={plan.planKey}
                  className={`relative rounded-3xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                    isPopular 
                      ? 'bg-[#09090b] border border-[#c5a880]/40 text-white shadow-2xl scale-100 lg:scale-[1.04] z-10' 
                      : 'bg-white border border-[#e3d8c8]/40 hover:border-[#c5a880]/30 text-[#09090b]'
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c5a880] text-[#09090b] text-[9px] font-black uppercase tracking-widest px-4.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                      Most Popular
                    </span>
                  )}

                  <div className="text-left">
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isPopular ? 'text-[#c5a880]' : 'text-[#09090b]'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-[11px] mt-1.5 font-medium ${isPopular ? 'text-slate-400' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                    
                    <div className="flex items-baseline gap-1 mt-6 mb-4">
                      <span className="text-3xl sm:text-4xl font-black font-serif-luxury tracking-tight">
                        {formattedPrice}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isPopular ? 'text-[#c5a880]' : 'text-gray-400'}`}>
                        {plan.billingPeriod || '/year'}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className={`h-px my-5 ${isPopular ? 'bg-white/10' : 'bg-gray-100'}`} />

                    {/* Bullet points list */}
                    <ul className="space-y-3.5 my-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                          <Check className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                          <span className={isPopular ? 'text-slate-200' : 'text-gray-700'}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <Link 
                      href={plan.ctaHref || '/dashboard/plans-billing'}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center cursor-pointer min-h-[44px] shadow-sm ${
                        isPopular 
                          ? 'bg-[#c5a880] hover:bg-white text-[#09090b] font-black' 
                          : 'border border-[#09090b]/15 text-[#09090b] bg-transparent hover:bg-slate-50'
                      }`}
                    >
                      {plan.ctaText || `Choose ${plan.name}`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Basic Free Tier Banner */}
          {basicPlan && (
            <div className="mt-12 max-w-3xl mx-auto bg-white rounded-2xl border border-[#e3d8c8]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#f5f2eb] text-[#c5a880] flex items-center justify-center shrink-0 border border-[#c5a880]/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#09090b]">Looking to test first? Free Starter Tier</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Explore galleries with 1,000 photos, 2 videos, and 5 demo events at ₹0.</p>
                </div>
              </div>
              <Link
                href="/signup"
                className="whitespace-nowrap inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Start Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Guarantee / Security badge */}
          <div className="mt-12 max-w-xl mx-auto flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-[#c5a880]" />
              7-Day Money-Back Policy
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-[#c5a880]" />
              Secure Razorpay Checkout
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-[#c5a880]" />
              Instant Plan Activation
            </span>
          </div>
        </section>
      </main>
    </PublicWrapper>
  );
}
