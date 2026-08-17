'use client';
import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, Mail, Phone, Calendar, Shield, Eye, Edit, Trash2, X, Save, User as UserIcon } from 'lucide-react';
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

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewUser, setViewUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/admin/users');
        setUsers(res.data.users);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleView = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setViewUser(user);
  };

  const handleEdit = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setEditUser(user);
    setEditForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || '' });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/users/${editUser._id}`, editForm);
      setUsers(users.map(u => u._id === editUser._id ? { ...u, ...res.data.user } : u));
      toast.success('User updated successfully');
      setEditUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-7 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <UsersIcon className="w-5 h-5" />
            </div>
            User Management
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1.5 uppercase tracking-[0.12em]">Total {users.length} registered users</p>
        </div>
        <div className={`relative w-full sm:w-72 transition-all duration-300 ${searchFocused ? 'sm:w-80' : ''}`}>
          <Search className={`w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-[#c5a880]' : 'text-slate-400'}`} />
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none search-premium" />
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
                    <div className="skeleton-shimmer w-14 h-14 rounded-full shrink-0" />
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
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <UsersIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No users found</h3>
              <p className="text-slate-500 font-medium max-w-sm">We couldn't find any users matching your search. Try adjusting your filters.</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUsers.map((user) => (
                <motion.div key={user._id} variants={rowVariants} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-50 pointer-events-none transition-opacity group-hover:opacity-100" />
                  
                  <div className="flex items-start mb-5 relative z-10 w-full gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md transition-transform duration-300 group-hover:scale-110 shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                      {user.studioName ? user.studioName.charAt(0).toUpperCase() : user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center pt-0.5">
                      <div className="font-black text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                        {user.studioName || 'No Studio Assigned'}
                      </div>
                      <div className="mt-1.5 flex items-center">
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'STUDIO_OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role === 'SUPER_ADMIN' && <Shield className="w-2.5 h-2.5" />}
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1 relative z-10 border-t border-slate-100/60 pt-4">
                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-blue-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name</span>
                       <span className="text-sm font-black text-slate-900 truncate">{user.name}</span>
                    </div>

                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-blue-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</span>
                      <span className="text-sm font-bold text-slate-700 truncate">{user.email}</span>
                    </div>

                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-blue-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile Number</span>
                      <span className="text-sm font-bold text-slate-700 truncate">{user.phone || 'N/A'}</span>
                    </div>

                    <div className="flex flex-col justify-center p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-blue-50/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined Date</span>
                       <span className="text-sm font-bold text-slate-700 truncate">{new Date(user.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
                    <button onClick={(e) => handleView(e, user)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-blue-500/20"><Eye className="w-4 h-4" /> View</button>
                    <button onClick={(e) => handleEdit(e, user)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-500 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-amber-500/20"><Edit className="w-4 h-4" /> Edit</button>
                    <button onClick={(e) => handleDelete(e, user._id)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shrink-0 border border-transparent hover:shadow-lg hover:shadow-red-500/20"><Trash2 className="w-4.5 h-4.5" /></button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ─── View Modal ─── */}
      <AnimatePresence>
        {viewUser && (
          <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setViewUser(null)}>
            <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><UserIcon className="w-5 h-5 text-blue-500" /> User Details</h3>
                <button onClick={() => setViewUser(null)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                    {viewUser.studioName ? viewUser.studioName.charAt(0).toUpperCase() : viewUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Studio</div>
                    <div className="text-xl font-black text-slate-900 truncate leading-tight mb-2">
                      {viewUser.studioName || 'No Studio Assigned'}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700 truncate">{viewUser.name}</span>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${viewUser.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : viewUser.role === 'STUDIO_OWNER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {viewUser.role === 'SUPER_ADMIN' && <Shield className="w-3 h-3" />}
                        {viewUser.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={viewUser.email} />
                  <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={viewUser.phone || 'Not provided'} />
                  <DetailRow icon={<Calendar className="w-4 h-4" />} label="Joined" value={new Date(viewUser.createdAt).toLocaleDateString('en-GB')} />
                  <DetailRow icon={<Calendar className="w-4 h-4" />} label="Last Updated" value={new Date(viewUser.updatedAt).toLocaleDateString('en-GB')} />
                </div>
                <div className="text-[10px] font-medium text-slate-400 pt-2 border-t border-slate-100">ID: {viewUser._id}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editUser && (
          <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setEditUser(null)}>
            <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Edit className="w-5 h-5 text-amber-500" /> Edit User</h3>
                <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <FormField label="Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                <FormField label="Email" value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" />
                <FormField label="Phone" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} />
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#c5a880] focus:ring-2 focus:ring-[#c5a880]/10 transition-all">
                    <option value="CLIENT">Client</option>
                    <option value="STUDIO_OWNER">Studio Owner</option>
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-end gap-3">
                <button onClick={() => setEditUser(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #c5a880, #a8875e)' }}>
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
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
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-slate-700 mt-0.5">{value}</div>
      </div>
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
