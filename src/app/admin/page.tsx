'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Users, Camera, FolderOpen, Image as ImageIcon, Activity, ArrowUpRight, TrendingUp, Zap, Server, Database, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';

// ─── Animated Counter Hook ───
function useCounter(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || end === 0) { setCount(end); return; }
    started.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

// ─── Animation Variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

// ─── Stat Card Colors ───
const statStyles = [
  { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', shadow: 'rgba(99,102,241,0.3)', bg: 'rgba(99,102,241,0.06)' },
  { gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)', shadow: 'rgba(168,85,247,0.3)', bg: 'rgba(168,85,247,0.06)' },
  { gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.06)' },
  { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.06)' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="space-y-3">
          <div className="skeleton-shimmer h-8 w-64" />
          <div className="skeleton-shimmer h-4 w-48" />
        </div>
        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-shimmer h-40 rounded-2xl" />
          ))}
        </div>
        {/* Skeleton Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton-shimmer h-64 rounded-2xl" />
          <div className="skeleton-shimmer h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <Users className="w-6 h-6" />, label: 'Total Users', value: stats?.totalUsers || 0 },
    { icon: <Camera className="w-6 h-6" />, label: 'Registered Studios', value: stats?.totalStudios || 0 },
    { icon: <FolderOpen className="w-6 h-6" />, label: 'Total Events', value: stats?.totalEvents || 0 },
    { icon: <ImageIcon className="w-6 h-6" />, label: 'Media Uploaded', value: stats?.totalMedia || 0 },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          System Overview
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-pulse-green" />
            Live
          </span>
        </h1>
        <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-[0.15em]">Real-time platform statistics</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} style={statStyles[i]} index={i} />
        ))}
      </motion.div>

      {/* Bottom Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-7 gradient-border-top card-hover-glow">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#c5a880]" />
                Financial Overview
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Total platform revenue & billing</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(197,168,128,0.12), rgba(197,168,128,0.04))', border: '1px solid rgba(197,168,128,0.15)' }}
            >
              <Activity className="w-5 h-5 text-[#c5a880]" />
            </div>
          </div>

          <div className="flex items-end gap-3 mb-2">
            <RevenueCounter value={stats?.totalRevenue || 0} />
            <span className="text-sm font-bold text-emerald-500 flex items-center mb-1.5 gap-0.5">
              <ArrowUpRight className="w-4 h-4" /> Lifetime
            </span>
          </div>

          {/* Mini chart visualization */}
          <div className="flex items-end gap-1 h-16 mt-6 mb-6 px-1">
            {[35, 50, 40, 65, 45, 70, 55, 80, 60, 90, 70, 85].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ background: `linear-gradient(to top, rgba(197,168,128,0.15), rgba(197,168,128,${0.2 + (h / 200)}))` }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(197,168,128,0.04)' }}>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">Total Bookings</div>
              <div className="text-2xl font-black text-slate-800">
                <AnimatedNumber value={stats?.totalBookings || 0} />
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.04)' }}>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">Total Quotations</div>
              <div className="text-2xl font-black text-slate-800">
                <AnimatedNumber value={stats?.totalQuotations || 0} />
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card-dark rounded-2xl p-7 relative overflow-hidden group">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(197,168,128,0.08) 0%, transparent 60%)' }}
          />

          <h2 className="text-lg font-black text-white mb-2 relative z-10 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#c5a880]" />
            System Status
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-6 relative z-10">Infrastructure health</p>

          <div className="space-y-4 relative z-10">
            <StatusItem
              icon={<Server className="w-4 h-4" />}
              label="API Server"
              status="online"
              latency="12ms"
            />
            <StatusItem
              icon={<Database className="w-4 h-4" />}
              label="Database"
              status="online"
              latency="3ms"
            />
            <StatusItem
              icon={<Cpu className="w-4 h-4" />}
              label="AI Sidecar"
              status="degraded"
              latency="340ms"
            />
          </div>

          {/* Uptime bar */}
          <div className="mt-7 pt-5 border-t border-white/[0.06] relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Uptime (30d)</span>
              <span className="text-xs font-black text-emerald-400">99.8%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }}
                initial={{ width: '0%' }}
                animate={{ width: '99.8%' }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub Components ───

function StatCard({ icon, label, value, style, index }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  style: { gradient: string; shadow: string; bg: string };
  index: number;
}) {
  const animatedValue = useCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card rounded-2xl p-6 card-hover-glow icon-float cursor-default group"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="stat-icon w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110"
          style={{ background: style.gradient, boxShadow: `0 8px 24px ${style.shadow}` }}
        >
          {icon}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: style.bg }}>
          <ArrowUpRight className="w-4 h-4" style={{ color: style.shadow.replace(',0.3)', ',1)') }} />
        </div>
      </div>
      <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
        {animatedValue.toLocaleString('en-IN')}
      </div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mt-1">{label}</div>
    </motion.div>
  );
}

function StatusItem({ icon, label, status, latency }: {
  icon: React.ReactNode;
  label: string;
  status: 'online' | 'degraded' | 'offline';
  latency: string;
}) {
  const isOnline = status === 'online';
  const isDegraded = status === 'degraded';

  return (
    <div className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 status-pulse-green' : isDegraded ? 'bg-amber-400 status-pulse-amber' : 'bg-red-400'}`} />
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          <span className="font-semibold text-sm text-slate-300">{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-medium text-slate-500">{latency}</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
          isOnline ? 'text-emerald-400 bg-emerald-400/10' :
          isDegraded ? 'text-amber-400 bg-amber-400/10' :
          'text-red-400 bg-red-400/10'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function RevenueCounter({ value }: { value: number }) {
  const animatedValue = useCounter(value);
  return (
    <span className="text-4xl font-black text-slate-900 tracking-tight tabular-nums">
      ₹{animatedValue.toLocaleString('en-IN')}
    </span>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const animatedValue = useCounter(value);
  return <>{animatedValue.toLocaleString('en-IN')}</>;
}
