'use client';

import React from 'react';
import Link from 'next/link';
import { Cloud, ArrowUpRight, Sparkles, HardDrive, AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { StorageUsage, formatBytes } from '@/lib/storage';
import { useAuth } from '@/lib/AuthContext';

interface StorageCreditBlockProps {
  usage?: StorageUsage | null;
  loading?: boolean;
  className?: string;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
  compact?: boolean;
  fallbackActive?: boolean;
  fallbackTotalGb?: number;
  fallbackPlanName?: string;
}

export default function StorageCreditBlock({
  usage,
  loading = false,
  className = '',
  showUpgradeButton = true,
  onUpgradeClick,
  compact = false,
  fallbackActive = false,
  fallbackTotalGb,
  fallbackPlanName,
}: StorageCreditBlockProps) {
  const { user, studio } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';
  const studioPlanKey = (studio?.subscriptionPlan || '').toUpperCase();
  const studioExpiresAt = studio?.subscriptionExpiresAt;
  const isStudioPaidActive = Boolean(
    isSuperAdmin ||
    (studioPlanKey &&
     studioPlanKey !== 'BASIC' &&
     (!studioExpiresAt || new Date(studioExpiresAt) > new Date()))
  );

  // Strict check: Is a plan actually active? Checks API usage, fallbackActive, and AuthContext studio
  const isPlanActive = Boolean(
    (usage?.hasActivePlan &&
     usage?.activePlan?.status === 'ACTIVE' &&
     usage?.activePlan?.planId &&
     usage?.activePlan?.planId !== 'free-starter') ||
    fallbackActive ||
    isStudioPaidActive
  );

  if (loading && !isPlanActive) {
    return (
      <div className={`bg-white rounded-2xl border border-[#e8dfd3] p-5 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 bg-[#faf7f2] rounded" />
          <div className="h-6 w-24 bg-[#faf7f2] rounded-full" />
        </div>
        <div className="h-8 w-28 bg-[#faf7f2] rounded mb-2" />
        <div className="h-3 w-20 bg-[#faf7f2] rounded mb-4" />
        <div className="h-2.5 w-full bg-[#faf7f2] rounded-full" />
      </div>
    );
  }

  // Authoritative numbers
  const usedGb = usage?.usedStorageGb ?? 0;
  const defaultTotalGb = isSuperAdmin ? 10000 : (studioPlanKey === 'PREMIUM' ? 500 : 75);
  const totalGb = isPlanActive ? (usage?.totalStorageGb || fallbackTotalGb || defaultTotalGb) : 0;
  const availableGb = isPlanActive ? (usage?.availableStorageGb ?? Math.max(0, totalGb - usedGb)) : 0;
  const usagePercentage = isPlanActive && totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
  const warningState = isPlanActive ? (usage?.warningState ?? 'NORMAL') : 'NONE';
  const planName = isPlanActive
    ? (usage?.activePlan?.name || fallbackPlanName || (isSuperAdmin ? 'VIP Admin Unlimited' : `${studioPlanKey || 'Active'} Plan`))
    : 'No Active Plan';

  // Determine progress bar fill color in White & Gold luxury theme
  let progressColor = 'bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f]';
  let progressGlow = 'shadow-[0_0_12px_rgba(197,168,128,0.35)]';
  if (warningState === 'FULL' || (isPlanActive && usagePercentage >= 100)) {
    progressColor = 'bg-gradient-to-r from-red-500 to-rose-600';
    progressGlow = 'shadow-[0_0_12px_rgba(220,38,38,0.4)]';
  } else if (warningState === 'CRITICAL' || (isPlanActive && usagePercentage >= 95)) {
    progressColor = 'bg-gradient-to-r from-rose-500 to-amber-600';
    progressGlow = 'shadow-[0_0_12px_rgba(244,63,94,0.4)]';
  } else if (warningState === 'WARNING' || (isPlanActive && usagePercentage >= 80)) {
    progressColor = 'bg-gradient-to-r from-amber-500 to-yellow-600';
    progressGlow = 'shadow-[0_0_12px_rgba(245,158,11,0.4)]';
  }

  const clampedPercent = isPlanActive ? Math.min(100, Math.max(usedGb > 0 ? 1.5 : 0, usagePercentage)) : 0;

  return (
    <div
      className={`bg-white rounded-2xl border border-[#e8dfd3] p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#c5a880]/50 ${className}`}
    >
      {/* Top Header Row in White & Gold Luxury Styling */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#9e7b4f]" />
              Storage Overview
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Your photo storage at a glance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Plan or No Active Plan Pill Badge */}
          {isPlanActive ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Plan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              No Active Plan
            </span>
          )}

          {showUpgradeButton && (
            onUpgradeClick ? (
              <button
                onClick={onUpgradeClick}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-black px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white hover:brightness-105 transition-all cursor-pointer shadow-sm shadow-[#c5a880]/20"
              >
                {isPlanActive ? 'Upgrade' : 'Choose Plan'} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/dashboard/plans-billing"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-black px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#b89665] to-[#9e7b4f] text-white hover:brightness-105 transition-all cursor-pointer shadow-sm shadow-[#c5a880]/20"
              >
                {isPlanActive ? 'Upgrade' : 'Choose Plan'} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )
          )}
        </div>
      </div>

      {/* Metric Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            Storage used
          </span>
          <HardDrive className="w-4 h-4 text-[#c5a880]" />
        </div>

        {/* Large Numbers */}
        <div className="mb-3">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-sans leading-none">
            {usage?.formattedUsedStorage || formatBytes(usage?.usedStorageBytes || 0)}
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            {isPlanActive ? (
              <>of {usage?.formattedTotalStorage || (totalGb >= 10 ? Math.round(totalGb) : totalGb.toFixed(1)) + ' GB'}</>
            ) : (
              <span className="text-amber-700 font-semibold">of 0 GB (No plan selected)</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full bg-[#f4ece1] rounded-full h-2.5 sm:h-3 overflow-hidden p-[1px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${progressColor} ${progressGlow} transition-colors duration-500`}
          />
        </div>

        {/* Footer Numbers */}
        <div className="flex items-center justify-between text-xs sm:text-sm mt-2.5">
          <span className="font-medium text-slate-500">
            {isPlanActive ? `${usagePercentage.toFixed(1)}% used` : '0% allocated'}
          </span>
          <span className="font-medium text-slate-500">
            {isPlanActive ? (
              <>{usage?.formattedAvailableStorage || (availableGb >= 10 ? Math.round(availableGb) : availableGb.toFixed(1)) + ' GB'} available</>
            ) : (
              '0 GB available'
            )}
          </span>
        </div>
      </div>

      {/* Warning Alert Banner when storage is high */}
      {isPlanActive && (warningState === 'WARNING' || warningState === 'CRITICAL' || warningState === 'FULL') && (
        <div
          className={`mt-4 p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
            warningState === 'FULL'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : warningState === 'CRITICAL'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              {warningState === 'FULL'
                ? 'Your storage is completely full. New uploads will be blocked.'
                : warningState === 'CRITICAL'
                ? 'Critical storage level: You are above 95% capacity.'
                : 'Storage warning: You have used over 80% of your plan limit.'}
            </span>
          </div>
          <Link
            href="/dashboard/plans-billing"
            className="font-bold underline shrink-0 hover:opacity-80"
          >
            Upgrade Now
          </Link>
        </div>
      )}
    </div>
  );
}
