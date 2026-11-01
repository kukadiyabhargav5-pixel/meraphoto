import { Event, Media, FaceEmbedding, ShootLog, EventCover } from '../models';
import Customer from '../models/Customer';
import GalleryVisitor from '../models/GalleryVisitor';
import { Studio } from '../models/Studio';
import { StorageSubscription } from '../models/StorageSubscription';
import { deleteFile, deleteFiles } from './StorageService';
import { deleteEventPoints } from './qdrantService';

/**
 * Calculates days remaining for an event based strictly on the Studio's active Subscription Plan!
 * An event stays active for the entire duration of the studio's subscription (1 Month, 6 Months, or 1 Year).
 * When subscription expires, events and uploaded media are permanently purged from cloud storage,
 * while Customer and GalleryVisitor records are permanently preserved.
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

  // Fallback: If no plan expiry is set, default to 6-month window from creation date
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
    // Gallery visitor data is NEVER deleted. It is enriched with event info so the studio retains all visitor leads forever.
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
 * Automatically cleans up events and media from expired subscriptions,
 * freeing up cloud storage space while permanently preserving customer records and gallery visitor data.
 */
export const cleanupExpiredEvents = async () => {
  try {
    const now = new Date();

    // 1. Find all active subscriptions and their studioIds
    const activeSubs = await StorageSubscription.find({
      status: 'ACTIVE',
      paymentStatus: 'paid',
      expiresAt: { $gt: now },
    }).select('studioId expiresAt').lean();

    const activeStudioIds = new Set<string>(activeSubs.map((s) => s.studioId?.toString() || ''));

    // Also check Studio collection directly for active plans
    const activeStudios = await Studio.find({
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: { $ne: 'BASIC' },
      $or: [
        { subscriptionExpiresAt: { $gt: now } },
        { subscriptionExpiresAt: null }
      ],
    }).select('_id subscriptionExpiresAt').lean();

    activeStudios.forEach((s) => activeStudioIds.add(s._id.toString()));

    // 2. Find all events and check which ones belong to an expired or non-subscribed studio
    const allEvents = await Event.find({}).lean();
    const eventsToPurge = allEvents.filter((ev) => {
      const sId = ev.studioId?.toString();
      // If studio has an active plan, DO NOT PURGE! Events stay valid for entire plan!
      if (sId && activeStudioIds.has(sId)) {
        return false;
      }
      return true;
    });

    if (!eventsToPurge || eventsToPurge.length === 0) {
      return { cleanedCount: 0 };
    }

    console.log(`[EventRetention] Found ${eventsToPurge.length} event(s) from expired subscription(s). Purging media to release cloud storage while strictly preserving visitor & customer contacts...`);

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
 * Initializes the automated event retention background schedule (runs hourly).
 */
export const startEventRetentionScheduler = () => {
  // Run once on server startup
  cleanupExpiredEvents().catch((err) => console.error('[EventRetention] Initial run error:', err));

  // Run automatically every 1 hour
  if (!retentionInterval) {
    retentionInterval = setInterval(() => {
      cleanupExpiredEvents().catch((err) => console.error('[EventRetention] Scheduled run error:', err));
    }, 60 * 60 * 1000);
    console.log('[EventRetention] Automated subscription-based event retention schedule initialized (runs hourly).');
  }
};
