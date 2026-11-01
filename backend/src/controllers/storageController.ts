import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { StoragePlan, CANONICAL_STORAGE_PLANS, ONE_GB_BYTES } from '../models/StoragePlan';
import { StorageSubscription } from '../models/StorageSubscription';
import { StorageActivity } from '../models/StorageActivity';
import { Media } from '../models/Media';
import { Studio } from '../models/Studio';
import { User } from '../models/User';
import { Order } from '../models/Order';
import {
  getUserStorageUsage,
  getAuthoritativeStoragePlan,
  recordStorageActivity,
  seedStoragePlans,
} from '../services/storageSubscriptionService';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from '../services/RazorpayService';

/**
 * GET /api/storage/plans
 * Lists all available storage subscription plans
 */
export const getStoragePlans = async (req: Request, res: Response) => {
  try {
    let plans = await StoragePlan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    if (!plans || plans.length === 0) {
      await seedStoragePlans();
      plans = await StoragePlan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    }

    const monthlyPlans = plans.filter((p) => p.billingCategory === 'MONTHLY');
    const sixMonthPlans = plans.filter((p) => p.billingCategory === '6_MONTHS');
    const yearlyPlans = plans.filter((p) => p.billingCategory === 'YEARLY');

    return res.json({
      success: true,
      plans,
      categories: {
        MONTHLY: monthlyPlans,
        '6_MONTHS': sixMonthPlans,
        YEARLY: yearlyPlans,
      },
    });
  } catch (err: any) {
    console.error('[getStoragePlans Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch storage plans' });
  }
};

/**
 * GET /api/storage/subscription
 * Get current user's active storage subscription
 */
export const getStorageSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    const admin = isSuperAdmin(req.user);
    const usage = await getUserStorageUsage(studio._id, req.user._id, admin);

    // Auto-sync studio subscription tier if user has an active storage plan
    if (usage?.hasActivePlan && studio.subscriptionPlan === 'BASIC') {
      const tier = usage.totalStorageGb >= 100 ? 'PREMIUM' : usage.totalStorageGb >= 50 ? 'STANDARD' : 'STARTUP';
      studio.subscriptionPlan = tier;
      studio.subscriptionStatus = 'ACTIVE';
      await studio.save();
    }

    const subscription = await StorageSubscription.findOne({
      studioId: studio._id,
      status: 'ACTIVE',
      paymentStatus: 'paid',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      subscription: subscription || null,
      usage,
    });
  } catch (err: any) {
    console.error('[getStorageSubscription Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/storage/usage
 * Get current user's live storage metrics calculated from actual file sizes
 */
export const getStorageUsage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      // Auto-provision basic studio if missing
      studio = await Studio.create({
        name: `${req.user.name || 'Mara'} Studio`,
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
      });
    }

    const admin = isSuperAdmin(req.user);
    const usage = await getUserStorageUsage(studio._id, req.user._id, admin);

    // Auto-sync studio subscription tier if user has an active storage plan
    if (usage?.hasActivePlan && studio.subscriptionPlan === 'BASIC') {
      const tier = usage.totalStorageGb >= 100 ? 'PREMIUM' : usage.totalStorageGb >= 50 ? 'STANDARD' : 'STARTUP';
      studio.subscriptionPlan = tier;
      studio.subscriptionStatus = 'ACTIVE';
      await studio.save();
    }

    return res.json({
      success: true,
      usage,
    });
  } catch (err: any) {
    console.error('[getStorageUsage Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/storage/activity
 * Get recent storage activity log for dashboard
 */
export const getStorageActivity = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.json({ success: true, activities: [] });

    const limit = Math.min(50, parseInt(req.query.limit as string) || 15);
    const activities = await StorageActivity.find({ studioId: studio._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      activities,
    });
  } catch (err: any) {
    console.error('[getStorageActivity Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/storage/checkout
 * Initiate Razorpay checkout order for a specific storage plan
 */
export const createStorageCheckoutOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { planId, customerDetails, billingAddress } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    // 1. Authoritative plan lookup
    const plan = await getAuthoritativeStoragePlan(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Storage plan not found or currently unavailable' });
    }

    const priceInr = plan.priceInr;
    if (priceInr <= 0) {
      return res.status(400).json({ error: 'Invalid plan price' });
    }

    // 2. Resolve Customer Details
    const sanitizedCustomerDetails = {
      fullName: (customerDetails?.fullName || req.user.name || studio.name || 'Studio Owner').trim(),
      email: (customerDetails?.email || req.user.email || 'studio@maraphoto.com').trim().toLowerCase(),
      phone: (customerDetails?.phone || (req.user as any).phone || '9876543210').toString().replace(/[^0-9]/g, ''),
      companyName: customerDetails?.companyName || studio.name,
    };

    if (sanitizedCustomerDetails.phone.length !== 10) {
      sanitizedCustomerDetails.phone = '9876543210';
    }

    // 3. Resolve Billing Address
    const sanitizedBillingAddress = {
      address: (billingAddress?.address || `${studio.name} Studio HQ`).trim(),
      city: (billingAddress?.city || 'Surat').trim(),
      state: (billingAddress?.state || 'Gujarat').trim(),
      pincode: (billingAddress?.pincode || '395006').toString().trim(),
      country: (billingAddress?.country || 'India').trim(),
    };

    // 4. Calculate Taxes & Totals
    const subtotal = priceInr;
    const tax = Math.round(subtotal * 0.18); // 18% GST standard
    const totalAmount = subtotal + tax;

    const orderNumber = `STOR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `INV-STOR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 5. Create Order in Database
    const newOrder = await Order.create({
      orderNumber,
      invoiceNumber,
      userId: req.user._id,
      orderItems: [
        {
          productId: plan.planId,
          name: `${plan.name} Cloud Storage Plan`,
          price: priceInr,
          quantity: 1,
          planKey: plan.planId,
          description: `${plan.storageGb} GB cloud storage ${plan.billingPeriodText}`,
        },
      ],
      customerDetails: sanitizedCustomerDetails,
      billingAddress: sanitizedBillingAddress,
      subtotal,
      discount: 0,
      shippingCharge: 0,
      tax,
      totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'pending',
      orderStatus: 'payment_pending',
      notes: `Storage plan checkout: ${plan.name}`,
    });

    // 6. Create Razorpay Order
    let rzpOrder: any;
    try {
      rzpOrder = await createRazorpayOrder(totalAmount, orderNumber, {
        orderId: newOrder._id.toString(),
        orderNumber,
        planId: plan.planId,
        studioId: studio._id.toString(),
      });
    } catch (rzpErr: any) {
      console.error('[Razorpay Order Creation Failed]:', rzpErr);
      await Order.findByIdAndUpdate(newOrder._id, { paymentStatus: 'failed', notes: rzpErr.message });
      return res.status(502).json({
        error: 'Failed to communicate with Razorpay payment gateway. Please ensure Razorpay is configured.',
      });
    }

    newOrder.razorpayOrderId = rzpOrder.id;
    await newOrder.save();

    // 7. Calculate Expiry Date for pending subscription
    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);

    // Create pending subscription record
    await StorageSubscription.create({
      userId: req.user._id,
      studioId: studio._id,
      planId: plan.planId,
      planName: plan.name,
      storageLimitBytes: plan.storageBytes,
      storageLimitGb: plan.storageGb,
      billingCategory: plan.billingCategory,
      durationMonths: plan.durationMonths,
      amountInr: totalAmount,
      paymentStatus: 'pending',
      status: 'PENDING',
      startDate,
      expiresAt,
      razorpayOrderId: rzpOrder.id,
      autoRenew: false,
    });

    return res.status(201).json({
      success: true,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      invoiceNumber: newOrder.invoiceNumber,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency || 'INR',
      key: process.env.RAZORPAY_KEY_ID || '',
      plan: {
        planId: plan.planId,
        name: plan.name,
        storageGb: plan.storageGb,
        displayPrice: plan.displayPrice,
        billingPeriodText: plan.billingPeriodText,
        totalAmount,
      },
      customerDetails: newOrder.customerDetails,
    });
  } catch (err: any) {
    console.error('[createStorageCheckoutOrder Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to initiate storage plan checkout' });
  }
};

/**
 * POST /api/storage/verify-payment
 * Cryptographically verify Razorpay payment and activate storage subscription
 */
export const verifyStoragePayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment signature verification details' });
    }

    // 1. Locate Order
    let order = null;
    if (orderId) order = await Order.findById(orderId);
    if (!order && razorpayOrderId) order = await Order.findOne({ razorpayOrderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent duplicate processing
    if (order.paymentStatus === 'paid') {
      const studio = await Studio.findOne({ ownerId: req.user._id });
      const usage = studio ? await getUserStorageUsage(studio._id, req.user._id) : null;
      return res.json({
        success: true,
        message: 'Payment already verified and active',
        order,
        usage,
      });
    }

    // 2. Cryptographic signature check
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      order.paymentStatus = 'failed';
      order.notes = 'Signature verification failed';
      await order.save();
      return res.status(400).json({ error: 'Payment signature verification failed. Untrusted transaction.' });
    }

    // 3. Mark Order as Confirmed
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();
    order.invoiceDate = new Date();
    await order.save();

    // 4. Activate StorageSubscription
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    let subscription = await StorageSubscription.findOne({ razorpayOrderId });
    const planItem = order.orderItems[0];
    const planId = planItem?.planKey || 'monthly-10gb';
    const plan = await getAuthoritativeStoragePlan(planId);

    const now = new Date();
    const durationMonths = plan?.durationMonths || 1;
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    if (subscription) {
      subscription.paymentStatus = 'paid';
      subscription.status = 'ACTIVE';
      subscription.razorpayPaymentId = razorpayPaymentId;
      subscription.razorpaySignature = razorpaySignature;
      subscription.startDate = now;
      subscription.expiresAt = expiresAt;
      await subscription.save();
    } else {
      subscription = await StorageSubscription.create({
        userId: req.user._id,
        studioId: studio._id,
        planId: plan?.planId || planId,
        planName: plan?.name || 'Storage Plan',
        storageLimitBytes: plan?.storageBytes || 10 * ONE_GB_BYTES,
        storageLimitGb: plan?.storageGb || 10,
        billingCategory: plan?.billingCategory || 'MONTHLY',
        durationMonths,
        amountInr: order.totalAmount,
        paymentStatus: 'paid',
        status: 'ACTIVE',
        startDate: now,
        expiresAt,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        autoRenew: false,
      });
    }

    // Deactivate older subscriptions for clean state
    await StorageSubscription.updateMany(
      {
        studioId: studio._id,
        _id: { $ne: subscription._id },
        status: 'ACTIVE',
      },
      { $set: { status: 'CANCELLED' } }
    );

    // 5. Record Storage Activity
    await recordStorageActivity({
      userId: req.user._id,
      studioId: studio._id,
      activityType: 'PLAN_PURCHASED',
      title: 'Storage Plan Purchased',
      description: `Activated ${subscription.planName} (${subscription.storageLimitGb} GB) for ₹${order.totalAmount.toLocaleString('en-IN')}`,
      bytesChange: 0,
      metadata: {
        orderNumber: order.orderNumber,
        planId: subscription.planId,
        expiresAt: subscription.expiresAt,
      },
    });

    const usage = await getUserStorageUsage(studio._id, req.user._id);

    return res.json({
      success: true,
      message: `Congratulations! ${subscription.planName} is now active on your account.`,
      subscription,
      usage,
      order: {
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        totalAmount: order.totalAmount,
        paidAt: order.paidAt,
      },
    });
  } catch (err: any) {
    console.error('[verifyStoragePayment Error]:', err);
    return res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

/**
 * GET /api/storage/admin/overview
 * Super Admin: Total allocated vs total used storage across all studios & user list
 */
export const getAdminStorageOverview = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access forbidden: Super Admin required' });
    }

    // 1. Total Media stored across platform
    const mediaAgg = await Media.aggregate([
      {
        $group: {
          _id: null,
          totalBytesUsed: { $sum: '$size' },
          totalPhotos: { $sum: { $cond: [{ $eq: ['$type', 'PHOTO'] }, 1, 0] } },
          totalVideos: { $sum: { $cond: [{ $eq: ['$type', 'VIDEO'] }, 1, 0] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const platformBytesUsed = mediaAgg[0]?.totalBytesUsed || 0;
    const platformPhotos = mediaAgg[0]?.totalPhotos || 0;
    const platformVideos = mediaAgg[0]?.totalVideos || 0;

    // 2. Total active subscriptions & allocated bytes
    const activeSubs = await StorageSubscription.find({
      status: 'ACTIVE',
      paymentStatus: 'paid',
      expiresAt: { $gt: new Date() },
    }).lean();

    const totalAllocatedBytes = activeSubs.reduce((acc, sub) => acc + (sub.storageLimitBytes || 0), 0);

    // 3. User & Studio Breakdown
    const studios = await Studio.find()
      .populate('ownerId', 'name email phone role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const usersData = await Promise.all(
      studios.map(async (studio) => {
        const owner: any = studio.ownerId;
        if (!owner) return null;

        const usage = await getUserStorageUsage(studio._id, owner._id, owner.role === 'SUPER_ADMIN');
        return {
          studioId: studio._id,
          studioName: studio.name,
          userId: owner._id,
          userName: owner.name,
          email: owner.email,
          phone: owner.phone,
          role: owner.role,
          activePlan: usage.activePlan,
          totalStorageGb: usage.totalStorageGb,
          usedStorageGb: usage.usedStorageGb,
          availableStorageGb: usage.availableStorageGb,
          usagePercentage: usage.usagePercentage,
          warningState: usage.warningState,
          totalPhotos: usage.totalPhotos,
          totalVideos: usage.totalVideos,
        };
      })
    );

    const validUsers = usersData.filter(Boolean);

    // 4. Recent Storage Transactions
    const recentOrders = await Order.find({
      'orderItems.planKey': { $regex: /monthly|sixmonth|yearly|storage/i },
      paymentStatus: 'paid',
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      stats: {
        platformBytesUsed,
        platformStorageGb: Number((platformBytesUsed / ONE_GB_BYTES).toFixed(2)),
        totalAllocatedBytes,
        totalAllocatedGb: Number((totalAllocatedBytes / ONE_GB_BYTES).toFixed(2)),
        platformPhotos,
        platformVideos,
        activeSubscriptionsCount: activeSubs.length,
        totalStudiosCount: studios.length,
      },
      users: validUsers,
      recentTransactions: recentOrders,
    });
  } catch (err: any) {
    console.error('[getAdminStorageOverview Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/storage/admin/adjust-limit
 * Super Admin: Manually adjust user's storage limit
 */
export const adminAdjustUserStorageLimit = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access forbidden: Super Admin required' });
    }

    const { studioId, newLimitGb, reason } = req.body;
    if (!studioId || !newLimitGb || newLimitGb <= 0) {
      return res.status(400).json({ error: 'studioId and valid newLimitGb (>0) required' });
    }

    const studio = await Studio.findById(studioId);
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const newLimitBytes = Math.round(Number(newLimitGb) * ONE_GB_BYTES);

    // Upsert or update active subscription
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const subscription = await StorageSubscription.findOneAndUpdate(
      { studioId: studio._id, status: 'ACTIVE' },
      {
        $set: {
          planId: `custom-admin-${newLimitGb}gb`,
          planName: `Custom Admin Tier (${newLimitGb} GB)`,
          storageLimitBytes: newLimitBytes,
          storageLimitGb: Number(newLimitGb),
          notes: `Adjusted manually by Admin (${req.user?.email || 'admin'}): ${reason || 'Manual quota adjustment'}`,
          expiresAt: oneYearLater,
          paymentStatus: 'paid',
          status: 'ACTIVE',
        },
      },
      { upsert: true, new: true }
    );

    await recordStorageActivity({
      userId: studio.ownerId,
      studioId: studio._id,
      activityType: 'CAPACITY_CHANGED',
      title: 'Storage Limit Adjusted by Admin',
      description: `Storage capacity manually adjusted to ${newLimitGb} GB (${reason || 'Admin modification'})`,
      bytesChange: newLimitBytes,
      metadata: { adjustedBy: req.user?.email || 'admin', newLimitGb },
    });

    return res.json({
      success: true,
      message: `Storage limit updated to ${newLimitGb} GB successfully`,
      subscription,
    });
  } catch (err: any) {
    console.error('[adminAdjustUserStorageLimit Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/storage/admin/extend-subscription
 * Super Admin: Extend a user's subscription duration by days/months
 */
export const adminExtendSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access forbidden: Super Admin required' });
    }

    const { studioId, extendMonths = 1, reason } = req.body;
    if (!studioId) return res.status(400).json({ error: 'studioId is required' });

    const sub = await StorageSubscription.findOne({ studioId, status: 'ACTIVE' });
    if (!sub) return res.status(404).json({ error: 'No active storage subscription found for this studio' });

    const currentExpiry = new Date(sub.expiresAt > new Date() ? sub.expiresAt : new Date());
    currentExpiry.setMonth(currentExpiry.getMonth() + Number(extendMonths));
    sub.expiresAt = currentExpiry;
    sub.notes = `${sub.notes || ''} | Extended ${extendMonths} month(s) by Admin (${reason || ''})`;
    await sub.save();

    await recordStorageActivity({
      userId: sub.userId,
      studioId: sub.studioId,
      activityType: 'SUBSCRIPTION_RENEWED',
      title: 'Subscription Extended by Admin',
      description: `Subscription extended by ${extendMonths} month(s) until ${currentExpiry.toLocaleDateString('en-IN')}`,
      metadata: { extendedBy: req.user?.email || 'admin', newExpiry: currentExpiry },
    });

    return res.json({
      success: true,
      message: `Subscription extended until ${currentExpiry.toLocaleDateString('en-IN')}`,
      subscription: sub,
    });
  } catch (err: any) {
    console.error('[adminExtendSubscription Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/storage/admin/cancel-subscription
 * Super Admin: Cancel subscription without deleting files
 */
export const adminCancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Access forbidden: Super Admin required' });
    }

    const { studioId, reason } = req.body;
    if (!studioId) return res.status(400).json({ error: 'studioId is required' });

    const sub = await StorageSubscription.findOne({ studioId, status: 'ACTIVE' });
    if (!sub) return res.status(404).json({ error: 'No active storage subscription found' });

    sub.status = 'CANCELLED';
    sub.cancelledAt = new Date();
    sub.notes = `${sub.notes || ''} | Cancelled by Admin: ${reason || 'Administrative cancellation'}`;
    await sub.save();

    await recordStorageActivity({
      userId: sub.userId,
      studioId: sub.studioId,
      activityType: 'CAPACITY_CHANGED',
      title: 'Subscription Cancelled',
      description: `Subscription was cancelled by admin (${reason || 'No reason provided'}). Existing files preserved.`,
      metadata: { cancelledBy: req.user?.email || 'admin' },
    });

    return res.json({
      success: true,
      message: 'Subscription cancelled. All user photos remain safe and accessible.',
      subscription: sub,
    });
  } catch (err: any) {
    console.error('[adminCancelSubscription Error]:', err);
    return res.status(500).json({ error: err.message });
  }
};

