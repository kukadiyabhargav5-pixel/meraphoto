import { Event, Media, FaceEmbedding, ShootLog, EventCover } from '../models';
import Customer from '../models/Customer';
import GalleryVisitor from '../models/GalleryVisitor';
import { Studio } from '../models/Studio';
import { StorageSubscription } from '../models/StorageSubscription';
import { deleteFile, deleteFiles } from './StorageService';
import { deleteEventPoints } from './qdrantService';

/**
 * Calculates days remaining for an event based on the Studio's active Subscription Plan.
 * VIP Admin / Unlimited lifetime mode: never expires.
 */
export const calculateEventDaysLeft = (event: any, customPlanExpiresAt?: Date | string | null) => {
  const now = new Date();
  let expiresAt: Date | null = null;

  if (customPlanExpiresAt) {
    expiresAt = new Date(customPlanExpiresAt);
  } else if (event?.planExpiresAt) {
    expiresAt = new Date(event.planExpiresAt);
  } else if (event?.studioId?.subscriptionExpiresAt) {
    expiresAt = new Date(event.studioId.subscriptionExpiresAt);
  }

  // VIP Admin / Unlimited lifetime mode: never expires
  if (event?.isLifetime || (expiresAt && expiresAt.getFullYear() >= 2099)) {
    return {
      diffDays: 0,
      daysLeft: 9999,
      isExpired: false,
      autoDeleteAt: new Date('2099-12-31'),
      createdDate: new Date(event?.createdAt || Date.now()),
    };
  }

  if (expiresAt && !isNaN(expiresAt.getTime())) {
    const diffMs = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

    return {
      diffDays: 0,
      daysLeft,
      isExpired,
      autoDeleteAt: expiresAt,
      createdDate: new Date(event?.createdAt || Date.now()),
    };
  }

  // Fallback: If no plan expiry is set, default to 180 days (6 months) window from creation date
  const createdRaw = event?.createdAt ? new Date(event.createdAt) : new Date();
  const defaultExpiry = new Date(createdRaw.getTime() + 180 * 24 * 60 * 60 * 1000);
  const diffMs = defaultExpiry.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  return {
    diffDays: 0,
    daysLeft,
    isExpired,
    autoDeleteAt: defaultExpiry,
    createdDate: createdRaw,
  };
};

/**
 * Permanently deletes an event and all its uploaded media from Cloudflare R2
 * and MongoDB, while strictly preserving Customer and GalleryVisitor records.
 */
export const purgeEventPermanently = async (eventOrId: any): Promise<boolean> => {
  try {
    let event: any = null;
    if (typeof eventOrId === 'string') {
      event = await Event.findById(eventOrId);
    } else if (eventOrId && eventOrId._id) {
      event = eventOrId;
    }

    if (!event) {
      return false;
    }

    const eventId = event._id.toString();
    console.log(`[EventRetention] Starting permanent purge for expired subscription event "${event.name}" (${event.code || eventId})...`);

    // 1. Permanently preserve / update Customer record
    try {
      if (event.clientName) {
        const queryConditions: any[] = [];
        if (event.clientMobile) queryConditions.push({ phone: event.clientMobile });
        if (event.clientEmail) queryConditions.push({ email: event.clientEmail });

        let customer = null;
        if (queryConditions.length > 0) {
          customer = await Customer.findOne({
            studioId: event.studioId,
            $or: queryConditions,
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
            status: 'Completed',
          });
        }
      }
    } catch (custErr) {
      console.error(`[EventRetention] Customer preservation error for event ${eventId}:`, custErr);
    }

    // 2. Permanently preserve GalleryVisitor records with full event context
    try {
      await GalleryVisitor.updateMany(
        { eventId: event._id },
        {
          $set: {
            eventName: event.name,
            eventCode: event.code,
            eventDate: event.date,
            studioId: event.studioId,
          },
        }
      );
    } catch (visErr) {
      console.error(`[EventRetention] Visitor preservation error for event ${eventId}:`, visErr);
    }

    // 3. Collect and delete all media files permanently from Cloudflare R2 to free cloud storage
    try {
      const mediaList = await Media.find({ eventId: event._id });
      const storageKeysToDelete = new Set<string>();

      for (const media of mediaList) {
        if (media.r2Key) storageKeysToDelete.add(media.r2Key);
        if (media.compressedUrl && !media.compressedUrl.startsWith('data:') && !media.compressedUrl.startsWith('localdb:')) {
          storageKeysToDelete.add(media.compressedUrl);
        }
        if (media.thumbnailUrl && !media.thumbnailUrl.startsWith('data:') && !media.thumbnailUrl.startsWith('localdb:')) {
          storageKeysToDelete.add(media.thumbnailUrl);
        }
      }

      if (event.coverImageUrl && !event.coverImageUrl.startsWith('data:')) {
        storageKeysToDelete.add(event.coverImageUrl);
      }

      const keysArray = Array.from(storageKeysToDelete);
      if (keysArray.length > 0) {
        console.log(`[EventRetention] Deleting ${keysArray.length} file(s) from Cloudflare R2 for event ${eventId}...`);
        for (const key of keysArray) {
          await deleteFile(key).catch((err) =>
            console.warn(`[EventRetention] Failed to delete file ${key}:`, err?.message || err)
          );
        }
      }

      // Delete FaceEmbeddings
      const mediaIds = mediaList.map((m) => m._id);
      if (mediaIds.length > 0) {
        await FaceEmbedding.deleteMany({ mediaId: { $in: mediaIds } });
      }
      await FaceEmbedding.deleteMany({ eventId: event._id });

      // Delete Media documents
      await Media.deleteMany({ eventId: event._id });
    } catch (medErr) {
      console.error(`[EventRetention] Media purge error for event ${eventId}:`, medErr);
    }

    // 4. Delete vector points from Qdrant vector database
    try {
      await deleteEventPoints(eventId);
    } catch (qErr) {
      console.warn(`[EventRetention] Qdrant purge warning for event ${eventId}:`, qErr);
    }

    // 5. Delete ShootLog and EventCover
    try {
      await ShootLog.deleteMany({ eventId: event._id });
      await EventCover.deleteMany({ eventId: event._id });
    } catch (miscErr) {
      console.error(`[EventRetention] Misc logs purge error for event ${eventId}:`, miscErr);
    }

    // 6. Delete Event document from database
    await Event.findByIdAndDelete(event._id);
    console.log(`[EventRetention] Successfully purged expired event "${event.name}" (${event.code || eventId}) from cloud and database. Cloud storage released. Visitor data preserved.`);
    return true;
  } catch (err: any) {
    console.error(`[EventRetention] Error purging event:`, err);
    return false;
  }
};

/**
 * Genuinely expired event cleanup:
 * Only purges events that:
 * 1. Were created at least 30 days ago.
 * 2. Whose calculated retention period has reached 0 days (daysLeft <= 0 and isExpired === true).
 * NEVER deletes active, recent, or newly created events!
 */
export const cleanupExpiredEvents = async () => {
  try {
    const now = new Date();
    // Safety guard: only consider events older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const candidates = await Event.find({
      createdAt: { $lt: thirtyDaysAgo }
    }).populate('studioId').lean();

    if (!candidates || candidates.length === 0) {
      return { cleanedCount: 0 };
    }

    const eventsToPurge: any[] = [];
    for (const ev of candidates) {
      const studio: any = ev.studioId;
      if (!studio) continue;

      let planExpiresAt = studio.subscriptionExpiresAt;
      const { isExpired, daysLeft } = calculateEventDaysLeft(ev, planExpiresAt);
      if (isExpired && daysLeft <= 0) {
        eventsToPurge.push(ev);
      }
    }

    if (eventsToPurge.length === 0) {
      return { cleanedCount: 0 };
    }

    console.log(`[EventRetention] Found ${eventsToPurge.length} genuinely expired event(s). Purging media to release cloud storage...`);

    let cleanedCount = 0;
    for (const event of eventsToPurge) {
      const success = await purgeEventPermanently(event);
      if (success) cleanedCount++;
    }

    return { cleanedCount };
  } catch (err: any) {
    console.error('[EventRetention] Error in cleanupExpiredEvents:', err);
    return { error: err?.message || err };
  }
};

let retentionInterval: NodeJS.Timeout | null = null;

/**
 * Initializes the automated event retention background schedule (runs daily).
 */
export const startEventRetentionScheduler = () => {
  // Run automatically once every 24 hours (not aggressively on startup)
  if (!retentionInterval) {
    retentionInterval = setInterval(() => {
      cleanupExpiredEvents().catch((err) => console.error('[EventRetention] Scheduled run error:', err));
    }, 24 * 60 * 60 * 1000);
    console.log('[EventRetention] Automated subscription-based event retention schedule initialized (runs daily).');
  }
};
