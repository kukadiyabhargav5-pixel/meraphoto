'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { Calendar, Image as ImageIcon, Users, Heart, UsersRound, RefreshCw, ExternalLink, Settings, Camera, TrendingUp, ArrowUpRight, Sparkles, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

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

  const statCards = [
    { id: 'events', label: 'Events', value: stats.events, icon: Calendar, color: '#6366f1', bg: '#eef2ff', link: '/dashboard/events' },
    { id: 'media', label: 'Uploads', value: stats.media, icon: ImageIcon, color: '#8b5cf6', bg: '#f5f3ff', link: '/dashboard/events' },
    { id: 'visitors', label: 'Visitors', value: stats.visitors, icon: Users, color: '#10b981', bg: '#ecfdf5', link: '/dashboard/gallery-visitors' },
    { id: 'team', label: 'Team', value: stats.teamMembers, icon: UsersRound, color: '#f59e0b', bg: '#fffbeb', link: '/dashboard/team' },
    { id: 'customers', label: 'Customers', value: stats.customers, icon: Heart, color: '#ef4444', bg: '#fef2f2', link: '/dashboard/customers' },
  ];

  const quickLinks = [
    { label: 'Create Event', href: '/dashboard/create-event', icon: Calendar, accent: '#6366f1' },
    { label: 'Studio Settings', href: '/dashboard/studio-settings', icon: Settings, accent: '#64748b' },
    { label: 'Studio Branding', href: '/dashboard/studio-branding', icon: Sparkles, accent: '#c5a880' },
    { label: 'Quotation', href: '/dashboard/quotation', icon: ExternalLink, accent: '#10b981' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-16">

      {/* ═══ Welcome Banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      >
        {/* Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #c5a880 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

        <div className="relative z-10 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #c5a880, #a07c4c)' }}>
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl lg:text-2xl font-black text-white tracking-tight"
              >
                {greeting}, <span className="text-[#c5a880]">{user?.name || stats.studioName || 'Studio'}</span>
              </motion.h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-400">
                  {stats.studioName || 'Your Studio'} • Dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 border border-white/10
                text-white text-xs font-bold hover:bg-white/20 transition-all disabled:opacity-50 backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/dashboard/studio-settings">
              <button className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl
                bg-gradient-to-r from-[#c5a880] to-[#a07c4c] text-white text-xs font-black
                shadow-lg shadow-[#c5a880]/20 hover:shadow-xl hover:shadow-[#c5a880]/30 hover:-translate-y-0.5 transition-all">
                <Settings className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Manage</span> Studio
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

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
                  onClick={() => router.push(card.link)}
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
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{card.label}</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
                      <AnimatedCount value={card.value} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((ql, i) => (
            <Link key={ql.href} href={ql.href}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-3.5 cursor-pointer
                  hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5
                  transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${ql.accent}12` }}>
                  <ql.icon className="w-5 h-5" style={{ color: ql.accent }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{ql.label}</div>
                  <div className="text-[10px] font-medium text-slate-400">Go to {ql.label.toLowerCase()}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
