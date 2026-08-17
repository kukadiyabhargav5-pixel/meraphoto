import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Studio, User, Order } from '../models';
import { createRazorpayOrder, verifyPaymentSignature, cancelSubscription, verifyWebhookSignature, PLAN_PRICES } from '../services/RazorpayService';
import { calculateStudioCredits } from './studioController';

/**
 * Returns Razorpay public configuration
 */
export const getPaymentConfig = (req: Request, res: Response) => {
  return res.json({ 
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TCrfzMZeYCcbsJ',
    currency: 'INR'
  });
};

/**
 * Validates 10-digit Indian phone and standard email format
 */
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length === 10;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Recalculate cart totals securely on server side
 */
function calculateServerTotals(cartItems: any[]) {
  let subtotal = 0;
  const verifiedItems = cartItems.map((item: any) => {
    let itemPrice = Number(item.price) || 0;
    
    // If it's a known plan, strictly enforce verified plan price
    if (item.planKey) {
      const standardPrice = PLAN_PRICES[item.planKey.toUpperCase()];
      if (standardPrice !== undefined) {
        itemPrice = standardPrice;
      }
    }
    
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    subtotal += itemPrice * qty;

    return {
      productId: item.productId || item.id || item.planKey,
      name: item.name || 'Studio Plan',
      price: itemPrice,
      quantity: qty,
      image: item.image || '',
      planKey: item.planKey || undefined,
      description: item.description || '',
    };
  });

  const discount = 0;
  const shippingCharge = 0; // Digital subscription
  const tax = Math.round(subtotal * 0.18); // 18% GST calculation
  const totalAmount = subtotal + shippingCharge + tax - discount;

  return { subtotal, discount, shippingCharge, tax, totalAmount, verifiedItems };
}

/**
 * Initiates an e-commerce / subscription payment order via Razorpay
 */
export const createOrderSession = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerDetails,
      billingAddress,
      cartItems,
      paymentMethod = 'UPI'
    } = req.body;

    // 1. Resolve & Validate Customer Details (with logged-in user fallbacks)
    const sanitizedCustomerDetails = {
      fullName: (customerDetails?.fullName || req.user?.name || 'Studio Owner').trim(),
      email: (customerDetails?.email || req.user?.email || 'studio@maraphoto.com').trim().toLowerCase(),
      phone: (customerDetails?.phone || (req.user as any)?.phone || '9876543210').toString().replace(/[^0-9]/g, ''),
      companyName: customerDetails?.companyName?.trim() || undefined,
      gstin: customerDetails?.gstin?.trim() || undefined,
    };

    if (sanitizedCustomerDetails.phone.length !== 10) {
      sanitizedCustomerDetails.phone = '9876543210';
    }

    if (!isValidEmail(sanitizedCustomerDetails.email)) {
      sanitizedCustomerDetails.email = 'studio@maraphoto.com';
    }

    // 2. Resolve & Validate Billing Address
    const sanitizedBillingAddress = {
      address: (billingAddress?.address || 'Studio Headquarters').trim(),
      city: (billingAddress?.city || 'Surat').trim(),
      state: (billingAddress?.state || 'Gujarat').trim(),
      pincode: (billingAddress?.pincode || '395006').toString().trim(),
      country: (billingAddress?.country || 'India').trim(),
    };

    if (!isValidPincode(sanitizedBillingAddress.pincode)) {
      sanitizedBillingAddress.pincode = '395006';
    }

    // 3. Validate Cart Items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // 4. Server-Side Price & Total Calculation (NEVER trust frontend total)
    const { subtotal, discount, shippingCharge, tax, totalAmount, verifiedItems } = calculateServerTotals(cartItems);

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    // 5. Generate Order Identifier and Invoice Number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 6. Save Order in MongoDB with pending status
    const newOrder = await Order.create({
      orderNumber,
      invoiceNumber,
      userId: req.user?._id || undefined,
      orderItems: verifiedItems,
      customerDetails: sanitizedCustomerDetails,
      billingAddress: sanitizedBillingAddress,
      subtotal,
      discount,
      shippingCharge,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'payment_pending',
    });

    // 7. Create Order on Razorpay Server
    let rzpOrder: any;
    try {
      rzpOrder = await createRazorpayOrder(totalAmount, orderNumber, {
        orderId: newOrder._id.toString(),
        orderNumber,
        invoiceNumber,
        customerName: customerDetails.fullName,
      });
    } catch (rzpErr: any) {
      console.error('[Razorpay Order Creation Failed]:', rzpErr);
      await Order.findByIdAndUpdate(newOrder._id, { paymentStatus: 'failed', notes: rzpErr.message });
      return res.status(502).json({ error: 'Failed to communicate with Razorpay payment gateway. Please try again.' });
    }

    // 8. Attach Razorpay Order ID to our database record
    newOrder.razorpayOrderId = rzpOrder.id;
    await newOrder.save();

    return res.status(201).json({
      success: true,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      invoiceNumber: newOrder.invoiceNumber,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TCrfzMZeYCcbsJ',
      customerDetails: newOrder.customerDetails,
    });
  } catch (err: any) {
    console.error('Create Order Session Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while creating order' });
  }
};

/**
 * Verifies Razorpay payment signature cryptographically
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment signature verification details' });
    }

    // 1. Locate Order in Database
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    }
    if (!order && razorpayOrderId) {
      order = await Order.findOne({ razorpayOrderId });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found in records' });
    }

    // 2. Cryptographically Verify Signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      order.paymentStatus = 'failed';
      order.orderStatus = 'payment_pending';
      order.notes = 'Signature verification failed';
      await order.save();
      return res.status(400).json({ error: 'Payment signature verification failed. Untrusted transaction.' });
    }

    // 3. Mark Order as Confirmed & Paid
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();
    order.invoiceDate = new Date();
    if (!order.invoiceNumber) {
      order.invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    await order.save();

    // 4. If this was a subscription plan purchase, update the studio with 1-year validity
    const planItem = order.orderItems.find((item: any) => item.planKey);
    let updatedStudio: any = null;
    if (planItem && planItem.planKey) {
      let targetUserId = order.userId || req.user?._id;
      if (!targetUserId && order.customerDetails?.email) {
        const matchingUser = await User.findOne({ email: order.customerDetails.email.toLowerCase() });
        if (matchingUser) targetUserId = matchingUser._id;
      }

      if (targetUserId) {
        const startDate = new Date();
        const oneYearFromNow = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        updatedStudio = await Studio.findOneAndUpdate(
          { ownerId: targetUserId },
          { 
            subscriptionPlan: planItem.planKey.toUpperCase(),
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate: startDate,
            subscriptionExpiresAt: oneYearFromNow,
            razorpaySubscriptionId: razorpayPaymentId
          },
          { new: true, upsert: true }
        );
      }
    }

    const credits = updatedStudio ? await calculateStudioCredits(updatedStudio._id, updatedStudio.subscriptionPlan) : null;

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      studio: updatedStudio,
      credits,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        invoiceDate: order.invoiceDate,
        subtotal: order.subtotal,
        tax: order.tax,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paidAt: order.paidAt,
        razorpayPaymentId: order.razorpayPaymentId,
        razorpayOrderId: order.razorpayOrderId,
        customerDetails: order.customerDetails,
        billingAddress: order.billingAddress,
        orderItems: order.orderItems,
      }
    });
  } catch (err: any) {
    console.error('Verify Payment Error:', err);
    return res.status(500).json({ error: err.message || 'Error occurred while verifying payment' });
  }
};

/**
 * Retrieve Order Details by ID (for receipt & invoice)
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let order = null;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    } else {
      order = await Order.findOne({ 
        $or: [{ orderNumber: id }, { invoiceNumber: id }] 
      });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieve Orders for the Logged-in User
 */
export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await Order.find({ 
      $or: [
        { userId: req.user._id },
        { 'customerDetails.email': req.user.email }
      ]
    }).sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Legacy: createBillingSession for backwards compatibility
 */
export const createBillingSession = async (req: AuthRequest, res: Response) => {
  const { plan } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!plan) return res.status(400).json({ error: 'Plan is required' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    studio.subscriptionPlan = plan;
    studio.subscriptionStatus = 'ACTIVE';
    await studio.save();

    return res.json({
      subscriptionId: 'sub_' + Date.now(),
      message: 'Plan upgraded successfully'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Cancels subscription
 */
export const cancelMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(400).json({ error: 'Studio not found' });

    studio.subscriptionPlan = 'BASIC';
    studio.subscriptionStatus = 'ACTIVE';
    studio.razorpaySubscriptionId = undefined;
    await studio.save();

    return res.json({ message: 'Subscription cancelled successfully', subscriptionStatus: 'CANCELLED' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Handle incoming Razorpay webhooks
 */
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  try {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      await Order.findOneAndUpdate(
        { razorpayOrderId },
        { 
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          razorpayPaymentId,
          paidAt: new Date()
        }
      );
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Razorpay Webhook Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
