'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Shield, Zap, Sparkles, Crown, Check, CheckCircle2,
  Lock, ArrowRight, RefreshCw, AlertCircle, HelpCircle,
  Calendar, Flame
} from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Plan Configurations
export interface PlanTier {
  key: 'BASIC' | 'STANDARD' | 'ESSENTIAL' | 'PREMIUM';
  name: string;
  price: number;
  displayPrice: string;
  period: string;
  tagline: string;
  popular?: boolean;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  specs: {
    photos: string;
    videos: string;
    watermark: boolean;
    portfolio: boolean;
    digitalAlbum: boolean;
    support: string;
  };
}

const PLANS_DATA: PlanTier[] = [
  {
    key: 'BASIC',
    name: 'Basic',
    price: 3500,
    displayPrice: '₹3,500',
    period: '/year',
    tagline: 'Ideal for independent photographers starting digital delivery',
    popular: false,
    badge: 'Starter',
    icon: Shield,
    features: [
      'Store up to 50,000 photos',
      'Store up to 10 event videos',
      'Custom Business Branding',
      'One-Click Bulk Download',
      'Instant Web Mode Access',
      'Standard Email Support',
    ],
    specs: {
      photos: '50,000',
      videos: '10',
      watermark: false,
      portfolio: false,
      digitalAlbum: false,
      support: 'Standard Email',
    }
  },
  {
    key: 'STANDARD',
    name: 'Standard',
    price: 7900,
    displayPrice: '₹7,900',
    period: '/year',
    tagline: 'Best for growing photo studios with frequent wedding shoots',
    popular: true,
    badge: 'Most Popular',
    icon: Zap,
    features: [
      'Store up to 1,50,000 photos',
      'Store up to 100 event videos',
      'Dynamic Watermark Protection',
      'Multi-Day Event Support',
      'Client Selection Dashboard',
      'Includes all Basic features',
    ],
    specs: {
      photos: '1,50,000',
      videos: '100',
      watermark: true,
      portfolio: false,
      digitalAlbum: false,
      support: 'Priority Email',
    }
  },
  {
    key: 'ESSENTIAL',
    name: 'Essential',
    price: 15900,
    displayPrice: '₹15,900',
    period: '/year',
    tagline: 'Full-featured toolkit for professional wedding & corporate teams',
    popular: false,
    badge: 'Professional',
    icon: Sparkles,
    features: [
      'Store up to 3,00,000 photos',
      'Store up to 200 event videos',
      'Client Favourites & Selections',
      'Switch on/off Public Downloads',
      'Custom Portfolio Website',
      'Includes all Standard features',
    ],
    specs: {
      photos: '3,00,000',
      videos: '200',
      watermark: true,
      portfolio: true,
      digitalAlbum: false,
      support: 'Priority 24/7',
    }
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: 31900,
    displayPrice: '₹31,900',
    period: '/year',
    tagline: 'Maximum power & capacity for large luxury production agencies',
    popular: false,
    badge: 'Enterprise',
    icon: Crown,
    features: [
      'Store up to 7,50,000 photos',
      'Store up to 500 event videos',
      'Interactive Digital Album Mode',
      'Dedicated Fast Bandwidth',
      'VIP Priority 24/7 Support',
      'Includes all Essential features',
    ],
    specs: {
      photos: '7,50,000',
      videos: '500',
      watermark: true,
      portfolio: true,
      digitalAlbum: true,
      support: 'VIP Dedicated 24/7',
    }
  },
];

export default function PlansBillingPage() {
  const context = useDashboard();
  const { user, studio: authStudio } = useAuth();

  const studio = context?.studio || authStudio;
  const setStudio = context?.setStudio;
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loadingPlanKey, setLoadingPlanKey] = useState<string | null>(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Active studio plan key
  const activePlanKey = (studio?.subscriptionPlan?.toUpperCase() || authStudio?.subscriptionPlan?.toUpperCase() || 'BASIC') as PlanTier['key'];

  // Load Razorpay Checkout SDK Script Dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch latest studio profile on mount & on focus
  useEffect(() => {
    const fetchLatestStudio = () => {
      apiClient.get('/studio/me').then(res => {
        if (res.data?.studio && setStudio) {
          setStudio(res.data.studio);
        }
      }).catch(console.error);
    };

    fetchLatestStudio();

    window.addEventListener('focus', fetchLatestStudio);
    window.addEventListener('studio_plan_updated', fetchLatestStudio);
    window.addEventListener('storage', fetchLatestStudio);

    return () => {
      window.removeEventListener('focus', fetchLatestStudio);
      window.removeEventListener('studio_plan_updated', fetchLatestStudio);
      window.removeEventListener('storage', fetchLatestStudio);
    };
  }, [setStudio]);

  // Next renewal date calculation
  const renewalDate = useMemo(() => {
    if (studio?.subscriptionExpiresAt) {
      return new Date(studio.subscriptionExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [studio?.subscriptionExpiresAt]);

  // Direct Razorpay API Call & Native Checkout Modal Launch
  const handleSelectPlan = async (plan: PlanTier) => {
    if (activePlanKey === plan.key) {
      setSuccessMsg(`You are currently on the ${plan.name} Plan.`);
      return;
    }

    try {
      setLoadingPlanKey(plan.key);
      setErrorMsg('');
      setSuccessMsg('');

      // 1. Ensure Razorpay SDK is available
      if (typeof window === 'undefined' || !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
          setTimeout(resolve, 1500);
        });
      }

      // 2. Direct Call to Create Order Session on Backend
      const orderPayload = {
        customerDetails: {
          fullName: user?.name || studio?.name || 'Studio Owner',
          email: user?.email || 'studio@maraphoto.com',
          phone: (user as any)?.phone || '9876543210',
          companyName: studio?.name || undefined,
        },
        billingAddress: {
          address: studio?.name ? `${studio.name} Studio HQ` : 'Studio Address',
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395006',
          country: 'India',
        },
        cartItems: [
          {
            name: `${plan.name} Studio Plan`,
            price: plan.price,
            quantity: 1,
            planKey: plan.key,
            description: plan.tagline,
          },
        ],
        paymentMethod: 'UPI',
      };

      const createRes = await apiClient.post('/payment/create-order', orderPayload);
      const { orderId, razorpayOrderId, amount, currency, key } = createRes.data;

      if (!razorpayOrderId) {
        throw new Error('Could not initialize Razorpay payment order from server');
      }

      // 3. Open Official Razorpay Checkout Modal Directly (Razorpay's native styling)
      const options: any = {
        key: key || 'rzp_test_TCrfzMZeYCcbsJ',
        amount: amount,
        currency: currency || 'INR',
        name: 'Mara Photo',
        description: `${plan.name} Plan Annual Subscription`,
        image: studio?.logoUrl || '/logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || studio?.name || '',
          email: user?.email || '',
          contact: (user as any)?.phone || '',
        },
        theme: {
          color: '#09090b',
        },
        modal: {
          ondismiss: () => {
            setLoadingPlanKey(null);
          },
        },
        handler: async (response: any) => {
          try {
            // 4. Verify Cryptographic Signature on Backend
            const verifyRes = await apiClient.post('/payment/verify', {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              if (setStudio) {
                setStudio((prev: any) => ({
                  ...prev,
                  subscriptionPlan: plan.key,
                  subscriptionStatus: 'ACTIVE',
                  razorpaySubscriptionId: response.razorpay_payment_id,
                }));
              }

              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('studio_plan_updated', { detail: { plan: plan.key } }));
                localStorage.setItem('mara_studio_plan_updated', Date.now().toString());
              }

              if (context?.refreshCredits) {
                context.refreshCredits();
              }

              setSuccessMsg(`🎉 Success! Your studio has been upgraded to the ${plan.name} Plan.`);
            } else {
              throw new Error(verifyRes.data.error || 'Payment signature verification failed');
            }
          } catch (verifyErr: any) {
            console.error('Verification Error:', verifyErr);
            setErrorMsg(verifyErr.response?.data?.error || 'Payment verification failed. Please contact support.');
          } finally {
            setLoadingPlanKey(null);
          }
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (failRes: any) => {
          console.error('Razorpay Payment Failed:', failRes.error);
          setLoadingPlanKey(null);
          setErrorMsg(failRes.error?.description || 'Transaction declined or failed. Please try again.');
        });
        rzp.open();
      } else {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      setLoadingPlanKey(null);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to initiate payment gateway');
    }
  };

  // Downgrade Subscription
  const handleConfirmCancel = async () => {
    try {
      setLoadingCancel(true);
      const res = await apiClient.post('/payment/cancel');
      setSuccessMsg(res.data.message || 'Subscription cancelled. Downgraded to Basic.');
      if (setStudio) {
        setStudio((prev: any) => ({ ...prev, subscriptionPlan: 'BASIC', subscriptionStatus: 'ACTIVE' }));
      }
      setShowCancelModal(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#faf9f6] text-slate-900 p-4 sm:p-6 md:p-10 flex flex-col min-h-full font-poppins">
      
      {/* Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#c5a880]/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#e3d8c8]/25 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-10 pb-16 relative z-10">

        {/* 1. Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a07c4c] bg-[#c5a880]/15 px-3.5 py-1.5 rounded-full border border-[#c5a880]/30 shadow-xs">
                PRO STUDIO TIERS
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight font-serif-luxury mt-2">
              Plans & Billing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-xl">
              Scale your photography studio with cloud storage, watermark protection, and instant digital album delivery.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Plan: <strong className="text-slate-900">{activePlanKey}</strong></span>
            </div>
            <Link
              href="/dashboard/support-help"
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/40 transition-all duration-300 shadow-sm hover:rotate-6"
              title="Billing Support"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer font-black text-sm">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900 cursor-pointer font-black text-sm">✕</button>
          </div>
        )}

        {/* 2. Active Subscription Card */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-[2rem] border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.03)] p-6 sm:p-8 relative overflow-hidden group hover:border-[#c5a880]/50 hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a880]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#c5a880]/15 transition-all duration-700" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c5a880] bg-[#c5a880]/10 px-3.5 py-1.5 rounded-full border border-[#c5a880]/25">
                  Current Studio Tier
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {studio?.subscriptionStatus || 'ACTIVE'}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mt-4">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif-luxury">
                  {activePlanKey} Plan
                </h3>
                <span className="text-sm font-bold text-slate-500">
                  {PLANS_DATA.find(p => p.key === activePlanKey)?.displayPrice || '₹3,500'} / year
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium mt-2 max-w-xl">
                {PLANS_DATA.find(p => p.key === activePlanKey)?.tagline || 'Studio Plan active on Mara Photo'}
              </p>
            </div>

            {/* Right Meta Info */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 text-xs border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-4 lg:pt-0 lg:pl-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Renewal</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#c5a880]" /> {renewalDate}
                </span>
              </div>

              <div className="space-y-1 sm:pl-6 sm:border-l border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Security</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Razorpay Secured
                </span>
              </div>

              {activePlanKey !== 'BASIC' && (
                <div className="sm:pl-6 sm:border-l border-slate-200/80">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-300 hover:scale-105 cursor-pointer shadow-xs"
                  >
                    Cancel Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Pricing Plans Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif-luxury">
                Choose Your Plan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Click any plan to open direct Razorpay checkout and upgrade your studio instantly.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">
              Annual Billing (12 Months)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {PLANS_DATA.map((plan) => {
              const isCurrent = activePlanKey === plan.key;
              const isLoading = loadingPlanKey === plan.key;
              const Icon = plan.icon;

              return (
                <div
                  key={plan.key}
                  onClick={() => !isLoading && !isCurrent && handleSelectPlan(plan)}
                  className={`relative rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 ${
                    isCurrent
                      ? 'bg-white/95 border-2 border-emerald-500/50 shadow-md'
                      : plan.popular
                        ? 'bg-white border-2 border-slate-900 shadow-xl hover:shadow-2xl ring-1 ring-slate-900/10 cursor-pointer hover:-translate-y-2.5'
                        : 'bg-white/95 border border-slate-200/90 shadow-sm hover:border-[#c5a880] hover:shadow-xl cursor-pointer hover:-translate-y-2.5'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && !isCurrent && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap z-10 flex items-center gap-1.5 border border-white/20">
                      <Flame className="w-3 h-3 text-[#c5a880] fill-[#c5a880]" /> MOST POPULAR
                    </span>
                  )}

                  {isCurrent && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap z-10 font-bold">
                      ACTIVE PLAN
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#a07c4c]">
                          {plan.badge}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-[#a07c4c] transition-colors">
                          {plan.name}
                        </h3>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-[#c5a880] group-hover:text-white group-hover:shadow-lg group-hover:rotate-6 transition-all duration-300 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-serif-luxury">
                        {plan.displayPrice}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {plan.period}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed pb-4 border-b border-slate-100">
                      {plan.tagline}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-3 my-6">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                          <div className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-[#c5a880]/20 text-slate-500 group-hover:text-[#a07c4c] flex items-center justify-center shrink-0 mt-0.5 transition-all">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Choose Plan CTA */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isLoading || isCurrent}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCurrent) handleSelectPlan(plan);
                      }}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : isLoading
                            ? 'bg-slate-900 text-white cursor-wait opacity-80'
                            : plan.popular
                              ? 'bg-slate-950 hover:bg-[#c5a880] text-white hover:text-slate-950 shadow-md hover:shadow-lg cursor-pointer'
                              : 'bg-slate-900 hover:bg-[#c5a880] text-white hover:text-slate-950 shadow-sm cursor-pointer'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Current Active Plan</span>
                        </>
                      ) : isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <span>Choose {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Downgrade Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-4 animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Downgrade to Basic?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your subscription will be downgraded to the Basic plan.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Keep Current Plan
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loadingCancel}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                {loadingCancel ? 'Downgrading...' : 'Yes, Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
