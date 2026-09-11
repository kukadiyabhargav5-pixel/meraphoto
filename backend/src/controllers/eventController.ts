import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { Event, Studio, User, Media } from '../models';
import Customer from '../models/Customer';
import { sendAdminNotificationEmail, sendEventInviteEmail } from '../services/EmailService';

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
    let code = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existingCode = await Event.findOne({ code });
    if (existingCode) {
      // Append unique timestamp hash to guarantee uniqueness
      code = `${code}-${Math.random().toString(36).substring(2, 6)}`;
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
      clientEmail,
      date: new Date(date),
      type,
      coverImageUrl,
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
      watermark: watermark || { isActive: false, type: 'LOGO', position: 'BOTTOM_RIGHT', width: 20, height: 20, opacity: 0.5 },
    });

    // Auto-sync client to Customers directory
    try {
      let customer = await Customer.findOne({ 
        studioId: studio._id, 
        $or: [ { phone: clientMobile }, { email: clientEmail } ]
      });

      if (!customer) {
        await Customer.create({
          studioId: studio._id,
          name: clientName,
          phone: clientMobile,
          email: clientEmail,
          totalEvents: 1,
          status: 'Active'
        });
      } else {
        customer.totalEvents = (customer.totalEvents || 0) + 1;
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

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      if (isSuperAdmin(req.user)) {
        const events = await Event.find().sort({ date: -1 });
        return res.json({ events });
      }
      return res.json({ events: [] });
    }

    let query: any = { studioId: studio._id };
    if (req.user.role === 'TEAM_MEMBER') {
      query = { studioId: studio._id, assignedTeamMembers: req.user._id };
    }

    const events = await Event.find(query).sort({ date: -1 });
    return res.json({ events });
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
    const event = await Event.findOne({ code })
      .populate('studioId', 'name logoUrl watermark customDomain instagramUrl facebookUrl');
    
    if (!event) {
      return res.status(404).json({ error: 'Event gallery not found' });
    }

    // Redact passwordHash before sending
    const eventObj = event.toObject();
    delete eventObj.passwordHash;

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
  } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let event;
    if (eventId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ code: eventId });
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

    if (name) event.name = name;
    if (clientName) event.clientName = clientName;
    if (clientMobile) event.clientMobile = clientMobile;
    if (clientEmail) event.clientEmail = clientEmail;
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

    // If watermark settings changed, re-process all photos for this event in the background
    if (shouldRewatermark) {
      setTimeout(async () => {
        try {
          console.log(`[Watermark] Settings changed for event ${event._id}. Re-queuing all photos...`);
          const { Media } = await import('../models');
          const { photoQueue, processMediaLocal, isRedisAvailable } = await import('../workers/mediaWorker');
          
          const mediaList = await Media.find({ eventId: event._id, type: 'PHOTO' });
          
          // Helper to process in batches to prevent Out Of Memory errors
          const processInBatches = async (items: any[], batchSize: number) => {
            for (let i = 0; i < items.length; i += batchSize) {
              const batch = items.slice(i, i + batchSize);
              await Promise.all(batch.map(async (media) => {
                media.processedStatus = 'PENDING';
                await media.save();

                if (isRedisAvailable && photoQueue) {
                  await photoQueue.add(`photo-job-${media._id}`, {
                    mediaId: media._id,
                    studioId: event.studioId,
                  });
                } else {
                  try {
                    await processMediaLocal(media._id.toString(), 'PHOTO', event.studioId.toString());
                  } catch (e) {
                    console.error(`Re-watermark failed for ${media._id}:`, e);
                  }
                }
              }));
            }
          };

          await processInBatches(mediaList, 5); // Process 5 photos at a time
          console.log(`[Watermark] Successfully queued/processed ${mediaList.length} photos for re-watermarking.`);
        } catch (err) {
          console.error('[Watermark] Failed to re-queue photos:', err);
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

    return res.json({ 
      message: 'Event updated successfully', 
      event,
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

    // Delete associated media documents
    await Media.deleteMany({ eventId: event._id });

    // Delete event document
    await Event.findByIdAndDelete(event._id);

    return res.json({ message: 'Event and all its associated media deleted successfully' });
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
    if (eventId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(eventId);
    } else {
      event = await Event.findOne({ code: eventId });
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
