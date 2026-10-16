import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanLimits {
  maxPhotos: number;
  maxVideos: number;
  maxEvents: number;
  maxStorageGb: number;
  aiSearchEnabled: boolean;
  watermarkEnabled: boolean;
  portfolioEnabled: boolean;
  bulkDownloadEnabled: boolean;
  whitelabelEnabled: boolean;
  prioritySupport: boolean;
}

export interface PricingPlanData {
  _id?: string;
  planKey: string;
  name: string;
  description: string;
  priceInr: number;
  displayPrice?: string;
  billingPeriod: string;
  currency: string;
  isActive: boolean;
  isRecommended: boolean;
  sortOrder: number;
  taxRate: number;
  features: PlanFeature[];
  limits?: PlanLimits;
  ctaText?: string;
  ctaHref?: string;
}

/**
 * Single Canonical Source of Truth for Default Client-Side Pricing.
 * Matches backend DB seed so there is ZERO discrepancy between frontend display and payment checkout.
 */
export const DEFAULT_CANONICAL_PLANS: PricingPlanData[] = [
  {
    planKey: 'BASIC',
    name: 'Basic',
    description: 'Get started free — explore Mara Photo galleries',
    priceInr: 0,
    displayPrice: 'Free',
    billingPeriod: '/year',
    currency: 'INR',
    isActive: true,
    isRecommended: false,
    sortOrder: 0,
    taxRate: 0,
    ctaText: 'Get Started Free',
    ctaHref: '/signup',
    features: [
      { text: 'Up to 5 events', included: true },
      { text: 'Store 1,000 photos', included: true },
      { text: 'Store 2 videos', included: true },
      { text: 'Basic gallery sharing', included: true },
      { text: 'QR code generation', included: true },
    ],
    limits: {
      maxPhotos: 1000,
      maxVideos: 2,
      maxEvents: 5,
      maxStorageGb: 2,
      aiSearchEnabled: false,
      watermarkEnabled: false,
      portfolioEnabled: false,
      bulkDownloadEnabled: false,
      whitelabelEnabled: false,
      prioritySupport: false,
    },
  },
  {
    planKey: 'STARTUP',
    name: 'Startup',
    description: 'Store 50,000 photos & 10 videos',
    priceInr: 3999,
    displayPrice: '₹3,999',
    billingPeriod: '/year',
    currency: 'INR',
    isActive: true,
    isRecommended: false,
    sortOrder: 1,
    taxRate: 0.18,
    ctaText: 'Choose Startup',
    ctaHref: '/dashboard/plans-billing',
    features: [
      { text: 'Store 50,000 photos', included: true },
      { text: 'Store 10 videos', included: true },
      { text: 'Create & Manage Events', included: true },
      { text: 'Quotation Generator', included: true },
      { text: 'Profile & Galleries', included: true },
    ],
    limits: {
      maxPhotos: 50000,
      maxVideos: 10,
      maxEvents: 50,
      maxStorageGb: 50,
      aiSearchEnabled: false,
      watermarkEnabled: true,
      portfolioEnabled: false,
      bulkDownloadEnabled: false,
      whitelabelEnabled: false,
      prioritySupport: false,
    },
  },
  {
    planKey: 'STANDARD',
    name: 'Standard',
    description: 'Store 1,00,000 photos & 20 videos',
    priceInr: 7999,
    displayPrice: '₹7,999',
    billingPeriod: '/year',
    currency: 'INR',
    isActive: true,
    isRecommended: true,
    sortOrder: 2,
    taxRate: 0.18,
    ctaText: 'Choose Standard',
    ctaHref: '/dashboard/plans-billing',
    features: [
      { text: 'Store 1,00,000 photos', included: true },
      { text: 'Store 20 videos', included: true },
      { text: 'ALL Dashboard Tools Enabled', included: true },
      { text: 'Bill & Invoice Generator', included: true },
      { text: 'Lead Capture & Branding', included: true },
      { text: 'Watermarks & Protection', included: true },
    ],
    limits: {
      maxPhotos: 100000,
      maxVideos: 20,
      maxEvents: 200,
      maxStorageGb: 100,
      aiSearchEnabled: false,
      watermarkEnabled: true,
      portfolioEnabled: true,
      bulkDownloadEnabled: true,
      whitelabelEnabled: false,
      prioritySupport: false,
    },
  },
  {
    planKey: 'ESSENTIAL',
    name: 'Essential',
    description: 'Store 1,50,000 photos & 50 videos',
    priceInr: 12999,
    displayPrice: '₹12,999',
    billingPeriod: '/year',
    currency: 'INR',
    isActive: true,
    isRecommended: false,
    sortOrder: 3,
    taxRate: 0.18,
    ctaText: 'Choose Essential',
    ctaHref: '/dashboard/plans-billing',
    features: [
      { text: 'Store 1,50,000 photos', included: true },
      { text: 'Store 50 videos', included: true },
      { text: 'ALL Dashboard Tools Enabled', included: true },
      { text: 'High-Speed Optimization', included: true },
      { text: 'Priority 24/7 Support', included: true },
      { text: 'Includes all Standard features', included: true },
    ],
    limits: {
      maxPhotos: 150000,
      maxVideos: 50,
      maxEvents: 500,
      maxStorageGb: 200,
      aiSearchEnabled: true,
      watermarkEnabled: true,
      portfolioEnabled: true,
      bulkDownloadEnabled: true,
      whitelabelEnabled: false,
      prioritySupport: true,
    },
  },
  {
    planKey: 'PREMIUM',
    name: 'Premium',
    description: 'Store 3,00,000 photos & 100 videos',
    priceInr: 19999,
    displayPrice: '₹19,999',
    billingPeriod: '/year',
    currency: 'INR',
    isActive: true,
    isRecommended: false,
    sortOrder: 4,
    taxRate: 0.18,
    ctaText: 'Choose Premium',
    ctaHref: '/dashboard/plans-billing',
    features: [
      { text: 'Store 3,00,000 photos', included: true },
      { text: 'Store 100 videos', included: true },
      { text: 'ALL Dashboard Tools Enabled', included: true },
      { text: 'AI Face Recognition Scanner', included: true },
      { text: 'Dedicated VIP Account Manager', included: true },
      { text: 'Includes all Essential features', included: true },
    ],
    limits: {
      maxPhotos: 300000,
      maxVideos: 100,
      maxEvents: 1000,
      maxStorageGb: 500,
      aiSearchEnabled: true,
      watermarkEnabled: true,
      portfolioEnabled: true,
      bulkDownloadEnabled: true,
      whitelabelEnabled: true,
      prioritySupport: true,
    },
  },
];

export const formatInrPrice = (amount: number): string => {
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Fetches dynamic plans from the backend API, falling back cleanly to canonical defaults.
 */
export const fetchPricingPlans = async (): Promise<PricingPlanData[]> => {
  try {
    const res = await apiClient.get('/plans');
    if (res.data?.success && Array.isArray(res.data?.plans) && res.data.plans.length > 0) {
      return res.data.plans.map((p: any) => ({
        ...p,
        displayPrice: formatInrPrice(p.priceInr),
        billingPeriod: p.priceInr === 0 ? '/year' : '/year',
        ctaText: p.ctaText || `Choose ${p.name}`,
        ctaHref: p.priceInr === 0 ? '/signup' : '/dashboard/plans-billing',
      }));
    }
  } catch (err) {
    // Silent fallback to canonical plans
  }
  return DEFAULT_CANONICAL_PLANS;
};

/**
 * Custom React Hook for live synchronized pricing across all pages.
 */
export const usePricingPlans = () => {
  const [plans, setPlans] = useState<PricingPlanData[]>(DEFAULT_CANONICAL_PLANS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPricingPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load plans');
      setPlans(DEFAULT_CANONICAL_PLANS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return { plans, loading, error, refresh: loadPlans };
};
