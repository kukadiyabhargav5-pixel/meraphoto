import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio' },
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientMobile: { type: String },
  eventName: { type: String },
  gstNumber: { type: String },
  invoiceNo: { type: String, required: true },
  amount: { type: Number, required: true },
  advance: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  issueDate: { type: Date },
  dueDate: { type: Date },
  eventDate: { type: Date },
  tokenPaymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Online' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Bill', billSchema);
