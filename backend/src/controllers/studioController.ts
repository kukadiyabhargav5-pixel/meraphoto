import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Studio, User, Media } from '../models';

export const PLAN_STORAGE_LIMITS: Record<string, { photos: number; videos: number; name: string }> = {
  BASIC: { photos: 50000, videos: 10, name: 'Basic' },
  STANDARD: { photos: 150000, videos: 100, name: 'Standard' },
  ESSENTIAL: { photos: 300000, videos: 200, name: 'Essential' },
  PREMIUM: { photos: 750000, videos: 500, name: 'Premium' },
  STARTER: { photos: 50000, videos: 10, name: 'Basic' },
  PROFESSIONAL: { photos: 150000, videos: 100, name: 'Standard' },
  BUSINESS: { photos: 300000, videos: 200, name: 'Essential' },
  ENTERPRISE: { photos: 750000, videos: 500, name: 'Premium' },
};

export const calculateStudioCredits = async (studioId: any, plan: string, cachedStudio?: any) => {
  const planKey = (plan || 'BASIC').toUpperCase();
  const limits = PLAN_STORAGE_LIMITS[planKey] || PLAN_STORAGE_LIMITS.BASIC;

  const [studio, [creditedPhotos, creditedVideos, pendingPhotos, pendingVideos]] = await Promise.all([
    cachedStudio ? Promise.resolve(cachedStudio) : Studio.findById(studioId).select('usage').lean(),
    Promise.all([
      Media.countDocuments({ studioId, type: 'PHOTO', creditDeducted: true }),
      Media.countDocuments({ studioId, type: 'VIDEO', creditDeducted: true }),
      Media.countDocuments({ studioId, type: 'PHOTO', creditDeducted: false }),
      Media.countDocuments({ studioId, type: 'VIDEO', creditDeducted: false })
    ])
  ]);

  // Consumed quota:
  // Uploads deduct quota permanently once event is saved.
  let consumedPhotos = studio?.usage?.photosUploaded ?? 0;
  let consumedVideos = studio?.usage?.videosUploaded ?? 0;

  // Initialize if never tracked or if behind credited media count
  if (consumedPhotos < creditedPhotos) {
    consumedPhotos = creditedPhotos;
    await Studio.findByIdAndUpdate(studioId, { $set: { 'usage.photosUploaded': creditedPhotos } });
  }
  if (consumedVideos < creditedVideos) {
    consumedVideos = creditedVideos;
    await Studio.findByIdAndUpdate(studioId, { $set: { 'usage.videosUploaded': creditedVideos } });
  }

  const totalPhotosUsed = consumedPhotos;
  const totalVideosUsed = consumedVideos;

  const photoPercent = limits.photos > 0 ? (totalPhotosUsed / limits.photos) * 100 : 0;
  const videoPercent = limits.videos > 0 ? (totalVideosUsed / limits.videos) * 100 : 0;

  return {
    plan: planKey,
    planName: limits.name,
    photos: {
      totalLimit: limits.photos,
      used: totalPhotosUsed,
      remaining: Math.max(0, limits.photos - totalPhotosUsed),
      pendingSave: pendingPhotos,
      projectedRemaining: Math.max(0, limits.photos - totalPhotosUsed - pendingPhotos),
      percentUsed: Number(photoPercent.toFixed(2)),
      rawPercent: photoPercent
    },
    videos: {
      totalLimit: limits.videos,
      used: totalVideosUsed,
      remaining: Math.max(0, limits.videos - totalVideosUsed),
      pendingSave: pendingVideos,
      projectedRemaining: Math.max(0, limits.videos - totalVideosUsed - pendingVideos),
      percentUsed: Number(videoPercent.toFixed(2)),
      rawPercent: videoPercent
    }
  };
};

/**
 * Get profile of current authenticated studio owner
 */
export const getMyStudio = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      // Auto-upgrade user's role to STUDIO_OWNER if they are a CLIENT
      const user = await User.findById(req.user._id);
      if (user) {
        if (user.role === 'CLIENT') {
          user.role = 'STUDIO_OWNER';
          await user.save();
          req.user.role = 'STUDIO_OWNER';
        }
      }

      // Auto-create a default Studio profile
      const cleanName = (user ? user.name : 'Mara') + ' Studio';
      
      studio = await Studio.create({
        name: cleanName,
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
      });
    } else {
      // Check if user is STUDIO_OWNER in DB
      const user = await User.findById(req.user._id);
      if (user && user.role === 'CLIENT') {
        user.role = 'STUDIO_OWNER';
        await user.save();
        req.user.role = 'STUDIO_OWNER';
      }
    }

    const credits = await calculateStudioCredits(studio._id, studio.subscriptionPlan, studio);

    return res.json({ studio, credits });
  } catch (err: any) {
    console.error('getMyStudio error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get real-time storage credits for current studio
 */
export const getStudioCredits = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id }).select('name subscriptionPlan usage').lean();
    if (!studio) return res.status(404).json({ error: 'Studio profile not found' });

    const credits = await calculateStudioCredits(studio._id, studio.subscriptionPlan, studio);
    return res.json({ credits, studio: { name: studio.name, subscriptionPlan: studio.subscriptionPlan } });
  } catch (err: any) {
    console.error('getStudioCredits error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update studio configuration details (Branding, Watermark, Domain)
 */
export const updateMyStudio = async (req: AuthRequest, res: Response) => {
  const { name, logoUrl, customDomain, watermark, paymentDetails, instagramUrl, facebookUrl } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Update user profile if provided
    const { userName, userPhone } = req.body;
    if (userName !== undefined || userPhone !== undefined) {
      const user = await User.findById(req.user._id);
      if (user) {
        if (userName !== undefined) user.name = userName;
        if (userPhone !== undefined) user.phone = userPhone;
        await user.save();
      }
    }

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      return res.status(404).json({ error: 'Studio profile not found' });
    }

    if (name) studio.name = name;
    if (logoUrl !== undefined) studio.logoUrl = logoUrl;
    if (instagramUrl !== undefined) studio.instagramUrl = instagramUrl;
    if (facebookUrl !== undefined) studio.facebookUrl = facebookUrl;

    if (customDomain !== undefined) {
      if (customDomain) {
        const cleanDom = customDomain.toLowerCase().trim();
        const existing = await Studio.findOne({ customDomain: cleanDom, _id: { $ne: studio._id } });
        if (existing) {
          return res.status(400).json({ error: 'Custom domain is already registered by another studio' });
        }
        studio.customDomain = cleanDom;
      } else {
        studio.customDomain = undefined; // Delete custom domain
      }
    }

    if (watermark) {
      studio.watermark = {
        type: watermark.type || studio.watermark.type,
        text: watermark.text !== undefined ? watermark.text : studio.watermark.text,
        logoUrl: watermark.logoUrl !== undefined ? watermark.logoUrl : studio.watermark.logoUrl,
        position: watermark.position || studio.watermark.position,
        opacity: watermark.opacity !== undefined ? watermark.opacity : studio.watermark.opacity,
        size: watermark.size !== undefined ? watermark.size : studio.watermark.size,
      };
    }

    if (paymentDetails) {
      if (!studio.paymentDetails) {
        studio.paymentDetails = { upiId: '', merchantName: '', uploadedQrUrl: '' };
      }
      if (paymentDetails.upiId !== undefined) studio.paymentDetails.upiId = paymentDetails.upiId;
      if (paymentDetails.merchantName !== undefined) studio.paymentDetails.merchantName = paymentDetails.merchantName;
      if (paymentDetails.uploadedQrUrl !== undefined) studio.paymentDetails.uploadedQrUrl = paymentDetails.uploadedQrUrl;
    }

    await studio.save();
    return res.json({ message: 'Studio updated successfully', studio });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update / Upgrade studio subscription plan (1 year duration)
 */
export const updateStudioPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { plan, durationDays = 365 } = req.body;
    const planKey = (plan || '').toUpperCase();
    if (!planKey || !PLAN_STORAGE_LIMITS[planKey]) {
      return res.status(400).json({ error: 'Invalid plan selected. Choose from: BASIC, STANDARD, ESSENTIAL, PREMIUM' });
    }

    const startDate = new Date();
    const expiresAt = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const studio = await Studio.findOneAndUpdate(
      { ownerId: req.user._id },
      {
        subscriptionPlan: planKey,
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: startDate,
        subscriptionExpiresAt: expiresAt,
      },
      { new: true, upsert: true }
    );

    const credits = await calculateStudioCredits(studio._id, studio.subscriptionPlan);

    return res.json({
      success: true,
      message: `Successfully activated ${credits.planName} plan for 1 year`,
      studio,
      credits,
    });
  } catch (err: any) {
    console.error('updateStudioPlan error:', err);
    return res.status(500).json({ error: err.message });
  }
};
