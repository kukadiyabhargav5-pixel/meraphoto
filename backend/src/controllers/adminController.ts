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
  console.log(`[Admin] Purging event ${event.name} (${eventIdStr}) completely from cloud and DB...`);

  // 1. Collect all media file keys to delete from Cloudflare R2
  const mediaList = await Media.find({ eventId: event._id }).select('r2Key r2Url compressedUrl thumbnailUrl').lean();
  const keysToDelete: string[] = [];
  for (const m of mediaList) {
    if (m.r2Key) keysToDelete.push(m.r2Key);
    if (m.r2Url) keysToDelete.push(m.r2Url);
    if (m.compressedUrl) keysToDelete.push(m.compressedUrl);
    if (m.thumbnailUrl) keysToDelete.push(m.thumbnailUrl);
  }
  if (event.coverImageUrl) keysToDelete.push(event.coverImageUrl);
  if (event.watermark?.logoUrl) keysToDelete.push(event.watermark.logoUrl);

  // Bulk delete all file keys from Cloudflare R2
  if (keysToDelete.length > 0) {
    await deleteFiles(keysToDelete);
  }

  // Also purge entire R2 prefix for this event: events/<eventId>/
  await deleteFolderPrefix(`events/${eventIdStr}`);

  // 2. Delete all related database records for this event
  const mediaIds = mediaList.map((m) => m._id);
  if (mediaIds.length > 0) {
    await FaceEmbedding.deleteMany({ mediaId: { $in: mediaIds } });
  }
  await FaceEmbedding.deleteMany({ eventId: event._id });
  await Media.deleteMany({ eventId: event._id });
  await GalleryVisitor.deleteMany({ eventId: event._id });
  await EventCover.deleteMany({ eventId: event._id });
  await ShootLog.deleteMany({ eventId: event._id });
  await Event.findByIdAndDelete(event._id);
  console.log(`[Admin] Event ${eventIdStr} completely purged.`);
};

const deleteStudioInternal = async (studioId: string) => {
  const studio = await Studio.findById(studioId);
  if (!studio) return;

  const studioIdStr = studio._id.toString();
  console.log(`[Admin] Starting 100% complete purge for Studio "${studio.name}" (${studioIdStr})...`);

  // 1. Find and purge all events and their media from Cloudflare R2 and DB
  const events = await Event.find({ studioId: studio._id }).select('_id').lean();
  for (const event of events) {
    await deleteEventInternal(event._id.toString());
  }

  // 2. Delete studio branding assets (logo, banner, watermark) from R2
  const studioKeys: string[] = [];
  if (studio.logoUrl) studioKeys.push(studio.logoUrl);
  if (studio.bannerUrl) studioKeys.push(studio.bannerUrl);
  if ((studio as any).watermarkLogoUrl) studioKeys.push((studio as any).watermarkLogoUrl);
  if (studioKeys.length > 0) {
    await deleteFiles(studioKeys);
  }

  // Recursively clear entire R2 prefix for this studio: studios/<studioId>/
  await deleteFolderPrefix(`studios/${studioIdStr}`);

  // 3. Purge any remaining media and face embeddings associated with this studio
  const remainingMedia = await Media.find({ studioId: studio._id }).select('r2Key r2Url compressedUrl thumbnailUrl').lean();
  if (remainingMedia.length > 0) {
    const remKeys = remainingMedia.flatMap((m) => [m.r2Key, m.r2Url, m.compressedUrl, m.thumbnailUrl].filter(Boolean) as string[]);
    await deleteFiles(remKeys);
  }
  await Media.deleteMany({ studioId: studio._id });
  await FaceEmbedding.deleteMany({ studioId: studio._id });

  // 4. Permanently delete all other studio-related data from MongoDB
  await GalleryVisitor.deleteMany({ studioId: studio._id });
  await Customer.deleteMany({ studioId: studio._id });
  await Booking.deleteMany({ studioId: studio._id });
  await Quotation.deleteMany({ studioId: studio._id });
  await Bill.deleteMany({ studioId: studio._id });
  await Portfolio.deleteMany({ studioId: studio._id });
  await SupportTicket.deleteMany({ studioId: studio._id });
  await ClientTicket.deleteMany({ studioId: studio._id });
  await StorageSubscription.deleteMany({ studioId: studio._id });
  await StorageActivity.deleteMany({ studioId: studio._id });
  await Order.deleteMany({ studioId: studio._id });
  await ShootLog.deleteMany({ studioId: studio._id });
  await SearchSession.deleteMany({ studioId: studio._id });
  await Team.deleteMany({ studioId: studio._id });
  await EventCover.deleteMany({ studioId: studio._id });
  await Event.deleteMany({ studioId: studio._id });

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
  const studios = await Studio.find({ ownerId: user._id }).select('_id').lean();
  for (const studio of studios) {
    await deleteStudioInternal(studio._id.toString());
  }

  // 2. Delete any orphaned user support tickets, client tickets, or activities
  await SupportTicket.deleteMany({ userId: user._id });
  await ClientTicket.deleteMany({ userId: user._id });
  await StorageActivity.deleteMany({ userId: user._id });

  // 3. Finally delete the user
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
    return res.json({ success: true, message: 'User deleted successfully' });
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
    return res.json({ success: true, message: 'Studio deleted successfully' });
  } catch (err: any) {
    console.error('deleteStudio Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete an event
 */
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
