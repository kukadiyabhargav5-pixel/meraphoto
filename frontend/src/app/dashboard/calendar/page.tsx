'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Camera,
  Video,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Mail,
  Sparkles,
  Filter,
  Check,
  RefreshCw,
  CalendarCheck2,
  ArrowRight
} from 'lucide-react';

const EVENT_TYPES = [
  'Wedding', 'Pre-Wedding', 'Reception', 'Engagement', 'Birthday',
  'Corporate', 'School', 'Garba', 'Concert', 'Religious',
  'Baby Shower', 'Maternity', 'Portfolio', 'Other'
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// Format date to YYYY-MM-DD
function formatDateKey(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type ShootCategory = 'upcoming' | 'today' | 'complete' | 'due';

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useDashboard();
  const { shoots = [], setShoots } = context || {};

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateKey(today), [today]);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeFilter, setActiveFilter] = useState<'all' | ShootCategory>('all');
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: todayStr,
    time: '09:00',
    eventName: '',
    eventType: 'Wedding',
    photographersCount: 1,
    videographersCount: 0,
    photographersNames: [''] as string[],
    videographersNames: [] as string[],
    location: '',
    notes: '',
    reminder: '24h' as 'none' | '24h' | '72h'
  });

  // Handle URL query filter on initial load (e.g. ?filter=today)
  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter && ['upcoming', 'today', 'complete', 'due'].includes(urlFilter.toLowerCase())) {
      setActiveFilter(urlFilter.toLowerCase() as ShootCategory);
    }
  }, [searchParams]);

  // Refresh shoots from server
  const fetchShoots = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get('/dashboard/shoots');
      if (res.data && Array.isArray(res.data)) {
        setShoots(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh shoots:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Determine shoot category
  const getShootCategory = (s: any): ShootCategory => {
    if (s.status === 'Completed') return 'complete';
    if (s.status === 'Due') return 'due';
    
    const sDateStr = formatDateKey(s.date);
    if (sDateStr === todayStr || s.status === 'Today') {
      return 'today';
    }
    if (sDateStr > todayStr || s.status === 'Upcoming') {
      return 'upcoming';
    }
    // Past date not completed
    return 'due';
  };

  // Month navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const goToTodayMonth = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayStr);
  };

  // Filtered shoots for the selected month
  const shootsInSelectedMonth = useMemo(() => {
    return (shoots || []).filter((s: any) => {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [shoots, currentMonth, currentYear]);

  // Counts for the 4 boxes based on the currently selected month
  const monthlyCounts = useMemo(() => {
    let upcoming = 0;
    let todayCount = 0;
    let complete = 0;
    let due = 0;

    shootsInSelectedMonth.forEach((s: any) => {
      const cat = getShootCategory(s);
      if (cat === 'upcoming') upcoming++;
      else if (cat === 'today') todayCount++;
      else if (cat === 'complete') complete++;
      else if (cat === 'due') due++;
    });

    return { upcoming, today: todayCount, complete, due, total: shootsInSelectedMonth.length };
  }, [shootsInSelectedMonth, todayStr]);

  // Filtered shoots display list based on activeFilter and selectedDate
  const displayedShoots = useMemo(() => {
    let list = shootsInSelectedMonth;

    if (activeFilter !== 'all') {
      list = list.filter((s: any) => getShootCategory(s) === activeFilter);
    } else if (selectedDate) {
      // If no specific status filter, filter by selected date
      list = list.filter((s: any) => formatDateKey(s.date) === selectedDate);
    }

    // Sort by date asc, then time
    return [...list].sort((a: any, b: any) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (diff !== 0) return diff;
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [shootsInSelectedMonth, activeFilter, selectedDate]);

  // Open Add Shoot modal
  const handleOpenAddModal = (dateStr?: string) => {
    const targetDate = dateStr || selectedDate || todayStr;
    setEditingShootId(null);
    setFormData({
      date: targetDate,
      time: '09:00',
      eventName: '',
      eventType: 'Wedding',
      photographersCount: 1,
      videographersCount: 0,
      photographersNames: [''],
      videographersNames: [],
      location: '',
      notes: '',
      reminder: '24h'
    });
    setShowFormModal(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (shoot: any) => {
    setEditingShootId(shoot._id);
    setFormData({
      date: formatDateKey(shoot.date) || todayStr,
      time: shoot.time || '09:00',
      eventName: shoot.eventName || '',
      eventType: shoot.eventType || 'Wedding',
      photographersCount: shoot.photographersCount || (shoot.photographersNames?.length || 0),
      videographersCount: shoot.videographersCount || (shoot.videographersNames?.length || 0),
      photographersNames: shoot.photographersNames || [],
      videographersNames: shoot.videographersNames || [],
      location: shoot.location || '',
      notes: shoot.notes || '',
      reminder: shoot.reminder || '24h'
    });
    setShowFormModal(true);
  };

  // Update photographer / videographer counts & names
  const updatePhotographerCount = (count: number) => {
    const c = Math.max(0, Math.min(20, count));
    const names = [...formData.photographersNames];
    while (names.length < c) names.push('');
    setFormData({ ...formData, photographersCount: c, photographersNames: names.slice(0, c) });
  };

  const updateVideographerCount = (count: number) => {
    const c = Math.max(0, Math.min(20, count));
    const names = [...formData.videographersNames];
    while (names.length < c) names.push('');
    setFormData({ ...formData, videographersCount: c, videographersNames: names.slice(0, c) });
  };

  // Submit Add or Edit shoot
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      toast.error('Please enter an event name');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        date: formData.date,
        time: formData.time,
        eventName: formData.eventName.trim(),
        eventType: formData.eventType,
        photographersCount: formData.photographersNames.filter(n => n.trim()).length,
        videographersCount: formData.videographersNames.filter(n => n.trim()).length,
        photographersNames: formData.photographersNames.filter(n => n.trim()),
        videographersNames: formData.videographersNames.filter(n => n.trim()),
        location: formData.location.trim(),
        notes: formData.notes.trim(),
        reminder: formData.reminder
      };

      if (editingShootId) {
        const res = await apiClient.put(`/dashboard/shoots/${editingShootId}`, payload);
        setShoots((prev: any[]) => prev.map((s: any) => s._id === editingShootId ? res.data : s));
        toast.success('Shoot updated successfully!');
      } else {
        const res = await apiClient.post('/dashboard/shoots', payload);
        setShoots((prev: any[]) => [...prev, res.data]);
        const shootCat = getShootCategory(res.data);
        if (shootCat === 'today') {
          toast.success('🎉 Scheduled for Today! Notification email sent to studio.');
        } else {
          toast.success('📅 Shoot added to Upcoming schedule!');
        }
      }

      setShowFormModal(false);
      setSelectedDate(formData.date);
    } catch (err: any) {
      console.error('Error saving shoot:', err);
      toast.error(err?.response?.data?.error || 'Failed to save shoot');
    } finally {
      setSaving(false);
    }
  };

  // ACTION 1: Complete Shoot (Moves to Complete Box)
  const handleMarkComplete = async (shootId: string, eventName: string) => {
    try {
      setActionLoadingId(shootId);
      const res = await apiClient.put(`/dashboard/shoots/${shootId}`, { status: 'Completed' });
      setShoots((prev: any[]) => prev.map((s: any) => s._id === shootId ? res.data : s));
      toast.success(`🎉 "${eventName}" marked as Completed! Moved to Complete box.`, {
        icon: '✅',
        duration: 3500
      });
    } catch (err: any) {
      console.error('Failed to complete shoot:', err);
      toast.error('Failed to update shoot status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ACTION 2: Move to Due Date (User clicks Delete / Move to Due on Today shoot)
  const handleMoveToDue = async (shootId: string, eventName: string) => {
    try {
      setActionLoadingId(shootId);
      const res = await apiClient.put(`/dashboard/shoots/${shootId}`, { status: 'Due' });
      setShoots((prev: any[]) => prev.map((s: any) => s._id === shootId ? res.data : s));
      toast.success(`Shoot "${eventName}" moved to Due Date list.`, {
        icon: '⏳',
        duration: 3500
      });
    } catch (err: any) {
      console.error('Failed to move shoot to due:', err);
      toast.error('Failed to update shoot status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Resend Email Alert to studio
  const handleResendEmail = async (shootId: string, eventName: string) => {
    try {
      setActionLoadingId(shootId);
      const res = await apiClient.post(`/dashboard/shoots/${shootId}/send-email`);
      toast.success(res.data?.message || `Alert email sent for "${eventName}"!`, {
        icon: '📧',
        duration: 3500
      });
      // update state
      setShoots((prev: any[]) => prev.map((s: any) => s._id === shootId ? { ...s, todayEmailSent: true } : s));
    } catch (err: any) {
      console.error('Email send error:', err);
      toast.error(err?.response?.data?.error || 'Failed to dispatch email');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (shootId: string, eventName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete shoot "${eventName}"?`)) return;
    try {
      setActionLoadingId(shootId);
      await apiClient.delete(`/dashboard/shoots/${shootId}`);
      setShoots((prev: any[]) => prev.filter((s: any) => s._id !== shootId));
      toast.success('Shoot permanently removed.');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete shoot');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calendar Grid Cells calculations
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const calendarCells = [];
  // Trailing previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      shoots: (shoots || []).filter((s: any) => formatDateKey(s.date) === dateStr)
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      shoots: (shoots || []).filter((s: any) => formatDateKey(s.date) === dateStr)
    });
  }

  // Leading next month days to complete 35 or 42 grid cells
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      calendarCells.push({
        day: i,
        dateStr,
        isCurrentMonth: false,
        shoots: (shoots || []).filter((s: any) => formatDateKey(s.date) === dateStr)
      });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#faf8f5] text-slate-900 min-h-screen p-3 xs:p-4 sm:p-6 lg:p-8">
      {/* ═══ Header ═══ */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e8dfd3]/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30">
                Studio Planner
              </span>
              <span className="text-xs font-semibold text-slate-400">• Automated Sync & Alerts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
              <CalendarIcon className="w-7 h-7 text-[#c5a880]" />
              Event & Shoot Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Automated 4-status tracking for upcoming, today, completed, and due shoots.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchShoots}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white border border-[#e8dfd3] text-slate-600 hover:text-slate-900 hover:border-[#c5a880] transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Shoots"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#c5a880]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => handleOpenAddModal(selectedDate || todayStr)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#cbb08c] to-[#b89665] text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule New Shoot
            </button>
          </div>
        </div>

        {/* ═══ Top 4 KPI Status Boxes ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* BOX 1: UPCOMING */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'upcoming' ? 'all' : 'upcoming')}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden border ${
              activeFilter === 'upcoming'
                ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white border-[#e8dfd3] hover:border-blue-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeFilter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                Upcoming
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {monthlyCounts.upcoming}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Scheduled future shoots in {MONTH_NAMES[currentMonth].slice(0, 3)}
            </p>
            {activeFilter === 'upcoming' && (
              <div className="mt-2 text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Filtering list
              </div>
            )}
          </div>

          {/* BOX 2: TODAY */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'today' ? 'all' : 'today')}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden border ${
              activeFilter === 'today'
                ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                : 'bg-white border-[#e8dfd3] hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeFilter === 'today' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                Today
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {monthlyCounts.today}
              {monthlyCounts.today > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block" />
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Action required today • Email alerts sent
            </p>
            {activeFilter === 'today' && (
              <div className="mt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Filtering list
              </div>
            )}
          </div>

          {/* BOX 3: COMPLETE */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'complete' ? 'all' : 'complete')}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden border ${
              activeFilter === 'complete'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white border-[#e8dfd3] hover:border-emerald-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeFilter === 'complete' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Complete
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {monthlyCounts.complete}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Successfully finished shoots
            </p>
            {activeFilter === 'complete' && (
              <div className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Filtering list
              </div>
            )}
          </div>

          {/* BOX 4: DUE DATE */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'due' ? 'all' : 'due')}
            className={`cursor-pointer rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden border ${
              activeFilter === 'due'
                ? 'bg-rose-50/80 border-rose-500 shadow-md ring-2 ring-rose-500/30'
                : 'bg-white border-[#e8dfd3] hover:border-rose-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeFilter === 'due' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                Due Date
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {monthlyCounts.due}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Overdue or deleted from today
            </p>
            {activeFilter === 'due' && (
              <div className="mt-2 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Filtering list
              </div>
            )}
          </div>
        </div>

        {/* ═══ Month Switcher Bar ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 p-3 sm:p-4 rounded-2xl bg-white border border-[#e8dfd3] shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-xl bg-[#faf8f5] hover:bg-[#ebd9c2]/50 text-slate-700 transition-colors cursor-pointer border border-[#e8dfd3]"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight min-w-[170px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-xl bg-[#faf8f5] hover:bg-[#ebd9c2]/50 text-slate-700 transition-colors cursor-pointer border border-[#e8dfd3]"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={goToTodayMonth}
              className="text-xs font-black px-3 py-1.5 rounded-xl bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30 hover:bg-[#c5a880]/25 transition-colors cursor-pointer ml-1"
            >
              This Month
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-[#faf8f5] text-slate-600 hover:bg-slate-100 border border-[#e8dfd3]'
              }`}
            >
              All Shoots ({monthlyCounts.total})
            </button>
            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#faf8f5] text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              Upcoming ({monthlyCounts.upcoming})
            </button>
            <button
              onClick={() => setActiveFilter('today')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#faf8f5] text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Today ({monthlyCounts.today})
            </button>
            <button
              onClick={() => setActiveFilter('complete')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'complete'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#faf8f5] text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Complete ({monthlyCounts.complete})
            </button>
            <button
              onClick={() => setActiveFilter('due')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'due'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#faf8f5] text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              Due Date ({monthlyCounts.due})
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Main Calendar & Shoots Section ═══ */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Full Interactive Calendar Matrix (7 Cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-2 border-b border-slate-100 mb-2">
            {DAY_NAMES.map((d, idx) => (
              <div
                key={d}
                className={`text-[11px] sm:text-xs font-black uppercase tracking-wider py-1 ${
                  idx === 0 || idx === 6 ? 'text-amber-700' : 'text-slate-500'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              const isSelected = selectedDate === cell.dateStr;
              const isDayToday = cell.dateStr === todayStr;
              const hasShoots = cell.shoots.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    if (activeFilter !== 'all') {
                      setActiveFilter('all');
                    }
                  }}
                  className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer relative flex flex-col justify-between border ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/60 text-slate-300 border-slate-100 opacity-60'
                      : isSelected
                      ? 'bg-[#c5a880]/10 border-[#c5a880] ring-2 ring-[#c5a880]/40 shadow-xs'
                      : isDayToday
                      ? 'bg-amber-50/70 border-amber-300/80 shadow-xs'
                      : 'bg-white border-slate-100 hover:border-[#c5a880]/60 hover:bg-[#faf8f5]'
                  }`}
                >
                  {/* Top: Day Number + Add button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-black flex items-center justify-center rounded-lg ${
                        isDayToday
                          ? 'w-6 h-6 bg-amber-500 text-white shadow-xs'
                          : isSelected
                          ? 'w-6 h-6 bg-[#c5a880] text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {cell.isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.dateStr);
                          handleOpenAddModal(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-400 hover:text-[#c5a880] transition-opacity cursor-pointer"
                        title="Add Shoot on this Date"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Shoot Badges Preview */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {cell.shoots.slice(0, 2).map((s: any) => {
                      const cat = getShootCategory(s);
                      let badgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
                      if (cat === 'today') badgeBg = 'bg-amber-200/90 text-amber-900 border-amber-300 font-extrabold';
                      else if (cat === 'complete') badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      else if (cat === 'due') badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';

                      return (
                        <div
                          key={s._id}
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate border ${badgeBg}`}
                          title={`${s.eventName} (${s.time})`}
                        >
                          {s.time} {s.eventName}
                        </div>
                      );
                    })}
                    {cell.shoots.length > 2 && (
                      <div className="text-[9px] font-extrabold text-slate-500 text-center">
                        +{cell.shoots.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Bottom Indicator Dot */}
                  {hasShoots && (
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      {cell.shoots.some((s: any) => getShootCategory(s) === 'today') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                      {cell.shoots.some((s: any) => getShootCategory(s) === 'upcoming') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {cell.shoots.some((s: any) => getShootCategory(s) === 'complete') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      {cell.shoots.some((s: any) => getShootCategory(s) === 'due') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Upcoming
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Today (Active)
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Complete
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Due Date
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">
              Click any date to inspect details
            </span>
          </div>
        </div>

        {/* Right: Shoot Details & Action Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[#e8dfd3] p-4 sm:p-5 shadow-xs">
            {/* Header for shoots view */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarCheck2 className="w-4 h-4 text-[#c5a880]" />
                  {activeFilter === 'all'
                    ? selectedDate === todayStr
                      ? "Today's Schedule"
                      : `Shoots on ${selectedDate}`
                    : `${activeFilter.toUpperCase()} Shoots`}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {displayedShoots.length} shoot(s) found
                </span>
              </div>

              <button
                onClick={() => handleOpenAddModal(selectedDate || todayStr)}
                className="px-2.5 py-1.5 rounded-xl bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30 hover:bg-[#c5a880]/25 text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Shoots List */}
            {displayedShoots.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#faf8f5] text-slate-400 flex items-center justify-center mx-auto mb-3 border border-[#e8dfd3]">
                  <CalendarIcon className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">No shoots found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {activeFilter !== 'all'
                    ? `No ${activeFilter} shoots for this month.`
                    : 'No shoots scheduled on this date.'}
                </p>
                <button
                  onClick={() => handleOpenAddModal(selectedDate || todayStr)}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors"
                >
                  + Add Shoot Here
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {displayedShoots.map((shoot: any) => {
                  const cat = getShootCategory(shoot);
                  const isActionLoading = actionLoadingId === shoot._id;

                  return (
                    <div
                      key={shoot._id}
                      className={`rounded-2xl p-4 border transition-all ${
                        cat === 'today'
                          ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                          : cat === 'complete'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : cat === 'due'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-[#e8dfd3]'
                      }`}
                    >
                      {/* Top Row: Event name + Category Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {shoot.eventType || 'Event'}
                            </span>
                            {cat === 'today' && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                                ★ Today's Shoot
                              </span>
                            )}
                            {cat === 'complete' && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                ✓ Completed
                              </span>
                            )}
                            {cat === 'due' && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                                ⚠ Due Date
                              </span>
                            )}
                            {cat === 'upcoming' && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-900 mt-1">
                            {shoot.eventName}
                          </h4>
                        </div>

                        {/* Edit & Delete icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(shoot)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Shoot"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(shoot._id, shoot.eventName)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Permanent Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Shoot Details Info */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700">{shoot.time}</span>
                          <span className="text-slate-400">•</span>
                          <span>{formatDateKey(shoot.date)}</span>
                        </div>

                        {shoot.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{shoot.location}</span>
                          </div>
                        )}

                        {/* Photographers & Videographers */}
                        {(shoot.photographersNames?.length > 0 || shoot.videographersNames?.length > 0) && (
                          <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px]">
                            {shoot.photographersNames?.length > 0 && (
                              <span className="flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                <Camera className="w-3 h-3 text-[#c5a880]" />
                                {shoot.photographersNames.join(', ')}
                              </span>
                            )}
                            {shoot.videographersNames?.length > 0 && (
                              <span className="flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                <Video className="w-3 h-3 text-indigo-500" />
                                {shoot.videographersNames.join(', ')}
                              </span>
                            )}
                          </div>
                        )}

                        {shoot.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded-lg border border-slate-100 mt-1">
                            "{shoot.notes}"
                          </p>
                        )}
                      </div>

                      {/* ═══ TODAY'S TWO PRIMARY ACTION BUTTONS: Complete & Delete (Move to Due) ═══ */}
                      {cat === 'today' && (
                        <div className="mt-4 pt-3 border-t border-amber-200/60 flex flex-col gap-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                            Action for Today's Event
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Complete Button */}
                            <button
                              onClick={() => handleMarkComplete(shoot._id, shoot.eventName)}
                              disabled={isActionLoading}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>Complete</span>
                            </button>

                            {/* Delete / Move to Due Button */}
                            <button
                              onClick={() => handleMoveToDue(shoot._id, shoot.eventName)}
                              disabled={isActionLoading}
                              className="w-full py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Delete or reschedule: moves to Due Date box"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Move to Due</span>
                            </button>
                          </div>

                          {/* Email notification status and resend button */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Mail className="w-3 h-3 text-emerald-600" />
                              {shoot.todayEmailSent ? 'Email sent to Studio' : 'Auto email scheduled'}
                            </span>
                            <button
                              onClick={() => handleResendEmail(shoot._id, shoot.eventName)}
                              disabled={isActionLoading}
                              className="text-[#8c6d3f] hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              Resend Alert
                            </button>
                          </div>
                        </div>
                      )}

                      {/* DUE DATE CARD ACTIONS: Complete or Reschedule */}
                      {cat === 'due' && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleMarkComplete(shoot._id, shoot.eventName)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(shoot)}
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 underline"
                          >
                            Reschedule Date
                          </button>
                        </div>
                      )}

                      {/* UPCOMING CARD ACTIONS */}
                      {cat === 'upcoming' && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Status: Scheduled</span>
                          <button
                            onClick={() => handleOpenEditModal(shoot)}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            Edit Shoot
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Add / Edit Shoot Modal ═══ */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#ebd9c2] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {editingShootId ? 'Edit Shoot Details' : 'Schedule New Shoot'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Shoots on today's date auto-alert the studio owner via email.
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhargav & Priya Wedding"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/20"
                />
              </div>

              {/* Event Type & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-[#c5a880]"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Shoot Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-[#c5a880]"
                  >
                  </input>
                </div>
              </div>

              {/* Time & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Bhagwati, Surat"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* Photographers Section */}
              <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#c5a880]" />
                    Photographers ({formData.photographersNames.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updatePhotographerCount(formData.photographersNames.length - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePhotographerCount(formData.photographersNames.length + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {formData.photographersNames.map((name, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Photographer #${idx + 1} Name`}
                    value={name}
                    onChange={(e) => {
                      const updated = [...formData.photographersNames];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, photographersNames: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs mb-1.5 bg-white focus:outline-hidden focus:border-[#c5a880]"
                  />
                ))}
              </div>

              {/* Videographers Section */}
              <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#e8dfd3]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-indigo-500" />
                    Videographers ({formData.videographersNames.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateVideographerCount(formData.videographersNames.length - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVideographerCount(formData.videographersNames.length + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {formData.videographersNames.map((name, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Videographer #${idx + 1} Name`}
                    value={name}
                    onChange={(e) => {
                      const updated = [...formData.videographersNames];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, videographersNames: updated });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs mb-1.5 bg-white focus:outline-hidden focus:border-[#c5a880]"
                  />
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Special Notes / Client Requirements
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Drone needed, candid shots priority, arrive 30 mins early"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-hidden focus:border-[#c5a880]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#b89665] text-white text-xs font-black shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingShootId ? 'Update Shoot' : 'Save Shoot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-[#c5a880]" />
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
