import { Event, Media, FaceEmbedding, ShootLog, EventCover } from '../models';
import Customer from '../models/Customer';
import GalleryVisitor from '../models/GalleryVisitor';
import { deleteFile } from './StorageService';

export const RETENTION_DAYS = 30;

/**
 * Automatically cleans up events and media that are older than 30 days from creation,
 * while permanently preserving customer records and gallery visitor data.
 */
export const cleanupExpiredEvents = async () => {
  try {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Query all events and find those where 30 days have elapsed from event date or creation date
    const allEvents = await Event.find({});
    const expiredEvents = allEvents.filter(event => {
      const baseDate = event.date ? new Date(event.date) : new Date(event.createdAt || (event as any)._id.getTimestamp());
      const baseMidnight = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();
      const diffDays = Math.floor((todayMidnight - baseMidnight) / (1000 * 60 * 60 * 24));
      return diffDays >= RETENTION_DAYS;
    });

    if (!expiredEvents || expiredEvents.length === 0) {
      return { cleanedCount: 0 };
    }

    console.log(`[EventRetention] Found ${expiredEvents.length} event(s) older than 30 days. Purging event media while preserving customer & visitor data...`);

    let cleanedCount = 0;
    for (const event of expiredEvents) {
      const eventId = event._id.toString();

      // 1. Permanently preserve/update Customer record
      try {
        if (event.clientName) {
          const queryConditions: any[] = [];
          if (event.clientMobile) queryConditions.push({ phone: event.clientMobile });
          if (event.clientEmail) queryConditions.push({ email: event.clientEmail });

          let customer = null;
          if (queryConditions.length > 0) {
            customer = await Customer.findOne({
              studioId: event.studioId,
              $or: queryConditions
            });
          }

          if (customer) {
            if (!customer.get('eventName')) (customer as any).eventName = event.name;
            if (!customer.get('eventDate')) (customer as any).eventDate = event.date;
            (customer as any).status = 'Completed';
            await customer.save();
          } else {
            await Customer.create({
              studioId: event.studioId,
              name: event.clientName,
              phone: event.clientMobile || '',
              email: event.clientEmail || '',
              eventName: event.name,
              eventDate: event.date,
              totalEvents: 1,
              status: 'Completed'
            });
          }
        }
      } catch (custErr) {
        console.error(`[EventRetention] Customer preservation error for event ${eventId}:`, custErr);
      }

      // 2. Permanently preserve GalleryVisitor records with Event details
      try {
        await GalleryVisitor.updateMany(
          { eventId: event._id },
          {
            $set: {
              eventName: event.name,
              eventCode: event.code,
              eventDate: event.date,
              studioId: event.studioId
            }
          }
        );
      } catch (visErr) {
        console.error(`[EventRetention] Visitor preservation error for event ${eventId}:`, visErr);
      }

      // 3. Delete all Media files and Cloud Storage objects
      try {
        const mediaList = await Media.find({ eventId: event._id });
        for (const media of mediaList) {
          if (media.r2Key) {
            await deleteFile(media.r2Key).catch(err =>
              console.warn(`[EventRetention] Failed to delete file key ${media.r2Key}:`, err?.message || err)
            );
          }
        }
        const mediaIds = mediaList.map(m => m._id);
        if (mediaIds.length > 0) {
          await FaceEmbedding.deleteMany({ mediaId: { $in: mediaIds } });
        }
        await Media.deleteMany({ eventId: event._id });
      } catch (medErr) {
        console.error(`[EventRetention] Media deletion error for event ${eventId}:`, medErr);
      }

      // 4. Delete ShootLog and EventCover
      try {
        await ShootLog.deleteMany({ eventId: event._id });
        await EventCover.deleteMany({ eventId: event._id });
      } catch (miscErr) {
        console.error(`[EventRetention] Misc logs deletion error for event ${eventId}:`, miscErr);
      }

      // 5. Delete Event document from database
      await Event.findByIdAndDelete(event._id);
      cleanedCount++;
      console.log(`[EventRetention] Successfully purged 30-day expired event "${event.name}" (${event.code}) and all associated media.`);
    }

    return { cleanedCount };
  } catch (err: any) {
    console.error('[EventRetention] Error in cleanupExpiredEvents:', err);
    return { error: err?.message || err };
  }
};

let retentionInterval: NodeJS.Timeout | null = null;

/**
 * Initializes the automated 30-day retention background schedule
 */
export const startEventRetentionScheduler = () => {
  // Run once immediately on server startup
  cleanupExpiredEvents().catch(err => console.error('[EventRetention] Initial run error:', err));

  // Run automatically every 1 hour
  if (!retentionInterval) {
    retentionInterval = setInterval(() => {
      cleanupExpiredEvents().catch(err => console.error('[EventRetention] Scheduled run error:', err));
    }, 60 * 60 * 1000);
    console.log('[EventRetention] Automated 30-day event retention schedule initialized (runs hourly).');
  }
};
