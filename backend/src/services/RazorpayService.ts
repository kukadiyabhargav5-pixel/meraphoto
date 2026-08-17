import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TCrfzMZeYCcbsJ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'c7AIZ8VMSuHFL7I1CiCHy1Tu',
});

export const PLAN_PRICES: Record<string, number> = {
  BASIC: 3500,
  STANDARD: 7900,
  ESSENTIAL: 15900,
  PREMIUM: 31900,
};

/**
 * Creates a generic Razorpay Order for any server-verified amount
 */
export const createRazorpayOrder = async (amountInRupees: number, receiptId: string, notes: Record<string, any> = {}) => {
  const amountInPaise = Math.round(amountInRupees * 100);
  return razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
    notes,
  });
};

/**
 * Creates a one-time order inside Razorpay for a studio plan
 */
export const createOrder = async (planKey: string, receiptId: string) => {
  const amount = PLAN_PRICES[planKey.toUpperCase()] || 0;
  return createRazorpayOrder(amount, receiptId, { planKey });
};

/**
 * Securely verifies payment signature returned by Razorpay Checkout
 */
export const verifyPaymentSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'c7AIZ8VMSuHFL7I1CiCHy1Tu';
  const data = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  return generatedSignature === razorpaySignature;
};

/**
 * Cancels an active Razorpay subscription (mocked since we use one-time orders)
 */
export const cancelSubscription = async (subscriptionId: string) => {
  return true;
};

/**
 * Verifies the integrity of webhook callbacks from Razorpay
 */
export const verifyWebhookSignature = (rawBody: string, signature: string): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'mock_webhook_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
};

export { razorpay };
