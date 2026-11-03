import mongoose from 'mongoose';

/**
 * Permanently cleans up obsolete database indexes that cause E11000 duplicate key errors
 * (specifically legacy subdomain_1 on the studios collection).
 */
export const cleanObsoleteDatabaseIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('[DB Cleaner] Database not connected yet, skipping index cleanup.');
      return;
    }

    const collections = await db.listCollections().toArray();
    const studioColl = collections.find((c) => c.name === 'studios');
    if (!studioColl) return;

    const collection = db.collection('studios');
    const indexes = await collection.indexes();

    for (const idx of indexes) {
      const idxName = idx.name;
      if (!idxName) continue;

      const hasSubdomain = idxName === 'subdomain_1' || idxName.includes('subdomain') || (idx.key && 'subdomain' in idx.key);
      if (hasSubdomain) {
        console.log(`[DB Cleaner] Dropping obsolete index "${idxName}" on studios collection...`);
        try {
          await collection.dropIndex(idxName);
          console.log(`[DB Cleaner] Successfully dropped obsolete index "${idxName}".`);
        } catch (dropErr: any) {
          console.warn(`[DB Cleaner] Notice dropping index ${idxName}:`, dropErr?.message);
        }
      }
    }

    // Unset legacy subdomain field from existing studio documents if present
    const unsetResult = await collection.updateMany(
      { subdomain: { $exists: true } },
      { $unset: { subdomain: '' } }
    );
    if (unsetResult.modifiedCount > 0) {
      console.log(`[DB Cleaner] Cleaned legacy subdomain field from ${unsetResult.modifiedCount} studio documents.`);
    }
  } catch (err: any) {
    console.warn('[DB Cleaner] Index cleanup notice:', err?.message);
  }
};

/**
 * Dynamically drop the legacy subdomain_1 index immediately if an E11000 error occurs.
 */
export const safelyDropSubdomainIndex = async () => {
  try {
    const db = mongoose.connection.db;
    if (db) {
      console.log('[DB Cleaner] On-the-fly attempt to drop subdomain_1...');
      await db.collection('studios').dropIndex('subdomain_1');
      console.log('[DB Cleaner] Successfully dropped subdomain_1 on-the-fly.');
    }
  } catch (err: any) {
    // If it was already dropped or doesn't exist, ignore safely
    console.warn('[DB Cleaner] subdomain_1 drop on-the-fly notice:', err?.message);
  }
};
