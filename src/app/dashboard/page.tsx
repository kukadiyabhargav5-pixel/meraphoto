'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { Calendar, Image as ImageIcon, Users, Heart, UsersRound, RefreshCw, ExternalLink, Settings, Camera, TrendingUp, ArrowUpRight, Sparkles, Clock, Lock, CreditCard } from 'lucide-react';
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
  const { user } = useAuth();
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
    { label: 'Plans & Billing', href: '/dashboard/plans-billing', icon: CreditCard, accent: '#f59e0b', highlight: true },
    { label: 'Create Event', href: '/dashboard/create-event', icon: Calendar, accent: '#6366f1' },
    { label: 'Studio Settings', href: '/dashboard/studio-settings', icon: Settings, accent: '#64748b' },
    { label: 'Studio Branding', href: '/dashboard/studio-branding', icon: Sparkles, accent: '#c5a880' },
    { label: 'Quotation', href: '/dashboard/quotation', icon: ExternalLink, accent: '#10b981' },
  ];

  return (
    <div className="p-3 xs:p-4 lg:p-8 max-w-7xl mx-auto pb-16">

      {/* ═══ Welcome Banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 sm:mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      >
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c5a880 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

        <div className="relative z-10 p-4 xs:p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #c5a880, #a07c4c)' }}>
              <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg xs:text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap"
              >
                {greeting}, <span className="text-[#c5a880]">{user?.name || stats.studioName || 'Studio'}</span>
                {isSuperAdmin && (
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    👑 VIP Admin
                  </span>
                )}
              </motion.h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-400">
                  {stats.studioName || 'Super Admin Studio'} • {isSuperAdmin ? 'Unlimited Free Admin Access' : 'Dashboard'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <Link
              href="/dashboard/plans-billing"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl
                bg-gradient-to-r from-amber-400 via-[#c5a880] to-amber-500 text-slate-950 text-xs font-black
                shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-h-[44px] border border-amber-300/60"
            >
              <CreditCard className="w-4 h-4 text-slate-950" />
              <span>Plans & Billing</span>
            </Link>
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 border border-white/10
                text-white text-xs font-bold hover:bg-white/20 transition-all disabled:opacity-50 backdrop-blur-sm cursor-pointer min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => handleBlockClick('/dashboard/studio-settings')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl
                ${(isBasicPlan || isStartupPlan) ? 'bg-slate-800 text-slate-400 opacity-60 border border-slate-700' : 'bg-gradient-to-r from-[#c5a880] to-[#a07c4c] text-white shadow-lg shadow-[#c5a880]/20 hover:shadow-xl hover:shadow-[#c5a880]/30 hover:-translate-y-0.5'}
                text-xs font-black transition-all cursor-pointer min-h-[44px]`}
            >
              {(isBasicPlan || isStartupPlan) ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Settings className="w-3.5 h-3.5" />}
              <span>Manage Studio</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-[120px] animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 mb-3" />
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
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              {statCards.map((card) => (
                <motion.div
                  key={card.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}
                  onClick={() => handleBlockClick(card.link)}
                  className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-5 relative overflow-hidden cursor-pointer
                    hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1
                    transition-all duration-300 group"
                >
                  {/* Hover glow */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100
                    transition-opacity duration-500 blur-2xl"
                    style={{ background: card.color }} />

                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: card.bg }}>
                      <card.icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center justify-between">
                      <span>{card.label}</span>
                      {(isBasicPlan || (isStartupPlan && !allowedStartupLinks.some(r => card.link === r || card.link.startsWith(`${r}/`)))) && (
                        <Lock className="w-3 h-3 text-amber-500/70" />
                      )}
                    </div>
                    <div className="text-xl xs:text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                      <AnimatedCount value={card.value} />
                    </div>
                  </div>

                  {/* Arrow or Lock Badge */}
                  <div className="absolute top-4 right-4">
                    {(isBasicPlan || (isStartupPlan && !allowedStartupLinks.some(r => card.link === r || card.link.startsWith(`${r}/`)))) ? (
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                className={`rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-3.5 cursor-pointer
                  transition-all duration-300 group ${
                    ql.highlight
                      ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400/60 shadow-md shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-1'
                      : isQLLocked
                        ? 'bg-slate-50/70 border border-slate-200/60 opacity-60 hover:opacity-80'
                        : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  ql.highlight ? 'bg-amber-500/20 text-amber-600 shadow-sm' : ''
                }`}
                  style={!ql.highlight ? { background: `${ql.accent}12` } : {}}>
                  <ql.icon className="w-5 h-5" style={{ color: ql.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors flex items-center gap-1.5 truncate">
                    <span>{ql.label}</span>
                    {ql.highlight && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-[#c5a880] text-slate-950 px-1.5 py-0.5 rounded shadow-xs">
                        HOT
                      </span>
                    )}
                    {isQLLocked && !ql.highlight && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 truncate">
                    {ql.highlight ? 'Upgrade or manage plans' : (isQLLocked ? 'Click to upgrade plan' : `Go to ${ql.label.toLowerCase()}`)}
                  </div>
                </div>
                {isQLLocked && !ql.highlight ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 ml-auto group-hover:bg-amber-500/20 transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <ArrowUpRight className={`w-4 h-4 ml-auto transition-all ${
                    ql.highlight ? 'text-amber-500 opacity-100 group-hover:translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                  }`} />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
