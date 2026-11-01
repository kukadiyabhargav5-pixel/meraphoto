import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { Studio, User, Media, Event, Customer } from '../models';
import { getFileUrl } from '../services/StorageService';

export const PLAN_STORAGE_LIMITS: Record<string, { photos: number; videos: number; name: string }> = {
  BASIC: { photos: 0, videos: 0, name: 'No Active Plan (0 GB)' },
  STARTUP: { photos: 50000, videos: 50, name: 'Startup' },
  STARTER: { photos: 50000, videos: 50, name: 'Startup' },
  STANDARD: { photos: 100000, videos: 100, name: 'Standard' },
  ESSENTIAL: { photos: 150000, videos: 200, name: 'Essential' },
  PREMIUM: { photos: 300000, videos: 500, name: 'Premium' },
  ENTERPRISE: { photos: 300000, videos: 500, name: 'Premium' },
  SUPER_ADMIN: { photos: 999999999, videos: 999999999, name: 'VIP Unlimited Admin (Free)' },
};

export const calculateStudioCredits = async (studioId: any, plan: string, cachedStudio?: any, isSuperAdminUser: boolean = false) => {
  let planKey = (plan || 'BASIC').toUpperCase();

  // Ensure complete studio record with subscriptionStartDate and usage is loaded
  let studio = cachedStudio;
  if (!studio || studio.subscriptionStartDate === undefined || studio.usage === undefined || studio.subscriptionExpiresAt === undefined) {
    studio = await Studio.findById(studioId).select('name usage subscriptionExpiresAt subscriptionStartDate subscriptionPlan').lean();
  }

  if ((!plan || planKey === 'BASIC') && studio?.subscriptionPlan) {
    planKey = studio.subscriptionPlan.toUpperCase();
  }

  // Resolve plan activation date. Any media uploaded before this date belongs to previous plans/events and never consumes current plan quota.
  let planStart: Date;
  if (studio?.subscriptionStartDate) {
    planStart = new Date(studio.subscriptionStartDate);
  } else {
    planStart = new Date();
    await Studio.findByIdAndUpdate(studioId, { $set: { subscriptionStartDate: planStart } });
  }

  const mediaDateFilter: any = { studioId, creditDeducted: true, createdAt: { $gte: planStart } };
  const pendingDateFilter: any = { studioId, creditDeducted: false, createdAt: { $gte: planStart } };

  const [creditedPhotos, creditedVideos, pendingPhotos, pendingVideos] = await Promise.all([
    Media.countDocuments({ ...mediaDateFilter, type: 'PHOTO' }),
    Media.countDocuments({ ...mediaDateFilter, type: 'VIDEO' }),
    Media.countDocuments({ ...pendingDateFilter, type: 'PHOTO' }),
    Media.countDocuments({ ...pendingDateFilter, type: 'VIDEO' })
  ]);

  if (isSuperAdminUser || planKey === 'SUPER_ADMIN') {
    return {
      plan: 'PREMIUM',
      planName: 'VIP Admin (Unlimited Free Access)',
      photos: {
        totalLimit: 999999999,
        used: creditedPhotos,
        remaining: 999999999,
        pendingSave: pendingPhotos,
        projectedRemaining: 999999999,
        percentUsed: 0,
        rawPercent: 0
      },
      videos: {
        totalLimit: 999999999,
        used: creditedVideos,
        remaining: 999999999,
        pendingSave: pendingVideos,
        projectedRemaining: 999999999,
        percentUsed: 0,
        rawPercent: 0
      }
    };
  }

  // Expiration Check Logic - downgrade to BASIC if expired
  if (studio?.subscriptionExpiresAt && new Date(studio.subscriptionExpiresAt) < new Date() && planKey !== 'BASIC') {
    planKey = 'BASIC';
    await Studio.findByIdAndUpdate(studioId, {
      $set: {
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionExpiresAt: null,
        'usage.photosUploaded': 0,
        'usage.videosUploaded': 0
      }
    });
  }

  const limits = PLAN_STORAGE_LIMITS[planKey] || PLAN_STORAGE_LIMITS.BASIC;

  // Consumed quota for the current plan cycle is strictly the media deducted since planStart.
  // Synchronize studio usage counters in DB so they reflect current active plan usage.
  const totalPhotosUsed = creditedPhotos;
  const totalVideosUsed = creditedVideos;

  if ((studio?.usage?.photosUploaded ?? 0) !== creditedPhotos || (studio?.usage?.videosUploaded ?? 0) !== creditedVideos) {
    await Studio.findByIdAndUpdate(studioId, {
      $set: {
        'usage.photosUploaded': creditedPhotos,
        'usage.videosUploaded': creditedVideos
      }
    });
  }

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
        subscriptionStartDate: new Date(),
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

    const adminUser = isSuperAdmin(req.user);
    if (adminUser) {
      if (!studio) {
        studio = await Studio.create({
          name: 'Super Admin Studio',
          ownerId: req.user._id,
          subscriptionPlan: 'PREMIUM',
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: new Date('2099-12-31'),
        });
      } else if (!studio.subscriptionPlan) {
        studio.subscriptionPlan = 'PREMIUM';
        studio.subscriptionStatus = 'ACTIVE';
        studio.subscriptionExpiresAt = new Date('2099-12-31');
        await studio.save();
      }
    }

    const credits = await calculateStudioCredits(studio._id, studio.subscriptionPlan, studio, adminUser);

    const studioObj = studio.toObject ? studio.toObject() : { ...studio };
    if (studioObj.logoUrl) {
      studioObj.logoUrl = getFileUrl(studioObj.logoUrl);
    }
    if (studioObj.watermark && studioObj.watermark.logoUrl) {
      studioObj.watermark.logoUrl = getFileUrl(studioObj.watermark.logoUrl);
    }

    return res.json({ studio: studioObj, credits });
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

    const adminUser = isSuperAdmin(req.user);
    let studio: any = await Studio.findOne({ ownerId: req.user._id }).select('name logoUrl subscriptionPlan usage subscriptionStartDate subscriptionExpiresAt').lean();
    if (!studio && adminUser) {
      const created = await Studio.create({
        name: 'Super Admin Studio',
        ownerId: req.user._id,
        subscriptionPlan: 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date('2099-12-31'),
      });
      studio = created.toObject();
    }
    if (!studio) return res.status(404).json({ error: 'Studio profile not found' });

    const credits = await calculateStudioCredits(studio._id, studio.subscriptionPlan, studio, adminUser);
    const logoUrl = studio.logoUrl ? getFileUrl(studio.logoUrl) : null;
    return res.json({ credits, studio: { name: studio.name, logoUrl, subscriptionPlan: studio.subscriptionPlan || (adminUser ? 'PREMIUM' : 'BASIC') } });
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
    if (logoUrl !== undefined) {
      if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) {
        try {
          const parts = logoUrl.split(',');
          const base64Data = parts[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const { uploadFile } = await import('../services/StorageService');
          const { url } = await uploadFile(buffer, 'studios/logos');
          studio.logoUrl = url;
          if (studio.watermark) studio.watermark.logoUrl = url;
        } catch (uploadErr) {
          console.error('Failed to convert base64 logo to cloud URL, storing directly:', uploadErr);
          studio.logoUrl = logoUrl;
        }
      } else {
        studio.logoUrl = logoUrl;
        if (studio.watermark && logoUrl) studio.watermark.logoUrl = logoUrl;
      }
    }
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
 * Direct file upload for Studio Logo
 */
export const uploadStudioLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);
    if (!file) {
      return res.status(400).json({ error: 'No logo image file uploaded' });
    }

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (file.mimetype && !validMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Please upload JPG, PNG, WEBP, or SVG.' });
    }

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      studio = await Studio.create({
        name: (req.user.name || 'Mara') + ' Studio',
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
      });
    }

    const { uploadFile, deleteFile } = await import('../services/StorageService');

    // Store in structured R2 path: studios/{studioId}/logo/{filename}
    const folder = `studios/${studio._id}/logo`;
    const { url, publicId } = await uploadFile(file.buffer, folder, file.mimetype, file.originalname);

    // If previous logo key exists and is different, cleanup old logo from R2
    if (studio.logoKey && studio.logoKey !== publicId) {
      deleteFile(studio.logoKey).catch((delErr) => console.warn('[Logo] Old logo cleanup notice:', delErr));
    }

    studio.logoUrl = url;
    studio.logoKey = publicId;
    if (!studio.watermark) {
      studio.watermark = { type: 'NONE', opacity: 0.5, size: 50, position: 'BOTTOM_RIGHT' };
    }
    studio.watermark.logoUrl = url;
    await studio.save();

    return res.status(200).json({
      success: true,
      message: 'Studio logo uploaded and saved successfully',
      logoUrl: url,
      logoKey: publicId,
      studio,
    });
  } catch (err: any) {
    console.error('uploadStudioLogo error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload studio logo' });
  }
};

/**
 * Delete studio logo safely from Cloudflare R2 and MongoDB
 */
export const deleteStudioLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    if (studio.logoKey) {
      const { deleteFile } = await import('../services/StorageService');
      await deleteFile(studio.logoKey).catch((e) => console.warn('Could not delete old R2 logo:', e));
    }

    studio.logoUrl = undefined;
    studio.logoKey = undefined;
    if (studio.watermark) {
      studio.watermark.logoUrl = undefined;
    }
    await studio.save();

    return res.status(200).json({
      success: true,
      message: 'Studio logo removed successfully',
      studio,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to remove studio logo' });
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
        $set: {
          subscriptionPlan: planKey,
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: startDate,
          subscriptionExpiresAt: expiresAt,
          'usage.photosUploaded': 0,
          'usage.videosUploaded': 0,
        }
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


/**
 * Public Studio Profile & Branding Lookup (by slug, customDomain, or id)
 * Strictly NO star ratings or rating counts returned.
 */
export const getPublicStudio = async (req: Request, res: Response) => {
  try {
    const rawParam = (req.params.slug || '').trim();
    if (!rawParam) {
      return res.status(400).json({ error: 'Studio slug or domain is required' });
    }

    const cleanSlug = rawParam.toLowerCase();

    // 1. Try matching customDomain
    let studio: any = await Studio.findOne({ customDomain: cleanSlug });

    // 2. If not found and param is a valid ObjectId, try finding by _id
    if (!studio && mongoose.isValidObjectId(rawParam)) {
      studio = await Studio.findById(rawParam);
    }

    // 3. If still not found, try matching name (case-insensitive)
    if (!studio) {
      studio = await Studio.findOne({
        name: { $regex: new RegExp('^' + cleanSlug.replace(/[-_]/g, ' ') + '$', 'i') }
      });
    }

    // 4. If still not found, try regex match on customDomain or name contains
    if (!studio) {
      studio = await Studio.findOne({
        $or: [
          { customDomain: { $regex: new RegExp(cleanSlug, 'i') } },
          { name: { $regex: new RegExp(cleanSlug.replace(/[-_]/g, ' '), 'i') } }
        ]
      });
    }

    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    const owner: any = await User.findById(studio.ownerId).select('name email phone').lean();

    // Real metrics
    const [eventsCount, dbCustomersCount, distinctClientMobiles] = await Promise.all([
      Event.countDocuments({ studioId: studio._id }),
      Customer.countDocuments({ studioId: studio._id }),
      Event.distinct('clientMobile', { studioId: studio._id }),
    ]);

    const happyCustomersCount = Math.max(dbCustomersCount, distinctClientMobiles.length, eventsCount > 0 ? eventsCount : 0);

    // Fetch portfolio events (prefer addToPortfolio: true, fallback to all studio events if none marked)
    let portfolioEventsQuery = await Event.find({ studioId: studio._id, addToPortfolio: true })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    if (!portfolioEventsQuery || portfolioEventsQuery.length === 0) {
      portfolioEventsQuery = await Event.find({ studioId: studio._id, accessType: 'PUBLIC' })
        .sort({ date: -1, createdAt: -1 })
        .limit(12)
        .lean();
    }

    // Enhance each portfolio event with resolved cover URL and exact photo count
    const portfolioEvents = await Promise.all(
      portfolioEventsQuery.map(async (ev: any) => {
        const photosCount = await Media.countDocuments({ eventId: ev._id, type: 'PHOTO' });
        let coverKey = ev.coverImageUrl;
        const firstPhoto: any = await Media.findOne({ eventId: ev._id, type: 'PHOTO' })
          .sort({ order: 1, createdAt: 1 })
          .select('r2Key compressedUrl url')
          .lean();
        const firstPhotoUrl = firstPhoto ? getFileUrl(firstPhoto.compressedUrl || firstPhoto.r2Key || firstPhoto.url) : null;
        if (!coverKey || typeof coverKey !== 'string' || !coverKey.trim()) {
          coverKey = firstPhoto ? (firstPhoto.compressedUrl || firstPhoto.r2Key || firstPhoto.url) : null;
        }
        const resolvedCover = coverKey ? getFileUrl(coverKey) : firstPhotoUrl;
        return {
          id: ev._id,
          name: ev.name,
          code: ev.code,
          type: ev.type,
          date: ev.date,
          location: ev.location,
          clientName: ev.clientName,
          coverImageUrl: resolvedCover,
          firstPhotoUrl,
          photosCount,
        };
      })
    );

    const branding = studio.branding || {};
    const logoUrl = studio.logoUrl ? getFileUrl(studio.logoUrl) : null;
    const rawBanner = (branding.bannerUrl && branding.bannerUrl !== '/wedding.jpg')
      ? branding.bannerUrl
      : (studio.bannerUrl && studio.bannerUrl !== '/wedding.jpg' ? studio.bannerUrl : (studio.bannerUrl || branding.bannerUrl || null));
    const bannerUrl = rawBanner ? getFileUrl(rawBanner) : null;

    return res.json({
      success: true,
      studio: {
        id: studio._id,
        name: studio.name,
        slug: studio.customDomain || cleanSlug,
        logoUrl,
        bannerUrl,
        tagline: studio.tagline || branding.tagline || 'Capturing Timeless Moments & Cherished Stories',
        bio: studio.bio || branding.bio || 'We specialize in cinematic wedding, pre-wedding, and lifestyle photography crafted with passion.',
        aboutUs: branding.aboutUs || studio.bio || '',
        phone: studio.phone || branding.phone || owner?.phone || '',
        mobile: studio.mobile || branding.mobile || owner?.phone || '',
        email: studio.email || branding.email || owner?.email || '',
        address: studio.address || branding.address || '',
        city: studio.city || branding.city || '',
        customEventsCount: studio.customEventsCount || branding.customEventsCount || '',
        customCustomersCount: studio.customCustomersCount || branding.customCustomersCount || '',
        instagramUrl: studio.instagramUrl || branding.instagramUrl || '',
        facebookUrl: studio.facebookUrl || branding.facebookUrl || '',
        whatsappNumber: branding.whatsappNumber || studio.whatsappUrl || '',
        whatsappUrl: studio.whatsappUrl || '',
        websiteUrl: branding.websiteUrl || '',
      },
      stats: {
        eventsCount: studio.customEventsCount || branding.customEventsCount || (eventsCount > 0 ? eventsCount + '+' : '100+'),
        customersCount: studio.customCustomersCount || branding.customCustomersCount || (happyCustomersCount > 0 ? happyCustomersCount + '+' : '250+'),
      },
      portfolioEvents,
    });
  } catch (err: any) {
    console.error('getPublicStudio error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch studio profile' });
  }
};

/**
 * Get current studio branding settings for the authenticated studio owner
 */
export const getStudioBranding = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      studio = await Studio.create({
        name: (req.user.name || 'My') + ' Studio',
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
      });
    }

    const owner: any = await User.findById(req.user._id).select('name email phone').lean();

    // Fetch all events for this studio so user can select portfolio events
    const events = await Event.find({ studioId: studio._id })
      .select('name code type date location coverImageUrl addToPortfolio createdAt')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formattedEvents = await Promise.all(
      events.map(async (ev: any) => {
        const photosCount = await Media.countDocuments({ eventId: ev._id, type: 'PHOTO' });
        return {
          id: ev._id,
          name: ev.name,
          code: ev.code,
          type: ev.type,
          date: ev.date,
          location: ev.location,
          coverImageUrl: ev.coverImageUrl ? getFileUrl(ev.coverImageUrl) : null,
          addToPortfolio: Boolean(ev.addToPortfolio),
          photosCount,
        };
      })
    );

    const branding = studio.branding || {};
    const logoUrl = studio.logoUrl ? getFileUrl(studio.logoUrl) : null;
    const rawBanner = (branding.bannerUrl && branding.bannerUrl !== '/wedding.jpg')
      ? branding.bannerUrl
      : (studio.bannerUrl && studio.bannerUrl !== '/wedding.jpg' ? studio.bannerUrl : (studio.bannerUrl || branding.bannerUrl || null));
    const bannerUrl = rawBanner ? getFileUrl(rawBanner) : null;

    return res.json({
      success: true,
      studio: {
        id: studio._id,
        name: studio.name,
        slug: studio.customDomain || '',
        customDomain: studio.customDomain || '',
        logoUrl,
        bannerUrl,
        tagline: studio.tagline || branding.tagline || '',
        bio: studio.bio || branding.bio || '',
        aboutUs: branding.aboutUs || '',
        phone: studio.phone || branding.phone || owner?.phone || '',
        mobile: studio.mobile || branding.mobile || owner?.phone || '',
        email: studio.email || branding.email || owner?.email || '',
        address: studio.address || branding.address || '',
        city: studio.city || branding.city || '',
        customEventsCount: studio.customEventsCount || branding.customEventsCount || '',
        customCustomersCount: studio.customCustomersCount || branding.customCustomersCount || '',
        instagramUrl: studio.instagramUrl || branding.instagramUrl || '',
        facebookUrl: studio.facebookUrl || branding.facebookUrl || '',
        whatsappNumber: branding.whatsappNumber || studio.whatsappUrl || '',
        whatsappUrl: studio.whatsappUrl || '',
        websiteUrl: branding.websiteUrl || '',
      },
      events: formattedEvents,
    });
  } catch (err: any) {
    console.error('getStudioBranding error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch studio branding' });
  }
};

/**
 * Update studio branding details and manage portfolio events
 */
export const updateStudioBranding = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      studio = await Studio.create({
        name: (req.user.name || 'My') + ' Studio',
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
      });
    }

    const {
      name,
      slug,
      customDomain,
      logoUrl,
      bannerUrl,
      tagline,
      bio,
      aboutUs,
      phone,
      mobile,
      email,
      address,
      city,
      customEventsCount,
      customCustomersCount,
      instagramUrl,
      facebookUrl,
      whatsappNumber,
      websiteUrl,
      portfolioEventIds,
    } = req.body;

    // Validate and update customDomain / slug
    const targetSlug = (slug !== undefined ? slug : customDomain);
    if (targetSlug !== undefined) {
      const cleanSlug = targetSlug ? targetSlug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '') : '';
      if (cleanSlug) {
        const existing = await Studio.findOne({ customDomain: cleanSlug, _id: { $ne: studio._id } });
        if (existing) {
          return res.status(400).json({ error: 'This slug or subdomain is already taken. Please choose another.' });
        }
        studio.customDomain = cleanSlug;
      } else {
        studio.customDomain = undefined;
      }
    }

    if (name) studio.name = name;
    if (tagline !== undefined) studio.tagline = tagline;
    if (bio !== undefined) studio.bio = bio;
    if (phone !== undefined) studio.phone = phone;
    if (mobile !== undefined) studio.mobile = mobile;
    if (email !== undefined) studio.email = email;
    if (address !== undefined) studio.address = address;
    if (city !== undefined) studio.city = city;
    if (customEventsCount !== undefined) studio.customEventsCount = customEventsCount;
    if (customCustomersCount !== undefined) studio.customCustomersCount = customCustomersCount;
    if (instagramUrl !== undefined) studio.instagramUrl = instagramUrl;
    if (facebookUrl !== undefined) studio.facebookUrl = facebookUrl;
    if (whatsappNumber !== undefined) {
      studio.whatsappUrl = whatsappNumber;
    }

    if (logoUrl !== undefined) studio.logoUrl = logoUrl;
    if (bannerUrl !== undefined) studio.bannerUrl = bannerUrl;

    // Update branding object
    studio.branding = {
      ...(studio.branding || {}),
      tagline: tagline !== undefined ? tagline : studio.branding?.tagline,
      bio: bio !== undefined ? bio : studio.branding?.bio,
      aboutUs: aboutUs !== undefined ? aboutUs : studio.branding?.aboutUs,
      phone: phone !== undefined ? phone : studio.branding?.phone,
      mobile: mobile !== undefined ? mobile : studio.branding?.mobile,
      email: email !== undefined ? email : studio.branding?.email,
      address: address !== undefined ? address : studio.branding?.address,
      city: city !== undefined ? city : studio.branding?.city,
      customEventsCount: customEventsCount !== undefined ? customEventsCount : studio.branding?.customEventsCount,
      customCustomersCount: customCustomersCount !== undefined ? customCustomersCount : studio.branding?.customCustomersCount,
      instagramUrl: instagramUrl !== undefined ? instagramUrl : studio.branding?.instagramUrl,
      facebookUrl: facebookUrl !== undefined ? facebookUrl : studio.branding?.facebookUrl,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : studio.branding?.whatsappNumber,
      websiteUrl: websiteUrl !== undefined ? websiteUrl : studio.branding?.websiteUrl,
      bannerUrl: bannerUrl !== undefined ? bannerUrl : studio.branding?.bannerUrl,
    };

    // If portfolioEventIds array is supplied, update Event.addToPortfolio flags
    if (Array.isArray(portfolioEventIds)) {
      await Event.updateMany(
        { studioId: studio._id, _id: { $in: portfolioEventIds } },
        { $set: { addToPortfolio: true } }
      );
      await Event.updateMany(
        { studioId: studio._id, _id: { $nin: portfolioEventIds } },
        { $set: { addToPortfolio: false } }
      );
    }

    await studio.save();

    return res.json({
      success: true,
      message: 'Studio branding updated successfully',
      studio: {
        id: studio._id,
        name: studio.name,
        slug: studio.customDomain || '',
        logoUrl: studio.logoUrl ? getFileUrl(studio.logoUrl) : null,
        bannerUrl: studio.bannerUrl ? getFileUrl(studio.bannerUrl) : null,
        tagline: studio.tagline,
        bio: studio.bio,
        phone: studio.phone,
        mobile: studio.mobile,
        email: studio.email,
        address: studio.address,
        city: studio.city,
        customEventsCount: studio.customEventsCount || studio.branding?.customEventsCount || '',
        customCustomersCount: studio.customCustomersCount || studio.branding?.customCustomersCount || '',
        instagramUrl: studio.instagramUrl,
        facebookUrl: studio.facebookUrl,
        whatsappNumber: studio.whatsappUrl,
        branding: studio.branding,
      },
    });
  } catch (err: any) {
    console.error('updateStudioBranding error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update studio branding' });
  }
};

/**
 * Direct file upload for Studio Banner / Cover Photo
 */
export const uploadStudioBanner = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);
    if (!file) {
      return res.status(400).json({ error: 'No banner image file uploaded' });
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (file.mimetype && !validMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Please upload JPG, PNG, or WEBP.' });
    }

    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      studio = await Studio.create({
        name: (req.user.name || 'Mara') + ' Studio',
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
      });
    }

    const { uploadFile, deleteFile } = await import('../services/StorageService');

    const folder = `studios/${studio._id}/banner`;
    const { url, publicId } = await uploadFile(file.buffer, folder, file.mimetype, file.originalname);

    if (studio.bannerKey && studio.bannerKey !== publicId) {
      deleteFile(studio.bannerKey).catch((delErr) => console.warn('[Banner] Old banner cleanup notice:', delErr));
    }

    studio.bannerUrl = url;
    studio.bannerKey = publicId;
    studio.branding = {
      ...(studio.branding || {}),
      bannerUrl: url,
    };
    await studio.save();

    return res.status(200).json({
      success: true,
      bannerUrl: getFileUrl(url),
      bannerKey: publicId,
      studio,
    });
  } catch (err: any) {
    console.error('uploadStudioBanner error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload studio banner' });
  }
};

/**
 * Delete studio banner safely
 */
export const deleteStudioBanner = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    if (studio.bannerKey) {
      const { deleteFile } = await import('../services/StorageService');
      await deleteFile(studio.bannerKey).catch((e) => console.warn('Could not delete old banner:', e));
    }

    studio.bannerUrl = undefined;
    studio.bannerKey = undefined;
    if (studio.branding) {
      studio.branding.bannerUrl = undefined;
    }
    await studio.save();

    return res.status(200).json({
      success: true,
      message: 'Studio banner removed successfully',
      studio,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to remove studio banner' });
  }
};
