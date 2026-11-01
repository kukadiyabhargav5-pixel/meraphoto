'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Edit3,
  Check,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Save,
  ShieldCheck,
  HardDrive,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  Star,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

type BillingCategory = 'ALL' | 'MONTHLY' | '6_MONTHS' | 'YEARLY';

interface StoragePlan {
  _id?: string;
  planId: string;
  name: string;
  storageGb: number;
  storageBytes: number;
  priceInr: number;
  displayPrice: string;
  billingCategory: 'MONTHLY' | '6_MONTHS' | 'YEARLY';
  billingPeriodText: string;
  durationMonths: number;
  isRecommended: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  desc?: string;
  badge?: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<StoragePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<BillingCategory>('ALL');

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState<StoragePlan | null>(null);
  const [formName, setFormName] = useState('');
  const [formPriceInr, setFormPriceInr] = useState<number | ''>(0);
  const [formStorageGb, setFormStorageGb] = useState<number | ''>(10);
  const [formPeriodText, setFormPeriodText] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsRecommended, setFormIsRecommended] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/storage-plans');
      if (res.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err: any) {
      // Fallback try /storage/admin/plans or public /storage/plans
      try {
        const fallback = await apiClient.get('/storage/plans');
        if (fallback.data?.plans) {
          setPlans(fallback.data.plans);
        }
      } catch (e) {
        console.error('Failed to load storage plans:', err);
        toast.error('Failed to load plans from server');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (plan: StoragePlan) => {
    setEditingPlan(plan);
    setFormName(plan.name || '');
    setFormPriceInr(plan.priceInr || 0);
    setFormStorageGb(plan.storageGb || 10);
    setFormPeriodText(plan.billingPeriodText || '');
    setFormBadge(plan.badge || (plan.isRecommended ? 'HOT • Most Popular' : ''));
    setFormDesc(plan.desc || '');
    setFormIsRecommended(Boolean(plan.isRecommended));
    setFormIsActive(plan.isActive !== false);
    setFormFeatures(Array.isArray(plan.features) ? [...plan.features] : []);
  };

  // Add Feature item
  const handleAddFeature = () => {
    setFormFeatures([...formFeatures, '']);
  };

  // Update Feature item
  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...formFeatures];
    updated[index] = val;
    setFormFeatures(updated);
  };

  // Remove Feature item
  const handleRemoveFeature = (index: number) => {
    const updated = formFeatures.filter((_, i) => i !== index);
    setFormFeatures(updated);
  };

  // Save Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (formPriceInr === '' || Number(formPriceInr) < 0) {
      toast.error('Please enter a valid price in INR');
      return;
    }
    if (formStorageGb === '' || Number(formStorageGb) <= 0) {
      toast.error('Please enter valid storage GB');
      return;
    }

    try {
      setSaving(true);
      const cleanedFeatures = formFeatures.map(f => f.trim()).filter(Boolean);

      const payload = {
        name: formName.trim(),
        priceInr: Number(formPriceInr),
        displayPrice: `₹${Number(formPriceInr).toLocaleString('en-IN')}`,
        storageGb: Number(formStorageGb),
        billingPeriodText: formPeriodText.trim(),
        badge: formBadge.trim(),
        desc: formDesc.trim(),
        isRecommended: formIsRecommended,
        isActive: formIsActive,
        features: cleanedFeatures,
      };

      const res = await apiClient.put(`/admin/storage-plans/${editingPlan.planId}`, payload);
      if (res.data?.success) {
        toast.success(`Updated ${formName} successfully! Live on site.`);
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast.error(res.data?.error || 'Failed to update plan');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  const filteredPlans = plans.filter(p => {
    if (categoryFilter === 'ALL') return true;
    return p.billingCategory === categoryFilter;
  });

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Live Billing Config
            </span>
            <span className="text-xs font-bold text-slate-500">
              1 Month (3 Plans) • 6 Months (1 Plan) • 1 Year (3 Plans)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#c5a880]" />
            Storage Plans & Pricing Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Edit plan prices, storage capacity, durations, and bullet-point details. Any changes saved here update <strong>immediately</strong> on the Home Page and User Plan & Billing Page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/plans-billing"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-[#c5a880]" />
            <span>View User Pricing Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ═══ Category Tabs ═══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {[
          { key: 'ALL', label: 'All Plans', count: plans.length },
          { key: 'MONTHLY', label: '1 Month', count: plans.filter(p => p.billingCategory === 'MONTHLY').length },
          { key: '6_MONTHS', label: '6 Months', count: plans.filter(p => p.billingCategory === '6_MONTHS').length },
          { key: 'YEARLY', label: '1 Year', count: plans.filter(p => p.billingCategory === 'YEARLY').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key as BillingCategory)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              categoryFilter === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                categoryFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ Plans Grid ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-white/70 rounded-3xl border border-slate-200 p-6" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => {
            return (
              <div
                key={plan.planId}
                className={`relative rounded-3xl p-6 sm:p-7 bg-white border flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg ${
                  plan.isRecommended
                    ? 'border-[#c5a880] ring-1 ring-[#c5a880]/30'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#c5a880]/15 text-[#8c6d3f] border border-[#c5a880]/30">
                      {plan.storageGb} GB Storage
                    </span>

                    <div className="flex items-center gap-2">
                      {plan.isRecommended && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                          <Star className="w-3 h-3 fill-white" />
                          {plan.badge || 'Most Popular'}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          plan.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Plan Name & Live Price */}
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-sans">
                      {plan.displayPrice || `₹${plan.priceInr.toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      / {plan.billingPeriodText}
                    </span>
                  </div>

                  {/* Validity pill */}
                  <div className="mt-2 text-[11px] font-bold text-slate-500 flex items-center gap-1.5 bg-[#faf8f5] px-2.5 py-1.5 rounded-xl border border-[#e8dfd3]">
                    <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>
                      Duration: <strong>{plan.durationMonths === 12 ? '1 Full Year (12 Months)' : plan.durationMonths === 6 ? '6 Full Months' : '1 Month'}</strong> ({plan.billingCategory})
                    </span>
                  </div>

                  {/* Bullet Points List */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Features & Details ({plan.features?.length || 0} bullets):
                    </span>
                    <div className="space-y-2 text-xs text-slate-600 max-h-48 overflow-y-auto pr-1">
                      {plan.features?.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>Edit Pricing & Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Edit Plan Modal / Drawer ═══ */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 my-8 relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#c5a880]/15 text-[#8c6d3f] flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Edit Plan: {editingPlan.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Category: <strong>{editingPlan.billingCategory}</strong> • Plan ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">{editingPlan.planId}</code>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSavePlan} className="space-y-4 pt-4 overflow-y-auto pr-1 flex-1">
                {/* Row 1: Plan Name & Storage GB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      required
                      placeholder="e.g. 10 GB Storage"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-sm text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Storage Capacity (GB) *
                    </label>
                    <input
                      type="number"
                      value={formStorageGb}
                      onChange={e => setFormStorageGb(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      min={1}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-sm text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* Row 2: Price in INR & Period text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Price in INR (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={formPriceInr}
                        onChange={e => setFormPriceInr(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        min={0}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-sm text-slate-900 font-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Validity Period Text *
                    </label>
                    <input
                      type="text"
                      value={formPeriodText}
                      onChange={e => setFormPeriodText(e.target.value)}
                      required
                      placeholder="e.g. per month, for 6 months, per year"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* Row 3: Badge & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Badge / Tag (Optional)
                    </label>
                    <input
                      type="text"
                      value={formBadge}
                      onChange={e => setFormBadge(e.target.value)}
                      placeholder="e.g. HOT • Most Popular, Starter Solo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Summary Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={e => setFormDesc(e.target.value)}
                      placeholder="e.g. Store ~18,750 High-Res Photos"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formIsRecommended}
                      onChange={e => setFormIsRecommended(e.target.checked)}
                      className="w-4 h-4 rounded text-[#c5a880] focus:ring-0 cursor-pointer"
                    />
                    <span>Highlight as Recommended / Most Popular</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={e => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Is Active (Available for purchase)</span>
                  </label>
                </div>

                {/* Features / Details Bullets Editor */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        Features & Details (Bullet Points)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Shown below the price on both User Billing and Home pages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 py-1.5 rounded-lg bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#8c6d3f] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Bullet</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                    {formFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 w-5 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={feat}
                          onChange={e => handleFeatureChange(idx, e.target.value)}
                          placeholder="e.g. 50 GB High-Speed Cloud Storage"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c5a880] text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          title="Delete bullet point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {formFeatures.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        No bullet points yet. Click "+ Add Bullet" to create one.
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] via-[#d4be9f] to-[#b89665] hover:brightness-105 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Plan Changes</span>
                      </>
                    )}
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
