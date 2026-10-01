'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { Calendar, Image as ImageIcon, Users, Heart, UsersRound, RefreshCw, ExternalLink, Settings, Camera, TrendingUp, ArrowUpRight, Sparkles, Clock, Lock, CreditCard, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import toast from 'react-hot-toast';

interface Stats {
  events: number;
  media: number;
  visitors: number;
  teamMembers: number;
  customers: number;
  studioName?: string;
  subscriptionPlan?: string;
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const steps = 50;
    const inc = value / steps;
    const iv = 1000 / steps;
    const t = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(start));
    }, iv);
    return () => clearInterval(t);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export default function DashboardOverview() {
  const router = useRouter();
  const context = useDashboard();
  const { user, studio: authStudio } = useAuth();
  const [stats, setStats] = useState<Stats>({ events: 0, media: 0, visitors: 0, teamMembers: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await apiClient.get('/dashboard/stats');
      setStats({
        events: res.data.events || 0,
        media: res.data.media || 0,
        visitors: res.data.visitors || 0,
        teamMembers: res.data.teamMembers || 0,
        customers: res.data.customers || 0,
        studioName: res.data.studioName,
        subscriptionPlan: res.data.subscriptionPlan
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 300000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!context) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'maraphoto303@gmail.com';

  useEffect(() => {
    if (isSuperAdmin) {
      router.replace('/admin-dashboard');
    }
  }, [isSuperAdmin, router]);

  const studio = context?.studio || authStudio;
  const studioPlanKey = (stats.subscriptionPlan || studio?.subscriptionPlan || authStudio?.subscriptionPlan || '').toUpperCase();
  const currentPlan = studioPlanKey || (isSuperAdmin ? 'PREMIUM' : 'BASIC');
  const isBasicPlan = currentPlan === 'BASIC';
  const isStartupPlan = currentPlan === 'STARTUP' || currentPlan === 'STARTER';

  const allowedStartupLinks = [
    '/dashboard/plans-billing',
    '/dashboard/create-event',
    '/dashboard/events',
    '/dashboard/quotation',
    '/dashboard/profile'
  ];

  const handleBlockClick = (targetLink?: string) => {
    if (isSuperAdmin) {
      if (targetLink) router.push(targetLink);
      return;
    }
    if (isBasicPlan) {
      if (targetLink && ['/dashboard', '/dashboard/plans-billing'].includes(targetLink)) {
        router.push(targetLink);
        return;
      }
      toast.error('Please upgrade your plan from Basic to access this feature.', {
        duration: 3500,
        icon: '🔒'
      });
      router.push('/dashboard/plans-billing');
      return;
    }
    if (isStartupPlan) {
      if (targetLink && allowedStartupLinks.some(r => targetLink === r || targetLink.startsWith(`${r}/`))) {
        router.push(targetLink);
        return;
      }
      toast.error('Please upgrade to Standard or higher to unlock this feature.', {
        duration: 3500,
        icon: '🔒'
      });
      router.push('/dashboard/plans-billing');
      return;
    }
    if (targetLink) {
      router.push(targetLink);
    }
  };

  const statCards = [
    { id: 'events', label: 'Events', value: stats.events, icon: Calendar, color: '#6366f1', bg: '#eef2ff', link: '/dashboard/events' },
    { id: 'media', label: 'Uploads', value: stats.media, icon: ImageIcon, color: '#8b5cf6', bg: '#f5f3ff', link: '/dashboard/events' },
    { id: 'visitors', label: 'Visitors', value: stats.visitors, icon: Users, color: '#10b981', bg: '#ecfdf5', link: '/dashboard/gallery-visitors' },
    { id: 'team', label: 'Team', value: stats.teamMembers, icon: UsersRound, color: '#f59e0b', bg: '#fffbeb', link: '/dashboard/team' },
    { id: 'customers', label: 'Customers', value: stats.customers, icon: Heart, color: '#ef4444', bg: '#fef2f2', link: '/dashboard/customers' },
  ];

  const quickLinks = [
    { label: 'Plans & Billing', subtitle: 'Upgrade & manage plans', href: '/dashboard/plans-billing', icon: CreditCard, accent: '#c5a880', highlight: true },
    { label: 'Create Event', subtitle: 'New photo gallery', href: '/dashboard/create-event', icon: Calendar, accent: '#6366f1' },
    { label: 'Studio Settings', subtitle: 'Studio preferences', href: '/dashboard/studio-settings', icon: Settings, accent: '#64748b' },
    { label: 'Studio Branding', subtitle: 'Watermark & logo', href: '/dashboard/studio-branding', icon: Sparkles, accent: '#c5a880' },
    { label: 'Quotation', subtitle: 'Invoices & quotes', href: '/dashboard/quotation', icon: ExternalLink, accent: '#10b981' },
  ];

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-32 sm:pb-24">

      {/* ═══ Welcome Banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 border border-white/10 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0b0f19 0%, #161e2e 50%, #0b0f19 100%)' }}
      >
        {/* Subtle Ambient Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c5a880 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

        <div className="relative z-10 p-4 sm:p-6 lg:p-7 flex flex-col gap-4 sm:gap-5">
          {/* Top Row: User info on Left + Refresh icon button on Right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-[#c5a880]/30"
                style={{ background: 'linear-gradient(135deg, rgba(197,168,128,0.25), rgba(160,124,76,0.1))' }}>
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#c5a880]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {greeting}
                </div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap leading-snug"
                >
                  <span className="truncate">{user?.name || stats.studioName || 'Studio'}</span>
                  {isSuperAdmin && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                      👑 VIP Admin
                    </span>
                  )}
                </motion.h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-medium text-slate-400 truncate">
                    {stats.studioName || 'Studio'} • {isSuperAdmin ? 'Unlimited Access' : 'Dashboard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Refresh Icon Button on Top-Right */}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              title="Refresh Stats"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10
                text-slate-300 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#c5a880]' : ''}`} />
            </button>
          </div>

          {/* Bottom Row: Two Balanced Equal-Height Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3 w-full">
            <Link
              href="/dashboard/plans-billing"
              className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl
                bg-gradient-to-r from-[#c5a880] via-[#d4bc97] to-[#b59a72] text-[#09090b] text-xs font-black
                shadow-[0_4px_14px_rgba(197,168,128,0.25)] hover:shadow-[0_6px_20px_rgba(197,168,128,0.35)]
                hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer h-[42px] border border-[#e3d8c8]/40"
            >
              <CreditCard className="w-4 h-4 text-[#09090b] shrink-0" />
              <span className="truncate">Plans & Billing</span>
            </Link>
            <button
              onClick={() => handleBlockClick('/dashboard/studio-settings')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl
                ${(isBasicPlan || isStartupPlan)
                  ? 'bg-slate-800/80 text-slate-400 border border-slate-700/80'
                  : 'bg-white/8 hover:bg-white/15 border border-white/15 text-white hover:border-[#c5a880]/50 hover:text-[#c5a880]'}
                text-xs font-black transition-all cursor-pointer h-[42px] active:scale-[0.98] shadow-xs`}
            >
              {(isBasicPlan || isStartupPlan) ? (
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Settings className="w-4 h-4 text-[#c5a880] shrink-0" />
              )}
              <span className="truncate">Manage Studio</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Super Admin VIP Banner ═══ */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#c5a880]/10 to-amber-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 text-xl font-black">
              👑
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                Super Admin VIP Access • 100% Free Lifetime
                <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Unlimited Mode Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Unlimited photos & videos upload, zero storage limits, watermark removal, custom branding, AI face engine, and all enterprise facilities are fully unlocked.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/create-event"
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            + Create Unlimited Event
          </Link>
        </motion.div>
      )}

      {/* ═══ Basic Plan Upgrade Banner ═══ */}
      {isBasicPlan && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleBlockClick()}
          className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                Active Plan: BASIC
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500/20 text-amber-800 px-2.5 py-0.5 rounded-full">
                  Free Limited Access
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Your studio is on the Basic Free Plan. All dashboard tools are locked. Click below to upgrade to Startup, Standard, Essential, or Premium.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleBlockClick(); }}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#a07c4c] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 group-hover:translate-x-0.5 cursor-pointer"
          >
            Upgrade Studio Plan <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ═══ Startup Plan Upgrade Banner ═══ */}
      {isStartupPlan && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleBlockClick()}
          className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                Active Plan: STARTUP (₹3,999/yr)
                <span className="text-[10px] uppercase font-black tracking-wider bg-blue-500/20 text-blue-800 px-2.5 py-0.5 rounded-full">
                  50k Photos & 10 Videos
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Create Event, Manage Events, Quotations, and Profile are unlocked. Upgrade to Standard (₹7,999) to unlock ALL dashboard features!
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleBlockClick(); }}
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 group-hover:translate-x-0.5 cursor-pointer"
          >
            Upgrade to Standard <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ═══ Stat Cards ═══ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overview Stats</span>
          {lastUpdated && (
            <span className="ml-auto text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <AnimatePresence>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 h-[110px] sm:h-[125px] animate-pulse ${i === 4 ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 mb-2.5" />
                  <div className="h-2 w-14 bg-slate-100 rounded mb-2" />
                  <div className="h-5 w-10 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5"
            >
              {statCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}
                  onClick={() => handleBlockClick(card.link)}
                  className={`bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 relative overflow-hidden cursor-pointer
                    hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 active:scale-[0.98]
                    transition-all duration-300 group shadow-xs ${idx === 4 ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}
                >
                  {/* Hover glow */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100
                    transition-opacity duration-500 blur-2xl pointer-events-none"
                    style={{ background: card.color }} />

                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[92px] sm:min-h-[105px]">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0 shadow-xs"
                        style={{ background: card.bg }}>
                        <card.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.color }} />
                      </div>
                      
                      {/* Arrow or Lock Badge */}
                      <div>
                        {(isBasicPlan || (isStartupPlan && !allowedStartupLinks.some(r => card.link === r || card.link.startsWith(`${r}/`)))) ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100 transition-all opacity-60 group-hover:opacity-100">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                        {card.label}
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                        <AnimatedCount value={card.value} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4 px-1">
          <Sparkles className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Actions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5">
          {quickLinks.map((ql, i) => {
            const isQLLocked = (isBasicPlan && !ql.highlight) || 
                               (isStartupPlan && !allowedStartupLinks.some(r => ql.href === r || ql.href.startsWith(`${r}/`)));
            return (
              <motion.div
                key={ql.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                onClick={() => handleBlockClick(ql.href)}
                className={`rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-3.5 cursor-pointer
                  transition-all duration-300 group active:scale-[0.98] ${
                    ql.highlight
                      ? 'bg-gradient-to-br from-[#fcf9f5] via-white to-[#faf5ec] border border-[#c5a880]/60 ring-1 ring-[#c5a880]/20 shadow-[0_4px_16px_rgba(197,168,128,0.12)] hover:border-[#c5a880] hover:ring-[#c5a880]/40 hover:shadow-[0_8px_24px_rgba(197,168,128,0.22)] hover:-translate-y-0.5'
                      : isQLLocked
                        ? 'bg-slate-50/70 border border-slate-200/60 opacity-60 hover:opacity-85 hover:bg-slate-50'
                        : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 shadow-xs'
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-xs ${
                    ql.highlight
                      ? 'bg-[#c5a880]/15 text-[#9e7b4f] border border-[#c5a880]/30'
                      : 'border border-slate-100'
                  }`}
                  style={!ql.highlight ? { background: `${ql.accent}12` } : {}}
                >
                  <ql.icon
                    className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: ql.highlight ? '#9e7b4f' : ql.accent }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
                      {ql.label}
                    </span>
                    {ql.highlight && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#c5a880] via-[#b89565] to-[#9a7b4f] text-white px-2 py-0.5 rounded-full shadow-xs shrink-0 leading-tight">
                        HOT
                      </span>
                    )}
                    {isQLLocked && !ql.highlight && (
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors truncate mt-0.5">
                    {isQLLocked && !ql.highlight
                      ? 'Click to upgrade plan'
                      : (ql.subtitle || `Go to ${ql.label.toLowerCase()}`)}
                  </div>
                </div>

                {isQLLocked && !ql.highlight ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 ml-auto group-hover:bg-amber-500/20 transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <ArrowUpRight
                    className={`w-4 h-4 ml-auto shrink-0 transition-all ${
                      ql.highlight
                        ? 'text-[#c5a880] opacity-100 group-hover:text-[#9e7b4f] group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                        : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                    }`}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
