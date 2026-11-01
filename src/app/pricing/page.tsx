'use client';

import React, { useState, useEffect } from 'react';
import PublicWrapper from '../../components/PublicWrapper';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';

type DurationType = 'MONTHLY' | '6_MONTHS' | 'YEARLY';

interface StoragePlanCard {
  name: string;
  price: string;
  period: string;
  storageGb: string;
  validity: string;
  desc: string;
  highlight: boolean;
  badge: string;
  features: string[];
  cta: string;
  href: string;
}

const defaultStoragePlansByDuration: Record<DurationType, StoragePlanCard[]> = {
  MONTHLY: [
    {
      name: '25 GB Storage',
      price: '₹149',
      period: '/ month',
      storageGb: '25 GB',
      validity: '1 Full Month',
      desc: 'Store ~6,250 High-Res Photos',
      highlight: false,
      badge: 'Starter Monthly',
      features: [
        '25 GB Cloud Storage Allocation',
        'Store ~6,250 High-Res Photos',
        'Standard Multi-Threaded Uploads',
        'High-Speed CDN Delivery',
        'AI Face Recognition Included',
      ],
      cta: 'Choose 25 GB',
      href: '/signup',
    },
    {
      name: '50 GB Storage',
      price: '₹299',
      period: '/ month',
      storageGb: '50 GB',
      validity: '1 Full Month',
      desc: 'Store ~12,500 High-Res Photos',
      highlight: false,
      badge: 'Popular Solo',
      features: [
        '50 GB High-Speed Cloud Storage',
        'Store ~12,500 High-Res Photos',
        'Full Video Storage & Playback',
        'AI Face Search & Live Scanner',
        'Custom Studio Watermarking',
      ],
      cta: 'Choose 50 GB',
      href: '/signup',
    },
    {
      name: '100 GB Storage',
      price: '₹499',
      period: '/ month',
      storageGb: '100 GB',
      validity: '1 Full Month',
      desc: 'Store ~25,000 High-Res Photos',
      highlight: true,
      badge: 'Most Popular',
      features: [
        '100 GB High-Speed Cloud Storage',
        'Store ~25,000 High-Res Photos',
        'Full 4K Video Storage Support',
        'AI Face Search & Smart Albums',
        'Automated Zip Download Archiver',
        'VIP Priority 24/7 Support',
      ],
      cta: 'Choose 100 GB',
      href: '/signup',
    },
  ],
  '6_MONTHS': [
    {
      name: '75 GB Storage',
      price: '₹6,999',
      period: '/ 6 months',
      storageGb: '75 GB',
      validity: '6 Full Months',
      desc: 'Store ~18,750 High-Res Photos',
      highlight: true,
      badge: 'HOT • Most Popular',
      features: [
        '75 GB Dedicated Cloud Storage',
        '6 Months Extended Validity',
        'Store ~18,750 High-Res Photos',
        'High-Speed Multi-Stream Uploads',
        'AI Face Recognition Included',
        'Complete Client Gallery Management',
      ],
      cta: 'Choose 75 GB',
      href: '/signup',
    },
  ],
  YEARLY: [
    {
      name: '100 GB Storage',
      price: '₹5,999',
      period: '/ year',
      storageGb: '100 GB',
      validity: '1 Full Year (12 Mo)',
      desc: 'Store ~25,000 High-Res Photos',
      highlight: false,
      badge: 'Annual Value',
      features: [
        '100 GB Dedicated Cloud Storage',
        '1 Full Year Subscription Validity',
        'Store ~25,000 High-Res Photos',
        'Unlimited Client Event Galleries',
        'AI Face Search & Smart Albums',
        'Dedicated Account Assistance',
      ],
      cta: 'Choose 100 GB',
      href: '/signup',
    },
    {
      name: '200 GB Storage',
      price: '₹11,999',
      period: '/ year',
      storageGb: '200 GB',
      validity: '1 Full Year (12 Mo)',
      desc: 'Store ~50,000 High-Res Photos',
      highlight: true,
      badge: 'Most Popular • Best Value',
      features: [
        '200 GB High-Capacity Storage',
        '1 Full Year Subscription Validity',
        'Store ~50,000 High-Res Photos',
        '4K Video Storage & Streaming',
        'AI Face Recognition VIP Tier',
        'VIP Priority 24/7 SLA Support',
      ],
      cta: 'Choose 200 GB',
      href: '/signup',
    },
    {
      name: '500 GB Storage',
      price: '₹23,999',
      period: '/ year',
      storageGb: '500 GB',
      validity: '1 Full Year (12 Mo)',
      desc: 'Store ~1,25,000 High-Res Photos',
      highlight: false,
      badge: 'Enterprise VIP',
      features: [
        '500 GB Maximum Enterprise Cloud Storage',
        '1 Full Year Subscription Validity',
        'Store ~1,25,000 High-Res Photos',
        'High-Throughput Enterprise CDN',
        'VIP Dedicated Account Manager',
        'Custom Domain & Whitelabeling Ready',
      ],
      cta: 'Choose 500 GB',
      href: '/signup',
    },
  ],
};

export default function PricingPage() {
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('MONTHLY');
  const [plansByDuration, setPlansByDuration] = useState<Record<DurationType, StoragePlanCard[]>>(defaultStoragePlansByDuration);

  // Sync with live admin-defined pricing if available
  useEffect(() => {
    let isMounted = true;
    apiClient.get('/admin/plans/pricing')
      .then((res) => {
        if (!isMounted || !res.data) return;
        const apiPlans = res.data.plans || res.data;
        if (!Array.isArray(apiPlans) || apiPlans.length === 0) return;

        const updated: Record<DurationType, StoragePlanCard[]> = {
          MONTHLY: [...defaultStoragePlansByDuration.MONTHLY],
          '6_MONTHS': [...defaultStoragePlansByDuration['6_MONTHS']],
          YEARLY: [...defaultStoragePlansByDuration.YEARLY],
        };

        apiPlans.forEach((ap: any) => {
          const key = String(ap.planKey || ap.id || '').toUpperCase();
          const targetDuration: DurationType =
            ap.duration === '6_MONTHS' || key.includes('6_MONTH')
              ? '6_MONTHS'
              : ap.duration === 'YEARLY' || key.includes('YEAR')
              ? 'YEARLY'
              : 'MONTHLY';

          const matchIdx = updated[targetDuration].findIndex((p) =>
            p.name.toLowerCase().includes(String(ap.storageGb || '').toLowerCase()) ||
            p.storageGb.toLowerCase().includes(String(ap.storageGb || '').toLowerCase())
          );

          if (matchIdx !== -1 && ap.priceInr !== undefined) {
            updated[targetDuration][matchIdx] = {
              ...updated[targetDuration][matchIdx],
              price: `₹${Number(ap.priceInr).toLocaleString('en-IN')}`,
              desc: ap.description || updated[targetDuration][matchIdx].desc,
            };
          }
        });

        setPlansByDuration(updated);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const activePlans = plansByDuration[selectedDuration] || defaultStoragePlansByDuration[selectedDuration];

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
          <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-4 sm:mb-5 shadow-xs">
            Plans &amp; Cloud Storage
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-light text-[#09090b] leading-[1.15] mb-4 sm:mb-6">
            Simple, Transparent Storage Pricing
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-xs sm:text-base font-medium">
            Choose your preferred validity: Monthly (3 Plans), 6 Months (1 Plan), or 1 Year (3 Plans). Instant cloud activation upon purchase.
          </p>

          {/* 3 Duration Pills matching Plans & Billing and Homepage */}
          <div className="flex items-center justify-center mt-8 mb-8">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-[#e8dfd3] shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedDuration('MONTHLY')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedDuration === 'MONTHLY'
                    ? 'bg-[#09090b] text-white shadow-md'
                    : 'text-gray-600 hover:text-black bg-transparent'
                }`}
              >
                Monthly (1 Month)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDuration('6_MONTHS')}
                className={`relative px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedDuration === '6_MONTHS'
                    ? 'bg-gradient-to-r from-[#c5a880] to-[#b89665] text-white shadow-md'
                    : 'text-gray-600 hover:text-black bg-transparent'
                }`}
              >
                6 Months (Extended)
                <span className="absolute -top-2.5 right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-[8px] font-black text-white uppercase tracking-wider">
                  HOT
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDuration('YEARLY')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedDuration === 'YEARLY'
                    ? 'bg-[#09090b] text-white shadow-md'
                    : 'text-gray-600 hover:text-black bg-transparent'
                }`}
              >
                1 Year (Annual)
              </button>
            </div>
          </div>

          {/* Pricing cards grid */}
          <div
            className={`grid gap-6 max-w-6xl mx-auto items-stretch ${
              selectedDuration === '6_MONTHS'
                ? 'grid-cols-1 max-w-md'
                : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {activePlans.map((plan) => {
              const isPopular = plan.highlight;

              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                    isPopular
                      ? 'bg-[#09090b] border border-[#c5a880]/40 text-white shadow-2xl scale-100 lg:scale-[1.03] z-10'
                      : 'bg-white border border-[#e3d8c8]/40 hover:border-[#c5a880]/30 text-[#09090b] shadow-xs'
                  }`}
                >
                  {/* Badge */}
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap ${
                      isPopular
                        ? 'bg-[#c5a880] text-[#09090b]'
                        : 'bg-[#f5f2eb] text-[#99732e] border border-[#e3d8c8]'
                    }`}
                  >
                    {isPopular && <Sparkles className="w-2.5 h-2.5 fill-current" />}
                    {plan.badge}
                  </span>

                  <div className="text-left mt-2">
                    <span
                      className={`inline-block text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 ${
                        isPopular ? 'bg-[#c5a880]/20 text-[#c5a880]' : 'bg-[#f5f2eb] text-[#8c6d3f]'
                      }`}
                    >
                      {plan.storageGb} Storage
                    </span>
                    <h3
                      className={`text-lg font-bold tracking-tight ${
                        isPopular ? 'text-[#c5a880]' : 'text-[#09090b]'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-xs mt-1.5 font-medium min-h-[32px] ${
                        isPopular ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      {plan.desc}
                    </p>

                    <div className="flex items-baseline gap-1 mt-5 mb-2 pb-3 border-b border-gray-100/15">
                      <span className="text-3xl sm:text-4xl font-black font-serif-luxury tracking-tight">
                        {plan.price}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isPopular ? 'text-[#c5a880]' : 'text-gray-400'
                        }`}
                      >
                        {plan.period}
                      </span>
                    </div>

                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${
                        isPopular ? 'text-gray-300' : 'text-gray-400'
                      }`}
                    >
                      Validity: {plan.validity}
                    </div>

                    {/* Bullet points list */}
                    <ul className="space-y-2.5 my-4">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                          <span className={isPopular ? 'text-slate-200' : 'text-gray-700'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={plan.href || '/signup'}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center cursor-pointer min-h-[44px] shadow-sm ${
                        isPopular
                          ? 'bg-[#c5a880] hover:bg-white text-[#09090b] font-black'
                          : 'border border-[#09090b]/15 text-[#09090b] bg-transparent hover:bg-slate-50'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee / Security badge */}
          <div className="mt-14 max-w-xl mx-auto flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#c5a880]" />
              Secure Razorpay Checkout
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-4 h-4 text-[#c5a880]" />
              Instant Plan Activation
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-[#c5a880]" />
              AI Face Recognition Included
            </span>
          </div>
        </section>
      </main>
    </PublicWrapper>
  );
}
