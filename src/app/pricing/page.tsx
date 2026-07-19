'use client';

import React from 'react';
import PublicWrapper from '../../components/PublicWrapper';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const staticPlans = [
    {
      name: 'Basic',
      price: '3,500',
      period: '/year',
      popular: false,
      desc: 'Store 50,000 photos & 10 videos',
      features: [
        'Store 50,000 photos',
        'Store 10 videos',
        'Business Branding',
        'Bulk Download',
        'Web Mode'
      ]
    },
    {
      name: 'Standard',
      price: '7,900',
      period: '/year',
      popular: true,
      desc: 'Store 1,50,000 photos & 100 videos',
      features: [
        'Store 1,50,000 photos',
        'Store 100 videos',
        'Watermarks',
        '+ Basic Plan Feature'
      ]
    },
    {
      name: 'Essential',
      price: '15,900',
      period: '/year',
      popular: false,
      desc: 'Store 3,00,000 photos & 200 videos',
      features: [
        'Store 3,00,000 photos',
        'Store 200 videos',
        'View Client Favourites',
        'Switch on/off Downloads',
        'Portfolio Website',
        '+ Standard Plan Feature'
      ]
    },
    {
      name: 'Premium',
      price: '31,900',
      period: '/year',
      popular: false,
      desc: 'Store 7,50,000 photos & 500 videos',
      features: [
        'Store 7,50,000 photos',
        'Store 500 videos',
        'Digital Album',
        '+ Essential Plan Feature'
      ]
    }
  ];

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b] min-h-screen font-poppins relative pb-24">
        {/* Background glow filters */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
        </div>

        {/* Section 1: Dynamic Photographer Plans Grid (Matching original gold/black theme) */}
        <section className="max-w-7xl mx-auto px-6 pt-28 pb-20 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-5 shadow-sm">
            Membership
          </span>
          <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-500 max-w-sm mx-auto text-sm md:text-base font-medium">
            Start delivering photos dynamically. Upgrade as your studio demands grow.
          </p>

          {/* Pricing cards grid wrapper */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto items-stretch">
            {staticPlans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${plan.popular ? 'bg-[#09090b] border border-[#c5a880]/30 text-white shadow-2xl scale-[1.03] lg:scale-[1.05] z-10' : 'bg-white border border-[#e3d8c8]/40 hover:border-[#c5a880]/30 text-[#09090b]'}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c5a880] text-black text-[9px] font-black uppercase tracking-widest px-4.5 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="text-left">
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${plan.popular ? 'text-[#c5a880]' : 'text-[#09090b]'}`}>{plan.name}</h3>
                  <p className={`text-[11px] mt-1.5 font-medium ${plan.popular ? 'text-slate-400' : 'text-gray-450'}`}>{plan.desc}</p>
                  
                  <div className="flex items-baseline gap-1 mt-6 mb-4">
                    <span className="text-3xl font-black font-serif-luxury">₹{plan.price}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${plan.popular ? 'text-[#c5a880]' : 'text-gray-450'}`}>{plan.period}</span>
                  </div>

                  {/* Divider */}
                  <div className={`h-px my-5 ${plan.popular ? 'bg-white/10' : 'bg-gray-150'}`} />

                  {/* Bullet points list */}
                  <ul className="space-y-4 my-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                        <Check className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                        <span className={plan.popular ? 'text-slate-200' : 'text-slate-650'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link 
                    href="/signup"
                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center cursor-pointer ${plan.popular ? 'bg-[#c5a880] hover:bg-white text-[#09090b] font-black' : 'border border-[#09090b]/15 text-[#09090b] bg-transparent hover:bg-slate-50'}`}
                  >
                    Choose {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PublicWrapper>
  );
}
