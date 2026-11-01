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
          type: 'Archived (Plan Completed)',
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

/**
 * Get comprehensive analytics for an event
 * Including graph time buckets, visitor counts, and date filters
 * GET /api/visitors/event/:eventId/analytics?range=today|yesterday|week|month|year|custom
 */
export const getEventAnalytics = async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const { range = 'week', startDate, endDate } = req.query as {
    range?: string;
    startDate?: string;
    endDate?: string;
  };

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const event = await Event.findOne({ _id: eventId, studioId: studio._id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { Media } = await import('../models');

    // 1. Fetch total counts
    const totalVisitors = await GalleryVisitor.countDocuments({ eventId, studioId: studio._id });
    
    // Unique visitors by phone/email
    const uniquePhones = await GalleryVisitor.distinct('phone', { eventId, studioId: studio._id });
    const uniqueVisitorsCount = uniquePhones.length;

    // Favorited photos count
    const favoritePhotosCount = await Media.countDocuments({
      eventId,
      $or: [{ isFavorite: true }, { favoriteCount: { $gt: 0 } }],
    });

    // Today's boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayVisitors = await GalleryVisitor.countDocuments({
      eventId,
      studioId: studio._id,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    // 2. Determine date filter range
    let rangeStart = new Date();
    let rangeEnd = new Date();
    let bucketMode: 'hourly' | 'daily' | 'monthly' = 'daily';

    switch (range) {
      case 'today':
        rangeStart = startOfToday;
        rangeEnd = endOfToday;
        bucketMode = 'hourly';
        break;

      case 'yesterday': {
        const yStart = new Date(startOfToday);
        yStart.setDate(yStart.getDate() - 1);
        const yEnd = new Date(endOfToday);
        yEnd.setDate(yEnd.getDate() - 1);
        rangeStart = yStart;
        rangeEnd = yEnd;
        bucketMode = 'hourly';
        break;
      }

      case 'week':
        rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        rangeEnd = now;
        bucketMode = 'daily';
        break;

      case 'month':
        rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        rangeEnd = now;
        bucketMode = 'daily';
        break;

      case 'year':
        rangeStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        rangeEnd = now;
        bucketMode = 'monthly';
        break;

      case 'custom':
        if (startDate && endDate) {
          rangeStart = new Date(startDate);
          rangeEnd = new Date(endDate);
          rangeEnd.setHours(23, 59, 59, 999);
          const diffDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 2) bucketMode = 'hourly';
          else if (diffDays <= 60) bucketMode = 'daily';
          else bucketMode = 'monthly';
        } else {
          rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          rangeEnd = now;
          bucketMode = 'daily';
        }
        break;

      default:
        rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        rangeEnd = now;
        bucketMode = 'daily';
    }

    // 3. Fetch visitors in range
    const visitorsInRange = await GalleryVisitor.find({
      eventId,
      studioId: studio._id,
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
    }).sort({ createdAt: 1 });

    // 4. Generate buckets for smooth graphing
    interface ChartBucket {
      label: string;
      date: string;
      visitors: number;
    }

    const chartData: ChartBucket[] = [];

    if (bucketMode === 'hourly') {
      // 24 hours buckets
      for (let h = 0; h < 24; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        chartData.push({
          label: hourStr,
          date: hourStr,
          visitors: 0,
        });
      }
      visitorsInRange.forEach((v) => {
        const d = new Date(v.createdAt);
        const h = d.getHours();
        if (chartData[h]) {
          chartData[h].visitors += 1;
        }
      });
    } else if (bucketMode === 'daily') {
      const daysCount = Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)));
      const dayMap = new Map<string, ChartBucket>();

      for (let i = 0; i <= daysCount; i++) {
        const cur = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
        if (cur > rangeEnd && i > 0) break;
        const key = cur.toISOString().split('T')[0];
        const label = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const bucket: ChartBucket = { label, date: key, visitors: 0 };
        dayMap.set(key, bucket);
        chartData.push(bucket);
      }

      visitorsInRange.forEach((v) => {
        const key = new Date(v.createdAt).toISOString().split('T')[0];
        const bucket = dayMap.get(key);
        if (bucket) {
          bucket.visitors += 1;
        }
      });
    } else {
      // Monthly buckets
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthMap = new Map<string, ChartBucket>();

      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        const bucket: ChartBucket = { label, date: key, visitors: 0 };
        monthMap.set(key, bucket);
        chartData.push(bucket);
      }

      visitorsInRange.forEach((v) => {
        const d = new Date(v.createdAt);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const bucket = monthMap.get(key);
        if (bucket) {
          bucket.visitors += 1;
        }
      });
    }

    // Recent visitors list (latest 25)
    const recentVisitors = await GalleryVisitor.find({
      eventId,
      studioId: studio._id,
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .select('name phone email createdAt')
      .lean();

    return res.json({
      success: true,
      eventName: event.name,
      eventCode: event.code,
      metrics: {
        totalVisitors,
        uniqueVisitors: uniqueVisitorsCount,
        rangeVisitors: visitorsInRange.length,
        todayVisitors,
        favoritePhotosCount,
      },
      range,
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      chartData,
      recentVisitors,
    });
  } catch (err: any) {
    console.error('[VisitorAnalytics] error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get analytics' });
  }
};
