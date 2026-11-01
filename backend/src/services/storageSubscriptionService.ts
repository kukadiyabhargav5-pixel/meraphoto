import mongoose from 'mongoose';
import {
  StoragePlan,
  CANONICAL_STORAGE_PLANS,
  ONE_GB_BYTES,
  IStoragePlan,
} from '../models/StoragePlan';
import {
  StorageSubscription,
  IStorageSubscription,
  StorageSubscriptionStatus,
} from '../models/StorageSubscription';
import { StorageActivity, StorageActivityType } from '../models/StorageActivity';
import { Media } from '../models/Media';
import { Studio } from '../models/Studio';
import { Event } from '../models/Event';

export const DEFAULT_STARTER_STORAGE_BYTES = 2 * ONE_GB_BYTES; // 2 GB Free Starter

export interface StorageUsageResult {
  hasActivePlan: boolean;
  totalStorageBytes: number;
  usedStorageBytes: number;
  availableStorageBytes: number;
  totalStorageGb: number;
  usedStorageGb: number;
  availableStorageGb: number;
  formattedUsedStorage: string;
  formattedTotalStorage: string;
  formattedAvailableStorage: string;
  usagePercentage: number;
  warningState: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'FULL';
  activePlan: {
    planId: string;
    name: string;
    storageGb: number;
    billingCategory?: string;
    durationMonths?: number;
    durationText?: string;
    status: 'ACTIVE' | 'EXPIRED' | 'FREE' | 'CANCELLED' | 'NONE';
    startDate?: Date | null;
    expiresAt?: Date | null;
    daysLeft?: number;
    isLifetime?: boolean;
    amountInr?: number;
  };
  totalPhotos: number;
  totalVideos: number;
  totalFiles: number;
}

export const formatStorageBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 MB';
  const gb = bytes / ONE_GB_BYTES;
  if (gb >= 1) {
    return `${gb >= 10 ? Math.round(gb) : gb.toFixed(2)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) {
    return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
};

/**
 * Seed canonical storage plans if they don't exist yet in the database.
 */
export const seedStoragePlans = async (): Promise<void> => {
  try {
    for (const plan of CANONICAL_STORAGE_PLANS) {
      await StoragePlan.findOneAndUpdate(
        { planId: plan.planId },
        { $setOnInsert: plan },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('[StoragePlans] Canonical 7 storage plans verified & synchronized in DB.');
  } catch (err) {
    console.error('[StoragePlans Seed Error]:', err);
  }
};

/**
 * Get authoritative plan by planId
 */
export const getAuthoritativeStoragePlan = async (planId: string): Promise<any | null> => {
  try {
    const dbPlan = await StoragePlan.findOne({ planId, isActive: true }).lean();
    if (dbPlan) return dbPlan;
  } catch (err) {
    console.warn('[Storage] DB lookup for plan failed, fallback to canonical:', err);
  }
  return CANONICAL_STORAGE_PLANS.find((p) => p.planId === planId) || null;
};

/**
 * Calculate live storage usage for a studio from actual stored file sizes in MongoDB.
 */
export const getUserStorageUsage = async (
  studioId: mongoose.Types.ObjectId | string,
  userId?: mongoose.Types.ObjectId | string,
  isSuperAdmin: boolean = false
): Promise<StorageUsageResult> => {
  const sId = new mongoose.Types.ObjectId(studioId.toString());

  // 1. Calculate actual stored bytes from Media collection
  // Query both by studioId and through events belonging to this studio
  const studioEvents = await Event.find({ studioId: sId }).select('_id').lean();
  const eventIds = studioEvents.map((e) => e._id);

  const mediaAgg = await Media.aggregate([
    {
      $match: {
        $or: [
          { studioId: sId },
          { eventId: { $in: eventIds } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalBytes: { $sum: '$size' },
        photosCount: {
          $sum: { $cond: [{ $eq: ['$type', 'PHOTO'] }, 1, 0] },
        },
        videosCount: {
          $sum: { $cond: [{ $eq: ['$type', 'VIDEO'] }, 1, 0] },
        },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const usedBytes = mediaAgg[0]?.totalBytes || 0;
  const photosCount = mediaAgg[0]?.photosCount || 0;
  const videosCount = mediaAgg[0]?.videosCount || 0;
  const totalCount = mediaAgg[0]?.totalCount || 0;

  // 2. VIP Super Admin bypass: 10,000 GB (10 TB)
  if (isSuperAdmin) {
    const adminTotalBytes = 10000 * ONE_GB_BYTES;
    const available = Math.max(0, adminTotalBytes - usedBytes);
    return {
      hasActivePlan: true,
      totalStorageBytes: adminTotalBytes,
      usedStorageBytes: usedBytes,
      availableStorageBytes: available,
      totalStorageGb: 10000,
      usedStorageGb: Number((usedBytes / ONE_GB_BYTES).toFixed(3)),
      availableStorageGb: Number((available / ONE_GB_BYTES).toFixed(2)),
      formattedUsedStorage: formatStorageBytes(usedBytes),
      formattedTotalStorage: '10,000 GB',
      formattedAvailableStorage: formatStorageBytes(available),
      usagePercentage: Number(Math.min(100, (usedBytes / adminTotalBytes) * 100).toFixed(1)),
      warningState: 'NORMAL',
      activePlan: {
        planId: 'super-admin-unlimited',
        name: 'VIP Admin (Unlimited)',
        storageGb: 10000,
        billingCategory: 'YEARLY',
        durationMonths: 12,
        durationText: 'Lifetime Unlimited',
        status: 'ACTIVE',
        isLifetime: true,
        startDate: new Date('2026-01-01'),
        expiresAt: new Date('2099-12-31'),
        daysLeft: 9999,
      },
      totalPhotos: photosCount,
      totalVideos: videosCount,
      totalFiles: totalCount,
    };
  }

  // 3. Find active storage subscription
  const now = new Date();
  let activeSub = await StorageSubscription.findOne({
    studioId: sId,
    status: 'ACTIVE',
    paymentStatus: 'paid',
    expiresAt: { $gt: now },
  })
    .sort({ storageLimitBytes: -1, createdAt: -1 })
    .lean();

  let totalLimitBytes = 0;
  let activePlanInfo: StorageUsageResult['activePlan'] = {
    planId: '',
    name: 'No Active Plan',
    storageGb: 0,
    status: 'NONE',
    isLifetime: false,
    expiresAt: null,
  };
  let hasActivePlan = false;

  if (activeSub) {
    hasActivePlan = true;
    totalLimitBytes = activeSub.storageLimitBytes;
    const durationM = activeSub.durationMonths || (activeSub.billingCategory === 'YEARLY' ? 12 : activeSub.billingCategory === '6_MONTHS' ? 6 : 1);
    const diffMs = new Date(activeSub.expiresAt).getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    activePlanInfo = {
      planId: activeSub.planId,
      name: activeSub.planName,
      storageGb: activeSub.storageLimitGb,
      billingCategory: activeSub.billingCategory,
      durationMonths: durationM,
      durationText: durationM === 12 ? '1 Year (12 Months)' : durationM === 6 ? '6 Months' : 'Monthly (1 Month)',
      status: 'ACTIVE',
      startDate: activeSub.startDate,
      expiresAt: activeSub.expiresAt,
      daysLeft,
      isLifetime: false,
      amountInr: activeSub.amountInr,
    };
  } else {
    // Check if Studio document has a subscriptionPlan!
    const studioDoc = await Studio.findById(sId).lean();
    if (studioDoc && studioDoc.subscriptionPlan && studioDoc.subscriptionPlan !== 'BASIC') {
      const tier = studioDoc.subscriptionPlan.toUpperCase();
      let planGb = 75;
      let planName = '75 GB Storage';
      let durationMonths = 6;
      let billingCategory = '6_MONTHS';

      if (tier === 'PREMIUM' || tier === 'ENTERPRISE' || tier === 'BUSINESS') {
        planGb = 100;
        planName = '100 GB Storage';
        durationMonths = 12;
        billingCategory = 'YEARLY';
      } else if (tier === 'STANDARD' || tier === 'ESSENTIAL' || tier === 'PROFESSIONAL') {
        planGb = 75;
        planName = '75 GB Storage';
        durationMonths = 6;
        billingCategory = '6_MONTHS';
      } else if (tier === 'STARTUP' || tier === 'STARTER') {
        planGb = 25;
        planName = '25 GB Storage';
        durationMonths = 1;
        billingCategory = 'MONTHLY';
      }

      const startDate = studioDoc.subscriptionStartDate || new Date();
      const calculatedExpiry = studioDoc.subscriptionExpiresAt || new Date(new Date(startDate).getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
      
      if (new Date(calculatedExpiry) > now) {
        hasActivePlan = true;
        totalLimitBytes = planGb * ONE_GB_BYTES;
        const diffMs = new Date(calculatedExpiry).getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        activePlanInfo = {
          planId: `studio-${tier.toLowerCase()}`,
          name: planName,
          storageGb: planGb,
          billingCategory,
          durationMonths,
          durationText: durationMonths === 12 ? '1 Year (12 Months)' : durationMonths === 6 ? '6 Months' : 'Monthly (1 Month)',
          status: 'ACTIVE',
          startDate,
          expiresAt: calculatedExpiry,
          daysLeft,
          isLifetime: false,
          amountInr: planGb === 100 ? 5999 : planGb === 75 ? 6999 : 299,
        };
      }
    }

    if (!hasActivePlan) {
      // Check if Studio has an expired subscription
      const expiredSub = await StorageSubscription.findOne({
        studioId: sId,
        paymentStatus: 'paid',
        expiresAt: { $lte: now },
      })
        .sort({ expiresAt: -1 })
        .lean();

      if (expiredSub) {
        activePlanInfo = {
          planId: expiredSub.planId,
          name: `${expiredSub.planName} (Expired)`,
          storageGb: expiredSub.storageLimitGb,
          billingCategory: expiredSub.billingCategory,
          durationMonths: expiredSub.durationMonths || 1,
          durationText: expiredSub.durationMonths === 12 ? '1 Year' : expiredSub.durationMonths === 6 ? '6 Months' : 'Monthly',
          status: 'EXPIRED',
          startDate: expiredSub.startDate,
          expiresAt: expiredSub.expiresAt,
          daysLeft: 0,
          isLifetime: false,
          amountInr: expiredSub.amountInr,
        };
        totalLimitBytes = 0;
      } else {
        // No free storage for new/unpaid users: 0 GB! All buttons disabled until a plan is purchased!
        hasActivePlan = false;
        totalLimitBytes = 0;
        activePlanInfo = {
          planId: '',
          name: 'No Active Plan (0 GB)',
          storageGb: 0,
          billingCategory: 'NONE',
          durationMonths: 0,
          durationText: 'No Active Plan',
          status: 'NONE',
          startDate: null,
          expiresAt: null,
          daysLeft: 0,
          isLifetime: false,
        };
      }
    }
  }

  const availableBytes = Math.max(0, totalLimitBytes - usedBytes);
  const totalGb = Number((totalLimitBytes / ONE_GB_BYTES).toFixed(2));
  const usedGb = Number((usedBytes / ONE_GB_BYTES).toFixed(3));
  const availableGb = Number((availableBytes / ONE_GB_BYTES).toFixed(2));
  
  const rawPct = totalLimitBytes > 0 ? (usedBytes / totalLimitBytes) * 100 : (usedBytes > 0 ? 100 : 0);
  const usagePct = rawPct > 0 && rawPct < 0.1 
    ? Math.max(0.01, Number(rawPct.toFixed(2))) 
    : Number(rawPct.toFixed(1));

  let warningState: StorageUsageResult['warningState'] = 'NORMAL';
  if (!hasActivePlan) {
    warningState = 'FULL';
  } else if (usagePct >= 100) {
    warningState = 'FULL';
  } else if (usagePct >= 95) {
    warningState = 'CRITICAL';
  } else if (usagePct >= 80) {
    warningState = 'WARNING';
  }

  return {
    hasActivePlan,
    totalStorageBytes: totalLimitBytes,
    usedStorageBytes: usedBytes,
    availableStorageBytes: availableBytes,
    totalStorageGb: totalGb,
    usedStorageGb: usedGb,
    availableStorageGb: availableGb,
    formattedUsedStorage: formatStorageBytes(usedBytes),
    formattedTotalStorage: hasActivePlan ? formatStorageBytes(totalLimitBytes) : '0 GB',
    formattedAvailableStorage: hasActivePlan ? formatStorageBytes(availableBytes) : '0 GB',
    usagePercentage: usagePct,
    warningState,
    activePlan: activePlanInfo,
    totalPhotos: photosCount,
    totalVideos: videosCount,
    totalFiles: totalCount,
  };
};

/**
 * Strict server-side storage check before upload.
 */
export const canUserUpload = async (
  studioId: mongoose.Types.ObjectId | string,
  newBytes: number,
  isSuperAdmin: boolean = false
): Promise<{
  allowed: boolean;
  reason?: string;
  remainingBytes: number;
  totalBytes: number;
  usedBytes: number;
  newBytes: number;
  remainingGb: number;
  requiredGb: number;
}> => {
  if (isSuperAdmin) {
    return {
      allowed: true,
      remainingBytes: 999999999999,
      totalBytes: 999999999999,
      usedBytes: 0,
      newBytes,
      remainingGb: 10000,
      requiredGb: Number((newBytes / ONE_GB_BYTES).toFixed(3)),
    };
  }

  const usage = await getUserStorageUsage(studioId, undefined, false);

  if (!usage.hasActivePlan) {
    return {
      allowed: false,
      reason: 'No active storage plan found. Please purchase a monthly, 6-month, or yearly storage plan to upload media.',
      remainingBytes: 0,
      totalBytes: 0,
      usedBytes: usage.usedStorageBytes,
      newBytes,
      remainingGb: 0,
      requiredGb: Number((newBytes / ONE_GB_BYTES).toFixed(3)),
    };
  }

  if (usage.availableStorageBytes < newBytes) {
    return {
      allowed: false,
      reason: `Storage capacity exceeded! You have ${formatStorageBytes(usage.availableStorageBytes)} remaining, but this upload requires ${formatStorageBytes(newBytes)}.`,
      remainingBytes: usage.availableStorageBytes,
      totalBytes: usage.totalStorageBytes,
      usedBytes: usage.usedStorageBytes,
      newBytes,
      remainingGb: usage.availableStorageGb,
      requiredGb: Number((newBytes / ONE_GB_BYTES).toFixed(3)),
    };
  }

  return {
    allowed: true,
    remainingBytes: usage.availableStorageBytes,
    totalBytes: usage.totalStorageBytes,
    usedBytes: usage.usedStorageBytes,
    newBytes,
    remainingGb: usage.availableStorageGb,
    requiredGb: Number((newBytes / ONE_GB_BYTES).toFixed(3)),
  };
};

/**
 * Log a storage activity event for auditing & notifications
 */
export const recordStorageActivity = async (
  studioIdOrOptions: any,
  activityType?: StorageActivityType,
  title?: string,
  description?: string,
  bytesChange?: number,
  currentTotalBytes?: number,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    if (typeof studioIdOrOptions === 'object' && studioIdOrOptions && studioIdOrOptions.studioId) {
      const opts = studioIdOrOptions;
      await StorageActivity.create({
        studioId: new mongoose.Types.ObjectId(opts.studioId.toString()),
        activityType: opts.activityType,
        title: opts.title,
        description: opts.description,
        bytesChange: opts.bytesChange || 0,
        currentTotalBytes: opts.currentTotalBytes || 0,
        metadata: opts.metadata,
      });
      return;
    }

    await StorageActivity.create({
      studioId: new mongoose.Types.ObjectId(studioIdOrOptions.toString()),
      activityType,
      title,
      description,
      bytesChange: bytesChange || 0,
      currentTotalBytes: currentTotalBytes || 0,
      metadata,
    });
  } catch (err) {
    console.error('[recordStorageActivity Error]:', err);
  }
};
