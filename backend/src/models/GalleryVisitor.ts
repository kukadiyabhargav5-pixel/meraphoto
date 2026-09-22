import mongoose, { Document, Schema } from 'mongoose';

export interface IGalleryVisitor extends Document {
  eventId: mongoose.Types.ObjectId;
  studioId: mongoose.Types.ObjectId;
  eventName?: string;
  eventCode?: string;
  eventDate?: Date;
  name: string;
  phone: string;
  email?: string;
  createdAt: Date;
}

const galleryVisitorSchema = new Schema<IGalleryVisitor>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: false },
  studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true },
  eventName: { type: String },
  eventCode: { type: String },
  eventDate: { type: Date },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries when studio owners look up their event visitors
galleryVisitorSchema.index({ studioId: 1, eventId: 1 });

export default mongoose.model<IGalleryVisitor>('GalleryVisitor', galleryVisitorSchema);
