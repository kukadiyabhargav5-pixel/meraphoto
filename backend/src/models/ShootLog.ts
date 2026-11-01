import mongoose from 'mongoose';

const shootLogSchema = new mongoose.Schema({
  studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  photographersCount: { type: Number, default: 0 },
  videographersCount: { type: Number, default: 0 },
  photographersNames: [{ type: String }],
  videographersNames: [{ type: String }],
  location: { type: String },
  notes: { type: String },
  reminder: { type: String, enum: ['none', '24h', '72h'], default: 'none' },
  status: {
    type: String,
    enum: ['Upcoming', 'Today', 'Completed', 'Due'],
    default: 'Upcoming'
  },
  todayEmailSent: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ShootLog', shootLogSchema);
