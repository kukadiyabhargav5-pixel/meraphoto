import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Cloudflare R2 S3 Client Initialization
export const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'maraphoto';

/**
 * Returns the public or stream URL for a given R2 object key.
 * If R2_PUBLIC_URL (e.g. https://pub-xxx.r2.dev or custom CDN domain) is configured,
 * returns the direct CDN URL.
 * Otherwise, returns the backend high-performance media stream URL.
 */
export const getFileUrl = (key: string): string => {
  if (!key) return '';
  const prodApi = (
    process.env.API_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://meraphotoes.onrender.com' : 'http://localhost:5000')
  ).replace(/\/+$/, '');

  // If key is a base64 data URI or blob URI, return it directly
  if (key.startsWith('data:') || key.startsWith('blob:')) {
    return key;
  }

  // If key is a local frontend static asset (e.g. /wedding.jpg, /logo.png), return as is
  if (key.startsWith('/') && !key.startsWith('/api/') && !key.startsWith('/studios/') && !key.startsWith('/branding/') && !key.startsWith('/events/') && !key.startsWith('/mara-photo/')) {
    return key;
  }

  // If key is already a full URL, sanitize any broken/localhost prefixes
  if (key.startsWith('http://') || key.startsWith('https://')) {
    if (key.includes('.r2.dev/')) {
      const cleanKey = key.split('.r2.dev/')[1];
      return `${prodApi}/api/media/file/${cleanKey.replace(/^\/+/, '')}`;
    }
    if (key.includes('/api/media/file/')) {
      const cleanKey = key.split('/api/media/file/')[1];
      return `${prodApi}/api/media/file/${cleanKey.replace(/^\/+/, '')}`;
    }
    if ((process.env.NODE_ENV === 'production' || process.env.RENDER) && (key.includes('localhost:5000') || key.includes('127.0.0.1:5000'))) {
      return key.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/g, prodApi);
    }
    return key;
  }

  const cleanKey = key.replace(/^\/+/, '');
  return `${prodApi}/api/media/file/${cleanKey}`;
};

/**
 * Uploads a buffer directly to Cloudflare R2 with high performance.
 * Returns the public access/stream URL and the R2 storage key (publicId).
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  folder: string = 'mara-photo',
  contentType: string = 'image/jpeg',
  fileName?: string
): Promise<{ url: string; publicId: string }> => {
  try {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    let safeName: string;

    if (fileName) {
      safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    } else {
      const ext = contentType.includes('png')
        ? '.png'
        : contentType.includes('webp')
        ? '.webp'
        : contentType.includes('video') || contentType.includes('mp4')
        ? '.mp4'
        : '.jpg';
      safeName = `${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
    }

    const key = cleanFolder ? `${cleanFolder}/${safeName}` : safeName;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    return {
      url: getFileUrl(key),
      publicId: key,
    };
  } catch (error) {
    console.error('[StorageService] R2 Upload Error:', error);
    throw error;
  }
};

/**
 * Cleans and sanitizes any full URL, API route, or raw identifier into a canonical Cloudflare R2 object key.
 */
export const cleanR2Key = (keyOrUrl: string): string => {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return '';
  let str = keyOrUrl.split('?')[0].trim();
  if (str.startsWith('data:') || str.startsWith('blob:') || str.startsWith('localdb://')) return '';

  if (str.includes('/api/media/file/')) {
    str = str.split('/api/media/file/')[1] || '';
  } else if (str.includes('.r2.dev/')) {
    str = str.split('.r2.dev/')[1] || '';
  } else if (str.includes('.cloudflarestorage.com/')) {
    const parts = str.split('.cloudflarestorage.com/')[1] || '';
    const slashIdx = parts.indexOf('/');
    str = slashIdx !== -1 ? parts.substring(slashIdx + 1) : parts;
  } else if (process.env.R2_PUBLIC_URL && str.includes(process.env.R2_PUBLIC_URL)) {
    str = str.replace(process.env.R2_PUBLIC_URL.replace(/\/+$/, '') + '/', '');
  } else if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const parsed = new URL(str);
      str = parsed.pathname.replace(/^\/+/, '');
      if (str.startsWith('api/media/file/')) {
        str = str.replace('api/media/file/', '');
      }
    } catch {
      return '';
    }
  }
  return decodeURIComponent(str.replace(/^\/+/, ''));
};

/**
 * Deletes a file from Cloudflare R2 given its storage key or publicId.
 */
export const deleteFile = async (keyOrId: string): Promise<void> => {
  try {
    const key = cleanR2Key(keyOrId);
    if (!key) return;

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
    console.log(`[StorageService] Successfully permanently deleted R2 file: ${key}`);
  } catch (error) {
    console.error(`[StorageService] Failed to delete R2 file: ${keyOrId}`, error);
  }
};

/**
 * Bulk deletes multiple files from Cloudflare R2 in chunks of 1000.
 */
export const deleteFiles = async (keys: string[]): Promise<void> => {
  try {
    const cleanedKeys = Array.from(
      new Set(
        keys
          .map((k) => cleanR2Key(k))
          .filter((k) => k && k.length > 0)
      )
    );
    if (cleanedKeys.length === 0) return;

    for (let i = 0; i < cleanedKeys.length; i += 1000) {
      const chunk = cleanedKeys.slice(i, i + 1000);
      await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: { Objects: chunk.map((Key) => ({ Key })) },
        })
      );
      console.log(`[StorageService] Successfully bulk deleted ${chunk.length} R2 files from storage.`);
    }
  } catch (error) {
    console.error('[StorageService] Bulk Delete Error:', error);
  }
};

/**
 * Directly downloads an object from Cloudflare R2 as a Buffer.
 * High-speed internal transfer for video/photo processing workers.
 */

/**
 * Recursively lists and permanently deletes all files under an R2 folder prefix (e.g. "studios/...", "events/...").
 */
export const deleteFolderPrefix = async (prefix: string): Promise<void> => {
  try {
    const cleanPrefix = cleanR2Key(prefix).replace(/^\/+/, '');
    if (!cleanPrefix) return;

    let continuationToken: string | undefined = undefined;
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: cleanPrefix,
        ContinuationToken: continuationToken,
      });
      const listRes: any = await r2Client.send(listCommand);
      if (listRes.Contents && listRes.Contents.length > 0) {
        const keys = listRes.Contents.map((obj: any) => obj.Key).filter(Boolean) as string[];
        if (keys.length > 0) {
          await deleteFiles(keys);
        }
      }
      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);
    console.log(`[StorageService] Successfully cleared entire R2 prefix: ${cleanPrefix}`);
  } catch (error) {
    console.error(`[StorageService] Error deleting prefix "${prefix}":`, error);
  }
};

export const getFileBuffer = async (key: string): Promise<Buffer> => {
  try {
    let cleanKey = key;
    if (cleanKey.includes('/api/media/file/')) {
      cleanKey = cleanKey.split('/api/media/file/')[1];
    } else if (process.env.R2_PUBLIC_URL && cleanKey.includes(process.env.R2_PUBLIC_URL)) {
      cleanKey = cleanKey.replace(process.env.R2_PUBLIC_URL.replace(/\/+$/, '') + '/', '');
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
    });
    const res = await r2Client.send(command);
    const byteArray = await (res.Body as any).transformToByteArray();
    return Buffer.from(byteArray);
  } catch (error) {
    console.error(`[StorageService] Failed to fetch buffer for key ${key}:`, error);
    throw error;
  }
};

/**
 * Streams an object directly from Cloudflare R2 as a Readable stream.
 * Enables zero-buffer streaming into ZIP archives without high RAM usage.
 */
export const getObjectStream = async (key: string): Promise<NodeJS.ReadableStream> => {
  let cleanKey = key;
  if (cleanKey.includes('/api/media/file/')) {
    cleanKey = cleanKey.split('/api/media/file/')[1];
  } else if (process.env.R2_PUBLIC_URL && cleanKey.includes(process.env.R2_PUBLIC_URL)) {
    cleanKey = cleanKey.replace(process.env.R2_PUBLIC_URL.replace(/\/+$/, '') + '/', '');
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: cleanKey,
  });
  const res = await r2Client.send(command);
  return res.Body as unknown as NodeJS.ReadableStream;
};

/**
 * Generates a presigned PUT URL for direct client-to-R2 high-speed upload.
 */
export const generatePresignedUploadUrl = async (
  key: string,
  contentType: string = 'image/jpeg',
  expiresInSeconds: number = 3600
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
};

/**
 * Generates a presigned GET URL for secure, direct downloads from Cloudflare R2.
 */
export const generatePresignedDownloadUrl = async (
  key: string,
  downloadFilename?: string,
  expiresInSeconds: number = 3600
): Promise<string> => {
  let cleanKey = key;
  if (cleanKey.includes('/api/media/file/')) {
    cleanKey = cleanKey.split('/api/media/file/')[1];
  } else if (process.env.R2_PUBLIC_URL && cleanKey.includes(process.env.R2_PUBLIC_URL)) {
    cleanKey = cleanKey.replace(process.env.R2_PUBLIC_URL.replace(/\/+$/, '') + '/', '');
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: cleanKey,
    ResponseContentDisposition: downloadFilename
      ? `attachment; filename="${encodeURIComponent(downloadFilename)}"`
      : undefined,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
};

/**
 * Backwards compatibility helper for previous client auth requests.
 */
export const generateSignature = () => {
  return {
    token: uuidv4(),
    expire: Math.floor(Date.now() / 1000) + 3600,
    signature: 'r2_authenticated',
  };
};
