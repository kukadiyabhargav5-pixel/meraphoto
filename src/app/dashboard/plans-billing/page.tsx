'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Shield, Zap, Sparkles, Crown, Check, CheckCircle2,
  Lock, ArrowRight, RefreshCw, AlertCircle, HelpCircle,
  Calendar, Flame, CreditCard, Loader2, PartyPopper
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Plan Configurations
export interface PlanTier {
  key: 'BASIC' | 'STARTUP' | 'STANDARD' | 'ESSENTIAL' | 'PREMIUM';
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
    price: 0,
    displayPrice: 'Free',
    period: '/year',
    tagline: 'Free starter tier with limited view-only access',
    popular: false,
    badge: 'Free Tier',
    icon: Shield,
    features: [
      'Free Lifetime Account',
      'Overview & Plans billing only',
      'All dashboard tools locked',
      'Zero photo & video uploads',
      'Upgrade required to create events',
    ],
    specs: {
      photos: '0',
      videos: '0',
      watermark: false,
      portfolio: false,
      digitalAlbum: false,
      support: 'Community Support',
    }
  },
  {
    key: 'STARTUP',
    name: 'Startup',
    price: 3999,
    displayPrice: '₹3,999',
    period: '/year',
    tagline: 'Core event creation & client delivery for emerging studios',
    popular: false,
    badge: 'Starter',
    icon: Zap,
    features: [
      'Store up to 50,000 photos',
      'Store up to 10 event videos',
      'Create Event & Manage Events',
      'Client Quotation Generator',
      'Studio Profile & Galleries',
      'Plans & Billing management',
    ],
    specs: {
      photos: '50,000',
      videos: '10',
      watermark: true,
      portfolio: false,
      digitalAlbum: false,
      support: 'Standard Email',
    }
  },
  {
    key: 'STANDARD',
    name: 'Standard',
    price: 7999,
    displayPrice: '₹7,999',
    period: '/year',
    tagline: 'ALL dashboard tools enabled for professional wedding studios',
    popular: true,
    badge: 'Most Popular',
    icon: Sparkles,
    features: [
      'Store up to 1,00,000 photos',
      'Store up to 20 event videos',
      'ALL Dashboard Buttons Enabled',
      'Bill & Invoice Generator unlocked',
      'Gallery Visitors Lead Capture',
      'Portfolios & Studio Branding',
    ],
    specs: {
      photos: '1,00,000',
      videos: '20',
      watermark: true,
      portfolio: true,
      digitalAlbum: true,
      support: 'Priority Email & Chat',
    }
  },
  {
    key: 'ESSENTIAL',
    name: 'Essential',
    price: 12999,
    displayPrice: '₹12,999',
    period: '/year',
    tagline: 'High volume capacity & speed for busy corporate studios',
    popular: false,
    badge: 'Professional',
    icon: Shield,
    features: [
      'Store up to 1,50,000 photos',
      'Store up to 50 event videos',
      'ALL Dashboard Buttons Enabled',
      'High-Speed Cloud Processing',
      'Dynamic Watermark Protection',
      'Priority 24/7 Support access',
    ],
    specs: {
      photos: '1,50,000',
      videos: '50',
      watermark: true,
      portfolio: true,
      digitalAlbum: true,
      support: 'Priority 24/7',
    }
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: 19999,
    displayPrice: '₹19,999',
    period: '/year',
    tagline: 'Ultimate power & luxury scale for high-volume agencies',
    popular: false,
    badge: 'Enterprise VIP',
    icon: Crown,
    features: [
      'Store up to 3,00,000 photos',
      'Store up to 100 event videos',
      'ALL Dashboard Buttons Enabled',
      'AI Face Recognition & Live Scanner',
      'Dedicated VIP Account Manager',
      'Ultra-Fast Uploads & 24/7 VIP Assistance',
    ],
    specs: {
      photos: '3,00,000',
      videos: '100',
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upgradedPlanName, setUpgradedPlanName] = useState('');
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [cancelOtp, setCancelOtp] = useState(['', '', '', '', '', '']);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';

  // Active studio plan key
  const rawKey = (isSuperAdmin ? 'PREMIUM' : (studio?.subscriptionPlan?.toUpperCase() || authStudio?.subscriptionPlan?.toUpperCase() || 'BASIC'));
  const activePlanKey = (rawKey === 'STARTER' ? 'STARTUP' : rawKey) as PlanTier['key'];

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

  const isBasicActivePlan = activePlanKey === 'BASIC';

  // Date calculations
  const renewalDateString = useMemo(() => {
    if (isBasicActivePlan) return 'Lifetime';
    if (studio?.subscriptionExpiresAt) {
      return new Date(studio.subscriptionExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [studio?.subscriptionExpiresAt, isBasicActivePlan]);

  const purchaseDateString = useMemo(() => {
    if (isBasicActivePlan) {
      // For Basic: show current date (or subscriptionStartDate if available)
      if (studio?.subscriptionStartDate) {
        return new Date(studio.subscriptionStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    let d = new Date();
    if (studio?.subscriptionExpiresAt) {
      d = new Date(studio.subscriptionExpiresAt);
      d.setFullYear(d.getFullYear() - 1);
    }
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [studio?.subscriptionExpiresAt, studio?.subscriptionStartDate, isBasicActivePlan]);

  const daysLeft = useMemo(() => {
    if (isBasicActivePlan) return -1; // -1 means Lifetime
    if (studio?.subscriptionExpiresAt) {
      const diffTime = new Date(studio.subscriptionExpiresAt).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 365;
  }, [studio?.subscriptionExpiresAt, isBasicActivePlan]);

  // Direct Razorpay API Call & Native Checkout Modal Launch
  const handleSelectPlan = async (plan: PlanTier) => {
    if (activePlanKey === plan.key) {
      setSuccessMsg(`You are currently on the ${plan.name} Plan.`);
      return;
    }

    // For Free Basic plan, immediately activate
    if (plan.price === 0) {
      await handleDirectActivate(plan.key);
      return;
    }

    // For Super Admin or instant dev testing, activate plan directly so it can be tested in live UI
    if (isSuperAdmin) {
      await handleDirectActivate(plan.key);
      toast.success(`Active plan switched to ${plan.name}!`);
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

              setUpgradedPlanName(plan.name);
              setShowSuccessModal(true);
              
              // Trigger confetti
              const end = Date.now() + 3 * 1000;
              const colors = ['#c5a880', '#e3d8c8', '#a07c4c', '#ffffff'];
              
              (function frame() {
                confetti({
                  particleCount: 5,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0 },
                  colors: colors
                });
                confetti({
                  particleCount: 5,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1 },
                  colors: colors
                });
              
                if (Date.now() < end) {
                  requestAnimationFrame(frame);
                }
              }());

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
          const failDesc = failRes?.error?.description || failRes?.error?.reason || failRes?.description || 'Transaction declined or cancelled. In Razorpay Test Mode, select "Success" in the mock payment gateway.';
          console.warn('[Razorpay] Payment declined or cancelled:', failDesc, failRes);
          setLoadingPlanKey(null);
          setErrorMsg(failDesc);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }
    } catch (err: any) {
      console.warn('Payment Initiation Notice:', err);
      setLoadingPlanKey(null);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to initiate payment gateway');
    }
  };

  // Direct Plan Activation (useful in development / test mode)
  const handleDirectActivate = async (planKey: string) => {
    try {
      setLoadingPlanKey(planKey);
      setErrorMsg('');
      const res = await apiClient.post('/studio/plan', { plan: planKey });
      if (res.data?.success) {
        if (setStudio) {
          setStudio(res.data.studio);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('studio_plan_updated', { detail: { plan: planKey } }));
          localStorage.setItem('mara_studio_plan_updated', Date.now().toString());
        }
        if (context?.refreshCredits) {
          context.refreshCredits();
        }
        setUpgradedPlanName(planKey);
        setShowSuccessModal(true);
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || 'Failed to activate plan');
    } finally {
      setLoadingPlanKey(null);
    }
  };

  // Downgrade Subscription - Request OTP
  const handleConfirmCancel = async () => {
    try {
      setLoadingCancel(true);
      await apiClient.post('/payment/request-cancel-otp');
      setShowCancelModal(false);
      setShowOtpModal(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to request cancellation OTP');
      setShowCancelModal(false);
    } finally {
      setLoadingCancel(false);
    }
  };

  // Verify OTP and Cancel
  const handleVerifyCancelOTP = async () => {
    const otpString = cancelOtp.join('');
    if (otpString.length !== 6) return setErrorMsg('Please enter a valid 6-digit OTP');
    try {
      setLoadingCancel(true);
      const res = await apiClient.post('/payment/verify-cancel-otp', { otp: otpString });
      setSuccessMsg(res.data.message || 'Subscription cancelled. Downgraded to Basic Free plan.');
      if (setStudio) {
        const updatedStudio = res.data.studio;
        if (updatedStudio) {
          setStudio(updatedStudio);
        } else {
          setStudio((prev: any) => ({ ...prev, subscriptionPlan: 'BASIC', subscriptionStatus: 'ACTIVE', subscriptionStartDate: new Date().toISOString(), subscriptionExpiresAt: null }));
        }
      }
      setShowOtpModal(false);
      setCancelOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...cancelOtp];
    newOtp[index] = val;
    setCancelOtp(newOtp);
    if (val && index < 5) {
      document.getElementById(`cancel-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !cancelOtp[index] && index > 0) {
      document.getElementById(`cancel-otp-${index - 1}`)?.focus();
    }
  };

  // Animation variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#faf9f6] to-[#f4f2eb] text-slate-900 p-3 xs:p-4 sm:p-6 md:p-10 flex flex-col min-h-full font-poppins relative">
      
      {/* Premium Decorative Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#c5a880]/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#e3d8c8]/20 rounded-full blur-[140px] mix-blend-multiply" />
      </div>

      <div className="max-w-[1440px] mx-auto w-full space-y-8 sm:space-y-12 pb-16 relative z-10">

        {/* 1. Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#a07c4c] bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#c5a880]/30 shadow-sm">
                <CreditCard className="w-3.5 h-3.5" /> Pro Studio Tiers
              </span>
            </div>
            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight font-serif-luxury">
              Plans & Billing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 sm:mt-3 max-w-xl">
              Scale your photography studio with cloud storage, advanced watermark protection, and instant digital album delivery.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>Active Plan: <strong className="text-slate-950 uppercase tracking-wide ml-1">{isSuperAdmin ? '👑 VIP SUPER ADMIN (FREE UNLIMITED)' : activePlanKey}</strong></span>
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
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                  <button 
                    onClick={() => handleDirectActivate('STARTUP')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    title="Activate Startup Plan instantly for testing"
                  >
                    ⚡ Test Startup (₹3,999)
                  </button>
                  <button 
                    onClick={() => handleDirectActivate('STANDARD')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    title="Activate Standard Plan instantly for testing"
                  >
                    ⚡ Test Standard (₹7,999)
                  </button>
                  <button 
                    onClick={() => handleDirectActivate('BASIC')}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    title="Activate Basic Plan instantly for testing"
                  >
                    ⚡ Test Basic (Free)
                  </button>
                  <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900 font-black px-1.5 py-1 cursor-pointer">✕</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Active Subscription Card */}
        <style dangerouslySetInnerHTML={{ __html: `
          .premium-active-plan-card {
            background: linear-gradient(135deg, #09090b 0%, #11141c 50%, #0d121f 100%);
            border-radius: 2rem;
            border: 1px solid rgba(197, 168, 128, 0.25);
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .premium-active-plan-card:hover {
            border-color: rgba(197, 168, 128, 0.45);
            box-shadow: 0 30px 70px -15px rgba(197, 168, 128, 0.15);
          }
          .premium-glow-1 {
            position: absolute;
            top: -40%;
            right: -15%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(197, 168, 128, 0.12) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
          }
          .premium-glow-2 {
            position: absolute;
            bottom: -40%;
            left: -15%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
          }
          .premium-badge {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #c5a880;
            background: rgba(197, 168, 128, 0.12);
            padding: 6px 14px;
            border-radius: 9999px;
            border: 1px solid rgba(197, 168, 128, 0.25);
          }
          .premium-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 800;
            color: #34d399;
            background: rgba(52, 211, 153, 0.1);
            padding: 6px 14px;
            border-radius: 9999px;
            border: 1px solid rgba(52, 211, 153, 0.25);
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .pulse-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #34d399;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
            100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
          }
          .premium-plan-title {
            font-size: clamp(1.85rem, 3.2vw, 2.75rem);
            font-weight: 900;
            background: linear-gradient(to right, #ffffff, #f1f5f9);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
            line-height: 1.15;
          }
          .premium-plan-price {
            font-size: 13px;
            font-weight: 800;
            padding: 5px 14px;
            border-radius: 9999px;
            white-space: nowrap;
          }
          .premium-plan-desc {
            font-size: 13px;
            color: #94a3b8;
            font-weight: 500;
            margin-top: 10px;
            max-width: 580px;
            line-height: 1.6;
          }
          .premium-meta-card {
            background: rgba(255, 255, 255, 0.035);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.25rem;
            padding: 14px 18px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 130px;
            transition: all 0.3s ease;
          }
          .premium-meta-card:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(197, 168, 128, 0.3);
            transform: translateY(-2px);
          }
          .premium-meta-label {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.15em;
          }
          .premium-meta-value {
            font-weight: 700;
            color: #f8fafc;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13.5px;
            white-space: nowrap;
          }
          .highlight-value {
            color: #FFD700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
          }
          .premium-cancel-btn {
            padding: 10px 20px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 800;
            color: #fb7185;
            background: rgba(251, 113, 133, 0.08);
            border: 1px solid rgba(251, 113, 133, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .premium-cancel-btn:hover {
            background: rgba(251, 113, 133, 0.15);
            border-color: rgba(251, 113, 133, 0.4);
            transform: scale(1.03);
          }
        `}} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="premium-active-plan-card relative overflow-hidden group shadow-2xl">
          <div className="premium-glow-1" />
          <div className="premium-glow-2" />

          <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
            
            {/* Top Bar: Tier Badges & Lifetime Status */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="premium-badge">
                  {isSuperAdmin ? '👑 Super Admin VIP Tier' : 'Current Studio Tier'}
                </span>
                <span className="premium-status-badge">
                  <span className="pulse-dot" />
                  {isSuperAdmin ? 'ACTIVE FOREVER' : (studio?.subscriptionStatus || 'ACTIVE')}
                </span>
              </div>

              {isSuperAdmin ? (
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm select-none">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>👑 Lifetime Free VIP</span>
                </div>
              ) : isBasicActivePlan ? (
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm select-none">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free Forever</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="premium-cancel-btn"
                >
                  Cancel Plan
                </button>
              )}
            </div>

            {/* Main Content: Left info + Right meta cards */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Plan Title, Price & Description */}
              <div className="xl:col-span-6 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <h3 className="premium-plan-title">
                    {isSuperAdmin ? 'UNLIMITED VIP Plan' : `${activePlanKey} Plan`}
                  </h3>
                  <span 
                    className="premium-plan-price"
                    style={{
                      color: isSuperAdmin ? '#34d399' : '#c5a880',
                      borderColor: isSuperAdmin ? 'rgba(52, 211, 153, 0.4)' : 'rgba(197, 168, 128, 0.3)',
                      background: isSuperAdmin ? 'rgba(52, 211, 153, 0.12)' : 'rgba(197, 168, 128, 0.1)'
                    }}
                  >
                    {isSuperAdmin ? '₹0 • 100% Free Lifetime' : `${PLANS_DATA.find(p => p.key === activePlanKey)?.displayPrice || 'Free'} / year`}
                  </span>
                </div>

                <p className="premium-plan-desc">
                  {isSuperAdmin 
                    ? 'Unlimited high-resolution photos, 4K videos, AI face recognition, custom watermarks, and all enterprise studio facilities completely free for lifetime.'
                    : (PLANS_DATA.find(p => p.key === activePlanKey)?.tagline || 'Studio Plan active on Mara Photo')}
                </p>
              </div>

              {/* Right Column: 3 Clean Meta Cards */}
              <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                
                <div className="premium-meta-card">
                  <span className="premium-meta-label">{isSuperAdmin ? 'Plan Validity' : 'Start Date'}</span>
                  <div className="premium-meta-value">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isSuperAdmin ? 'Lifetime Access' : purchaseDateString}</span>
                  </div>
                </div>

                <div className="premium-meta-card">
                  <span className="premium-meta-label">{isSuperAdmin ? 'Storage & Uploads' : 'End Date'}</span>
                  <div className="premium-meta-value">
                    <Sparkles className="w-4 h-4 text-[#c5a880] shrink-0" />
                    <span>{isSuperAdmin ? '∞ Unlimited' : renewalDateString}</span>
                  </div>
                </div>

                <div className="premium-meta-card">
                  <span className="premium-meta-label">{isSuperAdmin ? 'Access Period' : 'Days Left'}</span>
                  <div className="premium-meta-value highlight-value">
                    <Crown className="w-4 h-4 text-[#FFD700] shrink-0" />
                    <span>{isSuperAdmin ? '∞ Forever' : (daysLeft === -1 ? '∞ Lifetime' : `${daysLeft} Days`)}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </motion.div>

        {/* 3. Pricing Plans Grid (Hidden for Super Admin) */}
        {!isSuperAdmin ? (
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-3 xl:gap-3 2xl:gap-4 pt-4 items-stretch"
            >
              {PLANS_DATA.map((plan) => {
                const isCurrent = activePlanKey === plan.key;
                const isLoading = loadingPlanKey === plan.key;
                const Icon = plan.icon;

                return (
                  <motion.div
                    variants={itemVariants}
                    key={plan.key}
                    whileHover={!isCurrent ? { y: -6, scale: 1.015 } : undefined}
                    onClick={() => !isLoading && !isCurrent && handleSelectPlan(plan)}
                    className={`relative rounded-[1.75rem] p-4 sm:p-5 xl:p-3.5 2xl:p-5 flex flex-col justify-between transition-all duration-300 ease-out flex-1 backdrop-blur-sm ${
                      isCurrent
                        ? 'bg-white/95 border-2 border-emerald-500 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.3)] scale-[1.015] z-10'
                        : plan.popular
                          ? 'bg-slate-900/95 border border-[#c5a880]/30 text-white shadow-[0_20px_50px_-12px_rgba(197,168,128,0.2)] cursor-pointer z-10 hover:border-[#c5a880]'
                          : 'bg-white/70 border border-slate-200/80 shadow-lg cursor-pointer hover:border-[#c5a880]/50 hover:shadow-[0_20px_40px_-12px_rgba(197,168,128,0.15)]'
                    }`}
                  >
                    {/* Background Glows for Dark Card */}
                    {plan.popular && !isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-b from-[#c5a880]/10 to-transparent rounded-[1.75rem] pointer-events-none" />
                    )}

                    {/* Popular Badge */}
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#c5a880] to-[#a07c4c] text-white text-[9px] xl:text-[8.5px] 2xl:text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1 border border-white/20">
                        <Flame className="w-3 h-3 fill-white" /> MOST POPULAR
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] xl:text-[8.5px] 2xl:text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-white/20">
                        ACTIVE PLAN
                      </div>
                    )}

                    <div className="relative z-10 flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className={`text-[9.5px] font-black uppercase tracking-wider ${isCurrent ? 'text-emerald-600' : plan.popular ? 'text-[#c5a880]' : 'text-[#a07c4c]'}`}>
                            {plan.badge}
                          </span>
                          <h3 className={`text-xl xl:text-lg 2xl:text-2xl font-black tracking-tight mt-0.5 ${plan.popular && !isCurrent ? 'text-white' : 'text-slate-900'}`}>
                            {plan.name}
                          </h3>
                        </div>
                        <div className={`w-10 h-10 xl:w-9 xl:h-9 2xl:w-11 2xl:h-11 rounded-xl 2xl:rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isCurrent ? 'bg-emerald-50 text-emerald-600' : 
                          plan.popular ? 'bg-white/10 text-[#c5a880] backdrop-blur-md' : 
                          'bg-slate-50 text-slate-400 group-hover:bg-[#c5a880]/10 group-hover:text-[#c5a880]'
                        }`}>
                          <Icon className="w-5 h-5 xl:w-4.5 xl:h-4.5 2xl:w-5.5 2xl:h-5.5" />
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className={`text-3xl xl:text-2xl 2xl:text-3xl font-black tracking-tight font-serif-luxury ${plan.popular && !isCurrent ? 'text-white' : 'text-slate-950'}`}>
                          {plan.displayPrice}
                        </span>
                        <span className={`text-[11px] font-bold ${plan.popular && !isCurrent ? 'text-slate-400' : 'text-slate-500'}`}>
                          {plan.period}
                        </span>
                      </div>

                      <p className={`text-xs font-medium leading-relaxed pb-4 border-b ${plan.popular && !isCurrent ? 'text-slate-300 border-white/10' : 'text-slate-500 border-slate-100'}`}>
                        {plan.tagline}
                      </p>

                      {/* Features List */}
                      <ul className="space-y-3 my-5 xl:my-4 2xl:my-6">
                        {plan.features.map((feat, i) => (
                          <li key={i} className={`flex items-start gap-2 text-xs font-semibold ${plan.popular && !isCurrent ? 'text-slate-200' : 'text-slate-700'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              isCurrent ? 'bg-emerald-50 text-emerald-500' : 
                              plan.popular ? 'bg-[#c5a880]/20 text-[#c5a880]' : 
                              'bg-[#c5a880]/10 text-[#c5a880]'
                            }`}>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="leading-tight pt-0.5 text-[11px] xl:text-[10.5px] 2xl:text-xs">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Choose Plan CTA */}
                    <div className={`mt-auto pt-4 border-t ${plan.popular && !isCurrent ? 'border-white/10' : 'border-slate-100'}`}>
                      <button
                        type="button"
                        disabled={isLoading || isCurrent}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCurrent) handleSelectPlan(plan);
                        }}
                        className={`group w-full py-3 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl text-[11px] xl:text-[10.5px] 2xl:text-xs font-black uppercase tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm min-h-[42px] cursor-pointer overflow-hidden select-none ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500/30 cursor-default shadow-xs'
                            : isLoading
                              ? 'bg-slate-200 text-slate-500 cursor-wait opacity-80'
                              : plan.popular
                                ? 'bg-[#c5a880] hover:bg-[#d6bc97] text-slate-950 font-black shadow-lg shadow-[#c5a880]/25 hover:-translate-y-0.5 active:translate-y-0'
                                : 'bg-slate-900 hover:bg-[#c5a880] hover:text-slate-950 text-white font-extrabold shadow-md shadow-slate-900/10 hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate">Current Plan</span>
                          </>
                        ) : isLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span className="truncate">Processing...</span>
                          </>
                        ) : (
                          <>
                            <span className="truncate">Choose {plan.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ) : (
          /* VIP Super Admin Privileges Overview (Zero commercial plans shown) */
          <div className="space-y-6 pt-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-amber-50/20 to-white border border-amber-300/40 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-2xl shrink-0">
                    👑
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                      VIP Super Admin Lifetime Free Account
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                        All Features Unlocked Forever
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      As Super Admin, your studio is permanently exempt from all subscription charges, photo/video quotas, and plan tiers.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/admin-dashboard"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-sm"
                  >
                    Admin Overview
                  </Link>
                  <Link
                    href="/admin-dashboard/events"
                    className="px-4 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#b0936b] text-slate-950 text-xs font-black transition-all shadow-sm"
                  >
                    Manage Events
                  </Link>
                </div>
              </div>

              {/* 4 Super Admin Unlimited Perks Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black mb-3 text-lg">
                    ∞
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Unlimited Photos</h4>
                  <p className="text-xs text-slate-500 mt-1">Full resolution uploads with zero compression and no quota limit.</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black mb-3 text-lg">
                    🎥
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Unlimited 4K Videos</h4>
                  <p className="text-xs text-slate-500 mt-1">Upload cinematic video highlights and reels with no duration limits.</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mb-3 text-lg">
                    ✨
                  </div>
                  <h4 className="text-sm font-black text-slate-900">AI Face Recognition</h4>
                  <p className="text-xs text-slate-500 mt-1">Fast InsightFace buffalo_l AI search permanently enabled for all guests.</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mb-3 text-lg">
                    🛡️
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Custom Branding</h4>
                  <p className="text-xs text-slate-500 mt-1">Transparent studio watermark stamps and full white-label gallery access.</p>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* OTP Verification Modal for Downgrade */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Verify Cancellation</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                An OTP has been sent to your email to confirm the cancellation.
              </p>
              
              <div className="flex justify-center gap-3 mb-8">
                {cancelOtp.map((val, idx) => (
                  <input
                    key={idx}
                    id={`cancel-otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-black text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 transition-all shadow-sm"
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  onClick={handleVerifyCancelOTP}
                  disabled={loadingCancel}
                  className="w-full py-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center"
                >
                  {loadingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-full max-w-lg bg-white rounded-[2rem] p-10 shadow-2xl border border-slate-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c5a880]/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                  <PartyPopper className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2 font-serif-luxury">Congratulations!</h3>
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                  Your studio has successfully been upgraded to the <strong className="text-emerald-600 uppercase tracking-widest text-xs ml-1 mr-1">{upgradedPlanName}</strong> Plan. You now have access to all the premium features!
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 rounded-xl bg-slate-900 hover:bg-[#c5a880] text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-slate-900/20 hover:shadow-[#c5a880]/30 hover:-translate-y-1"
                >
                  Start Using New Features
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
