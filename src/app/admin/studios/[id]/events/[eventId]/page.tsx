'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Code, ArrowLeft, Users, Phone, Mail, Clock, FolderOpen, Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function EventDetailsPage() {
  const { id, eventId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await apiClient.get(`/admin/events/${eventId}`);
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch event details", error);
        toast.error("Failed to load event details");
        router.push(`/admin/studios/${id}/events`);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEventDetails();
  }, [eventId, id, router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 h-[calc(100vh-140px)] admin-scroll overflow-y-auto">
        <div className="skeleton-shimmer h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="skeleton-shimmer h-64 rounded-2xl" />
          <div className="skeleton-shimmer h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { event, mediaCount } = data;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-y-auto admin-scroll pb-10">
      <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-l-4 border-blue-500">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-5 z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{event.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${event.accessType === 'PUBLIC' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {event.accessType === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {event.accessType}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  {event.type?.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Code className="w-4 h-4" /> Code: <span className="font-bold text-slate-700">{event.code}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="z-10">
            <button onClick={() => router.push(`/admin/studios/${id}/events`)} className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Event List
            </button>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Customer & Studio */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Client Details
              </h3>
              <div className="space-y-4">
                <DetailRow icon={<Users />} label="Client Name" value={event.clientName || 'N/A'} />
                <DetailRow icon={<Phone />} label="Mobile Number" value={event.clientMobile || 'N/A'} />
                <DetailRow icon={<Mail />} label="Email Address" value={event.clientEmail || 'N/A'} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-500" /> Studio Information
              </h3>
              <div className="space-y-4">
                <DetailRow icon={<FolderOpen />} label="Studio Name" value={event.studioId?.name || 'Unknown'} />
                <DetailRow icon={<Globe />} label="Subdomain" value={event.studioId?.subdomain ? `${event.studioId.subdomain}.maraphoto.com` : 'N/A'} />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Event Info & Media */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Event Information
              </h3>
              <div className="space-y-4">
                <DetailRow icon={<Calendar />} label="Event Date" value={event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
                <DetailRow icon={<Clock />} label="Event Time" value={event.time || 'N/A'} />
                <DetailRow icon={<MapPin />} label="Location" value={event.location || 'N/A'} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-500" /> Media Statistics
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100/50">
                <div className="w-12 h-12 rounded-full bg-rose-200/50 flex items-center justify-center text-rose-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-500">Total Media Files</div>
                  <div className="text-2xl font-black text-rose-700">{mediaCount}</div>
                </div>
              </div>
            </motion.div>

            {event.assignedTeamMembers && event.assignedTeamMembers.length > 0 && (
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Assigned Team ({event.assignedTeamMembers.length})</h3>
                <div className="space-y-2">
                  {event.assignedTeamMembers.map((m: any) => (
                    <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{m.name.charAt(0)}</div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{m.name}</div>
                        <div className="text-[10px] font-medium text-slate-500">{m.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-sm font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
