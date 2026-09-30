import mongoose, { Schema, Document } from 'mongoose';

export interface IClientTicketMessage {
  sender: 'CUSTOMER' | 'STUDIO';
  message: string;
  timestamp: Date;
}

export interface IClientTicket extends Document {
  studioId: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  customerName: string;
  email: string;
  mobileNumber?: string;
  complaint: string;
  status: 'OPEN' | 'RESOLVED';
  messages: IClientTicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientTicketSchema = new Schema<IClientTicket>({
  studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true, index: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String },
  complaint: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['OPEN', 'RESOLVED'], 
    default: 'OPEN' 
  },
  messages: [
    {
      sender: { type: String, enum: ['CUSTOMER', 'STUDIO'], required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

export const ClientTicket = mongoose.model<IClientTicket>('ClientTicket', ClientTicketSchema);
