'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { Calendar, Image as ImageIcon, Users, Heart, UsersRound, RefreshCw, ExternalLink, Settings, Camera } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    const duration = 1200; // slightly longer, smoother animation
    const steps = 60;
    const increment = value / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function DashboardOverview() {
  const router = useRouter();
  const context = useDashboard();
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

  const statCards = [
    {
      id: 'events',
      label: 'Total Events',
      value: stats.events,
      icon: Calendar,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20',
      link: '/dashboard/events'
    },
    {
      id: 'media',
      label: 'Total Uploads',
      value: stats.media,
      icon: ImageIcon,
      color: 'purple',
      gradient: 'from-purple-500 to-fuchsia-500',
      shadow: 'shadow-purple-500/20',
      link: '/dashboard/events'
    },
    {
      id: 'visitors',
      label: 'Gallery Visitors',
      value: stats.visitors,
      icon: Users,
      color: 'emerald',
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      link: '/dashboard/customers'
    },
    {
      id: 'team',
      label: 'Team Members',
      value: stats.teamMembers,
      icon: UsersRound,
      color: 'amber',
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/20',
      link: '/dashboard/team'
    },
    {
      id: 'customers',
      label: 'Total Customers',
      value: stats.customers,
      icon: Heart,
      color: 'rose',
      gradient: 'from-rose-400 to-pink-500',
      shadow: 'shadow-rose-500/20',
      link: '/dashboard/customers'
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-y-auto admin-scroll pb-10">
      
      {/* Background Blobs for Premium Feel */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-purple-400/10 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {/* Studio Info Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-card rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                <Camera className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{stats.studioName || 'Loading Studio...'}</h2>
              </div>
            </div>
            <Link href="/dashboard/studio-settings">
              <button className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                <Settings className="w-3.5 h-3.5" /> Manage Studio
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stat Grid */}
        <AnimatePresence>
          {!loading && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {statCards.map((card) => (
                <motion.div 
                  key={card.id} 
                  variants={cardVariants} 
                  onClick={() => router.push(card.link)}
                  className="glass-card cursor-pointer border-2 border-slate-200/60 rounded-2xl p-4 relative overflow-hidden group hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 shadow-sm"
                >
                  {/* Hover Background Blobs */}
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 bg-gradient-to-br ${card.gradient} blur-2xl transition-all duration-500 group-hover:scale-150`} />
                  
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg ${card.shadow} bg-gradient-to-br ${card.gradient} group-hover:scale-110 transition-transform duration-500`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{card.label}</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">
                      <AnimatedCount value={card.value} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card border-2 border-slate-200/60 rounded-2xl p-4 relative overflow-hidden h-32 shadow-sm">
                <div className="skeleton-shimmer w-10 h-10 rounded-xl mb-3" />
                <div className="skeleton-shimmer h-2 w-20 mb-2" />
                <div className="skeleton-shimmer h-6 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
