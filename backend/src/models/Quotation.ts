import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio' },
  clientName: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // optional linking
  scope: { type: String }, // keeping for backwards compatibility or optional scope
  items: [{ 
    name: { type: String, required: true }, 
    price: { type: Number, required: true },
    notes: { type: String }
  }],
  amount: { type: Number, required: true }, // total amount
  validUntil: { type: Date, required: true },
  status: { type: String, enum: ['Accepted', 'Pending', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quotation', quotationSchema);
