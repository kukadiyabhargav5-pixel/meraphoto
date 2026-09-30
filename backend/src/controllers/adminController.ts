import { Request, Response } from 'express';
import { User, Studio, Event, Media, Booking, Customer, Quotation, Bill, SupportTicket, FaceEmbedding, ClientTicket, Portfolio, EventCover, ShootLog, GalleryVisitor } from '../models';
import { deleteFile } from '../services/StorageService';

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
  // Find all Media for this event
  const mediaList = await Media.find({ eventId });
  
  // Delete from Cloud Storage
  for (const media of mediaList) {
    if (media.r2Key) {
      await deleteFile(media.r2Key).catch(err => console.warn(`Failed to delete ${media.r2Key}:`, err));
    }
  }
  
  const mediaIds = mediaList.map(m => m._id);
  
  // Delete FaceEmbeddings
  await FaceEmbedding.deleteMany({ mediaId: { $in: mediaIds } });
  
  // Delete Media
  await Media.deleteMany({ _id: { $in: mediaIds } });
  
  // Delete ShootLog and EventCover
  await ShootLog.deleteMany({ eventId });
  await EventCover.deleteMany({ eventId });
  
  // Finally delete the Event
  await Event.findByIdAndDelete(eventId);
};

const deleteStudioInternal = async (studioId: string) => {
  // Find all events for this studio and delete them
  const events = await Event.find({ studioId });
  for (const event of events) {
    await deleteEventInternal(event._id.toString());
  }
  
  // Delete all other studio-related data
  await Booking.deleteMany({ studioId });
  await Customer.deleteMany({ studioId });
  await Quotation.deleteMany({ studioId });
  await Bill.deleteMany({ studioId });
  await SupportTicket.deleteMany({ studioId });
  await ClientTicket.deleteMany({ studioId });
  await Portfolio.deleteMany({ studioId });
  
  // Finally delete the Studio
  await Studio.findByIdAndDelete(studioId);
};

const deleteUserInternal = async (userId: string) => {
  // Find all studios owned by this user
  const studios = await Studio.find({ ownerId: userId });
  for (const studio of studios) {
    await deleteStudioInternal(studio._id.toString());
  }
  
  // Finally delete the user
  await User.findByIdAndDelete(userId);
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
