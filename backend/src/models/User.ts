import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: 'SUPER_ADMIN' | 'STUDIO_OWNER' | 'TEAM_MEMBER' | 'CLIENT';
  otp?: {
    code: string;
    expiresAt: Date;
  };
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  phone: { type: String },
  passwordHash: { type: String },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT'], 
    default: 'CLIENT' 
  },
  otp: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  refreshToken: { type: String }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
