import { Request, Response } from 'express';
import { User, Studio, Event, Media, Booking, Customer, Quotation, Bill, SupportTicket, FaceEmbedding, ClientTicket, Portfolio, EventCover, ShootLog, GalleryVisitor, StorageSubscription, StorageActivity, Order, SearchSession, Team } from '../models';
import { deleteFile, deleteFiles, deleteFolderPrefix } from '../services/StorageService';
import { purgeEventPermanently } from '../services/eventRetentionService';

/**
 * Get a single user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -refreshToken -otp');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update a user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshToken -otp');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single studio by ID
 */
export const getStudioById = async (req: Request, res: Response) => {
  try {
    const studio = await Studio.findById(req.params.id).populate('ownerId', 'name email');
    if (!studio) return res.status(404).json({ error: 'Studio not found' });
    
    // Get events
    const recentEvents = await Event.find({ studioId: studio._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const eventCount = await Event.countDocuments({ studioId: studio._id });
    
    // Get media stats
    const mediaList = await Media.find({ studioId: studio._id }).select('size type eventId');
    let totalStorage = 0;
    let photoCount = 0;
    let videoCount = 0;
    
    mediaList.forEach(m => {
      totalStorage += m.size || 0;
      if (m.type === 'PHOTO') photoCount++;
      if (m.type === 'VIDEO') videoCount++;
    });

    // Map media count per recent event
    const eventsWithStats = recentEvents.map(ev => {
      const evMedia = mediaList.filter(m => m.eventId.toString() === ev._id.toString());
      return {
        ...ev,
        mediaCount: evMedia.length,
      };
    });

    // Get other counts
    const bookingCount = await Booking.countDocuments({ studioId: studio._id });
    const customerCount = await Customer.countDocuments({ studioId: studio._id });
    
    return res.json({ 
      studio, 
      eventCount, 
      mediaCount: mediaList.length,
      photoCount,
      videoCount,
      totalStorage,
      bookingCount,
      customerCount,
      recentEvents: eventsWithStats
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update a studio
 */
export const updateStudio = async (req: Request, res: Response) => {
  try {
    const { name, subscriptionPlan, subscriptionStatus } = req.body;
    const studio = await Studio.findByIdAndUpdate(
      req.params.id,
      { name, subscriptionPlan, subscriptionStatus },
      { new: true, runValidators: true }
    ).populate('ownerId', 'name email');
    if (!studio) return res.status(404).json({ error: 'Studio not found' });
    return res.json({ studio });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all events for a specific studio
 */
export const getStudioEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find({ studioId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    const mediaList = await Media.find({ studioId: req.params.id }).select('eventId');
    
    const eventsWithStats = events.map(ev => {
      const evMedia = mediaList.filter(m => m.eventId.toString() === ev._id.toString());
      return {
        ...ev,
        mediaCount: evMedia.length,
      };
    });

    return res.json({ events: eventsWithStats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
/**
 * Get a single event by ID
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('studioId', 'name')
      .populate('assignedTeamMembers', 'name email');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    const mediaCount = await Media.countDocuments({ eventId: event._id });
    
    return res.json({ event, mediaCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Update an event
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { name, clientName, clientMobile, clientEmail, location, date, time, type, accessType } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { name, clientName, clientMobile, clientEmail, location, date, time, type, accessType },
      { new: true, runValidators: true }
    ).populate('studioId', 'name');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.json({ event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all gallery visitors for an event
 */
export const getEventVisitors = async (req: Request, res: Response) => {
  try {
    const visitors = await GalleryVisitor.find({ eventId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ visitors });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get global stats for the admin dashboard
 */
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudios = await Studio.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalMedia = await Media.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalQuotations = await Quotation.countDocuments();
    const totalSupportTickets = await SupportTicket.countDocuments();
    const totalClientTickets = await ClientTicket.countDocuments();
    
    // Calculate total revenue from all bills
    const bills = await Bill.find();
    const totalRevenue = bills.reduce((acc, bill) => acc + (bill.amount || 0), 0) || 0;

    return res.json({
      totalUsers,
      totalStudios,
      totalEvents,
      totalMedia,
      totalBookings,
      totalQuotations,
      totalSupportTickets,
      totalClientTickets,
      totalRevenue
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    
    const studios = await Studio.find().select('name ownerId').lean();
    
    const usersWithStudios = users.map(u => {
      const userStudios = studios.filter(s => {
        if (!s.ownerId || !u._id) return false;
        return String(s.ownerId) === String(u._id);
      });
      return {
        ...u,
        studioName: userStudios.length > 0 ? userStudios[0].name : null
      };
    });

    return res.json({ users: usersWithStudios });
  } catch (err: any) {
    console.error('getAllUsers Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all studios
 */
export const getAllStudios = async (req: Request, res: Response) => {
  try {
    const studios = await Studio.find().populate('ownerId', 'name email').sort({ createdAt: -1 });
    return res.json({ studios });
  } catch (err: any) {
    console.error('getAllStudios Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all events
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find().populate('studioId', 'name').sort({ createdAt: -1 }).lean();
    
    // Get media count for all events
    const mediaList = await Media.find().select('eventId');
    
    const eventsWithStats = events.map(ev => {
      const evMedia = mediaList.filter(m => m.eventId.toString() === ev._id.toString());
      return {
        ...ev,
        mediaCount: evMedia.length,
      };
    });

    return res.json({ events: eventsWithStats });
  } catch (err: any) {
    console.error('getAllEvents Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get media summary
 */
export const getMediaStats = async (req: Request, res: Response) => {
  try {
    const media = await Media.find().select('size type');
    let totalSize = 0;
    let photoCount = 0;
    let videoCount = 0;

    media.forEach(m => {
      totalSize += m.size;
      if (m.type === 'PHOTO') photoCount++;
      if (m.type === 'VIDEO') videoCount++;
    });

    const totalEmbeddings = await FaceEmbedding.countDocuments();

    return res.json({
      totalSize, // in bytes
      photoCount,
      videoCount,
      totalEmbeddings
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all support tickets
 */
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await SupportTicket.find({ status: { $ne: 'RESOLVED' } }).populate('studioId', 'name').sort({ createdAt: -1 });
    return res.json({ tickets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteEventInternal = async (eventId: string) => {
  const event = await Event.findById(eventId);
  if (!event) return;

  const eventIdStr = event._id.toString();
  console.log(`[Admin] Purging event "${event.name}" (${eventIdStr}) completely from cloud and DB...`);

  // 1. Collect all media file keys to delete from Cloudflare R2
  const mediaList = await Media.find({
    $or: [{ eventId: event._id }, { eventId: eventIdStr }]
  }).select('r2Key r2Url compressedUrl thumbnailUrl url').lean();
  const keysToDelete: string[] = [];
  for (const m of mediaList) {
    if (m.r2Key) keysToDelete.push(m.r2Key);
    if (m.r2Url) keysToDelete.push(m.r2Url);
    if (m.compressedUrl) keysToDelete.push(m.compressedUrl);
    if (m.thumbnailUrl) keysToDelete.push(m.thumbnailUrl);
    if ((m as any).url) keysToDelete.push((m as any).url);
  }
  if (event.coverImageUrl) keysToDelete.push(event.coverImageUrl);
  if (event.watermark?.logoUrl) keysToDelete.push(event.watermark.logoUrl);

  // Bulk delete all file keys from Cloudflare R2
  if (keysToDelete.length > 0) {
    await deleteFiles(keysToDelete);
  }

  // Also recursively purge entire R2 prefixes for this event
  await deleteFolderPrefix(`events/${eventIdStr}`);
  if (event.code) {
    await deleteFolderPrefix(`events/${event.code}`);
  }
  if (Array.isArray(event.previousCodes)) {
    for (const prevCode of event.previousCodes) {
      if (prevCode) await deleteFolderPrefix(`events/${prevCode}`);
    }
  }

  // 2. Delete all related database records for this event
  const mediaIds = mediaList.map((m) => m._id);
  if (mediaIds.length > 0) {
    await FaceEmbedding.deleteMany({ mediaId: { $in: mediaIds } });
  }
  await FaceEmbedding.deleteMany({ eventId: event._id });
  await Media.deleteMany({ $or: [{ eventId: event._id }, { eventId: eventIdStr }] });
  await GalleryVisitor.deleteMany({ eventId: event._id });
  await EventCover.deleteMany({ eventId: event._id });
  await ShootLog.deleteMany({ eventId: event._id });
  await Event.findByIdAndDelete(event._id);
  console.log(`[Admin] Event ${eventIdStr} completely purged from Cloud and Database.`);
};

const deleteStudioInternal = async (studioId: string) => {
  const studio = await Studio.findById(studioId);
  if (!studio) return;

  const studioIdStr = studio._id.toString();
  console.log(`[Admin] Starting 100% complete purge for Studio "${studio.name}" (${studioIdStr})...`);

  // 1. Find and purge all events and their media from Cloudflare R2 and DB
  const events = await Event.find({
    $or: [{ studioId: studio._id }, { studioId: studioIdStr }]
  }).select('_id code previousCodes').lean();
  for (const event of events) {
    await deleteEventInternal(event._id.toString());
  }

  // 2. Delete studio branding assets (logo, banner, watermark, QR code) from R2
  const studioKeys: string[] = [];
  if (studio.logoUrl) studioKeys.push(studio.logoUrl);
  if (studio.bannerUrl) studioKeys.push(studio.bannerUrl);
  if ((studio as any).watermarkLogoUrl) studioKeys.push((studio as any).watermarkLogoUrl);
  if ((studio as any).qrCodeUrl) studioKeys.push((studio as any).qrCodeUrl);

  // Collect portfolio files from R2
  const portfolios = await Portfolio.find({
    $or: [{ userId: studio.ownerId }, { studioId: studio._id } as any]
  }).lean();
  for (const p of portfolios) {
    if ((p as any).image) studioKeys.push((p as any).image);
    if ((p as any).coverImage) studioKeys.push((p as any).coverImage);
    if (Array.isArray((p as any).images)) {
      (p as any).images.forEach((img: string) => { if (img) studioKeys.push(img); });
    }
  }

  // Collect EventCover images from R2
  const eventCovers = await EventCover.find({
    $or: [{ userId: studio.ownerId }, { studioId: studio._id } as any]
  }).lean();
  for (const ec of eventCovers) {
    if ((ec as any).image) studioKeys.push((ec as any).image);
    if ((ec as any).imageUrl) studioKeys.push((ec as any).imageUrl);
  }

  if (studioKeys.length > 0) {
    await deleteFiles(studioKeys);
  }

  // Recursively clear all R2 folder prefixes for this studio:
  await deleteFolderPrefix(`studios/${studioIdStr}`);
  if ((studio as any).code) {
    await deleteFolderPrefix(`studios/${(studio as any).code}`);
  }
  await deleteFolderPrefix(`branding/${studioIdStr}`);
  await deleteFolderPrefix(`watermarks/${studioIdStr}`);

  // 3. Purge any remaining media and face embeddings associated with this studio
  const remainingMedia = await Media.find({
    $or: [{ studioId: studio._id }, { studioId: studioIdStr }]
  }).select('r2Key r2Url compressedUrl thumbnailUrl url').lean();
  if (remainingMedia.length > 0) {
    const remKeys = remainingMedia.flatMap((m) => [m.r2Key, m.r2Url, m.compressedUrl, m.thumbnailUrl, (m as any).url].filter(Boolean) as string[]);
    await deleteFiles(remKeys);
  }
  await Media.deleteMany({ $or: [{ studioId: studio._id }, { studioId: studioIdStr }] });
  await FaceEmbedding.deleteMany({ studioId: studio._id });

  // 4. Permanently delete all other studio-related data from MongoDB
  await GalleryVisitor.deleteMany({ studioId: studio._id });
  await Customer.deleteMany({ studioId: studio._id });
  await Booking.deleteMany({ studioId: studio._id });
  await Quotation.deleteMany({ studioId: studio._id });
  await Bill.deleteMany({ studioId: studio._id });
  await Portfolio.deleteMany({ $or: [{ userId: studio.ownerId }, { studioId: studio._id } as any] });
  await SupportTicket.deleteMany({ studioId: studio._id });
  await ClientTicket.deleteMany({ studioId: studio._id });
  await StorageSubscription.deleteMany({ studioId: studio._id });
  await StorageActivity.deleteMany({ studioId: studio._id });
  await Order.deleteMany({ studioId: studio._id });
  await ShootLog.deleteMany({ studioId: studio._id });
  await SearchSession.deleteMany({ studioId: studio._id });
  await Team.deleteMany({ studioId: studio._id });
  await EventCover.deleteMany({ $or: [{ userId: studio.ownerId }, { studioId: studio._id } as any] });
  await Event.deleteMany({ $or: [{ studioId: studio._id }, { studioId: studioIdStr }] });

  // 5. Finally delete the Studio document
  await Studio.findByIdAndDelete(studio._id);
  console.log(`[Admin] Studio ${studioIdStr} and ALL associated data permanently deleted from Cloud and DB.`);
};

const deleteUserInternal = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return;

  const userIdStr = user._id.toString();
  console.log(`[Admin] Starting 100% complete purge for User "${user.email}" (${userIdStr})...`);

  // 1. Find and purge all studios owned by this user
  const studios = await Studio.find({
    $or: [{ ownerId: user._id }, { ownerId: userIdStr }]
  }).select('_id').lean();
  for (const studio of studios) {
    await deleteStudioInternal(studio._id.toString());
  }

  // 2. Also delete user avatar & personal files from R2
  const userKeys: string[] = [];
  if ((user as any).avatar) userKeys.push((user as any).avatar);
  if ((user as any).avatarUrl) userKeys.push((user as any).avatarUrl);
  if (userKeys.length > 0) {
    await deleteFiles(userKeys);
  }
  await deleteFolderPrefix(`users/${userIdStr}`);

  // 3. Delete any orphaned user portfolios, covers, support tickets, activities, orders, sessions
  await Portfolio.deleteMany({ userId: user._id });
  await EventCover.deleteMany({ userId: user._id });
  await SupportTicket.deleteMany({ userId: user._id });
  await ClientTicket.deleteMany({ userId: user._id });
  await StorageActivity.deleteMany({ userId: user._id });
  await Order.deleteMany({ userId: user._id });
  await SearchSession.deleteMany({ userId: user._id });

  // 4. Finally delete the user document
  await User.findByIdAndDelete(user._id);
  console.log(`[Admin] User ${userIdStr} and ALL associated studios/data permanently deleted from Cloud and DB.`);
};

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteUserInternal(id);
    return res.json({ success: true, message: 'User and all associated cloud & database data permanently deleted' });
  } catch (err: any) {
    console.error('deleteUser Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a studio
 */
export const deleteStudio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteStudioInternal(id);
    return res.json({ success: true, message: 'Studio, all events, and cloud files permanently deleted' });
  } catch (err: any) {
    console.error('deleteStudio Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteEventInternal(id);
    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err: any) {
    console.error('deleteEvent Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
