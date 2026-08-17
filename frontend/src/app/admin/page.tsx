'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Users, Camera, FolderOpen, Image as ImageIcon, Activity, ArrowUpRight, TrendingUp, MessageSquare, HelpCircle, ChevronRight, BarChart3, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

// ─── Animated Counter Hook ───
function useCounter(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || end === 0) { setCount(end); return; }
    started.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function: easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

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

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers || 0, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', link: '/admin/users' },
    { icon: Camera, label: 'Studios', value: stats?.totalStudios || 0, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', link: '/admin/studios' },
    { icon: FolderOpen, label: 'Events', value: stats?.totalEvents || 0, color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', link: '/admin/events' },
    { icon: ImageIcon, label: 'Media Files', value: stats?.totalMedia || 0, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', link: '#' },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-8 space-y-8 animate-pulse">
        <div className="h-24 bg-slate-200/50 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200/50 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200/50 rounded-3xl" />
          <div className="h-80 bg-slate-200/50 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen relative">
      
      {/* ═══ Background Abstract Orbs ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-blue-400/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-purple-400/5 blur-[120px]" />
      </div>

      {/* ═══ Header Section ═══ */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 mb-8 text-white shadow-2xl shadow-slate-900/20"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Superadmin Portal
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">System Operational</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Server Time</span>
              <span className="text-lg font-mono font-bold text-white">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Main Stats Grid ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnimatePresence>
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
            >
              <Link href={card.link}>
                <div className="group relative bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  {/* Hover animated background glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                    style={{ background: `radial-gradient(circle at center, ${card.glow} 0%, transparent 70%)` }}
                  />
                  
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                        style={{ background: card.color, boxShadow: `0 10px 25px -5px ${card.color}` }}
                      >
                        <card.icon className="w-6 h-6" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
                      <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-1">
                        <AnimatedNumber value={card.value} />
                        <span className="text-lg text-slate-400 font-bold">+</span>
                      </div>
                    </div>
                  </div>

                  {/* Funky decorative patterns */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 border-[8px] border-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150" />
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 border-[2px] border-slate-200 rounded-full opacity-0 group-hover:opacity-50 transition-all duration-700 delay-75 group-hover:scale-150" />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══ Financial & Infrastructure Section ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ─── Financial Overview (Large Card) ─── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-2 bg-white/80 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 relative overflow-hidden group hover:border-slate-300 transition-colors duration-500"
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  Financial Overview
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Platform Revenue & Bookings</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Full Report
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Lifetime Revenue</div>
                <div className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">
                  <span className="text-slate-300">₹</span>
                  <AnimatedNumber value={stats?.totalRevenue || 0} />
                </div>
              </div>
              
              <div className="flex gap-4 flex-1">
                <div className="flex-1 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 group-hover:bg-indigo-100/50 transition-colors duration-500">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Bookings</div>
                  <div className="text-3xl font-black text-indigo-900">
                    <AnimatedNumber value={stats?.totalBookings || 0} />
                  </div>
                </div>
                <div className="flex-1 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 group-hover:bg-emerald-100/50 transition-colors duration-500">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Quotations</div>
                  <div className="text-3xl font-black text-emerald-900">
                    <AnimatedNumber value={stats?.totalQuotations || 0} />
                  </div>
                </div>
              </div>
            </div>

            {/* Funky Bar Chart Visualization */}
            <div className="h-32 flex items-end gap-2 mt-8">
              {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85, 60, 95].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-lg relative group/bar cursor-crosshair"
                  style={{ background: `linear-gradient(to top, #e2e8f0, ${i % 2 === 0 ? '#818cf8' : '#34d399'})` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: i * 0.05 + 0.5, type: 'spring' }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Data {i+1}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── Queries & Support (Dark Tech Card) ─── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden group shadow-2xl shadow-slate-900/20 flex flex-col"
        >
          {/* Cyberpunk grid overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-fuchsia-500/20 transition-colors duration-1000" />
          
          <div className="relative z-10 flex flex-col h-full flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-fuchsia-400 backdrop-blur-md">
                  <MessageSquare className="w-5 h-5" />
                </div>
                Support Queries
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-3">Platform Helpdesk Overview</p>
            </div>

            <div className="space-y-4 flex-1">
              <Link href="/admin/queries">
                <QueryStatBox 
                  icon={Camera} 
                  label="Studio Queries" 
                  value={stats?.totalSupportTickets || 0} 
                  colorClass="text-purple-400" 
                  bgClass="bg-purple-500/20" 
                />
              </Link>
              <Link href="#">
                <QueryStatBox 
                  icon={Users} 
                  label="Customer Queries" 
                  value={stats?.totalClientTickets || 0} 
                  colorClass="text-emerald-400" 
                  bgClass="bg-emerald-500/20" 
                />
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 mt-auto">
               <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                 View All Support Tickets <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ─── Helper Components ───

function AnimatedNumber({ value }: { value: number }) {
  const animatedValue = useCounter(value);
  return <>{animatedValue.toLocaleString('en-IN')}</>;
}

function QueryStatBox({ icon: Icon, label, value, colorClass, bgClass }: any) {
  return (
    <div className="group/item flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl ${bgClass} ${colorClass}`}>
          <Icon className="w-6 h-6 relative z-10" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-200 group-hover/item:text-white transition-colors">{label}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Received</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black text-white tracking-tighter">
          <AnimatedNumber value={value} />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" />
      </div>
    </div>
  );
}
