import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  planKey?: string;
  description?: string;
}

export interface ICustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  gstin?: string;
}

export interface IBillingAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  userId?: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  customerDetails: ICustomerDetails;
  billingAddress: IBillingAddress;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'RAZORPAY';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  orderStatus: 'payment_pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  image: { type: String },
  planKey: { type: String },
  description: { type: String },
}, { _id: false });

const CustomerDetailsSchema = new Schema<ICustomerDetails>({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  gstin: { type: String, trim: true },
}, { _id: false });

const BillingAddressSchema = new Schema<IBillingAddress>({
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'India', trim: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  orderItems: { type: [OrderItemSchema], required: true },
  customerDetails: { type: CustomerDetailsSchema, required: true },
  billingAddress: { type: BillingAddressSchema, required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'RAZORPAY'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  orderStatus: { 
    type: String, 
    enum: ['payment_pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'payment_pending' 
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paidAt: { type: Date },
  receiptUrl: { type: String },
  notes: { type: String },
}, {
  timestamps: true
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
