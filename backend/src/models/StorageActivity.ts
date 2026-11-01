import mongoose, { Schema, Document } from 'mongoose';

export type StorageActivityType =
  | 'PHOTO_UPLOADED'
  | 'PHOTO_DELETED'
  | 'PLAN_PURCHASED'
  | 'SUBSCRIPTION_RENEWED'
  | 'CAPACITY_CHANGED'
  | 'STORAGE_WARNING';

export interface IStorageActivity extends Document {
  userId: mongoose.Types.ObjectId;
  studioId: mongoose.Types.ObjectId;
  activityType: StorageActivityType;
  title: string;
  description: string;
  bytesChange: number; // positive for addition, negative for deletion
  currentTotalBytes: number; // snapshot of total used bytes after this activity
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StorageActivitySchema = new Schema<IStorageActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true, index: true },
    activityType: {
      type: String,
      enum: [
        'PHOTO_UPLOADED',
        'PHOTO_DELETED',
        'PLAN_PURCHASED',
        'SUBSCRIPTION_RENEWED',
        'CAPACITY_CHANGED',
        'STORAGE_WARNING',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    bytesChange: { type: Number, default: 0 },
    currentTotalBytes: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

StorageActivitySchema.index({ studioId: 1, createdAt: -1 });

export const StorageActivity = mongoose.model<IStorageActivity>(
  'StorageActivity',
  StorageActivitySchema
);

