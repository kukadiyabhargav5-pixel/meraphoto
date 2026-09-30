import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  image: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
}, {
  timestamps: true
});

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
