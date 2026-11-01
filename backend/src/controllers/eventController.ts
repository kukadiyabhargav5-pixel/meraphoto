import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { Event, Studio, User, Media } from '../models';
import { StorageSubscription } from '../models/StorageSubscription';
import Customer from '../models/Customer';
import { sendAdminNotificationEmail, sendEventInviteEmail } from '../services/EmailService';
import { getFileUrl } from '../services/StorageService';
import { calculateEventDaysLeft, cleanupExpiredEvents, purgeEventPermanently } from '../services/eventRetentionService';

/**
 * Creates a new event
 */
export const createEvent = async (req: AuthRequest, res: Response) => {
  const {
    name,
    clientName,
    clientMobile,
    clientEmail,
    date,
    type,
    coverImageUrl,
    description,
    location,
    time,
    isMultiDay,
    totalDays,
    days,
    accessType,
    password,
    assignedTeamEmails,
    addToPortfolio,
    allowDownload,
    watermark,
  } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // Validate plan limit (Bypass for SUPER_ADMIN)
    const activeEventsCount = await Event.countDocuments({ studioId: studio._id });
    if (!isSuperAdmin(req.user)) {
      if (studio.subscriptionPlan === 'BASIC' && activeEventsCount >= 15) {
        return res.status(403).json({ error: 'Basic plan limit reached (Max 15 events). Please upgrade.' });
      } else if (studio.subscriptionPlan === 'STANDARD' && activeEventsCount >= 50) {
        return res.status(403).json({ error: 'Standard plan limit reached (Max 50 events). Please upgrade.' });
      }
    }

    // Generate unique code slug
    let baseSlug = (req.body.code || name || 'event').toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'event';

    let code = baseSlug;
    const existingCode = await Event.findOne({ code });
    if (existingCode) {
      // Append unique timestamp hash to guarantee uniqueness
      code = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    let passwordHash = undefined;
    if ((accessType === 'PASSWORD' || accessType === 'OTP') && password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Map team emails to user Object IDs
    const assignedTeamMembers: any[] = [];
    if (assignedTeamEmails && Array.isArray(assignedTeamEmails)) {
      for (const email of assignedTeamEmails) {
        const foundTeam = await User.findOne({ email: email.toLowerCase(), role: 'TEAM_MEMBER' });
        if (foundTeam) {
          assignedTeamMembers.push(foundTeam._id);
        }
      }
    }

    const newEvent = await Event.create({
      name,
      code,
      clientName,
      clientMobile,
      clientEmail: clientEmail ? clientEmail.toLowerCase().trim() : '',
      date: new Date(date),
      type,
      coverImageUrl: coverImageUrl ? getFileUrl(coverImageUrl) : coverImageUrl,
      description,
      location,
      time,
      isMultiDay,
      totalDays,
      days,
      accessType,
      passwordHash,
      studioId: studio._id,
      assignedTeamMembers,
      addToPortfolio: addToPortfolio || false,
      allowDownload: allowDownload !== undefined ? allowDownload : true,
      watermark: watermark
        ? {
            ...watermark,
            logoUrl: watermark.logoUrl ? getFileUrl(watermark.logoUrl) : watermark.logoUrl,
          }
        : { isActive: false, type: 'LOGO', position: 'BOTTOM_RIGHT', width: 20, height: 20, opacity: 0.5 },
    });

    // Auto-sync client to Customers directory with permanent Event details
    try {
      const queryConditions: any[] = [];
      if (clientMobile) queryConditions.push({ phone: clientMobile });
      if (clientEmail) queryConditions.push({ email: clientEmail });

      let customer = null;
      if (queryConditions.length > 0) {
        customer = await Customer.findOne({ 
          studioId: studio._id, 
          $or: queryConditions
        });
      }

      if (!customer) {
        await Customer.create({
          studioId: studio._id,
          name: clientName,
          phone: clientMobile || '',
          email: clientEmail || '',
          eventName: name,
          eventDate: new Date(date),
          totalEvents: 1,
          status: 'Active'
        });
      } else {
        customer.totalEvents = (customer.totalEvents || 0) + 1;
        if (!(customer as any).eventName) (customer as any).eventName = name;
        if (!(customer as any).eventDate) (customer as any).eventDate = new Date(date);
        await customer.save();
      }
    } catch (custErr) {
      console.error('Error syncing customer:', custErr);
    }

    // Send email to the studio owner (logged in user) about the event creation
    if (req.user && req.user.email) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const galleryLink = `${frontendUrl}/e/${newEvent.code}`;
      
      sendEventInviteEmail(
        req.user.email,
        req.user.name || 'Studio Owner',
        name,
        galleryLink,
        accessType,
        password // Send raw password so studio owner knows it
      ).catch(err => console.error("Studio Owner Event Email Failed:", err));
    }

    return res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * List events for the studio (Owners/Team members assigned)
 */
export const getMyEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Clean up any events older than 30 days
    await cleanupExpiredEvents().catch(err => console.error('Auto cleanup error:', err));

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      if (isSuperAdmin(req.user)) {
        const events = await Event.find().sort({ createdAt: -1 });
        const enrichedEvents = events.map(ev => {
          const evObj = ev.toObject();
          if (evObj.coverImageUrl) evObj.coverImageUrl = getFileUrl(evObj.coverImageUrl);
          const { daysLeft, autoDeleteAt } = calculateEventDaysLeft(ev, new Date('2099-12-31'));
          return { ...evObj, daysLeft, autoDeleteAt };
        });

        enrichedEvents.sort((a, b) => {
          if (b.daysLeft !== a.daysLeft) return b.daysLeft - a.daysLeft;
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        return res.json({ events: enrichedEvents });
      }
      return res.json({ events: [] });
    }

    // Determine active subscription expiry for this studio
    const activeSub = await StorageSubscription.findOne({
      studioId: studio._id,
      status: 'ACTIVE',
      paymentStatus: 'paid',
      expiresAt: { $gt: new Date() }
    }).sort({ expiresAt: -1 }).lean();

    let planExpiresAt: any = activeSub?.expiresAt || studio.subscriptionExpiresAt;
    if (isSuperAdmin(req.user)) {
      planExpiresAt = new Date('2099-12-31');
    } else if (!planExpiresAt && studio.subscriptionPlan && studio.subscriptionPlan !== 'BASIC') {
      const start = studio.subscriptionStartDate || new Date();
      planExpiresAt = new Date(new Date(start).getTime() + 180 * 24 * 60 * 60 * 1000);
    }

    let query: any = { studioId: studio._id };
    if (req.user.role === 'TEAM_MEMBER') {
      query = { studioId: studio._id, assignedTeamMembers: req.user._id };
    }

    const events = await Event.find(query).sort({ createdAt: -1 });
    const enrichedEvents = events.map(ev => {
      const evObj = ev.toObject();
      if (evObj.coverImageUrl) evObj.coverImageUrl = getFileUrl(evObj.coverImageUrl);
      const { daysLeft, autoDeleteAt } = calculateEventDaysLeft(ev, planExpiresAt);
      return { ...evObj, daysLeft, autoDeleteAt };
    });

    // Sort: highest days remaining first (e.g. 30 -> 29 -> ... -> 1 -> 0), then newest created
    enrichedEvents.sort((a, b) => {
      if (b.daysLeft !== a.daysLeft) return b.daysLeft - a.daysLeft;
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return res.json({ events: enrichedEvents });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get public gallery information by event code
 */
export const getEventByCode = async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    let event = null;
    const cleanCode = (code || '').toLowerCase().trim();
    if (code.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(code)
        .populate('studioId', 'name logoUrl watermark customDomain instagramUrl facebookUrl subscriptionPlan subscriptionStartDate subscriptionExpiresAt');
    }
    if (!event) {
      event = await Event.findOne({ code: cleanCode })
        .populate('studioId', 'name logoUrl watermark customDomain instagramUrl facebookUrl subscriptionPlan subscriptionStartDate subscriptionExpiresAt');
    }
    
    if (!event) {
      return res.status(404).json({ error: 'Event gallery not found' });
    }

    // Redact passwordHash before sending
    const eventObj: any = event.toObject();
    delete eventObj.passwordHash;

    // Attach accurate plan-based validity & days remaining
    const studioId = (event.studioId as any)?._id || event.studioId;
    let planExpiresAt: any = null;
    if (studioId) {
      const activeSub = await StorageSubscription.findOne({
        studioId,
        status: 'ACTIVE',
        paymentStatus: 'paid',
        expiresAt: { $gt: new Date() }
      }).sort({ expiresAt: -1 }).lean();

      const studioDoc = await Studio.findById(studioId).select('subscriptionExpiresAt subscriptionPlan subscriptionStartDate').lean();
      planExpiresAt = activeSub?.expiresAt || studioDoc?.subscriptionExpiresAt;
      if (!planExpiresAt && studioDoc?.subscriptionPlan && studioDoc.subscriptionPlan !== 'BASIC') {
        const start = studioDoc.subscriptionStartDate || event.createdAt || new Date();
        planExpiresAt = new Date(new Date(start).getTime() + 180 * 24 * 60 * 60 * 1000);
      }
    }
    const { daysLeft, autoDeleteAt } = calculateEventDaysLeft(event, planExpiresAt);
    eventObj.daysLeft = daysLeft;
    eventObj.autoDeleteAt = autoDeleteAt;
    if (eventObj.coverImageUrl) eventObj.coverImageUrl = getFileUrl(eventObj.coverImageUrl);
    if (eventObj.studioId && (eventObj.studioId as any).logoUrl) {
      (eventObj.studioId as any).logoUrl = getFileUrl((eventObj.studioId as any).logoUrl);
    }

    if (event.accessType !== 'PASSWORD' && event.accessType !== 'OTP') {
      const media = await Media.find({ eventId: event._id }).sort({ createdAt: -1 });
      const sanitizedMedia = media.map(m => {
        const doc: any = m.toObject();
        if (doc.r2Url) doc.r2Url = getFileUrl(doc.r2Url);
        if (doc.compressedUrl) doc.compressedUrl = getFileUrl(doc.compressedUrl);
        if (doc.thumbnailUrl) doc.thumbnailUrl = getFileUrl(doc.thumbnailUrl);
        return doc;
      });
      return res.json({ event: eventObj, media: sanitizedMedia });
    }

    return res.json({ event: eventObj });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Authenticate access to a password protected gallery
 */
export const verifyEventPassword = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { password } = req.body;

  try {
    const event = await Event.findOne({ code });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.accessType !== 'PASSWORD' || !event.passwordHash) {
      return res.json({ accessGranted: true });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const isMatch = await bcrypt.compare(password, event.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    return res.json({ accessGranted: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Generates an event QR code that opens the gallery link
 */
export const getEventQRCode = async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    const event = await Event.findOne({ code });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // The landing site or dynamic routing will serve the gallery at /e/[slug]
    const host = req.get('host') || 'maraphoto.com';
    const protocol = req.secure ? 'https' : 'http';
    const galleryUrl = `${protocol}://${host}/e/${code}`;

    const qrBase64 = await QRCode.toDataURL(galleryUrl, {
      color: {
        dark: '#4f46e5', // Brand primary indigo
        light: '#ffffff',
      },
      width: 400,
      margin: 2,
    });

    return res.json({ qrCode: qrBase64, galleryUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update event details (Client details, name, type, access rules)
 */
export const updateEvent = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const {
    name,
    clientName,
    clientMobile,
    clientEmail,
    date,
    type,
    coverImageUrl,
    description,
    location,
    time,
    isMultiDay,
    totalDays,
    days,
    accessType,
    password,
    watermark,
    addToPortfolio,
    allowDownload,
  } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let event;
    const cleanUpdateId = (eventId || '').trim();
    if (cleanUpdateId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(cleanUpdateId);
    } else {
      event = await Event.findOne({ code: cleanUpdateId.toLowerCase() });
    }
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Validate that the request comes from the owner of the studio that owns the event
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      if (req.user.role === 'TEAM_MEMBER') {
        const isAssigned = event.assignedTeamMembers.some(
          (tmId) => tmId.toString() === req.user?._id.toString()
        );
        if (!isAssigned) {
          return res.status(403).json({ error: 'Unauthorized to update this event' });
        }
      } else {
        return res.status(403).json({ error: 'Unauthorized to update this event' });
      }
    }

    const requestedCode = req.body.code
      ? req.body.code.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      : null;

    if (requestedCode && requestedCode !== event.code) {
      // User explicitly changed or specified the URL slug
      let candidate = requestedCode;
      const existing = await Event.findOne({ code: candidate, _id: { $ne: event._id } });
      if (existing) {
        candidate = `${requestedCode}-${Math.random().toString(36).substring(2, 6)}`;
      }
      event.code = candidate;
    } else if (name && name.trim() && name.trim() !== event.name) {
      // Event name changed, automatically update the URL slug to match the new event name
      const nameSlug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (nameSlug && nameSlug !== event.code) {
        let candidate = nameSlug;
        const existing = await Event.findOne({ code: candidate, _id: { $ne: event._id } });
        if (existing) {
          candidate = `${nameSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }
        event.code = candidate;
      }
    }

    if (name && name.trim()) event.name = name.trim();
    if (clientName) event.clientName = clientName;
    if (clientMobile) event.clientMobile = clientMobile;
    if (clientEmail !== undefined) event.clientEmail = clientEmail ? clientEmail.toLowerCase().trim() : '';
    if (date) event.date = new Date(date);
    if (type) event.type = type;
    if (coverImageUrl !== undefined) event.coverImageUrl = coverImageUrl;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (time !== undefined) event.time = time;
    if (isMultiDay !== undefined) event.isMultiDay = isMultiDay;
    if (totalDays !== undefined) event.totalDays = totalDays;
    if (days !== undefined) event.days = days;
    if (addToPortfolio !== undefined) event.addToPortfolio = addToPortfolio;
    if (allowDownload !== undefined) event.allowDownload = allowDownload;

    if (accessType) {
      event.accessType = accessType;
      if ((accessType === 'PASSWORD' || accessType === 'OTP') && password) {
        const salt = await bcrypt.genSalt(10);
        event.passwordHash = await bcrypt.hash(password, salt);
      } else if (accessType !== 'PASSWORD' && accessType !== 'OTP') {
        event.passwordHash = undefined;
      }
    }

    let shouldRewatermark = false;

    if (watermark !== undefined) {
      const oldWm = JSON.stringify(event.watermark || {});
      const newWm = JSON.stringify(watermark || {});
      
      if (oldWm !== newWm) {
        shouldRewatermark = true;
      }

      event.set('watermark', watermark);
      event.markModified('watermark');
    }

    await event.save();

    // If watermark settings changed, re-process all photos for this event fast in the background
    if (shouldRewatermark) {
      setTimeout(async () => {
        try {
          console.log(`[Watermark] Settings changed for event ${event._id}. Fast re-watermarking all photos...`);
          const { Media } = await import('../models');
          const { reapplyWatermarkToPhoto } = await import('../workers/mediaWorker');
          
          const mediaList = await Media.find({ eventId: event._id, type: 'PHOTO' });
          console.log(`[Watermark] Starting fast-lane re-watermarking for ${mediaList.length} photos...`);

          const BATCH_SIZE = 8;
          for (let i = 0; i < mediaList.length; i += BATCH_SIZE) {
            const batch = mediaList.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(media => 
              reapplyWatermarkToPhoto(media._id.toString(), event.studioId.toString(), event._id.toString())
            ));
          }
          console.log(`[Watermark] Successfully completed fast re-watermarking for ${mediaList.length} photos.`);
        } catch (err) {
          console.error('[Watermark] Failed to fast re-watermark photos:', err);
        }
      }, 0);
    }

    // Deduct credits for any uncredited media uploaded for this event upon saving
    const { Media } = await import('../models');
    const uncreditedMedia = await Media.find({ eventId: event._id, creditDeducted: { $ne: true } });
    const photosToDeduct = uncreditedMedia.filter(m => m.type === 'PHOTO').length;
    const videosToDeduct = uncreditedMedia.filter(m => m.type === 'VIDEO').length;

    if (photosToDeduct > 0 || videosToDeduct > 0) {
      await Studio.findByIdAndUpdate(event.studioId, {
        $inc: {
          'usage.photosUploaded': photosToDeduct,
          'usage.videosUploaded': videosToDeduct
        }
      });

      await Media.updateMany(
        { _id: { $in: uncreditedMedia.map(m => m._id) } },
        { $set: { creditDeducted: true } }
      );
    }

    const { calculateStudioCredits } = await import('./studioController');
    const updatedStudio = await Studio.findById(event.studioId).lean();
    const credits = updatedStudio ? await calculateStudioCredits(updatedStudio._id, updatedStudio.subscriptionPlan, updatedStudio) : null;

    // Attach daysLeft calculation to updated event response
    const studioIdForDays = event.studioId;
    let updatePlanExpiresAt: any = null;
    if (studioIdForDays) {
      const activeSub = await StorageSubscription.findOne({
        studioId: studioIdForDays,
        status: 'ACTIVE',
        paymentStatus: 'paid',
        expiresAt: { $gt: new Date() }
      }).sort({ expiresAt: -1 }).lean();
      const studioDoc = await Studio.findById(studioIdForDays).select('subscriptionExpiresAt subscriptionPlan subscriptionStartDate').lean();
      updatePlanExpiresAt = activeSub?.expiresAt || studioDoc?.subscriptionExpiresAt;
      if (!updatePlanExpiresAt && studioDoc?.subscriptionPlan && studioDoc.subscriptionPlan !== 'BASIC') {
        const start = studioDoc.subscriptionStartDate || event.createdAt || new Date();
        updatePlanExpiresAt = new Date(new Date(start).getTime() + 180 * 24 * 60 * 60 * 1000);
      }
    }
    const { daysLeft: updatedDaysLeft, autoDeleteAt: updatedAutoDeleteAt } = calculateEventDaysLeft(event, updatePlanExpiresAt);
    const enrichedUpdatedEvent = { ...event.toObject(), daysLeft: updatedDaysLeft, autoDeleteAt: updatedAutoDeleteAt };

    return res.json({ 
      message: 'Event updated successfully', 
      event: enrichedUpdatedEvent,
      deductedPhotos: photosToDeduct,
      deductedVideos: videosToDeduct,
      credits
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mock Request OTP for Event Download
 */
export const requestEventOtp = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { mobile } = req.body;

  try {
    const event = await Event.findOne({ code });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

    console.log(`\n--- [MOCK OTP] ---`);
    console.log(`Sending OTP 1234 to mobile: ${mobile} for event: ${event.name}`);
    console.log(`-------------------\n`);

    return res.json({ message: 'OTP sent successfully to your mobile number' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mock Verify OTP for Event Download
 */
export const verifyEventOtp = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { mobile, otp } = req.body;

  try {
    const event = await Event.findOne({ code });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (otp !== '1234') {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    return res.json({ message: 'OTP verified successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete Event Gallery and associated media
 */
export const deleteEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  try {
    let event;
    if (eventId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ code: eventId });
    }
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Permanently purge event and media from R2 and MongoDB, preserving visitor leads
    await purgeEventPermanently(event);

    return res.json({ message: 'Event and all its associated media deleted permanently from cloud and database' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update event portfolio status instantly
 */
export const updatePortfolioStatus = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { addToPortfolio } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let event;
    const cleanPortId = (eventId || '').trim();
    if (cleanPortId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(cleanPortId);
    } else {
      event = await Event.findOne({ code: cleanPortId.toLowerCase() });
    }
    
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Validate that the request comes from the owner of the studio that owns the event
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      if (req.user.role === 'TEAM_MEMBER') {
        const isAssigned = event.assignedTeamMembers.some(
          (tmId) => tmId.toString() === req.user?._id.toString()
        );
        if (!isAssigned) {
          return res.status(403).json({ error: 'Unauthorized to update this event' });
        }
      } else {
        return res.status(403).json({ error: 'Unauthorized to update this event' });
      }
    }

    if (addToPortfolio !== undefined) {
      event.addToPortfolio = addToPortfolio;
      await event.save();
    }

    return res.json({ message: 'Portfolio status updated successfully', event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update event download permission status instantly
 */
export const updateDownloadStatus = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { allowDownload } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let event;
    const cleanPortId = (eventId || '').trim();
    if (cleanPortId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(cleanPortId);
    } else {
      event = await Event.findOne({ code: cleanPortId.toLowerCase() });
    }
    
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio && !isSuperAdmin(req.user)) {
      if (req.user.role === 'TEAM_MEMBER') {
        const isAssigned = event.assignedTeamMembers.some(
          (tmId) => tmId.toString() === req.user?._id.toString()
        );
        if (!isAssigned) {
          return res.status(403).json({ error: 'Unauthorized to update this event' });
        }
      } else {
        return res.status(403).json({ error: 'Unauthorized to update this event' });
      }
    }

    if (allowDownload !== undefined) {
      event.allowDownload = allowDownload;
      await event.save();
    }

    return res.json({ message: 'Download status updated successfully', event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

