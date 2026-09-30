'use client';
import React, { useEffect, useState } from 'react';
import { Camera, Search, Link as LinkIcon, Calendar, CheckCircle, Eye, Edit, Trash2, X, Save, Globe, CreditCard, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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

export default function AdminStudiosPage() {
  const router = useRouter();
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [editStudio, setEditStudio] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', subscriptionPlan: '', subscriptionStatus: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        const res = await apiClient.get('/admin/studios');
        setStudios(res.data.studios);
      } catch (error) {
        console.error("Failed to fetch studios", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudios();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this studio? All events and media will be permanently deleted.')) return;
    try {
      await apiClient.delete(`/admin/studios/${id}`);
      setStudios(studios.filter(s => s._id !== id));
      toast.success('Studio deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete studio');
    }
  };

  const handleView = (e: React.MouseEvent, studio: any) => {
    e.stopPropagation();
    router.push(`/admin/studios/${studio._id}`);
  };

  const handleEdit = (e: React.MouseEvent, studio: any) => {
    e.stopPropagation();
    setEditStudio(studio);
    setEditForm({ name: studio.name || '', subscriptionPlan: studio.subscriptionPlan || 'BASIC', subscriptionStatus: studio.subscriptionStatus || 'ACTIVE' });
  };

  const handleSaveEdit = async () => {
    if (!editStudio) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/studios/${editStudio._id}`, editForm);
      setStudios(studios.map(s => s._id === editStudio._id ? { ...s, ...res.data.studio } : s));
      toast.success('Studio updated successfully');
      setEditStudio(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update studio');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudios = studios.filter(studio =>
    studio.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 8px 24px rgba(168,85,247,0.3)' }}><Camera className="w-5 h-5" /></div>
            Studio Management
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1.5 uppercase tracking-[0.12em]">Total {studios.length} registered studios</p>
        </div>
        <div className={`relative w-full sm:w-72 transition-all duration-300 ${searchFocused ? 'sm:w-80' : ''}`}>
          <Search className={`w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-[#c5a880]' : 'text-slate-400'}`} />
          <input type="text" placeholder="Search studios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none search-premium" />
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
          ) : filteredStudios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <Camera className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No studios found</h3>
              <p className="text-slate-500 font-medium max-w-sm">We couldn't find any studios matching your search. Try adjusting your filters.</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStudios.map((studio) => (
                <motion.div key={studio._id} variants={rowVariants} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-full opacity-50 pointer-events-none transition-opacity group-hover:opacity-100" />
                  
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      {studio.logoUrl ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                          <img src={studio.logoUrl} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                          {studio.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="font-black text-slate-900 text-lg group-hover:text-purple-600 transition-colors duration-300 truncate max-w-[150px] leading-tight">{studio.name}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                            {studio.subscriptionPlan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1 relative z-10">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100/50 group-hover:bg-purple-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0"><Camera className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" /></div>
                      <span className="text-sm font-semibold text-slate-600 truncate">{studio.ownerId?.name || 'Unknown Owner'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100/50 group-hover:bg-purple-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" /></div>
                      <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Status: <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${studio.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{studio.subscriptionStatus}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100/50 group-hover:bg-purple-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" /></div>
                      <span className="text-sm font-semibold text-slate-600">Since {new Date(studio.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
                    <button onClick={(e) => handleView(e, studio)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-600 font-bold text-xs hover:bg-purple-600 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-purple-500/20"><Eye className="w-4 h-4" /> View</button>
                    <button onClick={(e) => handleEdit(e, studio)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-500 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-amber-500/20"><Edit className="w-4 h-4" /> Edit</button>
                    <button onClick={(e) => handleDelete(e, studio._id)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shrink-0 border border-transparent hover:shadow-lg hover:shadow-red-500/20"><Trash2 className="w-4.5 h-4.5" /></button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>



      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editStudio && (
          <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setEditStudio(null)}>
            <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Edit className="w-5 h-5 text-amber-500" /> Edit Studio</h3>
                <button onClick={() => setEditStudio(null)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <FormField label="Studio Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Subscription Plan</label>
                  <select value={editForm.subscriptionPlan} onChange={(e) => setEditForm({ ...editForm, subscriptionPlan: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/10 transition-all">
                    {['BASIC','STANDARD','ESSENTIAL','PREMIUM','STARTER','PROFESSIONAL','BUSINESS','ENTERPRISE'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={editForm.subscriptionStatus} onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/10 transition-all">
                    {['ACTIVE','PAST_DUE','CANCELLED','TRIALING','FREE'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-end gap-3">
                <button onClick={() => setEditStudio(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
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
