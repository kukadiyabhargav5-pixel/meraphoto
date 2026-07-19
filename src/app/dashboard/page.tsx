'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import { Calendar, Image as ImageIcon, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Stats {
  events: number;
  photos: number;
  customers: number;
  studioName?: string;
  subscriptionPlan?: string;
}

function AnimatedCount({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 900;
    const steps = 40;
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

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

export default function DashboardOverview() {
  const context = useDashboard();
  const [stats, setStats] = useState<Stats>({ events: 0, photos: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await apiClient.get('/dashboard/stats');
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 30 seconds (real-time feel)
  useEffect(() => {
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!context) return null;

  const statCards = [
    {
      id: 'events',
      label: 'Total Events',
      value: stats.events,
      icon: Calendar,
      iconBg: 'from-violet-500/20 to-purple-500/10',
      iconColor: '#a78bfa',
      borderColor: 'rgba(167,139,250,0.25)',
      glowColor: 'rgba(167,139,250,0.08)',
      trend: 'Events in your studio',
    },
    {
      id: 'photos',
      label: 'Total Photos',
      value: stats.photos,
      icon: ImageIcon,
      iconBg: 'from-amber-500/20 to-yellow-500/10',
      iconColor: '#f59e0b',
      borderColor: 'rgba(245,158,11,0.25)',
      glowColor: 'rgba(245,158,11,0.08)',
      trend: 'Uploaded media files',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-black p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Real-time data from your MongoDB database
              {lastUpdated && (
                <span className="text-slate-400 ml-1">
                  · Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-[#c5a880] hover:text-[#9c7c56] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards — Events & Photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="relative bg-white rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                style={{
                  border: `1px solid ${card.borderColor}`,
                  boxShadow: `0 4px 24px ${card.glowColor}`,
                }}
              >
                {/* Background glow */}
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 60% 60% at 80% 20%, ${card.glowColor.replace('0.08', '0.18')} 0%, transparent 70%)`,
                  }}
                />

                <div className="relative flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${card.iconBg}`}
                    style={{ border: `1px solid ${card.borderColor}` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: card.iconColor }} />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                    style={{
                      color: card.iconColor,
                      background: `${card.glowColor.replace('0.08', '0.15')}`,
                    }}
                  >
                    Live
                  </span>
                </div>

                <div className="relative">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {card.label}
                  </p>
                  <p className="text-4xl font-black text-slate-900 tabular-nums">
                    {loading ? (
                      <span className="inline-block w-16 h-9 bg-slate-100 rounded-lg animate-pulse" />
                    ) : (
                      <AnimatedCount value={card.value} />
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {card.trend}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-xs text-slate-500 font-medium">
            Auto-refreshes every <span className="text-slate-700 font-bold">30 seconds</span> from MongoDB database
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white border border-dashed border-[#c5a880]/40 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#c5a880]/10 rounded-full mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c5a880] animate-pulse" />
            <span className="text-xs font-bold text-[#9c7c56] uppercase tracking-wider">Coming Soon</span>
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1">Total Clients & Revenue</h2>
          <p className="text-sm text-slate-400">These stats will be added as per your instructions</p>
        </div>

      </div>
    </div>
  );
}
