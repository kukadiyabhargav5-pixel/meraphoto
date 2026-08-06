'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Calendar, Image as ImageIcon, Video, HardDrive, Users, CheckCircle, ArrowLeft, Globe, MapPin, Search } from 'lucide-react';
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

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function StudioDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudioDetails = async () => {
      try {
        const res = await apiClient.get(`/admin/studios/${id}`);
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch studio details", error);
        toast.error("Failed to load studio details");
        router.push('/admin/studios');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStudioDetails();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 h-[calc(100vh-140px)] admin-scroll overflow-y-auto">
        <div className="skeleton-shimmer h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-shimmer h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton-shimmer h-64 w-full rounded-2xl mt-4" />
      </div>
    );
  }

  if (!data) return null;

  const { studio, eventCount, photoCount, videoCount, totalStorage, bookingCount, customerCount, recentEvents } = data;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-y-auto admin-scroll pb-10">
      <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-l-4 border-[#a855f7]">
          {/* Background decoration */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#a855f7]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-5 z-10">
            {studio.logoUrl ? (
              <img src={studio.logoUrl} alt={studio.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                {studio.name?.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{studio.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${studio.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {studio.subscriptionStatus}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                <a href={`https://${studio.subdomain}.maraphoto.com`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#c5a880] transition-colors">
                  <Globe className="w-4 h-4" /> {studio.subdomain}.maraphoto.com
                </a>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {studio.ownerId?.name || 'Unknown Owner'}
                </div>
              </div>
            </div>
          </div>

          <div className="z-10 flex flex-col items-end gap-3">
            <button onClick={() => router.push('/admin/studios')} className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Studios
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Current Plan:</span>
              <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black tracking-widest">{studio.subscriptionPlan}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<Calendar className="w-5 h-5" />} title="Total Events" value={eventCount} color="blue" onClick={() => router.push(`/admin/studios/${id}/events`)} />
          <StatCard icon={<ImageIcon className="w-5 h-5" />} title="Photos" value={photoCount} color="emerald" />
          <StatCard icon={<Video className="w-5 h-5" />} title="Videos" value={videoCount} color="rose" />
          <StatCard icon={<HardDrive className="w-5 h-5" />} title="Storage Used" value={formatBytes(totalStorage)} color="amber" />
          <StatCard icon={<Users className="w-5 h-5" />} title="Customers" value={customerCount} color="purple" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Usage & Info */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-500" /> Account Activity
              </h3>
              <div className="space-y-4">
                <ActivityRow label="AI Searches Used" value={studio.usage?.aiSearchesCount || 0} max={1000} />
                <ActivityRow label="Photos Processed" value={studio.usage?.photosUploaded || 0} max={10000} />
                <ActivityRow label="Videos Processed" value={studio.usage?.videosUploaded || 0} max={500} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Registration Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">Registered Date</span>
                  <span className="text-sm font-bold text-slate-800">{new Date(studio.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Bookings</span>
                  <span className="text-sm font-bold text-slate-800">{bookingCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">Studio ID</span>
                  <span className="text-xs font-bold text-slate-400">{studio._id}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Recent Events */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Recent Events
              </h3>
              <button onClick={() => router.push('/admin/events')} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                View All Events
              </button>
            </div>
            
            <div className="overflow-x-auto admin-scroll flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Event Details</th>
                    <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Date & Location</th>
                    <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Media Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentEvents && recentEvents.length > 0 ? recentEvents.map((ev: any) => (
                    <tr key={ev._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-800 text-sm">{ev.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{ev.type?.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(ev.date).toLocaleDateString()}
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{ev.location}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-black text-xs">
                          {ev.mediaCount}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-300 mb-3">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-400">No events found for this studio.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, title, value, color, onClick }: { icon: React.ReactNode, title: string, value: string | number, color: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple', onClick?: () => void }) {
  const colorMap = {
    blue: 'from-blue-500 to-indigo-500 text-blue-600 bg-blue-50 hover:ring-2 hover:ring-blue-400/50 cursor-pointer',
    emerald: 'from-emerald-400 to-emerald-600 text-emerald-600 bg-emerald-50',
    rose: 'from-rose-400 to-rose-600 text-rose-600 bg-rose-50',
    amber: 'from-amber-400 to-amber-600 text-amber-600 bg-amber-50',
    purple: 'from-purple-400 to-purple-600 text-purple-600 bg-purple-50',
  };
  const gradient = colorMap[color].split(' ')[0] + ' ' + colorMap[color].split(' ')[1];
  const textColor = colorMap[color].split(' ')[2];
  const bgColor = colorMap[color].split(' ')[3];
  const interactiveClasses = onClick && color === 'blue' ? 'cursor-pointer ring-2 ring-transparent hover:ring-blue-200' : '';

  return (
    <motion.div variants={itemVariants} onClick={onClick} className={`glass-card rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${interactiveClasses}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg bg-gradient-to-br ${gradient}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${bgColor}`} />
    </motion.div>
  );
}

function ActivityRow({ label, value, max }: { label: string, value: number, max: number }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-900">{value}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full rounded-full bg-gradient-to-r from-[#c5a880] to-[#e5cca4]" 
        />
      </div>
    </div>
  );
}
