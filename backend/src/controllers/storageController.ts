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
    const topUpPlans = plans.filter((p) => p.billingCategory === 'TOPUP');

    return res.json({
      success: true,
      plans,
      categories: {
        MONTHLY: monthlyPlans,
        '6_MONTHS': sixMonthPlans,
        YEARLY: yearlyPlans,
        TOPUP: topUpPlans,
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
      $or: [
        { studioId: studio._id },
        { studioId: studio._id.toString() },
        { userId: req.user._id },
        { userId: req.user._id.toString() },
      ],
      status: 'ACTIVE',
      paymentStatus: { $in: ['paid', 'PAID', 'captured', 'COMPLETED', 'active', 'ACTIVE'] },
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

    // If user clicked or submitted 30-day Free Trial, route to claimFreeTrial directly
    if (plan.planId === 'trial-5gb' || plan.priceInr === 0) {
      return claimFreeTrial(req, res);
    }

    const isTopUp = Boolean(plan.isTopUp || plan.billingCategory === 'TOPUP');
    let priceInr = plan.priceInr;
    let durationMonths = plan.durationMonths;
    const startDate = new Date();
    let expiresAt: Date;

    if (isTopUp) {
      // Find active base plan for this studio
      const activeBaseSub = await StorageSubscription.findOne({
        studioId: studio._id,
        status: 'ACTIVE',
        paymentStatus: 'paid',
        isTopUp: { $ne: true },
        expiresAt: { $gt: startDate },
      }).sort({ expiresAt: -1 });

      if (!activeBaseSub) {
        return res.status(400).json({
          error: 'You must have an active base storage plan before purchasing an extra storage booster.',
        });
      }

      // Calculate accurate calendar remaining months until active base plan expiry
      const expDate = new Date(activeBaseSub.expiresAt);
      let months = (expDate.getFullYear() - startDate.getFullYear()) * 12 + (expDate.getMonth() - startDate.getMonth());
      if (expDate.getDate() > startDate.getDate()) {
        months += 1;
      }
      const remainingMonths = Math.max(1, months);

      durationMonths = remainingMonths;
      const rate = plan.monthlyRate || plan.priceInr;
      priceInr = rate * remainingMonths;
      expiresAt = expDate;
    } else {
      expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);
    }

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
          description: isTopUp
            ? `${plan.storageGb} GB booster for remaining ${durationMonths} month(s) (matches base plan expiry)`
            : `${plan.storageGb} GB cloud storage ${plan.billingPeriodText}`,
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
      notes: isTopUp
        ? `Storage booster checkout: ${plan.name} (${durationMonths} mos)`
        : `Storage plan checkout: ${plan.name}`,
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

    // 7. Create pending subscription record with calculated duration & expiry
    await StorageSubscription.create({
      userId: req.user._id,
      studioId: studio._id,
      planId: plan.planId,
      planName: plan.name,
      storageLimitBytes: plan.storageBytes,
      storageLimitGb: plan.storageGb,
      billingCategory: plan.billingCategory,
      durationMonths,
      amountInr: totalAmount,
      isTopUp,
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
        displayPrice: isTopUp ? `₹${priceInr}` : plan.displayPrice,
        billingPeriodText: isTopUp ? `for ${durationMonths} month(s)` : plan.billingPeriodText,
        totalAmount,
        isTopUp,
        durationMonths,
        expiresAt,
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
    const isTopUp = Boolean(plan?.isTopUp || plan?.billingCategory === 'TOPUP');

    let expiresAt: Date;
    let durationMonths = plan?.durationMonths || 1;

    if (isTopUp) {
      // Find active base plan to match its expiry exactly
      const activeBaseSub = await StorageSubscription.findOne({
        studioId: studio._id,
        status: 'ACTIVE',
        paymentStatus: 'paid',
        isTopUp: { $ne: true },
        expiresAt: { $gt: now },
      }).sort({ expiresAt: -1 });

      if (activeBaseSub) {
        expiresAt = new Date(activeBaseSub.expiresAt);
        let months = (expiresAt.getFullYear() - now.getFullYear()) * 12 + (expiresAt.getMonth() - now.getMonth());
        if (expiresAt.getDate() > now.getDate()) months += 1;
        durationMonths = Math.max(1, months);
      } else if (subscription?.expiresAt && new Date(subscription.expiresAt) > now) {
        expiresAt = new Date(subscription.expiresAt);
      } else {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    }

    if (subscription) {
      subscription.paymentStatus = 'paid';
      subscription.status = 'ACTIVE';
      subscription.isTopUp = isTopUp;
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
        billingCategory: plan?.billingCategory || (isTopUp ? 'TOPUP' : 'MONTHLY'),
        durationMonths,
        amountInr: order.totalAmount,
        paymentStatus: 'paid',
        status: 'ACTIVE',
        isTopUp,
        startDate: now,
        expiresAt,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        autoRenew: false,
      });
    }

    // CRITICAL:
    // If it's a top-up booster, DO NOT cancel older subscriptions!
    // If it's a new base plan, cancel only older BASE subscriptions so active top-ups continue.
    if (!isTopUp) {
      await StorageSubscription.updateMany(
        {
          studioId: studio._id,
          _id: { $ne: subscription._id },
          isTopUp: { $ne: true },
          status: 'ACTIVE',
        },
        { $set: { status: 'CANCELLED' } }
      );

      // 4b. Synchronize Studio subscription tier so all dashboard features unlock immediately!
      const purchasedTier = subscription.storageLimitGb >= 100 ? 'PREMIUM' : subscription.storageLimitGb >= 50 ? 'STANDARD' : 'STARTUP';
      studio.subscriptionPlan = purchasedTier;
      studio.subscriptionStatus = 'ACTIVE';
      studio.subscriptionStartDate = now;
      studio.subscriptionExpiresAt = expiresAt;
      await studio.save();
    }

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

/**
 * GET /api/storage/admin/plans OR /api/admin/storage-plans
 * Superadmin endpoint to fetch all storage plans
 */
export const adminGetStoragePlans = async (req: AuthRequest, res: Response) => {
  try {
    let plans = await StoragePlan.find().sort({ sortOrder: 1 }).lean();
    if (!plans || plans.length === 0) {
      await seedStoragePlans();
      plans = await StoragePlan.find().sort({ sortOrder: 1 }).lean();
    }
    return res.json({ success: true, plans });
  } catch (err: any) {
    console.error('[adminGetStoragePlans Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch storage plans' });
  }
};

/**
 * PUT /api/storage/admin/plans/:planId OR /api/admin/storage-plans/:planId
 * Superadmin endpoint to update any storage plan (pricing, storage GB, features list, name, etc.)
 */
export const adminUpdateStoragePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.params;
    const {
      name,
      priceInr,
      displayPrice,
      storageGb,
      billingPeriodText,
      durationMonths,
      desc,
      badge,
      features,
      isRecommended,
      isActive,
      sortOrder,
    } = req.body;

    const plan = await StoragePlan.findOne({
      $or: [
        { planId: planId },
        { _id: mongoose.isValidObjectId(planId) ? planId : undefined },
      ],
    });

    if (!plan) {
      return res.status(404).json({ error: 'Storage plan not found' });
    }

    if (name !== undefined) plan.name = String(name).trim();
    if (priceInr !== undefined) {
      plan.priceInr = Number(priceInr);
      plan.displayPrice = displayPrice ? String(displayPrice).trim() : `₹${Number(priceInr).toLocaleString('en-IN')}`;
    } else if (displayPrice !== undefined) {
      plan.displayPrice = String(displayPrice).trim();
    }
    if (storageGb !== undefined) {
      plan.storageGb = Number(storageGb);
      plan.storageBytes = Number(storageGb) * ONE_GB_BYTES;
    }
    if (billingPeriodText !== undefined) plan.billingPeriodText = String(billingPeriodText).trim();
    if (durationMonths !== undefined) plan.durationMonths = Number(durationMonths);
    if (desc !== undefined) plan.desc = String(desc).trim();
    if (badge !== undefined) plan.badge = String(badge).trim();
    if (Array.isArray(features)) {
      plan.features = features
        .map((f: any) => String(f).trim())
        .filter((f: string) => f.length > 0);
    }
    if (isRecommended !== undefined) plan.isRecommended = Boolean(isRecommended);
    if (isActive !== undefined) plan.isActive = Boolean(isActive);
    if (sortOrder !== undefined) plan.sortOrder = Number(sortOrder);

    await plan.save();

    return res.json({
      success: true,
      message: `Plan ${plan.name} updated successfully`,
      plan,
    });
  } catch (err: any) {
    console.error('[adminUpdateStoragePlan Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update storage plan' });
  }
};




/**
 * POST /api/storage/claim-free-trial
 * Activate 30-day Free Starter Trial (5 GB) for newly registered studios.
 * Strictly limited to ONE claim per studio account.
 */
export const claimFreeTrial = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      studio = await Studio.create({
        name: `${req.user.name || 'Mara'} Studio`,
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
      });
    }

    if (studio.freeTrialClaimed) {
      return res.status(400).json({
        error: 'તમે આ સ્ટુડિયો એકાઉન્ટ પર 30-દિવસની ફ્રી ટ્રાયલ પહેલેથી ક્લેમ કરી લીધી છે. (You have already claimed your 30-day free trial on this studio account.)',
      });
    }

    // Check if subscription record already exists
    const existingTrial = await StorageSubscription.findOne({
      studioId: studio._id,
      planId: 'trial-5gb',
    });
    if (existingTrial) {
      studio.freeTrialClaimed = true;
      if (!studio.freeTrialClaimedAt) studio.freeTrialClaimedAt = existingTrial.createdAt;
      await studio.save();
      return res.status(400).json({
        error: 'You have already claimed your 30-day free trial.',
      });
    }

    // Check if user already has an active paid subscription
    const activePaidSub = await StorageSubscription.findOne({
      studioId: studio._id,
      status: 'ACTIVE',
      paymentStatus: 'paid',
      expiresAt: { $gt: new Date() },
      amountInr: { $gt: 0 },
    });
    if (activePaidSub) {
      return res.status(400).json({
        error: 'તમારી પાસે પહેલેથી એક્ટિવ પેઇડ પ્લાન છે! (You already have an active paid subscription!)',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // exactly 30 days

    // Cancel any previous pending or zero-cost starter subscriptions if any
    await StorageSubscription.updateMany(
      { studioId: studio._id, status: 'ACTIVE', amountInr: 0 },
      { $set: { status: 'CANCELLED', cancelledAt: now } }
    );

    const subscription = await StorageSubscription.create({
      userId: req.user._id,
      studioId: studio._id,
      planId: 'trial-5gb',
      planName: '30-Day Free Starter (5 GB)',
      storageLimitBytes: 5 * ONE_GB_BYTES,
      storageLimitGb: 5,
      billingCategory: 'MONTHLY',
      durationMonths: 1,
      amountInr: 0,
      isTopUp: false,
      paymentStatus: 'paid',
      status: 'ACTIVE',
      startDate: now,
      expiresAt,
      autoRenew: false,
      notes: '30-Day Free Starter Trial (5 GB) claimed by user',
    });

    studio.freeTrialClaimed = true;
    studio.freeTrialClaimedAt = now;
    studio.subscriptionPlan = 'STARTER';
    studio.subscriptionStatus = 'ACTIVE';
    studio.subscriptionStartDate = now;
    studio.subscriptionExpiresAt = expiresAt;
    await studio.save();

    await recordStorageActivity({
      studioId: studio._id,
      userId: req.user._id,
      activityType: 'PLAN_PURCHASED',
      title: '30-Day Free Starter Trial Activated (5 GB)',
      description: 'Activated 5 GB cloud storage free for 30 days. Full access unlocked.',
      bytesChange: 5 * ONE_GB_BYTES,
      currentTotalBytes: 5 * ONE_GB_BYTES,
      metadata: { planId: 'trial-5gb', durationDays: 30 },
    });

    return res.json({
      success: true,
      message: 'તમારી 30 દિવસની ફ્રી ટ્રાયલ (5 GB સ્ટોરેજ) સફળતાપૂર્વક શરૂ થઈ ગઈ છે! (Your 30-day free trial has been activated!)',
      subscription,
      studio,
    });
  } catch (err: any) {
    console.error('[claimFreeTrial Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to claim free trial' });
  }
};
