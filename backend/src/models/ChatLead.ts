import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  _id?: any;
  sender: 'visitor' | 'admin' | 'bot';
  senderName?: string;
  text: string;
  timestamp: Date;
}

export interface IChatLead extends Document {
  sessionId: string;
  name?: string;
  phone?: string;
  email?: string;
  sourceUrl?: string;
  device?: string;
  
  // Callback details
  callbackRequested: boolean;
  callbackTimeNotice?: string;
  callbackStatus: 'pending' | 'called' | 'converted' | 'closed';
  callbackRequestedAt?: Date;
  callbackNotes?: string;
  
  // Live Chat details
  messages: IChatMessage[];
  unreadForAdmin: number;
  unreadForVisitor: number;
  lastMessageText?: string;
  lastMessageAt?: Date;
  status: 'active' | 'archived' | 'resolved';

  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender: { type: String, enum: ['visitor', 'admin', 'bot'], required: true },
  senderName: { type: String },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatLeadSchema = new Schema<IChatLead>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Website Visitor' },
    phone: { type: String, index: true },
    email: { type: String },
    sourceUrl: { type: String },
    device: { type: String },

    callbackRequested: { type: Boolean, default: false, index: true },
    callbackTimeNotice: { type: String, default: 'Within 2-3 hours' },
    callbackStatus: { 
      type: String, 
      enum: ['pending', 'called', 'converted', 'closed'], 
      default: 'pending',
      index: true 
    },
    callbackRequestedAt: { type: Date },
    callbackNotes: { type: String },

    messages: [ChatMessageSchema],
    unreadForAdmin: { type: Number, default: 0 },
    unreadForVisitor: { type: Number, default: 0 },
    lastMessageText: { type: String },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['active', 'archived', 'resolved'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const ChatLead = mongoose.models.ChatLead || mongoose.model<IChatLead>('ChatLead', ChatLeadSchema);
export default ChatLead;
