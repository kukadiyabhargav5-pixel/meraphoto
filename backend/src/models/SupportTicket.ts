import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  sender: 'STUDIO' | 'ADMIN';
  message: string;
  attachments?: string[];
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  studioId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], 
    default: 'OPEN' 
  },
  messages: [
    {
      sender: { type: String, enum: ['STUDIO', 'ADMIN'], required: true },
      message: { type: String, required: true },
      attachments: [{ type: String }],
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
