import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api';

export const ONE_GB_BYTES = 1024 * 1024 * 1024;

export type BillingCategory = 'MONTHLY' | '6_MONTHS' | 'YEARLY';

export interface StoragePlan {
  _id?: string;
  planId: string;
  name: string;
  storageGb: number;
  storageBytes: number;
  priceInr: number;
  displayPrice: string;
  billingCategory: BillingCategory;
  billingPeriodText: string;
  durationMonths: number;
  isRecommended: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface StorageSubscription {
  _id: string;
  planId: string;
  planName: string;
  storageLimitBytes: number;
  storageLimitGb: number;
  billingCategory: BillingCategory;
  durationMonths: number;
  amountInr: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  expiresAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface StorageUsage {
  hasActivePlan?: boolean;
  totalStorageBytes: number;
  usedStorageBytes: number;
  availableStorageBytes: number;
  totalStorageGb: number;
  usedStorageGb: number;
  availableStorageGb: number;
  formattedUsedStorage?: string;
  formattedTotalStorage?: string;
  formattedAvailableStorage?: string;
  usagePercentage: number;
  warningState: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'FULL';
  activePlan: {
    planId: string;
    name: string;
    storageGb: number;
    billingCategory?: string;
    durationMonths?: number;
    durationText?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'FREE' | 'CANCELLED' | 'NONE';
    startDate?: string | null;
    expiresAt?: string | null;
    daysLeft?: number;
    isLifetime?: boolean;
    amountInr?: number;
  };
  totalPhotos: number;
  totalVideos: number;
  totalFiles: number;
}

export interface StorageActivity {
  _id: string;
  activityType:
    | 'PHOTO_UPLOADED'
    | 'PHOTO_DELETED'
    | 'PLAN_PURCHASED'
    | 'SUBSCRIPTION_RENEWED'
    | 'CAPACITY_CHANGED'
    | 'STORAGE_WARNING';
  title: string;
  description: string;
  bytesChange: number;
  currentTotalBytes: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

export const CANONICAL_STORAGE_PLANS: StoragePlan[] = [
  {
    planId: 'monthly-10gb',
    name: '10 GB Storage',
    storageGb: 10,
    storageBytes: 10 * ONE_GB_BYTES,
    priceInr: 149,
    displayPrice: '₹149',
    billingCategory: 'MONTHLY',
    billingPeriodText: 'per month',
    durationMonths: 1,
    isRecommended: false,
    sortOrder: 1,
    isActive: true,
    features: [
      '10 GB High-Speed Cloudflare R2 Storage',
      'Store ~2,500 High-Res Photos',
      'Full Resolution Downloads',
      'AI Face Recognition Indexing',
      'Direct Client Sharing Links & QR Codes',
      'AES-256 Storage Encryption',
    ],
  },
  {
    planId: 'monthly-50gb',
    name: '50 GB Storage',
    storageGb: 50,
    storageBytes: 50 * ONE_GB_BYTES,
    priceInr: 299,
    displayPrice: '₹299',
    billingCategory: 'MONTHLY',
    billingPeriodText: 'per month',
    durationMonths: 1,
    isRecommended: false,
    sortOrder: 2,
    isActive: true,
    features: [
      '50 GB High-Speed Cloudflare R2 Storage',
      'Store ~12,500 High-Res Photos',
      'Ultra-Fast CDN Delivery',
      'AI Face Search & Live Scanner',
      'Custom Studio Watermarking',
      'Priority Support',
    ],
  },
  {
    planId: 'monthly-100gb',
    name: '100 GB Storage',
    storageGb: 100,
    storageBytes: 100 * ONE_GB_BYTES,
    priceInr: 499,
    displayPrice: '₹499',
    billingCategory: 'MONTHLY',
    billingPeriodText: 'per month',
    durationMonths: 1,
    isRecommended: true,
    sortOrder: 3,
    isActive: true,
    features: [
      '100 GB High-Speed Cloudflare R2 Storage',
      'Store ~25,000 High-Res Photos',
      'Full Video Storage Support',
      'AI Face Search & Smart Albums',
      'Automated Zip Download Archiver',
      'VIP Priority 24/7 Support',
    ],
  },
  {
    planId: 'sixmonth-75gb',
    name: '75 GB Storage',
    storageGb: 75,
    storageBytes: 75 * ONE_GB_BYTES,
    priceInr: 6999,
    displayPrice: '₹6,999',
    billingCategory: '6_MONTHS',
    billingPeriodText: 'for 6 months',
    durationMonths: 6,
    isRecommended: true,
    sortOrder: 4,
    isActive: true,
    features: [
      '75 GB Dedicated Cloud Storage',
      '6 Months Extended Validity',
      'Store ~18,750 High-Res Photos',
      'High-Speed Multi-Stream Uploads',
      'AI Face Recognition Included',
      'Complete Client Gallery Management',
    ],
  },
  {
    planId: 'yearly-100gb',
    name: '100 GB Storage',
    storageGb: 100,
    storageBytes: 100 * ONE_GB_BYTES,
    priceInr: 5999,
    displayPrice: '₹5,999',
    billingCategory: 'YEARLY',
    billingPeriodText: 'per year',
    durationMonths: 12,
    isRecommended: false,
    sortOrder: 5,
    isActive: true,
    features: [
      '100 GB Dedicated Cloud Storage',
      '1 Full Year Subscription Validity',
      'Store ~25,000 High-Res Photos',
      'Unlimited Client Event Galleries',
      'AI Face Search & Smart Albums',
      'Dedicated Account Assistance',
    ],
  },
  {
    planId: 'yearly-200gb',
    name: '200 GB Storage',
    storageGb: 200,
    storageBytes: 200 * ONE_GB_BYTES,
    priceInr: 11999,
    displayPrice: '₹11,999',
    billingCategory: 'YEARLY',
    billingPeriodText: 'per year',
    durationMonths: 12,
    isRecommended: true,
    sortOrder: 6,
    isActive: true,
    features: [
      '200 GB High-Capacity Storage',
      '1 Full Year Subscription Validity',
      'Store ~50,000 High-Res Photos',
      '4K Video Storage & Streaming',
      'AI Face Recognition VIP Tier',
      'VIP Priority 24/7 SLA Support',
    ],
  },
  {
    planId: 'yearly-500gb',
    name: '500 GB Storage',
    storageGb: 500,
    storageBytes: 500 * ONE_GB_BYTES,
    priceInr: 23999,
    displayPrice: '₹23,999',
    billingCategory: 'YEARLY',
    billingPeriodText: 'per year',
    durationMonths: 12,
    isRecommended: false,
    sortOrder: 7,
    isActive: true,
    features: [
      '500 GB Maximum Enterprise Cloud Storage',
      '1 Full Year Subscription Validity',
      'Store ~1,25,000 High-Res Photos',
      'High-Throughput Enterprise CDN',
      'VIP Dedicated Account Manager',
      'Custom Domain & Whitelabeling Ready',
    ],
  },
];

export const formatInr = (amount: number): string => {
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 MB';
  const gb = bytes / ONE_GB_BYTES;
  if (gb >= 1) {
    return `${gb >= 10 ? Math.round(gb) : gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) {
    return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
};

export const fetchStoragePlans = async (): Promise<StoragePlan[]> => {
  try {
    const res = await apiClient.get('/storage/plans');
    if (res.data?.success && Array.isArray(res.data?.plans) && res.data.plans.length > 0) {
      return res.data.plans;
    }
  } catch (err) {
    // fallback
  }
  return CANONICAL_STORAGE_PLANS;
};

export const fetchStorageUsage = async (): Promise<StorageUsage | null> => {
  try {
    const res = await apiClient.get(`/storage/usage?_t=${Date.now()}`);
    if (res.data?.success && res.data?.usage) {
      return res.data.usage;
    }
  } catch (err) {
    console.error('Failed to fetch storage usage:', err);
  }
  return null;
};

export const fetchStorageActivities = async (limit: number = 10): Promise<StorageActivity[]> => {
  try {
    const res = await apiClient.get(`/storage/activity?limit=${limit}`);
    if (res.data?.success && Array.isArray(res.data?.activities)) {
      return res.data.activities;
    }
  } catch (err) {
    console.error('Failed to fetch storage activity:', err);
  }
  return [];
};

export const useStoragePlans = () => {
  const [plans, setPlans] = useState<StoragePlan[]>(CANONICAL_STORAGE_PLANS);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStoragePlans();
      setPlans(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { plans, loading, refresh: load };
};

export const useStorageUsage = () => {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStorageUsage();
      setUsage(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener('storage_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('storage_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [load]);

  return { usage, loading, refresh: load };
};

