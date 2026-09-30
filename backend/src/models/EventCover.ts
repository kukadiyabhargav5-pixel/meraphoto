import mongoose, { Schema, Document } from 'mongoose';

export interface IEventCover extends Document {
  userId: mongoose.Types.ObjectId;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventCoverSchema = new Schema<IEventCover>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, required: true },
}, {
  timestamps: true
});

export const EventCover = mongoose.model<IEventCover>('EventCover', EventCoverSchema);
