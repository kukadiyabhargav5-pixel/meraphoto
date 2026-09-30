'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDashboard } from '../dashboard/DashboardContext';
import { 
  Calendar, Image as ImageIcon, Users, Heart, UsersRound, RefreshCw, 
  ExternalLink, Settings, Camera, TrendingUp, Sparkles, Plus, 
  ShieldCheck, Infinity as InfinityIcon, ArrowRight, Shield, Video,
  QrCode, FileText, CheckCircle2, Award
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { motion } from 'framer-motion';
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const context = useDashboard();
  const { user, studio: authStudio } = useAuth();
  const [stats, setStats] = useState<Stats>({ events: 0, media: 0, visitors: 0, teamMembers: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventsList, setEventsList] = useState<any[]>([]);

  const fetchStats = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [statsRes, eventsRes] = await Promise.all([
        apiClient.get('/dashboard/stats').catch(() => ({ data: {} })),
        apiClient.get('/event/my-events').catch(() => ({ data: { events: [] } }))
      ]);

      if (statsRes.data) {
        setStats({
          events: statsRes.data.events || 0,
          media: statsRes.data.media || 0,
          visitors: statsRes.data.visitors || 0,
          teamMembers: statsRes.data.teamMembers || 0,
          customers: statsRes.data.customers || 0,
          studioName: statsRes.data.studioName,
          subscriptionPlan: statsRes.data.subscriptionPlan
        });
      }

      if (eventsRes.data?.events) {
        setEventsList(eventsRes.data.events.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 180000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const studio = context?.studio || authStudio;

  const vipPerks = [
    {
      title: 'Unlimited Photos',
      desc: 'No quota caps. Upload millions of HD photos without fees.',
      icon: ImageIcon,
      badge: 'Unlimited ∞',
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.25)'
    },
    {
      title: 'Unlimited Videos',
      desc: 'Full 4K/HD video gallery upload with zero restrictions.',
      icon: Video,
      badge: 'Unlimited ∞',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.25)'
    },
    {
      title: 'AI Face Recognition',
      desc: 'High-speed InsightFace buffalo_l engine permanently active.',
      icon: Sparkles,
      badge: 'Active & Free',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)'
    },
    {
      title: 'Custom Watermarking',
      desc: 'Add custom studio logo and automated security stamps.',
      icon: ShieldCheck,
      badge: '100% Unlocked',
      color: '#c5a880',
      bg: 'rgba(197, 168, 128, 0.1)',
      border: 'rgba(197, 168, 128, 0.25)'
    }
  ];

  const quickFeatures = [
    {
      title: 'Create Event & Upload',
      desc: 'Create an event and upload unlimited high-resolution photos and videos.',
      href: '/admin-dashboard/create-event',
      icon: Plus,
      actionText: '+ New Event',
      primary: true
    },
    {
      title: 'Events Management',
      desc: 'View, organize, and share QR codes for all client photography events.',
      href: '/admin-dashboard/events',
      icon: Calendar,
      actionText: 'Manage Events'
    },
    {
      title: 'Gallery Visitors & Selfies',
      desc: 'Inspect guest attendance and AI selfie facial search records.',
      href: '/admin-dashboard/gallery-visitors',
      icon: Users,
      actionText: 'View Visitors'
    },
    {
      title: 'Photographer Portfolio',
      desc: 'Design and showcase your public studio portfolios online.',
      href: '/admin-dashboard/portfolios',
      icon: Camera,
      actionText: 'Portfolios'
    },
    {
      title: 'Customer Relationship (CRM)',
      desc: 'Store client contacts, wedding dates, and custom notes.',
      href: '/admin-dashboard/customers',
      icon: Heart,
      actionText: 'Open CRM'
    },
    {
      title: 'Quotation & Estimates',
      desc: 'Generate branded PDF quotations for clients in minutes.',
      href: '/admin-dashboard/quotation',
      icon: FileText,
      actionText: 'Create Quote'
    },
    {
      title: 'Client Billing & Invoices',
      desc: 'Manage event invoices, payments, and studio receipts.',
      href: '/admin-dashboard/bill',
      icon: Award,
      actionText: 'Open Billing'
    },
    {
      title: 'Studio Branding & Watermark',
      desc: 'Upload transparent watermark and configure studio themes.',
      href: '/admin-dashboard/studio-branding',
      icon: Sparkles,
      actionText: 'Branding'
    },
    {
      title: 'Payment QR Codes',
      desc: 'Showcase instant UPI/Bank payment QR code to clients.',
      href: '/admin-dashboard/payment-qr',
      icon: QrCode,
      actionText: 'Payment QR'
    },
    {
      title: 'Super Admin Control Center',
      desc: 'Manage all platform users, studios, logs, and global analytics.',
      href: '/admin',
      icon: Shield,
      actionText: 'Go to Admin Panel',
      highlight: true
    }
  ];

  return (
    <div className="p-3 xs:p-4 lg:p-8 max-w-7xl mx-auto pb-20">

      {/* ═══ VIP HERO BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-8 p-6 sm:p-8 lg:p-10 border border-amber-500/30 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #171512 40%, #1e1b16 70%, #09090b 100%)'
        }}
      >
        {/* Luxury Background Glow */}
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c5a880 0%, transparent 70%)' }} 
        />
        <div 
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} 
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl shrink-0 border border-amber-400/40"
              style={{ background: 'linear-gradient(135deg, #c5a880 0%, #a07c4c 50%, #835f2d 100%)' }}
            >
              <span className="text-3xl sm:text-4xl">👑</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-black tracking-widest uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-0.5 rounded-full">
                  Super Admin VIP Studio
                </span>
                <span className="text-[11px] font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Free Lifetime Access
                </span>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {greeting}, <span className="text-[#c5a880]">{user?.name || 'Super Admin'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
                You have full unrestricted admin access. Upload unlimited photos and videos, create unlimited events, and use all premium studio features with zero plan restrictions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-black transition-all cursor-pointer min-h-[44px]"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Admin Panel
            </Link>
            <Link
              href="/admin-dashboard/create-event"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#a07c4c] text-white text-xs font-black shadow-lg shadow-[#c5a880]/30 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              + Create Event
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══ UNLIMITED STATUS BADGES ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {vipPerks.map((perk, index) => {
          const Icon = perk.icon;
          return (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-5 rounded-2xl bg-white border shadow-sm relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: perk.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: perk.bg, color: perk.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span 
                  className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border"
                  style={{ background: perk.bg, color: perk.color, borderColor: perk.border }}
                >
                  {perk.badge}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{perk.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{perk.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ LIVE STUDIO OVERVIEW STATS ═══ */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#c5a880]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Live Studio Statistics
            </span>
          </div>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● Real-Time Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-400 mb-1">Total Events</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.events}</div>
            <div className="text-[10px] font-bold text-emerald-600 mt-1">Unlimited Allowed</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-400 mb-1">Uploaded Media</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.media}</div>
            <div className="text-[10px] font-bold text-emerald-600 mt-1">Unlimited Photo & Video</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-400 mb-1">Gallery Visitors</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.visitors}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">AI Selfie Guests</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-400 mb-1">Customers CRM</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.customers}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">Direct Client Leads</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-xs font-bold text-slate-400 mb-1">Team Members</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.teamMembers}</div>
            <div className="text-[10px] font-bold text-emerald-600 mt-1">Full Studio Crew</div>
          </div>
        </div>
      </div>

      {/* ═══ ALL UNLOCKED FEATURES HUB ═══ */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c5a880]" />
            <h2 className="text-base font-black text-slate-900">
              All Studio Facilities & Features (100% Free & Unlocked)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">10 Hubs Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.title}
                href={feat.href}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between group ${
                  feat.primary
                    ? 'bg-gradient-to-br from-[#c5a880]/15 via-white to-amber-500/10 border-[#c5a880]/40 hover:border-[#c5a880] shadow-sm hover:shadow-md'
                    : feat.highlight
                    ? 'bg-gradient-to-br from-amber-500/10 to-slate-900 text-slate-900 border-amber-400/40 hover:border-amber-500 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-[#c5a880]/60 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:scale-110 group-hover:bg-[#c5a880] group-hover:text-white transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Free Unlimited
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-[#a07c4c] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#a07c4c]">
                  <span>{feat.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ═══ RECENT EVENTS PREVIEW ═══ */}
      {eventsList.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-black text-slate-900">Your Recent Events</h2>
            </div>
            <Link 
              href="/admin-dashboard/events" 
              className="text-xs font-bold text-[#c5a880] hover:text-[#a07c4c] flex items-center gap-1"
            >
              View All Events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsList.map((ev) => (
              <div 
                key={ev._id} 
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Event Code: {ev.eventCode || ev._id.slice(-6)}
                    </span>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                      {ev.mediaCount || 0} Media
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 truncate">{ev.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ev.date ? new Date(ev.date).toLocaleDateString('en-IN') : 'Date not set'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/admin-dashboard/events/${ev.eventCode || ev._id}`}
                    className="flex-1 text-center py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors"
                  >
                    + Upload Media
                  </Link>
                  <Link
                    href={`/e/${ev.eventCode || ev._id}`}
                    target="_blank"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="View Guest Gallery"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
