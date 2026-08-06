'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Code, ArrowLeft, FolderOpen, Lock, Globe, Users } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function StudioEventsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get(`/admin/studios/${id}/events`);
        setEvents(res.data.events);
      } catch (error) {
        console.error("Failed to fetch studio events", error);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvents();
  }, [id]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-7 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}><FolderOpen className="w-5 h-5" /></div>
            Studio Events
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1.5 uppercase tracking-[0.12em]">Total {events.length} events for this studio</p>
        </div>
        <button onClick={() => router.push(`/admin/studios/${id}`)} className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Studio Details
        </button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col gradient-border-top">
        <div className="overflow-x-auto flex-1 admin-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(248,247,244,0.8)' }} className="border-b border-slate-200/60">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Event Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Client Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Date & Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Access</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap text-right">Media</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody className="divide-y divide-slate-100/60">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="space-y-2"><div className="skeleton-shimmer h-4 w-36" /><div className="skeleton-shimmer h-3 w-24" /></div></td>
                    <td className="px-6 py-4"><div className="skeleton-shimmer h-4 w-28" /></td>
                    <td className="px-6 py-4"><div className="space-y-2"><div className="skeleton-shimmer h-3 w-32" /><div className="skeleton-shimmer h-3 w-32" /></div></td>
                    <td className="px-6 py-4"><div className="skeleton-shimmer h-6 w-24 rounded-md" /></td>
                    <td className="px-6 py-4 text-right"><div className="skeleton-shimmer h-8 w-12 rounded-lg ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="skeleton-shimmer h-8 w-24 rounded-lg ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            ) : events.length === 0 ? (
              <tbody>
                <tr><td colSpan={6} className="text-center py-16"><div className="flex flex-col items-center gap-3"><div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-300" /></div><span className="text-slate-400 font-bold text-sm">No events found for this studio</span></div></td></tr>
              </tbody>
            ) : (
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100/60">
                {events.map((event) => (
                  <motion.tr key={event._id} variants={rowVariants} onClick={() => router.push(`/admin/studios/${id}/events/${event._id}`)} className="table-row-premium cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 text-[15px]">{event.name}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium"><Code className="w-3.5 h-3.5" />Code: <span className="text-slate-700 font-bold">{event.code}</span></div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium"><div className="w-2 h-2 rounded-full bg-blue-400" />{event.type?.replace('_', ' ')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{event.clientName || 'N/A'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{event.clientMobile || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 text-[11px] text-slate-600 font-medium">
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span></div>
                        {event.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="truncate max-w-[200px]">{event.location}</span></div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge-shimmer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${event.accessType === 'PUBLIC' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {event.accessType === 'PUBLIC' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {event.accessType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-black text-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        {event.mediaCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/studios/${id}/events/${event._id}/visitors`); }}
                        className="btn-glow inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border border-purple-100 hover:border-transparent"
                      >
                        <Users className="w-3.5 h-3.5" /> Visitors
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            )}
          </table>
        </div>
      </motion.div>
    </div>
  );
}
