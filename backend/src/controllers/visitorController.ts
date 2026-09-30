import { Request, Response } from 'express';
import GalleryVisitor from '../models/GalleryVisitor';
import { Event } from '../models/Event';
import { Studio } from '../models/Studio';
import { AuthRequest } from '../middlewares/auth';

/**
 * Submit gallery visitor details
 */
export const submitGalleryVisitor = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { name, phone, email } = req.body;

  try {
    const event = await Event.findOne({ code });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const visitor = new GalleryVisitor({
      eventId: event._id,
      studioId: event.studioId,
      eventName: event.name,
      eventCode: event.code,
      eventDate: event.date,
      name,
      phone,
      email
    });

    await visitor.save();

    return res.status(201).json({ message: 'Visitor details saved successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all events with visitor counts for the studio
 */
export const getEventsWithVisitorCounts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Clean up any events older than 30 days while preserving visitors
    const { cleanupExpiredEvents } = await import('../services/eventRetentionService');
    await cleanupExpiredEvents().catch(err => console.error('Auto cleanup error:', err));

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // Aggregate to get events and their visitor counts and event metadata
    const visitorStats = await GalleryVisitor.aggregate([
      { $match: { studioId: studio._id } },
      { 
        $group: { 
          _id: '$eventId', 
          count: { $sum: 1 },
          eventName: { $first: '$eventName' },
          eventCode: { $first: '$eventCode' },
          eventDate: { $first: '$eventDate' }
        } 
      }
    ]);

    const visitorCountsMap = visitorStats.reduce((acc: any, curr: any) => {
      if (curr._id) {
        acc[curr._id.toString()] = curr.count;
      }
      return acc;
    }, {});

    // Get all active events for the studio
    const events = await Event.find({ studioId: studio._id }).sort({ date: -1 });
    const activeEventIds = new Set(events.map(e => e._id.toString()));

    const eventsWithCounts = events.map(event => {
      const eventObj = event.toObject();
      return {
        ...eventObj,
        visitorCount: visitorCountsMap[event._id.toString()] || 0,
        isArchived: false
      };
    });

    // Also include completed/expired events (where 30 days completed) so visitor records are never lost
    const archivedEvents: any[] = [];
    for (const stat of visitorStats) {
      if (stat._id && !activeEventIds.has(stat._id.toString())) {
        archivedEvents.push({
          _id: stat._id,
          name: stat.eventName || 'Archived Event',
          code: stat.eventCode || '',
          date: stat.eventDate || new Date(),
          type: 'Archived (30 Days Completed)',
          visitorCount: stat.count,
          isArchived: true
        });
      }
    }

    const allEvents = [...eventsWithCounts, ...archivedEvents];

    // Sort descending by event date (so 17 Sep appears FIRST at top, and 12 Sep appears SECOND)
    allEvents.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.json({ events: allEvents });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get visitors for a specific event
 */
export const getEventVisitors = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const visitors = await GalleryVisitor.find({ 
      eventId, 
      studioId: studio._id 
    }).sort({ createdAt: -1 });

    return res.json({ visitors });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Delete event and its visitor leads
 */
export const deleteEventVisitors = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    // 1. Delete all gallery visitors for this event
    await GalleryVisitor.deleteMany({
      eventId,
      studioId: studio._id
    });

    // 2. If an active event exists, delete event and its media as well
    const event = await Event.findOne({ _id: eventId, studioId: studio._id });
    if (event) {
      const { Media } = await import('../models');
      await Media.deleteMany({ eventId: event._id });
      await Event.findByIdAndDelete(event._id);
    }

    return res.json({ message: 'Event and visitor leads deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
