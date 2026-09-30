'use client';
import React, { useEffect, useState } from 'react';
import { FolderOpen, Search, Calendar, MapPin, Eye, Code, Edit, Trash2, X, Save, Users, Image as ImageIcon, Lock, Globe, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};
const modalOverlay = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const EVENT_TYPES = ['WEDDING','PRE_WEDDING','PRE WEDDING','RECEPTION','BIRTHDAY','CORPORATE','SCHOOL','GARBA','CONCERT','RELIGIOUS','ENGAGEMENT','BABY SHOWER','PANCHMASI'];
const ACCESS_TYPES = ['PUBLIC','PASSWORD','OTP','QR'];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewEvent, setViewEvent] = useState<any>(null);
  const [viewMeta, setViewMeta] = useState<any>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', clientName: '', clientMobile: '', clientEmail: '', location: '', date: '', time: '', type: '', accessType: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/admin/events');
        setEvents(res.data.events);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event? All media will be permanently deleted.')) return;
    try {
      await apiClient.delete(`/admin/events/${id}`);
      setEvents(events.filter(ev => ev._id !== id));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleView = async (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    setViewEvent(event);
    try {
      const res = await apiClient.get(`/admin/events/${event._id}`);
      setViewEvent(res.data.event);
      setViewMeta({ mediaCount: res.data.mediaCount });
    } catch { setViewMeta(null); }
  };

  const handleEdit = (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    setEditEvent(event);
    setEditForm({
      name: event.name || '', clientName: event.clientName || '', clientMobile: event.clientMobile || '',
      clientEmail: event.clientEmail || '', location: event.location || '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      time: event.time || '', type: event.type || 'WEDDING', accessType: event.accessType || 'PUBLIC'
    });
  };

  const handleSaveEdit = async () => {
    if (!editEvent) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/events/${editEvent._id}`, editForm);
      setEvents(events.map(ev => ev._id === editEvent._id ? { ...ev, ...res.data.event } : ev));
      toast.success('Event updated successfully');
      setEditEvent(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.studioId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}><FolderOpen className="w-5 h-5" /></div>
            Event Management
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1.5 uppercase tracking-[0.12em]">Total {events.length} active events</p>
        </div>
        <div className={`relative w-full sm:w-72 transition-all duration-300 ${searchFocused ? 'sm:w-80' : ''}`}>
          <Search className={`w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-[#c5a880]' : 'text-slate-400'}`} />
          <input type="text" placeholder="Search events or studios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none search-premium" />
        </div>
      </motion.div>

      {/* Grid Layout */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto admin-scroll pb-24">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="skeleton-shimmer w-14 h-14 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1 pt-1">
                      <div className="skeleton-shimmer h-5 w-3/4 rounded-md" />
                      <div className="skeleton-shimmer h-4 w-1/2 rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="skeleton-shimmer h-10 w-full rounded-xl" />
                    <div className="skeleton-shimmer h-10 w-full rounded-xl" />
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton-shimmer h-10 flex-1 rounded-xl" />
                    <div className="skeleton-shimmer h-10 flex-1 rounded-xl" />
                    <div className="skeleton-shimmer h-10 w-10 shrink-0 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <FolderOpen className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No events found</h3>
              <p className="text-slate-500 font-medium max-w-sm">We couldn't find any events matching your search. Try adjusting your filters.</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEvents.map((event) => (
                <motion.div key={event._id} variants={rowVariants} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full opacity-50 pointer-events-none transition-opacity group-hover:opacity-100" />
                  
                  <div className="flex items-start justify-between mb-5 relative z-10 w-full gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md transition-transform duration-300 group-hover:scale-110 shrink-0" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                        {event.studioId?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Studio</div>
                        <div className="font-bold text-slate-800 text-sm truncate">{event.studioId?.name || 'Unknown Studio'}</div>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${event.accessType === 'PUBLIC' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {event.accessType === 'PUBLIC' ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      {event.accessType}
                    </span>
                  </div>
                  
                  <div className="space-y-3 flex-1 relative z-10 border-t border-slate-100/60 pt-4">
                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-emerald-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Event Name</span>
                       <span className="text-sm font-black text-slate-900 truncate">{event.name}</span>
                    </div>

                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-emerald-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</span>
                      <span className="text-sm font-bold text-slate-700 truncate">{new Date(event.date).toLocaleDateString('en-GB')}</span>
                    </div>

                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-emerald-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</span>
                      <span className="text-sm font-bold text-slate-700 truncate uppercase">{event.type?.replace('_', ' ')}</span>
                    </div>

                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-emerald-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Media Uploaded</span>
                       <span className="text-sm font-bold text-slate-700 truncate">{event.mediaCount || 0} Files</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
                    <button onClick={(e) => handleView(e, event)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-emerald-500/20"><Eye className="w-4 h-4" /> View</button>
                    <button onClick={(e) => handleEdit(e, event)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-500 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-amber-500/20"><Edit className="w-4 h-4" /> Edit</button>
                    <button onClick={(e) => handleDelete(e, event._id)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shrink-0 border border-transparent hover:shadow-lg hover:shadow-red-500/20"><Trash2 className="w-4.5 h-4.5" /></button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ─── View Modal ─── */}
      <AnimatePresence>
        {viewEvent && (
          <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => { setViewEvent(null); setViewMeta(null); }}>
            <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] overflow-y-auto admin-scroll" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-emerald-500" /> Event Details</h3>
                <button onClick={() => { setViewEvent(null); setViewMeta(null); }} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="text-xl font-black text-slate-900">{viewEvent.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">{viewEvent.type?.replace('_', ' ')}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${viewEvent.accessType === 'PUBLIC' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{viewEvent.accessType}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow icon={<Users className="w-4 h-4" />} label="Client" value={viewEvent.clientName || 'N/A'} />
                  <DetailRow icon={<Code className="w-4 h-4" />} label="Event Code" value={viewEvent.code || 'N/A'} />
                  <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={viewEvent.location || 'N/A'} />
                  <DetailRow icon={<Calendar className="w-4 h-4" />} label="Date" value={new Date(viewEvent.date).toLocaleDateString('en-GB')} />
                  <DetailRow icon={<Calendar className="w-4 h-4" />} label="Time" value={viewEvent.time || 'N/A'} />
                  <DetailRow icon={<FolderOpen className="w-4 h-4" />} label="Studio" value={viewEvent.studioId?.name || 'Unknown'} />
                  {viewEvent.clientEmail && <DetailRow icon={<Calendar className="w-4 h-4" />} label="Client Email" value={viewEvent.clientEmail} />}
                  {viewEvent.clientMobile && <DetailRow icon={<Calendar className="w-4 h-4" />} label="Client Phone" value={viewEvent.clientMobile} />}
                  {viewMeta && <DetailRow icon={<ImageIcon className="w-4 h-4" />} label="Media Files" value={String(viewMeta.mediaCount)} />}
                </div>
                {viewEvent.assignedTeamMembers && viewEvent.assignedTeamMembers.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Team Members ({viewEvent.assignedTeamMembers.length})</div>
                    <div className="space-y-1.5">
                      {viewEvent.assignedTeamMembers.map((m: any) => (
                        <div key={m._id} className="text-sm font-medium text-slate-700">{m.name} <span className="text-slate-400 text-xs">({m.email})</span></div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-100">ID: {viewEvent._id}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editEvent && (
          <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setEditEvent(null)}>
            <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] overflow-y-auto admin-scroll" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Edit className="w-5 h-5 text-amber-500" /> Edit Event</h3>
                <button onClick={() => setEditEvent(null)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <FormField label="Event Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Client Name" value={editForm.clientName} onChange={(v) => setEditForm({ ...editForm, clientName: v })} />
                  <FormField label="Client Mobile" value={editForm.clientMobile} onChange={(v) => setEditForm({ ...editForm, clientMobile: v })} />
                </div>
                <FormField label="Client Email" value={editForm.clientEmail} onChange={(v) => setEditForm({ ...editForm, clientEmail: v })} type="email" />
                <FormField label="Location" value={editForm.location} onChange={(v) => setEditForm({ ...editForm, location: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date" value={editForm.date} onChange={(v) => setEditForm({ ...editForm, date: v })} type="date" />
                  <FormField label="Time" value={editForm.time} onChange={(v) => setEditForm({ ...editForm, time: v })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Event Type</label>
                    <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/10 transition-all">
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Access Type</label>
                    <select value={editForm.accessType} onChange={(e) => setEditForm({ ...editForm, accessType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/10 transition-all">
                      {ACCESS_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-end gap-3">
                <button onClick={() => setEditEvent(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #c5a880, #a8875e)' }}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</div><div className="text-sm font-medium text-slate-700 mt-0.5">{value}</div></div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/10 transition-all" />
    </div>
  );
}
