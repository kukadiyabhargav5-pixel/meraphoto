'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  ChevronLeft, ChevronRight, Plus, X, Camera, Video, Clock,
  MapPin, Loader, Calendar as CalendarIcon, Trash2
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

export default function CalendarPage() {
  const context = useDashboard();
  if (!context) return null;
  const { shoots, setShoots } = context;

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workType, setWorkType] = useState<'Event' | 'Other'>('Event');
  const [viewingShoot, setViewingShoot] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    time: '09:00',
    eventName: '',
    eventType: 'Wedding',
    photographersCount: 1,
    videographersCount: 0,
    photographersNames: [''] as string[],
    videographersNames: [] as string[],
    location: '',
    notes: ''
  });

  // Calendar calculations
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  // Navigate months
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get shoots for a specific date
  const getShootsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shoots.filter((s: any) => {
      const sDate = new Date(s.date);
      const sStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
      return sStr === dateStr;
    });
  };

  // Handle date click
  const handleDateClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    const shootsOnDate = getShootsForDate(day);
    if (shootsOnDate.length > 0) {
      setShowForm(false);
    } else {
      setWorkType('Event');
      setFormData({
        time: '09:00',
        eventName: '',
        eventType: 'Wedding',
        photographersCount: 0,
        videographersCount: 0,
        photographersNames: [],
        videographersNames: [],
        location: '',
        notes: ''
      });
      setShowForm(true);
    }
  };

  // Update photographer/videographer name arrays when count changes
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

  const updatePhotographerName = (index: number, value: string) => {
    const names = [...formData.photographersNames];
    names[index] = value;
    setFormData({ ...formData, photographersNames: names });
  };

  const updateVideographerName = (index: number, value: string) => {
    const names = [...formData.videographersNames];
    names[index] = value;
    setFormData({ ...formData, videographersNames: names });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.eventName.trim()) return;

    try {
      setSaving(true);
      const payload = {
        date: selectedDate,
        time: formData.time,
        eventName: formData.eventName,
        eventType: workType === 'Other' ? 'Other Work' : formData.eventType,
        photographersCount: workType === 'Other' ? 0 : formData.photographersNames.length,
        videographersCount: workType === 'Other' ? 0 : formData.videographersNames.length,
        photographersNames: formData.photographersNames.filter(n => n.trim()),
        videographersNames: workType === 'Other' ? [] : formData.videographersNames.filter(n => n.trim()),
        location: formData.location,
        notes: formData.notes
      };

      const res = await apiClient.post('/dashboard/shoots', payload);
      setShoots([...shoots, res.data]);
      setShowForm(false);
      // Stay on the selected date to show the updated list
    } catch (err) {
      alert('Error saving shoot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete shoot
  const handleDeleteShoot = async (shootId: string) => {
    if (!window.confirm('Are you sure you want to delete this shoot?')) return;
    try {
      await apiClient.delete(`/dashboard/shoots/${shootId}`);
      setShoots(shoots.filter((s: any) => s._id !== shootId));
    } catch (err) {
      alert('Error deleting shoot.');
    }
  };

  // Check if a day is today
  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  // Upcoming shoots (from today onward, sorted)
  const upcomingShoots = shoots
    .filter((s: any) => new Date(s.date) >= new Date(today.toDateString()))
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Build calendar grid cells
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, isCurrentMonth: false, shoots: [] });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, isCurrentMonth: true, shoots: getShootsForDate(d) });
  }

  // Next month leading days (fill remaining cells to complete the grid row)
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      calendarCells.push({ day: i, isCurrentMonth: false, shoots: [] });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white text-black p-4 md:p-8">
      <style dangerouslySetInnerHTML={{ __html: `
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .cal-cell {
          min-height: 90px;
          border: 1px solid #e2e8f0;
          padding: 6px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          background: #fff;
        }
        .cal-cell:hover { background: #f8fafc; border-color: #c5a880; z-index: 1; }
        .cal-cell.today { background: linear-gradient(135deg, #fdf6ee 0%, #fef9f3 100%); border-color: #c5a880; }
        .cal-cell.other-month { background: #f8fafc; opacity: 0.5; }
        .cal-cell.selected { background: #c5a880/10; border-color: #c5a880; box-shadow: inset 0 0 0 2px #c5a880; }
        .cal-day-num {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          font-family: 'Inter', sans-serif;
        }
        .cal-cell.other-month .cal-day-num { color: #94a3b8; }
        .cal-cell.today .cal-day-num { 
          color: #fff; 
          background: #c5a880; 
          width: 26px; height: 26px; 
          border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
        }
        .shoot-pill {
          display: block;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: linear-gradient(135deg, #c5a880 0%, #d4b896 100%);
          color: #1e1b18;
        }
        .form-label {
          font-size: 10px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          display: block;
        }
        .form-input {
          width: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197, 168, 128, 0.15);
        }
        .form-input::placeholder { color: #94a3b8; }
        .crew-name-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s;
        }
        .crew-name-input:focus { border-color: #c5a880; background: #fff; }
        .form-panel {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .upcoming-card {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          transition: all 0.2s;
        }
        .upcoming-card:hover {
          border-color: #c5a880;
          box-shadow: 0 4px 12px rgba(197, 168, 128, 0.12);
        }
      ` }} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Studio Shoot CalendarLog</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            View upcoming shoots, manage bookings, and track your photography schedule.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Month Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-[#c5a880]" />
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrevMonth}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#c5a880] hover:bg-[#c5a880]/10 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Grid Scroll Wrapper */}
              <div className="overflow-x-auto w-full">
                <div className="min-w-[600px]">
                  {/* Day Names Header */}
                  <div className="cal-grid border-b border-slate-100">
                    {DAY_NAMES.map(d => (
                      <div key={d} className="text-center py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/30">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="cal-grid">
                    {calendarCells.map((cell, idx) => (
                      <div
                        key={idx}
                        className={`cal-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isCurrentMonth && isToday(cell.day) ? 'today' : ''} ${selectedDate === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}` && cell.isCurrentMonth ? 'selected' : ''}`}
                        onClick={() => cell.isCurrentMonth && handleDateClick(cell.day)}
                      >
                        <span className="cal-day-num">{cell.day}</span>
                        {cell.shoots.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1 w-full overflow-hidden">
                            {cell.shoots.slice(0, 2).map((s: any, i: number) => (
                              <span key={i} className="shoot-pill truncate w-full block">{s.eventName || 'Shoot'}</span>
                            ))}
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-[#c5a880]/10 text-[#b59a72] text-[9px] font-extrabold rounded w-full mt-0.5 border border-[#c5a880]/20">
                              {cell.shoots.length} {cell.shoots.length === 1 ? 'Work' : 'Works'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Form or Upcoming Shoots */}
          <div className="w-full lg:w-[380px] shrink-0">
            {showForm && selectedDate ? (
              <div className="form-panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Form Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex bg-slate-200/60 rounded-lg p-1 w-fit">
                      <button 
                        type="button" 
                        onClick={() => setWorkType('Event')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${workType === 'Event' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Event Shoot
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setWorkType('Other')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${workType === 'Other' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Other Work
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setSelectedDate(null); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors self-start"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {workType === 'Other' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="form-label">Task Name</label>
                        <input type="text" className="form-input"  value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} required />
                      </div>
                      <div>
                        <label className="form-label">
                          <Clock className="inline h-3 w-3 mr-1 -mt-0.5" /> Time
                        </label>
                        <input type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                      </div>
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                        <label className="form-label mb-3 text-slate-700">Assigned To</label>
                        <div className="flex flex-col gap-2">
                           {formData.photographersNames.map((name, idx) => (
                              <div key={`o-${idx}`} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-800 font-medium shadow-sm">
                                 {name}
                                 <button type="button" onClick={() => setFormData({...formData, photographersNames: formData.photographersNames.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5"/></button>
                              </div>
                           ))}
                           <select 
                             className="form-input text-sm text-slate-600 bg-white" 
                             value=""
                             onChange={(e) => {
                                if(e.target.value && !formData.photographersNames.includes(e.target.value)) {
                                   setFormData({...formData, photographersNames: [...formData.photographersNames, e.target.value]});
                                }
                             }}
                           >
                             <option value="">+ Assign team member</option>
                             <option value="Studio">Studio (Unassigned)</option>
                             {context.team?.map((t: any) => (
                               <option key={t._id} value={t.name}>{t.name} ({t.role})</option>
                             ))}
                           </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label">
                          <MapPin className="inline h-3 w-3 mr-1 -mt-0.5" /> Location (Optional)
                        </label>
                        <input type="text" className="form-input"  value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Notes (Optional)</label>
                        <textarea className="form-input" rows={2}  value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Time */}
                      <div>
                        <label className="form-label">
                          <Clock className="inline h-3 w-3 mr-1 -mt-0.5" /> Shoot Time
                        </label>
                        <input type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                      </div>

                      {/* Event Name */}
                      <div>
                        <label className="form-label">Event Name</label>
                        <input type="text" className="form-input"  value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} required />
                      </div>

                      {/* Event Type */}
                      <div>
                        <label className="form-label">Event Type</label>
                        <select className="form-input" value={formData.eventType} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
                          {EVENT_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Photographers */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                        <label className="form-label mb-3 flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5 text-[#c5a880]" /> Photographers
                        </label>
                        <div className="flex flex-col gap-2">
                           {formData.photographersNames.map((name, idx) => (
                              <div key={`p-${idx}`} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-800 font-medium shadow-sm">
                                 {name}
                                 <button type="button" onClick={() => setFormData({...formData, photographersNames: formData.photographersNames.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5"/></button>
                              </div>
                           ))}
                           <select 
                             className="form-input text-sm text-slate-600 bg-white" 
                             value=""
                             onChange={(e) => {
                                if(e.target.value && !formData.photographersNames.includes(e.target.value)) {
                                   setFormData({...formData, photographersNames: [...formData.photographersNames, e.target.value]});
                                }
                             }}
                           >
                             <option value="">+ Add Photographer</option>
                             <option value="Studio">Studio (Unassigned)</option>
                             {context.team?.filter((t: any) => t.role.toLowerCase().includes('photo') || t.role.toLowerCase().includes('studio')).map((t: any) => (
                               <option key={t._id} value={t.name}>{t.name} ({t.role})</option>
                             ))}
                           </select>
                        </div>
                      </div>

                      {/* Videographers */}
                      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                        <label className="form-label mb-3 flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5 text-[#c5a880]" /> Videographers
                        </label>
                        <div className="flex flex-col gap-2">
                           {formData.videographersNames.map((name, idx) => (
                              <div key={`v-${idx}`} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-800 font-medium shadow-sm">
                                 {name}
                                 <button type="button" onClick={() => setFormData({...formData, videographersNames: formData.videographersNames.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5"/></button>
                              </div>
                           ))}
                           <select 
                             className="form-input text-sm text-slate-600 bg-white" 
                             value=""
                             onChange={(e) => {
                                if(e.target.value && !formData.videographersNames.includes(e.target.value)) {
                                   setFormData({...formData, videographersNames: [...formData.videographersNames, e.target.value]});
                                }
                             }}
                           >
                             <option value="">+ Add Videographer</option>
                             <option value="Studio">Studio (Unassigned)</option>
                             {context.team?.filter((t: any) => t.role.toLowerCase().includes('video') || t.role.toLowerCase().includes('cine') || t.role.toLowerCase().includes('studio')).map((t: any) => (
                               <option key={t._id} value={t.name}>{t.name} ({t.role})</option>
                             ))}
                           </select>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="form-label">
                          <MapPin className="inline h-3 w-3 mr-1 -mt-0.5" /> Location (Optional)
                        </label>
                        <input type="text" className="form-input"  value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="form-label">Notes (Optional)</label>
                        <textarea className="form-input" rows={2}  value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#c5a880] hover:bg-[#b59a72] text-[#1e1b18] font-extrabold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
                  >
                    {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Add Shoot'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upcoming Shoots */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                    Upcoming Shoots
                  </h3>
                  {upcomingShoots.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 font-semibold">No upcoming shoots scheduled</p>
                      <p className="text-[10px] text-slate-300 mt-1">Click on a date to add a new shoot</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingShoots.map((shoot: any) => {
                        const shootDate = new Date(shoot.date);
                        return (
                          <div key={shoot._id} className="upcoming-card group cursor-pointer" onClick={() => setViewingShoot(shoot)}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-bold text-sm text-slate-900">{shoot.eventName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">
                                  {shootDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • {shoot.time || '09:00'}
                                  {shoot.location && <span className="ml-2"><MapPin className="inline h-2.5 w-2.5 -mt-0.5" /> {shoot.location}</span>}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{shoot.eventType}</span>
                                  
                                  {shoot.photographersNames?.map((name: string, i: number) => (
                                    <span key={`p-${i}`} className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${shoot.eventType === 'Other Work' ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-[#c5a880] bg-[#c5a880]/10 border-[#c5a880]/20'}`}>
                                      {shoot.eventType !== 'Other Work' && <Camera className="h-2.5 w-2.5" />} {name}
                                    </span>
                                  ))}

                                  {shoot.videographersNames?.map((name: string, i: number) => (
                                    <span key={`v-${i}`} className="text-[9px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Video className="h-2.5 w-2.5" /> {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteShoot(shoot._id); }}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Shoots on Selected Date */}
                {selectedDate && !showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-white border-2 border-dashed border-slate-300 hover:border-[#c5a880] hover:bg-[#c5a880]/5 text-slate-500 hover:text-[#c5a880] rounded-2xl p-6 shadow-sm transition-all flex flex-col items-center justify-center gap-3 form-panel group"
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-[#c5a880]/20 flex items-center justify-center transition-colors">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-sm block">Add Shoot for</span>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest mt-1 opacity-70">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shoot Details Modal */}
      {viewingShoot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Shoot Details</h2>
              <button onClick={() => setViewingShoot(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{viewingShoot.eventName}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 font-medium">
                  <span>{new Date(viewingShoot.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {viewingShoot.time || '09:00'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">{viewingShoot.eventType}</span>
                {viewingShoot.location && (
                  <span className="px-3 py-1 bg-[#c5a880]/10 text-[#c5a880] text-xs font-bold rounded-lg border border-[#c5a880]/20 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {viewingShoot.location}
                  </span>
                )}
              </div>

              {(viewingShoot.photographersNames?.length > 0 || viewingShoot.videographersNames?.length > 0) && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Team</h4>
                  <div className="flex flex-col gap-2">
                    {viewingShoot.photographersNames?.map((name: string, idx: number) => (
                      <div key={`p-${idx}`} className={`flex items-center gap-2 p-2 rounded-lg border ${viewingShoot.eventType === 'Other Work' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#c5a880]/5 border-[#c5a880]/20 text-[#c5a880]'}`}>
                        {viewingShoot.eventType !== 'Other Work' ? <Camera className="h-4 w-4" /> : <div className="h-4 w-4" />}
                        <span className="text-sm font-bold">{name}</span>
                      </div>
                    ))}
                    {viewingShoot.videographersNames?.map((name: string, idx: number) => (
                      <div key={`v-${idx}`} className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                        <Video className="h-4 w-4" />
                        <span className="text-sm font-bold">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingShoot.notes && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {viewingShoot.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setViewingShoot(null)} 
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
