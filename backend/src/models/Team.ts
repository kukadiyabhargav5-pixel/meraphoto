import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, default: 'Photographer' },
  phone: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'Invite Sent'], default: 'Active' },
  accessLevel: { type: String, enum: ['Admin', 'Editor', 'Viewer'], default: 'Editor' },
  joinedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Team', teamSchema);
