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
  const [editForm, setEditForm] = useState({ name: '', subdomain: '', subscriptionPlan: '', subscriptionStatus: '' });
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
    setEditForm({ name: studio.name || '', subdomain: studio.subdomain || '', subscriptionPlan: studio.subscriptionPlan || 'BASIC', subscriptionStatus: studio.subscriptionStatus || 'ACTIVE' });
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
    studio.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    studio.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col gradient-border-top">
        <div className="overflow-x-auto flex-1 admin-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(248,247,244,0.8)' }} className="border-b border-slate-200/60">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Studio Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Owner</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Plan / Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">Registered On</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <tbody className="divide-y divide-slate-100/60">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="skeleton-shimmer w-10 h-10 rounded-xl" /><div className="space-y-2"><div className="skeleton-shimmer h-4 w-32" /><div className="skeleton-shimmer h-3 w-40" /></div></div></td>
                    <td className="px-6 py-4"><div className="space-y-2"><div className="skeleton-shimmer h-4 w-28" /><div className="skeleton-shimmer h-3 w-36" /></div></td>
                    <td className="px-6 py-4"><div className="space-y-2"><div className="skeleton-shimmer h-6 w-16 rounded-md" /><div className="skeleton-shimmer h-4 w-20" /></div></td>
                    <td className="px-6 py-4"><div className="skeleton-shimmer h-4 w-28" /></td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-2"><div className="skeleton-shimmer h-8 w-16 rounded-lg" /><div className="skeleton-shimmer h-8 w-16 rounded-lg" /><div className="skeleton-shimmer h-8 w-16 rounded-lg" /></div></td>
                  </tr>
                ))}
              </tbody>
            ) : filteredStudios.length === 0 ? (
              <tbody>
                <tr><td colSpan={5} className="text-center py-16"><div className="flex flex-col items-center gap-3"><div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center"><Camera className="w-6 h-6 text-purple-300" /></div><span className="text-slate-400 font-bold text-sm">No studios found</span></div></td></tr>
              </tbody>
            ) : (
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100/60">
                {filteredStudios.map((studio) => (
                  <motion.tr key={studio._id} variants={rowVariants} className="table-row-premium group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {studio.logoUrl ? (
                          <img src={studio.logoUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-200 transition-all duration-300 group-hover:border-[#c5a880] group-hover:shadow-md" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md transition-transform duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>{studio.name?.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors duration-300">{studio.name}</div>
                          <a href={`https://${studio.subdomain}.maraphoto.com`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#c5a880] transition-colors mt-0.5"><LinkIcon className="w-3 h-3" />{studio.subdomain}.maraphoto.com</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{studio.ownerId?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{studio.ownerId?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="badge-shimmer inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>{studio.subscriptionPlan}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600"><CheckCircle className="w-3 h-3" />{studio.subscriptionStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium"><Calendar className="w-4 h-4 text-slate-400" />{new Date(studio.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => handleView(e, studio)} className="btn-glow flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 border border-purple-100 hover:border-transparent"><Eye className="w-3.5 h-3.5" /> View</button>
                        <button onClick={(e) => handleEdit(e, studio)} className="btn-glow flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-500 hover:text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 border border-amber-100 hover:border-transparent"><Edit className="w-3.5 h-3.5" /> Edit</button>
                        <button onClick={(e) => handleDelete(e, studio._id)} className="btn-glow flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 border border-red-100 hover:border-transparent"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            )}
          </table>
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
                <FormField label="Subdomain" value={editForm.subdomain} onChange={(v) => setEditForm({ ...editForm, subdomain: v })} />
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
