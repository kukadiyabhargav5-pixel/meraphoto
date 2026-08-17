import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  code: string; // URL Slug, e.g. "sharma-wedding-2026"
  clientName: string;
  clientMobile: string;
  clientEmail: string;
  date: Date;
  type: string;
  coverImageUrl?: string;
  description?: string;
  location: string;
  time: string;
  isMultiDay?: boolean;
  totalDays?: number;
  days?: {
    date: Date;
    time: string;
    location: string;
  }[];
  accessType: 'PUBLIC' | 'PASSWORD' | 'OTP' | 'QR';
  passwordHash?: string; // used if accessType is 'PASSWORD'
  studioId: mongoose.Types.ObjectId;
  assignedTeamMembers: mongoose.Types.ObjectId[];
  addToPortfolio?: boolean;
  watermark?: {
    isActive: boolean;
    type: 'TEXT' | 'LOGO';
    text?: string;
    logoUrl?: string;
    position: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';
    width: number;
    height: number;
    opacity: number;
  };
  isFaceSearchEnabled?: boolean;
  searchThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  clientName: { type: String, required: true },
  clientMobile: { type: String, required: true },
  clientEmail: { type: String, required: true, lowercase: true, trim: true },
  date: { type: Date, required: true },
  type: { type: String, required: true },
  coverImageUrl: { type: String },
  description: { type: String },
  location: { type: String, required: true },
  time: { type: String, required: true },
  isMultiDay: { type: Boolean, default: false },
  totalDays: { type: Number, default: 1 },
  days: [{
    date: { type: Date },
    time: { type: String },
    location: { type: String }
  }],
  accessType: {
    type: String,
    enum: ['PUBLIC', 'PASSWORD', 'OTP', 'QR'],
    default: 'PUBLIC'
  },
  passwordHash: { type: String },
  studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true },
  assignedTeamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  addToPortfolio: { type: Boolean, default: false },
  watermark: {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ['TEXT', 'LOGO'], default: 'LOGO' },
    text: { type: String },
    logoUrl: { type: String },
    position: {
      type: String,
      enum: ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'],
      default: 'BOTTOM_RIGHT'
    },
    width: { type: Number, default: 20 },
    height: { type: Number, default: 20 },
    opacity: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  isFaceSearchEnabled: { type: Boolean, default: true },
  searchThreshold: { type: Number, default: 0.45, min: 0, max: 1 }
}, {
  timestamps: true
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
