import mongoose, { Schema, Document } from 'mongoose';

export interface IWatermarkSettings {
  type: 'TEXT' | 'LOGO' | 'NONE';
  text?: string;
  logoUrl?: string;
  position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';
  opacity: number; // 0 to 1
  size: number; // 10 to 100 percentage
}

export interface IUsageLimit {
  photosUploaded: number;
  videosUploaded: number;
  aiSearchesCount: number;
}

export interface IPaymentDetails {
  upiId?: string;
  merchantName?: string;
  uploadedQrUrl?: string;
}

export interface IStudio extends Document {
  name: string;
  logoUrl?: string;
  logoKey?: string;
  bannerUrl?: string;
  bannerKey?: string;
  tagline?: string;
  bio?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  customEventsCount?: string;
  customCustomersCount?: string;
  customDomain?: string; // e.g. "gallery.dreamstudio.com"
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  ownerId: mongoose.Types.ObjectId;
  watermark: IWatermarkSettings;
  subscriptionPlan: 'BASIC' | 'STARTUP' | 'STANDARD' | 'ESSENTIAL' | 'PREMIUM' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING' | 'FREE';
  subscriptionStartDate?: Date;
  subscriptionExpiresAt?: Date;
  razorpaySubscriptionId?: string;
  paymentDetails?: IPaymentDetails;
  branding?: any;
  usage: IUsageLimit;
  createdAt: Date;
  updatedAt: Date;
}

const StudioSchema = new Schema<IStudio>({
  name: { type: String, required: true },
  logoUrl: { type: String },
  logoKey: { type: String },
  bannerUrl: { type: String },
  bannerKey: { type: String },
  tagline: { type: String },
  bio: { type: String },
  phone: { type: String },
  mobile: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  customEventsCount: { type: String },
  customCustomersCount: { type: String },
  branding: { type: Schema.Types.Mixed },
  customDomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  instagramUrl: { type: String },
  facebookUrl: { type: String },
  whatsappUrl: { type: String },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  watermark: {
    type: { type: String, enum: ['TEXT', 'LOGO', 'NONE'], default: 'NONE' },
    text: { type: String, default: 'Mara Photo' },
    logoUrl: { type: String },
    position: { 
      type: String, 
      enum: ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'], 
      default: 'BOTTOM_RIGHT' 
    },
    opacity: { type: Number, default: 0.5, min: 0, max: 1 },
    size: { type: Number, default: 20, min: 10, max: 100 }
  },
  subscriptionPlan: { 
    type: String, 
    enum: ['BASIC', 'STARTUP', 'STANDARD', 'ESSENTIAL', 'PREMIUM', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'], 
    default: 'BASIC' 
  },
  subscriptionStatus: { 
    type: String, 
    enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'FREE'], 
    default: 'ACTIVE' 
  },
  subscriptionStartDate: { type: Date },
  subscriptionExpiresAt: { type: Date },
  razorpaySubscriptionId: { type: String },
  paymentDetails: {
    upiId: { type: String },
    merchantName: { type: String },
    uploadedQrUrl: { type: String }
  },
  usage: {
    photosUploaded: { type: Number, default: 0 },
    videosUploaded: { type: Number, default: 0 },
    aiSearchesCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Ensure customDomain is strictly undefined if empty or null so sparse unique index is not violated
StudioSchema.pre('validate', function (next) {
  if (this.customDomain === '' || this.customDomain === null) {
    this.customDomain = undefined;
  }
  next();
});

export const Studio = mongoose.model<IStudio>('Studio', StudioSchema);
