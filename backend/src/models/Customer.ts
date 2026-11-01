import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio' },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  eventName: { type: String },
  eventDate: { type: Date },
  totalEvents: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Completed'], default: 'Active' },
  tags: [{ type: String }],
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.index({ studioId: 1, createdAt: -1 });
customerSchema.index({ studioId: 1, phone: 1 });
customerSchema.index({ studioId: 1, email: 1 });

export default mongoose.model('Customer', customerSchema);
