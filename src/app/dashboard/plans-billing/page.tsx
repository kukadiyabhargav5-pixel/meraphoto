'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Shield,
  Zap,
  Sparkles,
  Crown,
  Check,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Calendar,
  CreditCard,
  Loader2,
  HardDrive,
  Cloud,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Star,
  Users,
  Image as ImageIcon,
  Video,
  FileCheck,
  Flame,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BillingCategory,
  StoragePlan,
  StorageUsage,
  CANONICAL_STORAGE_PLANS,
  fetchStoragePlans,
  fetchStorageUsage,
  formatInr,
  formatBytes,
} from '@/lib/storage';
import StorageRecentActivity from '@/components/storage/StorageRecentActivity';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PlansBillingPage() {
  const context = useDashboard();
  const { user, studio: authStudio } = useAuth();
  const studio = context?.studio || authStudio;
  const setStudio = context?.setStudio;

  // Billing Category tab: 'MONTHLY' | '6_MONTHS' | 'YEARLY'
  const [selectedDuration, setSelectedDuration] = useState<BillingCategory>('6_MONTHS');

  // Storage Plans and Usage Data
  const [storagePlans, setStoragePlans] = useState<StoragePlan[]>(CANONICAL_STORAGE_PLANS);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);

  // Checkout states
  const [loadingPlanKey, setLoadingPlanKey] = useState<string | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    planName: string;
    amount: number;
    orderNumber?: string;
    expiresAt?: string;
  } | null>(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';

  // Load Razorpay Checkout SDK Script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch Storage Plans and Usage
  const refreshStorageData = async () => {
    try {
      setLoadingStorage(true);
      const [plans, usage] = await Promise.all([
        fetchStoragePlans(),
        fetchStorageUsage(),
      ]);
      if (plans && plans.length > 0) setStoragePlans(plans);
      if (usage) setStorageUsage(usage);
    } catch (err) {
      console.error('Failed to load storage data:', err);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    refreshStorageData();
    window.addEventListener('storage_updated', refreshStorageData);
    return () => window.removeEventListener('storage_updated', refreshStorageData);
  }, []);

  // Active Plan Detection
  const hasPaidActivePlan = Boolean(
    isSuperAdmin ||
    (storageUsage?.hasActivePlan &&
     storageUsage?.activePlan?.status === 'ACTIVE' &&
     storageUsage?.activePlan?.planId &&
     storageUsage?.activePlan?.planId !== 'free-starter')
  );

  const activePlanInfo = storageUsage?.activePlan;
  const activePaidPlanId = hasPaidActivePlan ? activePlanInfo?.planId : null;

  // Plan Duration Label (Monthly / 6 Months / 1 Year)
  const durationLabel = useMemo(() => {
    if (isSuperAdmin) return 'Lifetime VIP Access';
    if (!hasPaidActivePlan) return 'No Active Subscription';
    const cat = activePlanInfo?.billingCategory;
    const months = activePlanInfo?.durationMonths;
    if (months === 12 || cat === 'YEARLY') return '1 Year (Annual Plan)';
    if (months === 6 || cat === '6_MONTHS') return '6 Months (Extended Plan)';
    return 'Monthly (1 Month Plan)';
  }, [hasPaidActivePlan, isSuperAdmin, activePlanInfo]);

  // Formatted Start Date
  const startDateDisplay = useMemo(() => {
    if (!hasPaidActivePlan) return '—';
    if (isSuperAdmin) return 'Permanent';
    if (activePlanInfo?.startDate) {
      try {
        return new Date(activePlanInfo.startDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return '—';
      }
    }
    return 'Active';
  }, [hasPaidActivePlan, isSuperAdmin, activePlanInfo]);

  // Formatted Expiry / End Date
  const expiryDateDisplay = useMemo(() => {
    if (!hasPaidActivePlan) return 'No Active Subscription';
    if (isSuperAdmin || activePlanInfo?.isLifetime || !activePlanInfo?.expiresAt) {
      return 'Lifetime Unlimited Access';
    }
    try {
      return new Date(activePlanInfo.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Active';
    }
  }, [hasPaidActivePlan, isSuperAdmin, activePlanInfo]);

  // Days Remaining
  const daysRemainingDisplay = useMemo(() => {
    if (isSuperAdmin) return '∞ Lifetime Active';
    if (!hasPaidActivePlan) return 'Expired / No Plan';
    if (typeof activePlanInfo?.daysLeft === 'number') {
      return `${activePlanInfo.daysLeft} Days Remaining`;
    }
    if (activePlanInfo?.expiresAt) {
      const diffMs = new Date(activePlanInfo.expiresAt).getTime() - Date.now();
      const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return `${days} Days Remaining`;
    }
    return 'Active';
  }, [hasPaidActivePlan, isSuperAdmin, activePlanInfo]);

  // Filter plans based on selected tab
  const filteredStoragePlans = useMemo(() => {
    return storagePlans.filter((p) => p.billingCategory === selectedDuration);
  }, [storagePlans, selectedDuration]);

  // Handle Storage Plan Checkout via Razorpay
  const handleSelectStoragePlan = async (plan: StoragePlan) => {
    if (activePaidPlanId === plan.planId) {
      toast.success(`You are already subscribed to ${plan.name}`);
      return;
    }

    try {
      setLoadingPlanKey(plan.planId);

      // Ensure Razorpay script is loaded
      if (typeof window === 'undefined' || !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 1. Create Checkout Session on Backend
      const res = await apiClient.post('/storage/checkout', {
        planId: plan.planId,
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
      });

      const { orderId, razorpayOrderId, amount, currency, key } = res.data;

      if (!razorpayOrderId) {
        throw new Error('Server could not initialize Razorpay checkout order');
      }

      if (!key) {
        toast.error('Payment gateway setup required. Please configure RAZORPAY_KEY_ID in backend.');
        setLoadingPlanKey(null);
        return;
      }

      // 2. Launch Official Razorpay Modal
      const options: any = {
        key,
        amount,
        currency: currency || 'INR',
        name: 'Mara Photo Cloud Storage',
        description: `${plan.name} (${plan.billingPeriodText})`,
        image: studio?.logoUrl || '/logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || studio?.name || '',
          email: user?.email || '',
          contact: (user as any)?.phone || '',
        },
        theme: {
          color: '#c5a880',
        },
        modal: {
          ondismiss: () => {
            setLoadingPlanKey(null);
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
        handler: async (response: any) => {
          try {
            toast.loading('Verifying payment signature securely...', { id: 'verify-toast' });
            const verifyRes = await apiClient.post('/storage/verify-payment', {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              toast.success(`Success! ${plan.name} is now active.`, { id: 'verify-toast' });
              confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
              setSuccessModalData({
                planName: plan.name,
                amount: plan.priceInr,
                orderNumber: verifyRes.data?.order?.orderNumber,
                expiresAt: verifyRes.data?.subscription?.expiresAt,
              });
              await refreshStorageData();
              window.dispatchEvent(new Event('storage_updated'));
              window.dispatchEvent(new Event('studio_plan_updated'));
            } else {
              throw new Error(verifyRes.data?.error || 'Verification failed');
            }
          } catch (verifyErr: any) {
            console.error('Verification error:', verifyErr);
            toast.error(verifyErr.response?.data?.error || 'Payment verification failed', { id: 'verify-toast' });
          } finally {
            setLoadingPlanKey(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setLoadingPlanKey(null);
        toast.error(resp.error?.description || 'Payment transaction failed');
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.error || err.message || 'Could not initiate checkout');
      setLoadingPlanKey(null);
    }
  };

  // Authoritative numbers for display
  const usedStorageFormatted = storageUsage?.formattedUsedStorage || formatBytes(storageUsage?.usedStorageBytes || 0);
  const totalStorageFormatted = hasPaidActivePlan ? (storageUsage?.formattedTotalStorage || `${storageUsage?.totalStorageGb || 0} GB`) : '0 GB';
  const availableStorageFormatted = hasPaidActivePlan ? (storageUsage?.formattedAvailableStorage || `${storageUsage?.availableStorageGb || 0} GB`) : '0 GB';
  const usagePercentage = hasPaidActivePlan ? (storageUsage?.usagePercentage || 0) : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#faf8f5] text-slate-900 min-h-screen p-3 xs:p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">

        {/* ═══ Page Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ebd9c2]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30">
                Subscription Management
              </span>
              <span className="text-xs font-semibold text-slate-400">• High Speed Cloud Storage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
              <Cloud className="w-7 h-7 text-[#c5a880]" />
              Plans & Cloud Storage Billing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Select monthly, 6-month, or yearly cloud storage plans. Your event galleries stay live for your entire plan duration.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshStorageData}
              disabled={loadingStorage}
              className="p-2.5 rounded-xl bg-white border border-[#e8dfd3] text-slate-700 hover:text-slate-900 hover:border-[#c5a880] transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Refresh Storage Status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStorage ? 'animate-spin text-[#c5a880]' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* ═══ CURRENT ACTIVE PLAN CARD (PROMINENT STATUS) ═══ */}
        <div className="relative overflow-hidden rounded-3xl border border-[#ebd9c2] shadow-xl bg-white p-5 sm:p-7">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none bg-radial from-[#c5a880] to-transparent" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Left: Plan Name, Duration, and Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {hasPaidActivePlan ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Plan
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    No Active Plan
                  </span>
                )}

                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {durationLabel}
                </span>

                {hasPaidActivePlan && (
                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-slate-900 text-white shadow-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#c5a880]" />
                    {daysRemainingDisplay}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {hasPaidActivePlan
                    ? (activePlanInfo?.name || 'Active Studio Plan')
                    : 'Free Starter (Limited)'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {hasPaidActivePlan
                    ? `Subscribed under ${studio?.name || 'Studio'} • Dedicated Cloud Storage Allocation`
                    : 'Your studio currently has no active storage plan. Upgrade to unlock unlimited features.'}
                </p>
              </div>
            </div>

            {/* Right: Key Dates Card */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] min-w-[280px]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Start Date
                </span>
                <span className="text-sm font-black text-slate-900">
                  {startDateDisplay}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  End / Expiry Date
                </span>
                <span className="text-sm font-black text-emerald-700">
                  {expiryDateDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Live Real-time Storage Usage Bar */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#c5a880]" />
                Storage Space Used: <span className="font-black text-slate-950 text-base">{usedStorageFormatted}</span> of <span className="font-black text-slate-950">{totalStorageFormatted}</span>
              </span>
              <span className="font-extrabold text-[#8c6d3f]">
                {availableStorageFormatted} Available
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#f4ece1] overflow-hidden p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  usagePercentage >= 95
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-md'
                    : usagePercentage >= 80
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 shadow-md'
                    : 'bg-gradient-to-r from-[#c5a880] via-[#cbb08c] to-[#b89665] shadow-md'
                }`}
                style={{ width: `${Math.min(100, Math.max(storageUsage?.usedStorageBytes ? 1.5 : 0, usagePercentage))}%` }}
              />
            </div>

            {/* Bottom Row: Stat Pills */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-[#c5a880]" />
                  {storageUsage?.totalPhotos ?? 0} Photos Uploaded
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-indigo-500" />
                  {storageUsage?.totalVideos ?? 0} Videos Uploaded
                </span>
                <span className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {usagePercentage.toFixed(1)}% Storage Utilized
                </span>
              </div>

              <span className="text-[11px] font-bold text-slate-400">
                Synced automatically from Ultra-Fast Cloud Storage
              </span>
            </div>
          </div>

          {/* ═══ Data Retention Protection Banner ═══ */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-emerald-50/50 to-blue-50/50 border border-[#e8dfd3] flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <span className="font-black text-slate-900 block mb-0.5">
                Active Plan Data Protection Guarantee
              </span>
              As long as your subscription plan is active, all your event galleries, uploaded photos, videos, and QR links remain 100% safe and live. When your plan period ends, cloud media is purged to free up storage, while your <strong>Gallery Visitors & Customer contacts are permanently saved forever</strong>.
            </div>
          </div>
        </div>

        {/* ═══ DURATION SWITCHER TABS (Monthly / 6 Months / 1 Year) ═══ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c5a880]" />
                Choose Storage Capacity & Duration
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select your preferred billing cycle: Monthly, 6 Months (Extended), or 1 Year (Annual).
              </p>
            </div>

            {/* 3 Duration Pills */}
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-[#e8dfd3] shadow-xs">
              <button
                onClick={() => setSelectedDuration('MONTHLY')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedDuration === 'MONTHLY'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Monthly (1 Month)
              </button>
              <button
                onClick={() => setSelectedDuration('6_MONTHS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer relative ${
                  selectedDuration === '6_MONTHS'
                    ? 'bg-gradient-to-r from-[#c5a880] to-[#b89665] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                6 Months (Extended)
                <span className="absolute -top-2.5 right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-[9px] font-black text-white uppercase tracking-wider">
                  HOT
                </span>
              </button>
              <button
                onClick={() => setSelectedDuration('YEARLY')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedDuration === 'YEARLY'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                1 Year (Annual)
              </button>
            </div>
          </div>

          {/* ═══ PLANS GRID ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStoragePlans.map((plan) => {
              const isActivePlan = activePaidPlanId === plan.planId;
              const isRecommended = plan.isRecommended;

              return (
                <div
                  key={plan.planId}
                  className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                    isActivePlan
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                      : isRecommended
                      ? 'bg-white border-[#c5a880] shadow-md hover:shadow-xl hover:-translate-y-1'
                      : 'bg-white border-[#e8dfd3] shadow-xs hover:shadow-md hover:border-[#c5a880]/60 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30">
                      {plan.storageGb} GB Storage
                    </span>

                    {isActivePlan ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        Current Plan
                      </span>
                    ) : isRecommended ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Most Popular
                      </span>
                    ) : null}
                  </div>

                  {/* Plan Name & Pricing */}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {plan.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-sans">
                        {plan.displayPrice}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        / {plan.billingPeriodText}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] font-bold text-slate-500 flex items-center gap-1.5 bg-[#faf8f5] px-2.5 py-1.5 rounded-xl border border-[#e8dfd3]">
                      <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>
                        Validity: <strong>{plan.durationMonths === 12 ? '1 Full Year (12 Months)' : plan.durationMonths === 6 ? '6 Full Months' : '1 Month'}</strong>
                      </span>
                    </div>

                    {/* Features list */}
                    <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-7 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleSelectStoragePlan(plan)}
                      disabled={isActivePlan || loadingPlanKey === plan.planId}
                      className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isActivePlan
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                          : isRecommended
                          ? 'bg-gradient-to-r from-[#c5a880] via-[#cbb08c] to-[#b89665] text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-95'
                          : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-xs'
                      } disabled:opacity-60`}
                    >
                      {loadingPlanKey === plan.planId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Initializing Order...</span>
                        </>
                      ) : isActivePlan ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Active Subscription</span>
                        </>
                      ) : (
                        <>
                          <span>Choose {plan.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ LIFECYCLE & DATA PRESERVATION POLICY ═══ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ebd9c2] shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#c5a880]/15 text-[#8c6d3f] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#8c6d3f]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Subscription Lifecycle & Cloud Data Policy
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Transparent data retention rules designed for professional studios.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">1</span>
                Plan Active Duration
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                During your subscription (1 month, 6 months, or 1 year), all event galleries, high-res photos, and videos remain 100% live and accessible by your clients.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">2</span>
                On Plan Expiry
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When your plan expires and is not renewed, uploaded event photos and videos are purged from cloud storage to release storage space.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                Permanent Visitor Leads
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your <strong>Gallery Visitors and Client contact numbers</strong> are NEVER deleted. They remain safely preserved in your dashboard for lifetime marketing.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ RECENT ACTIVITY LOG ═══ */}
        <StorageRecentActivity />

      </div>

      {/* ═══ SUCCESS PAYMENT MODAL ═══ */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#ebd9c2] p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Subscription Activated!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your studio cloud capacity has been instantly updated.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-900">{successModalData.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-slate-900">₹{successModalData.amount.toLocaleString('en-IN')}</span>
              </div>
              {successModalData.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono text-slate-700">{successModalData.orderNumber}</span>
                </div>
              )}
              {successModalData.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Until:</span>
                  <span className="font-bold text-emerald-700">{new Date(successModalData.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSuccessModalData(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
