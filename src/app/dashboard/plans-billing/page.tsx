'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Sparkles, Crown, Check, CheckCircle2,
  Lock, ArrowRight, RefreshCw, AlertCircle, HelpCircle,
  Calendar, Flame, CreditCard
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#faf9f6] to-[#f4f2eb] text-slate-900 p-4 sm:p-6 md:p-10 flex flex-col min-h-full font-poppins relative">
      
      {/* Premium Decorative Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#c5a880]/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#e3d8c8]/20 rounded-full blur-[140px] mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-12 pb-16 relative z-10">

        {/* 1. Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#a07c4c] bg-white px-4 py-2 rounded-full border border-[#c5a880]/30 shadow-sm">
                <CreditCard className="w-3.5 h-3.5" /> Pro Studio Tiers
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight font-serif-luxury">
              Plans & Billing
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-3 max-w-xl">
              Scale your photography studio with cloud storage, advanced watermark protection, and instant digital album delivery.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>Active Plan: <strong className="text-slate-950 uppercase tracking-wide ml-1">{activePlanKey}</strong></span>
            </div>
            <Link
              href="/dashboard/support-help"
              className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 text-slate-500 hover:text-[#c5a880] hover:border-[#c5a880]/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
              title="Billing Support"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        {/* Success / Error Messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-black">✕</button>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900 font-black">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Active Subscription Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#c5a880]/20 to-transparent rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-[60px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c5a880] bg-[#c5a880]/10 px-4 py-1.5 rounded-full border border-[#c5a880]/20">
                  Current Studio Tier
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {studio?.subscriptionStatus || 'ACTIVE'}
                </span>
              </div>

              <div className="flex items-baseline gap-4 mt-2">
                <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-serif-luxury">
                  {activePlanKey} Plan
                </h3>
                <span className="text-sm font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-xl">
                  {PLANS_DATA.find(p => p.key === activePlanKey)?.displayPrice || '₹3,500'} / year
                </span>
              </div>

              <p className="text-sm text-slate-400 font-medium mt-3 max-w-xl">
                {PLANS_DATA.find(p => p.key === activePlanKey)?.tagline || 'Studio Plan active on Mara Photo'}
              </p>
            </div>

            {/* Right Meta Info */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-8 text-xs border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-10">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Next Renewal</span>
                <span className="font-bold text-white flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-[#c5a880]" /> {renewalDate}
                </span>
              </div>



              <div className="sm:pl-8 sm:border-l border-white/10">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 border border-rose-400/20 transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  Cancel Plan
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Pricing Plans Grid */}
        <div className="space-y-8 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-center sm:text-left">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif-luxury">
                Upgrade Your Studio
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Select the perfect plan to handle more events and deliver stunning digital albums.
              </p>
            </div>
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white shadow-md mx-auto sm:mx-0">
              <span className="text-xs font-bold font-mono tracking-widest">ANNUAL BILLING</span>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pt-4 items-stretch"
          >
            {PLANS_DATA.map((plan) => {
              const isCurrent = activePlanKey === plan.key;
              const isLoading = loadingPlanKey === plan.key;
              const Icon = plan.icon;

              return (
                <motion.div
                  variants={itemVariants}
                  key={plan.key}
                  onClick={() => !isLoading && !isCurrent && handleSelectPlan(plan)}
                  className={`relative rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-500 ease-out flex-1 ${
                    isCurrent
                      ? 'bg-white border-2 border-emerald-500 shadow-xl scale-[1.02] z-10'
                      : plan.popular
                        ? 'bg-slate-900 border-2 border-slate-900 text-white shadow-2xl hover:shadow-[#c5a880]/20 hover:-translate-y-3 cursor-pointer z-10'
                        : 'bg-white border border-slate-200/80 shadow-md hover:border-[#c5a880] hover:shadow-xl cursor-pointer hover:-translate-y-2'
                  }`}
                >
                  {/* Background Glows for Dark Card */}
                  {plan.popular && !isCurrent && (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#c5a880]/10 to-transparent rounded-[2rem] pointer-events-none" />
                  )}

                  {/* Popular Badge */}
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#c5a880] to-[#a07c4c] text-white text-[10px] font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-white/20">
                      <Flame className="w-3.5 h-3.5 fill-white" /> MOST POPULAR
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap border border-white/20">
                      ACTIVE PLAN
                    </div>
                  )}

                  <div className="relative z-10 flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-emerald-600' : plan.popular ? 'text-[#c5a880]' : 'text-[#a07c4c]'}`}>
                          {plan.badge}
                        </span>
                        <h3 className={`text-2xl font-black tracking-tight mt-1 ${plan.popular && !isCurrent ? 'text-white' : 'text-slate-900'}`}>
                          {plan.name}
                        </h3>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isCurrent ? 'bg-emerald-50 text-emerald-600' : 
                        plan.popular ? 'bg-white/10 text-[#c5a880] backdrop-blur-md' : 
                        'bg-slate-50 text-slate-400 group-hover:bg-[#c5a880]/10 group-hover:text-[#c5a880]'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span className={`text-4xl font-black tracking-tight font-serif-luxury ${plan.popular && !isCurrent ? 'text-white' : 'text-slate-950'}`}>
                        {plan.displayPrice}
                      </span>
                      <span className={`text-xs font-bold ${plan.popular && !isCurrent ? 'text-slate-400' : 'text-slate-500'}`}>
                        {plan.period}
                      </span>
                    </div>

                    <p className={`text-xs font-medium leading-relaxed pb-6 border-b ${plan.popular && !isCurrent ? 'text-slate-300 border-white/10' : 'text-slate-500 border-slate-100'}`}>
                      {plan.tagline}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-4 my-8">
                      {plan.features.map((feat, i) => (
                        <li key={i} className={`flex items-start gap-3 text-xs font-bold ${plan.popular && !isCurrent ? 'text-slate-200' : 'text-slate-700'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isCurrent ? 'bg-emerald-50 text-emerald-500' : 
                            plan.popular ? 'bg-[#c5a880]/20 text-[#c5a880]' : 
                            'bg-[#c5a880]/10 text-[#c5a880]'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="leading-tight pt-0.5">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Choose Plan CTA */}
                  <div className={`mt-auto pt-6 border-t ${plan.popular && !isCurrent ? 'border-white/10' : 'border-slate-100'}`}>
                    <button
                      type="button"
                      disabled={isLoading || isCurrent}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCurrent) handleSelectPlan(plan);
                      }}
                      className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-emerald-50 text-emerald-700 cursor-default'
                          : isLoading
                            ? 'bg-slate-200 text-slate-500 cursor-wait opacity-80'
                            : plan.popular
                              ? 'bg-[#c5a880] hover:bg-white text-slate-900 shadow-xl shadow-[#c5a880]/20 cursor-pointer'
                              : 'bg-slate-900 hover:bg-[#c5a880] text-white shadow-lg shadow-slate-900/10 cursor-pointer'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Current Plan</span>
                        </>
                      ) : isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Choose {plan.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

      </div>

      {/* Downgrade Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Downgrade to Basic?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Your studio will lose access to premium features, advanced storage, and digital albums. Your subscription will revert to the Basic starter tier.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Keep Current Plan
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={loadingCancel}
                  className="w-full py-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center"
                >
                  {loadingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Downgrade'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
