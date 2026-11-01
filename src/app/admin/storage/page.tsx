'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  HardDrive,
  Cloud,
  Users,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Sliders,
  Calendar,
  X,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatInr, formatBytes } from '@/lib/storage';

interface StorageAdminUser {
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  role: string;
  activePlan: {
    planId: string;
    name: string;
    storageGb: number;
    billingCategory?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'FREE' | 'CANCELLED';
    startDate?: string;
    expiresAt?: string;
    isLifetime?: boolean;
    amountInr?: number;
  };
  totalStorageGb: number;
  usedStorageGb: number;
  availableStorageGb: number;
  usagePercentage: number;
  warningState: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'FULL';
  totalPhotos: number;
  totalVideos: number;
}

export default function AdminStoragePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<StorageAdminUser[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [selectedUser, setSelectedUser] = useState<StorageAdminUser | null>(null);
  const [modalMode, setModalMode] = useState<'ADJUST' | 'EXTEND' | 'CANCEL' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [newLimitGb, setNewLimitGb] = useState<number>(100);
  const [extendMonths, setExtendMonths] = useState<number>(1);
  const [actionReason, setActionReason] = useState<string>('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/storage/admin/overview');
      if (res.data?.success) {
        setStats(res.data.stats);
        setUsers(res.data.users || []);
        setTransactions(res.data.recentTransactions || []);
      }
    } catch (err: any) {
      console.error('Failed to load storage admin data:', err);
      toast.error(err.response?.data?.error || 'Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.userName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studioName?.toLowerCase().includes(q);

      const matchesPlan =
        planFilter === 'ALL' ||
        (planFilter === 'FREE' && (u.activePlan.status === 'FREE' || u.activePlan.planId.includes('free'))) ||
        (planFilter === 'MONTHLY' && u.activePlan.billingCategory === 'MONTHLY') ||
        (planFilter === '6_MONTHS' && u.activePlan.billingCategory === '6_MONTHS') ||
        (planFilter === 'YEARLY' && u.activePlan.billingCategory === 'YEARLY');

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.activePlan.status === 'ACTIVE') ||
        (statusFilter === 'EXPIRED' && u.activePlan.status === 'EXPIRED') ||
        (statusFilter === 'FREE' && u.activePlan.status === 'FREE');

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, searchQuery, planFilter, statusFilter]);

  // Handle Limit Adjustment
  const handleAdjustLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post('/storage/admin/adjust-limit', {
        studioId: selectedUser.studioId,
        newLimitGb: Number(newLimitGb),
        reason: actionReason,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Storage limit adjusted successfully');
        setModalMode(null);
        setSelectedUser(null);
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to adjust storage limit');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Subscription Extension
  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post('/storage/admin/extend-subscription', {
        studioId: selectedUser.studioId,
        extendMonths: Number(extendMonths),
        reason: actionReason,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Subscription extended successfully');
        setModalMode(null);
        setSelectedUser(null);
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to extend subscription');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Subscription Cancellation
  const handleCancel = async () => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to cancel the storage plan for ${selectedUser.studioName}? Photos will NOT be deleted.`)) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post('/storage/admin/cancel-subscription', {
        studioId: selectedUser.studioId,
        reason: actionReason || 'Cancelled by Super Admin',
      });
      if (res.data?.success) {
        toast.success('Subscription cancelled. Files remain safe.');
        setModalMode(null);
        setSelectedUser(null);
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Cloud className="w-8 h-8 text-blue-600" />
            Storage Subscriptions Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor platform-wide Cloudflare R2 storage allocation, enforce storage limits, and manage user subscriptions.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* ─── 4 Platform Metric Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Allocated Storage */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Allocated</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.totalAllocatedGb ?? 0} GB
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all paid subscriptions</div>
        </div>

        {/* Total Used Storage */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Used</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.platformStorageGb ?? 0} GB
          </div>
          <div className="text-xs text-slate-500 mt-1">Stored in Cloudflare R2 bucket</div>
        </div>

        {/* Total Uploaded Media */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stored Photos & Videos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {(stats?.platformPhotos ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            + {(stats?.platformVideos ?? 0)} event videos
          </div>
        </div>

        {/* Active Storage Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Paid Plans</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.activeSubscriptionsCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total studios: {stats?.totalStudiosCount ?? 0}</div>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by studio name, owner, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Plan Category Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="MONTHLY">Monthly Plans</option>
            <option value="6_MONTHS">6-Month Plans</option>
            <option value="YEARLY">Yearly Plans</option>
            <option value="FREE">Free Tier</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="FREE">Free Starter</option>
          </select>
        </div>
      </div>

      {/* ─── Users & Studios Table ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            User Storage Subscriptions ({filteredUsers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Studio & Owner</th>
                <th className="py-3.5 px-4">Active Plan</th>
                <th className="py-3.5 px-4">Storage Usage</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No studios found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const percent = u.usagePercentage;
                  let barColor = 'bg-blue-600';
                  if (percent >= 100) barColor = 'bg-red-600';
                  else if (percent >= 95) barColor = 'bg-rose-500';
                  else if (percent >= 80) barColor = 'bg-amber-500';

                  return (
                    <tr key={u.studioId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.studioName}</div>
                        <div className="text-[11px] text-slate-500">{u.userName} • {u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{u.activePlan.name}</span>
                        <div className="text-[11px] text-slate-400">{u.totalStorageGb} GB Limit</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {u.usedStorageGb} GB / {u.totalStorageGb} GB
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">
                          {u.availableStorageGb} GB free ({u.totalPhotos} photos)
                        </div>
                      </td>

                      <td className="py-3 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>
                          <span className="text-[11px] font-mono text-slate-600 font-bold shrink-0">
                            {percent}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {u.activePlan.isLifetime || !u.activePlan.expiresAt ? (
                          <span className="text-slate-400">Lifetime</span>
                        ) : (
                          new Date(u.activePlan.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.activePlan.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.activePlan.status === 'EXPIRED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {u.activePlan.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewLimitGb(u.totalStorageGb);
                              setModalMode('ADJUST');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Adjust Limit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalMode('EXTEND');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Extend
                          </button>
                          {u.activePlan.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setModalMode('CANCEL');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Recent Storage Transactions ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Recent Storage Plan Purchases ({transactions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{tx.orderNumber}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{tx.customerDetails?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{tx.customerDetails?.email}</div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">
                      {tx.orderItems?.[0]?.name || 'Storage Plan'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {formatInr(tx.totalAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tx.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Dialogs ─── */}
      {modalMode && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button
              onClick={() => {
                setModalMode(null);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mode 1: Adjust Storage Limit */}
            {modalMode === 'ADJUST' && (
              <form onSubmit={handleAdjustLimit}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Adjust Storage Limit
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Modify the authoritative storage quota for <strong>{selectedUser.studioName}</strong> ({selectedUser.email}).
                </p>

                <div className="space-y-3.5 mb-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      New Storage Limit (in GB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={newLimitGb}
                      onChange={(e) => setNewLimitGb(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reason for Adjustment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP client upgrade, special studio package"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Save Limit'}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Extend Subscription */}
            {modalMode === 'EXTEND' && (
              <form onSubmit={handleExtend}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Extend Subscription Duration
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Add extra validity to the active storage subscription for <strong>{selectedUser.studioName}</strong>.
                </p>

                <div className="space-y-3.5 mb-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Extend By (Months)
                    </label>
                    <select
                      value={extendMonths}
                      onChange={(e) => setExtendMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value={1}>+ 1 Month</option>
                      <option value={3}>+ 3 Months</option>
                      <option value={6}>+ 6 Months</option>
                      <option value={12}>+ 12 Months (1 Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Complimentary extension, promotion"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Extending...' : 'Extend Subscription'}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 3: Cancel Subscription */}
            {modalMode === 'CANCEL' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Cancel Subscription
                  </h3>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                  Are you sure you want to cancel the storage plan for <strong>{selectedUser.studioName}</strong>?
                  <br />
                  <span className="text-emerald-600 font-bold mt-1 block">
                    ✓ Safety Guarantee: Existing photos will NOT be deleted. Only new uploads above free quota will be paused.
                  </span>
                </p>

                <div className="mb-5">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cancellation Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. User requested, non-payment"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

