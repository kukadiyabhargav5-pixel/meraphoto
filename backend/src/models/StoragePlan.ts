import mongoose, { Schema, Document } from 'mongoose';

export const ONE_GB_BYTES = 1024 * 1024 * 1024; // 1,073,741,824 bytes

export type BillingCategory = 'MONTHLY' | '6_MONTHS' | 'YEARLY';

export interface IStoragePlan extends Document {
  planId: string; // e.g. 'monthly-10gb', 'monthly-50gb', etc.
  name: string; // e.g. '10 GB Storage'
  storageGb: number; // in GB
  storageBytes: number; // in Bytes
  priceInr: number; // in Rupees
  displayPrice: string; // e.g. '₹149'
  billingCategory: BillingCategory;
  billingPeriodText: string; // e.g. 'per month', 'for 6 months', 'per year'
  durationMonths: number; // 1, 6, 12
  isRecommended: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const StoragePlanSchema = new Schema<IStoragePlan>(
  {
    planId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    storageGb: { type: Number, required: true },
    storageBytes: { type: Number, required: true },
    priceInr: { type: Number, required: true },
    displayPrice: { type: String, required: true },
    billingCategory: {
      type: String,
      enum: ['MONTHLY', '6_MONTHS', 'YEARLY'],
      required: true,
      index: true,
    },
    billingPeriodText: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    isRecommended: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const StoragePlan = mongoose.model<IStoragePlan>('StoragePlan', StoragePlanSchema);

/**
 * EXACT 7 Canonical Storage Subscription Plans specified by user
 */
export const CANONICAL_STORAGE_PLANS: Array<Omit<IStoragePlan, keyof Document | 'createdAt' | 'updatedAt'>> = [
  // ── A. Monthly Plans ──
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
      '10 GB High-Speed Ultra-Fast Cloud Storage',
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
      '50 GB High-Speed Ultra-Fast Cloud Storage',
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
      '100 GB High-Speed Ultra-Fast Cloud Storage',
      'Store ~25,000 High-Res Photos',
      'Full Video Storage Support',
      'AI Face Search & Smart Albums',
      'Automated Zip Download Archiver',
      'VIP Priority 24/7 Support',
    ],
  },

  // ── B. Six-Month Plan ──
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

  // ── C. Yearly Plans ──
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

