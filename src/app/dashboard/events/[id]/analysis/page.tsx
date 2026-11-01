'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Calendar,
  Clock,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Filter,
  UserCheck,
  Phone,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import EventHeaderNav from '@/components/events/EventHeaderNav';

type FilterRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

interface AnalyticsData {
  eventName?: string;
  eventCode?: string;
  metrics: {
    totalVisitors: number;
    uniqueVisitors: number;
    rangeVisitors: number;
    todayVisitors: number;
    favoritePhotosCount: number;
  };
  range: string;
  startDate: string;
  endDate: string;
  chartData: { label: string; date: string; visitors: number }[];
  recentVisitors: {
    _id?: string;
    name: string;
    phone: string;
    email?: string;
    createdAt: string;
  }[];
}

export default function EventAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedRange, setSelectedRange] = useState<FilterRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [mediaCount, setMediaCount] = useState({ all: 0, photos: 0, videos: 0 });

  // Fetch Analytics & Event Data
  const fetchAnalytics = async (range: FilterRange = selectedRange) => {
    try {
      setLoading(true);
      const paramsObj: any = { range };
      if (range === 'custom' && customStartDate && customEndDate) {
        paramsObj.startDate = customStartDate;
        paramsObj.endDate = customEndDate;
      }

      const [res, eventRes, mediaRes] = await Promise.allSettled([
        apiClient.get(`/visitors/event/${eventId}/analytics`, { params: paramsObj }),
        apiClient.get(`/event/${eventId}`),
        apiClient.get(`/media/event/${eventId}`),
      ]);

      if (res.status === 'fulfilled' && res.value.data) {
        setAnalytics(res.value.data);
      }
      if (eventRes.status === 'fulfilled' && eventRes.value.data) {
        setEvent(eventRes.value.data.event || eventRes.value.data);
      }
      if (mediaRes.status === 'fulfilled' && mediaRes.value.data) {
        const items = mediaRes.value.data.media || mediaRes.value.data || [];
        const flat = items.map((m: any) => (Array.isArray(m) ? m[0] : m));
        const photos = flat.filter((m: any) => (m.type || '').toUpperCase() !== 'VIDEO').length;
        const videos = flat.filter((m: any) => (m.type || '').toUpperCase() === 'VIDEO').length;
        setMediaCount({ all: flat.length, photos, videos });
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
      toast.error('Failed to load visitor analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [eventId, selectedRange]);

  const handleRangeChange = (range: FilterRange) => {
    setSelectedRange(range);
    if (range === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustomDates = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    fetchAnalytics('custom');
  };

  // Export visitors CSV
  const handleExportCSV = () => {
    if (!analytics?.recentVisitors || analytics.recentVisitors.length === 0) {
      toast.error('No visitor records to export');
      return;
    }
    const headers = ['Name', 'Phone', 'Email', 'Visit Date & Time'];
    const rows = analytics.recentVisitors.map((v) => [
      `"${v.name || 'Anonymous'}"`,
      `"${v.phone || ''}"`,
      `"${v.email || ''}"`,
      `"${new Date(v.createdAt).toLocaleString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitors_${event?.name || 'event'}_${selectedRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Visitor report downloaded!');
  };

  const rangeButtons: { key: FilterRange; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
    { key: 'year', label: 'Last Year' },
    { key: 'custom', label: 'Custom Date' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 pb-20 font-sans">
      {/* ─── TOP BREADCRUMB / EVENT BANNER ─── */}
      <div className="bg-white border-b border-[#e8dfd3] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/events/${eventId}`}
              className="p-2 rounded-xl bg-[#faf8f5] hover:bg-slate-100 border border-[#e8dfd3] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back to Event Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Analytics & Insights
                </span>
                <span className="text-xs text-slate-400 font-bold">•</span>
                <span className="text-xs text-slate-500 font-bold">
                  {event?.name || 'Event Insights'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                <TrendingUp className="w-5 h-5 text-[#c5a880]" />
                Album Visitors & Traffic Analytics
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAnalytics(selectedRange)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#faf8f5] border border-[#e8dfd3] hover:border-[#c5a880] text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#c5a880] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* ═══ LUXURY NAVIGATION HEADER WITH 4 TABS ═══ */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-[0_4px_20px_rgba(197,168,128,0.06)] p-3.5 sm:p-5 mb-6">
          <EventHeaderNav
            eventId={eventId}
            activeTab="analysis"
            allCount={mediaCount.all}
            photoCount={mediaCount.photos}
            videoCount={mediaCount.videos}
            favoritesCount={analytics?.metrics?.favoritePhotosCount || 0}
            actionSlot={
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 bg-[#faf8f5] border border-[#e8dfd3] px-3 py-1.5 rounded-xl">
                  Live Real-Time Visitors
                </span>
              </div>
            }
          />

          {/* ═══ TIME RANGE FILTER BUTTONS ═══ */}
          <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                Filter:
              </span>
              {rangeButtons.map((btn) => {
                const isActive = selectedRange === btn.key;
                return (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => handleRangeChange(btn.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-[#faf8f5] hover:bg-white text-slate-700 hover:text-slate-900 border border-[#e8dfd3]'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Picker Dropdown if active */}
            {showCustomPicker && (
              <div className="flex items-center gap-2 bg-[#faf8f5] border border-[#e8dfd3] p-2 rounded-xl">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-[#e8dfd3] text-xs font-semibold bg-white"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-[#e8dfd3] text-xs font-semibold bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomDates}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ 4 KPI METRIC CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Card 1: Total Visitors */}
          <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Total Album Visits
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {loading ? '...' : analytics?.metrics?.totalVisitors ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Lifetime guest page views
            </p>
          </div>

          {/* Card 2: Unique Visitors */}
          <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Unique People
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {loading ? '...' : analytics?.metrics?.uniqueVisitors ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Distinct registered guests
            </p>
          </div>

          {/* Card 3: In Selected Range */}
          <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                {selectedRange === 'today' ? "Today's Visits" : 'Visits in Range'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              {loading
                ? '...'
                : selectedRange === 'today'
                ? analytics?.metrics?.todayVisitors ?? 0
                : analytics?.metrics?.rangeVisitors ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Active within {selectedRange}
            </p>
          </div>

          {/* Card 4: Favorited Photos */}
          <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Favorited Photos
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 mt-2">
              {loading ? '...' : analytics?.metrics?.favoritePhotosCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              Liked by gallery visitors
            </p>
          </div>
        </div>

        {/* ═══ INTERACTIVE LUXURY RECHARTS GRAPH ═══ */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-[0_4px_20px_rgba(197,168,128,0.06)] p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#e8dfd3]">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c5a880]" />
                Gallery Visitors Timeline Graph
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Displaying visitor traffic progression for {selectedRange.toUpperCase()}
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
              Total in Range: {analytics?.metrics?.rangeVisitors ?? 0}
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#c5a880]" />
              <span className="text-sm font-bold">Rendering visitor analytics graph...</span>
            </div>
          ) : !analytics?.chartData || analytics.chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">No visitor activity in this time range</p>
              <p className="text-xs text-slate-400">Share your album QR code or link to begin tracking views!</p>
            </div>
          ) : (
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c5a880" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c5a880" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1ece5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e8dfd3' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: '1px solid #475569',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    }}
                    labelStyle={{ color: '#d4af37', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} Guests`, 'Album Views']}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#c5a880"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#goldGradient)"
                    activeDot={{ r: 6, fill: '#d4af37', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ═══ RECENT GALLERY VISITORS TABLE ═══ */}
        <div className="bg-white rounded-2xl border border-[#e8dfd3] shadow-[0_4px_20px_rgba(197,168,128,0.06)] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#e8dfd3]">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c5a880]" />
                Recent Visitor Access Logs
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                Detailed visitor log of guests who opened this event album
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-[#faf8f5] px-3 py-1 rounded-lg border border-[#e8dfd3]">
              {analytics?.recentVisitors?.length || 0} Recent Records
            </span>
          </div>

          {!analytics?.recentVisitors || analytics.recentVisitors.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No visitors recorded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                When clients or guests enter their details in the live album, they will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e8dfd3] bg-[#faf8f5] text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3 px-3 rounded-l-xl">Guest Name</th>
                    <th className="py-3 px-3">Phone Number</th>
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3 rounded-r-xl">Access Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {analytics.recentVisitors.map((v, i) => (
                    <tr key={v._id || i} className="hover:bg-[#fbf9f6] transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                          {(v.name || 'G')[0].toUpperCase()}
                        </div>
                        <span>{v.name || 'Guest'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.email || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(v.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

