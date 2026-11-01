import mongoose, { Schema, Document } from 'mongoose';
import { BillingCategory } from './StoragePlan';

export type StorageSubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export interface IStorageSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  studioId: mongoose.Types.ObjectId;
  planId: string; // e.g. 'monthly-10gb', 'yearly-200gb'
  planName: string;
  storageLimitBytes: number;
  storageLimitGb: number;
  billingCategory: BillingCategory;
  durationMonths: number;
  amountInr: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: StorageSubscriptionStatus;
  startDate: Date;
  expiresAt: Date;
  cancelledAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  autoRenew: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StorageSubscriptionSchema = new Schema<IStorageSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true, index: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    storageLimitBytes: { type: Number, required: true },
    storageLimitGb: { type: Number, required: true },
    billingCategory: {
      type: String,
      enum: ['MONTHLY', '6_MONTHS', 'YEARLY'],
      required: true,
    },
    durationMonths: { type: Number, required: true, default: 1 },
    amountInr: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    cancelledAt: { type: Date },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    autoRenew: { type: Boolean, default: false },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Helpful index to quickly find user's latest active subscription
StorageSubscriptionSchema.index({ studioId: 1, status: 1, expiresAt: -1 });
StorageSubscriptionSchema.index({ userId: 1, status: 1, expiresAt: -1 });

export const StorageSubscription = mongoose.model<IStorageSubscription>(
  'StorageSubscription',
  StorageSubscriptionSchema
);

