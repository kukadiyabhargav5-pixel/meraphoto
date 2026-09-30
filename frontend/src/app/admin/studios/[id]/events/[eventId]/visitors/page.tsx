'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, Calendar, Mail, Phone, ArrowLeft } from 'lucide-react';
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

export default function EventVisitorsPage() {
  const { id, eventId } = useParams();
  const router = useRouter();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const [visitorsRes, eventRes] = await Promise.all([
          apiClient.get(`/admin/events/${eventId}/visitors`),
          apiClient.get(`/admin/events/${eventId}`)
        ]);
        setVisitors(visitorsRes.data.visitors);
        setEventData(eventRes.data.event);
      } catch (error) {
        console.error("Failed to fetch visitors", error);
        toast.error("Failed to load visitors");
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchVisitors();
  }, [eventId]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-7 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 8px 24px rgba(168,85,247,0.3)' }}>
              <Users className="w-5 h-5" />
            </div>
            Gallery Visitors
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1.5 flex items-center gap-2">
            Event: <span className="text-purple-500 uppercase tracking-wider">{eventData?.name || 'Loading...'}</span>
          </p>
        </div>
        <button onClick={() => router.push(`/admin/studios/${id}/events`)} className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
      </motion.div>

      {/* Stats Cards */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5 border-l-4 border-purple-500 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
            <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Visitors</div><div className="text-2xl font-black text-slate-900">{visitors.length}</div></div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col gradient-border-top">
        <div className="overflow-x-auto flex-1 admin-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(248,247,244,0.8)' }} className="border-b border-slate-200/60">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Visitor Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Visit Date</th>
              </tr>
            </thead>
            {loading ? (
              <tbody className="divide-y divide-slate-100/60">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="skeleton-shimmer h-4 w-36" /></td>
                    <td className="px-6 py-4"><div className="space-y-2"><div className="skeleton-shimmer h-4 w-28" /><div className="skeleton-shimmer h-3 w-40" /></div></td>
                    <td className="px-6 py-4"><div className="skeleton-shimmer h-4 w-32" /></td>
                  </tr>
                ))}
              </tbody>
            ) : visitors.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={3} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center shadow-inner">
                        <Users className="w-8 h-8 text-purple-300" />
                      </div>
                      <span className="text-slate-400 font-bold text-sm">No visitors recorded for this gallery yet.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100/60">
                {visitors.map((visitor) => (
                  <motion.tr key={visitor._id} variants={rowVariants} className="table-row-premium group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-black text-sm border border-purple-200 shadow-sm">
                          {visitor.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-900 text-[15px] group-hover:text-purple-600 transition-colors">{visitor.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {visitor.phone}
                        </div>
                        {visitor.email && (
                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" /> {visitor.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(visitor.createdAt).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
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
