'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Edit, Check, X, Sparkles, RefreshCw, AlertCircle, Save, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({
    name: '',
    description: '',
    priceInr: 0,
    isActive: true,
    isRecommended: false,
    maxPhotos: 0,
    maxVideos: 0,
    maxEvents: 0,
    maxStorageGb: 0,
  });
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/plans');
      if (res.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err: any) {
      console.error('Failed to load admin plans:', err);
      toast.error('Failed to load plans from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEditClick = (plan: any) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name || '',
      description: plan.description || '',
      priceInr: plan.priceInr || 0,
      isActive: plan.isActive !== false,
      isRecommended: Boolean(plan.isRecommended),
      maxPhotos: plan.limits?.maxPhotos || 0,
      maxVideos: plan.limits?.maxVideos || 0,
      maxEvents: plan.limits?.maxEvents || 0,
      maxStorageGb: plan.limits?.maxStorageGb || 0,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setSaving(true);
      const payload = {
        name: editForm.name,
        description: editForm.description,
        priceInr: Number(editForm.priceInr),
        isActive: editForm.isActive,
        isRecommended: editForm.isRecommended,
        limits: {
          ...editingPlan.limits,
          maxPhotos: Number(editForm.maxPhotos),
          maxVideos: Number(editForm.maxVideos),
          maxEvents: Number(editForm.maxEvents),
          maxStorageGb: Number(editForm.maxStorageGb),
        },
      };

      const res = await apiClient.put(`/admin/plans/${editingPlan._id}`, payload);
      if (res.data?.success) {
        toast.success(`Updated ${editForm.name} plan successfully`);
        setEditingPlan(null);
        fetchPlans();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: any) => {
    try {
      const res = await apiClient.patch(`/admin/plans/${plan._id}/toggle`);
      if (res.data?.success) {
        toast.success(`Plan ${plan.name} status updated`);
        fetchPlans();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#c5a880] bg-[#f5f2eb] px-3.5 py-1 rounded-full border border-[#c5a880]/20">
            Platform Master Data
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#c5a880]" />
            Pricing Plans &amp; Quotas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Single source of truth for homepage, pricing page, studio billing, and Razorpay orders.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Plans
        </button>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#c5a880]/30 border-t-[#c5a880] rounded-full animate-spin mb-3" />
          <p className="text-xs uppercase tracking-wider font-semibold">Loading Canonical Plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No pricing plans found in database.</p>
          <p className="text-xs text-slate-500 mt-1">Plans are seeded automatically when the backend boots.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id || plan.planKey}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                plan.isRecommended
                  ? 'border-[#c5a880] ring-1 ring-[#c5a880]/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {plan.planKey}
                  </span>
                  <div className="flex items-center gap-2">
                    {plan.isRecommended && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#c5a880] text-black flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                        Popular
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                        plan.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                      title="Click to toggle active status"
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">{plan.description}</p>

                <div className="flex items-baseline gap-1 mt-4 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {plan.priceInr === 0 ? 'Free' : `₹${plan.priceInr.toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/{plan.billingPeriod?.toLowerCase() || 'year'}</span>
                </div>

                {/* Quotas */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs text-slate-600 border border-slate-100 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Photos:</span>
                    <span className="font-semibold text-slate-800">
                      {plan.limits?.maxPhotos ? plan.limits.maxPhotos.toLocaleString('en-IN') : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Videos:</span>
                    <span className="font-semibold text-slate-800">
                      {plan.limits?.maxVideos ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Events:</span>
                    <span className="font-semibold text-slate-800">
                      {plan.limits?.maxEvents ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AI Search:</span>
                    <span className={`font-semibold ${plan.limits?.aiSearchEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {plan.limits?.aiSearchEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleEditClick(plan)}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-[#c5a880] hover:text-black py-2.5 rounded-xl transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#c5a880]">
                    Editing Plan: {editingPlan.planKey}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{editingPlan.name}</h2>
                </div>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Description / Subtitle</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Price in INR (₹)</label>
                    <input
                      type="number"
                      value={editForm.priceInr}
                      onChange={(e) => setEditForm({ ...editForm, priceInr: e.target.value })}
                      required
                      min="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Max Photos</label>
                    <input
                      type="number"
                      value={editForm.maxPhotos}
                      onChange={(e) => setEditForm({ ...editForm, maxPhotos: e.target.value })}
                      min="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Max Videos</label>
                    <input
                      type="number"
                      value={editForm.maxVideos}
                      onChange={(e) => setEditForm({ ...editForm, maxVideos: e.target.value })}
                      min="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Max Events</label>
                    <input
                      type="number"
                      value={editForm.maxEvents}
                      onChange={(e) => setEditForm({ ...editForm, maxEvents: e.target.value })}
                      min="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#c5a880] rounded"
                    />
                    <span className="font-semibold text-slate-700">Active (Visible to public)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isRecommended}
                      onChange={(e) => setEditForm({ ...editForm, isRecommended: e.target.checked })}
                      className="w-4 h-4 text-[#c5a880] rounded"
                    />
                    <span className="font-semibold text-slate-700">Recommended (Popular Badge)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#09090b] text-[#c5a880] hover:bg-[#c5a880] hover:text-[#09090b] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
