'use client';

import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  Trash2,
  CreditCard,
  RefreshCw,
  HardDrive,
  Activity,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { StorageActivity, fetchStorageActivities, formatBytes } from '@/lib/storage';

export default function StorageRecentActivity({ limit = 6 }: { limit?: number }) {
  const [activities, setActivities] = useState<StorageActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      const data = await fetchStorageActivities(limit);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    const handleUpdate = () => loadActivities();
    window.addEventListener('storage_updated', handleUpdate);
    return () => window.removeEventListener('storage_updated', handleUpdate);
  }, [limit]);

  const getActivityIcon = (type: StorageActivity['activityType']) => {
    switch (type) {
      case 'PHOTO_UPLOADED':
        return <UploadCloud className="w-4 h-4 text-blue-600" />;
      case 'PHOTO_DELETED':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'PLAN_PURCHASED':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'SUBSCRIPTION_RENEWED':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      case 'CAPACITY_CHANGED':
        return <HardDrive className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActivityBg = (type: StorageActivity['activityType']) => {
    switch (type) {
      case 'PHOTO_UPLOADED':
        return 'bg-blue-50 border-blue-200/60';
      case 'PHOTO_DELETED':
        return 'bg-rose-50 border-rose-200/60';
      case 'PLAN_PURCHASED':
        return 'bg-emerald-50 border-emerald-200/60';
      case 'SUBSCRIPTION_RENEWED':
        return 'bg-purple-50 border-purple-200/60';
      case 'CAPACITY_CHANGED':
        return 'bg-amber-50 border-amber-200/60';
      default:
        return 'bg-slate-50 border-slate-200/60';
    }
  };

  const formatActivityTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs animate-pulse">
        <div className="h-4 w-36 bg-slate-100 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 bg-slate-100 rounded" />
                <div className="h-2 w-1/2 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Storage Activity
          </h3>
        </div>
        <button
          onClick={loadActivities}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
          title="Refresh activities"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <HardDrive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">No storage activity recorded yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Your file uploads, deletions, and plan changes will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((act) => (
            <div
              key={act._id}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100 group"
            >
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getActivityBg(
                  act.activityType
                )}`}
              >
                {getActivityIcon(act.activityType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {formatActivityTime(act.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {act.description}
                </p>
              </div>

              {act.bytesChange !== 0 && (
                <div
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 self-center ${
                    act.bytesChange > 0
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {act.bytesChange > 0 ? '+' : ''}
                  {formatBytes(Math.abs(act.bytesChange))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

