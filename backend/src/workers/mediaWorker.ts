import { Worker, Queue, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import axios from 'axios';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import { redisConfig } from '../config/redis';
import { uploadFile } from '../services/StorageService';
import { Media, FaceEmbedding, Studio, Event } from '../models';
import { insertFaceEmbedding, isQdrantAvailable } from '../services/qdrantService';

dotenv.config();

// ---- Redis availability check ----
export let isRedisAvailable = false;

const checkRedis = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: redisConfig.host, port: redisConfig.port });
    socket.setTimeout(800);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
  });
};

// Lazy queues & workers – only created when Redis is reachable
export let photoQueue: Queue | null = null;
export let videoQueue: Queue | null = null;

checkRedis().then((available) => {
  isRedisAvailable = available;
  if (available) {
    console.log('[MediaWorker] Redis is available – starting BullMQ queues & workers.');
    photoQueue = new Queue('photo-processing', { connection: redisConfig });
    videoQueue = new Queue('video-processing', { connection: redisConfig });
    initWorkers();
  } else {
    console.log('[MediaWorker] Redis is offline – BullMQ queues disabled. Uploads will process synchronously.');
  }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Downloads a file from a URL as a Buffer (e.g. for Studio Logos)
 */
const downloadUrlToBuffer = async (url: string): Promise<Buffer> => {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
};

/**
 * Helper to calculate watermark placement
 */
const getWatermarkPosition = (
  position: string,
  imgWidth: number,
  imgHeight: number,
  wWidth: number,
  wHeight: number
) => {
  const margin = 40;
  switch (position) {
    case 'TOP_LEFT':
      return { left: margin, top: margin };
    case 'TOP_RIGHT':
      return { left: imgWidth - wWidth - margin, top: margin };
    case 'BOTTOM_LEFT':
      return { left: margin, top: imgHeight - wHeight - margin };
    case 'CENTER':
      return { left: Math.round((imgWidth - wWidth) / 2), top: Math.round((imgHeight - wHeight) / 2) };
    case 'BOTTOM_RIGHT':
    default:
      return { left: imgWidth - wWidth - margin, top: imgHeight - wHeight - margin };
  }
};

/**
 * Applies studio's or event's watermark to a photo using Sharp.
 * Uses a fixed reference width (REFERENCE_WIDTH) so that the watermark
 * appears the same absolute size on every image, regardless of the
 * actual image dimensions.
 */
const REFERENCE_WIDTH = 1600; // All percentage calculations use this base

const applyWatermark = async (
  imageBuffer: Buffer,
  studioId: string,
  eventId?: string
): Promise<Buffer> => {
  let wmSettings: any = null;

  if (eventId) {
    const event = await Event.findById(eventId);
    if (event) {
      // If the event specifically has watermark disabled, DO NOT apply any watermark
      if (!event.watermark?.isActive) {
        return imageBuffer;
      }
      
      const wmType = event.watermark.type || 'LOGO';
      if (wmType === 'LOGO' && event.watermark.logoUrl) {
        wmSettings = {
          type: 'LOGO',
          logoUrl: event.watermark.logoUrl,
          position: event.watermark.position,
          opacity: event.watermark.opacity,
          widthPercentage: event.watermark.width,
          heightPercentage: event.watermark.height,
        };
      } else if (wmType === 'TEXT' && event.watermark.text) {
        wmSettings = {
          type: 'TEXT',
          text: event.watermark.text,
          position: event.watermark.position,
          opacity: event.watermark.opacity,
          widthPercentage: event.watermark.width,
          heightPercentage: event.watermark.height,
        };
      }
    }
  }

  if (!wmSettings) {
    const studio = await Studio.findById(studioId);
    if (!studio || !studio.watermark || studio.watermark.type === 'NONE') {
      return imageBuffer;
    }
    wmSettings = {
      type: studio.watermark.type,
      text: studio.watermark.text,
      logoUrl: studio.watermark.logoUrl,
      position: studio.watermark.position,
      opacity: studio.watermark.opacity,
      widthPercentage: 18, // Legacy studio default
      heightPercentage: null,
    };
  }

  const { type, text, logoUrl, position, opacity, widthPercentage, heightPercentage } = wmSettings;
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;

  if (type === 'TEXT' && text) {
    // Size relative to image width so it scales identically in masonry columns
    const fontSize = Math.round(width * 0.035);
    const margin = Math.round(width * 0.02); // 2% margin

    // Calculate text position based on the position setting
    let textX: string;
    let textY: string;
    let textAnchor: string;
    let dominantBaseline: string;

    switch (position) {
      case 'TOP_LEFT':
        textX = `${margin}`;
        textY = `${margin + fontSize}`;
        textAnchor = 'start';
        dominantBaseline = 'auto';
        break;
      case 'TOP_RIGHT':
        textX = `${width - margin}`;
        textY = `${margin + fontSize}`;
        textAnchor = 'end';
        dominantBaseline = 'auto';
        break;
      case 'BOTTOM_LEFT':
        textX = `${margin}`;
        textY = `${height - margin}`;
        textAnchor = 'start';
        dominantBaseline = 'auto';
        break;
      case 'BOTTOM_RIGHT':
        textX = `${width - margin}`;
        textY = `${height - margin}`;
        textAnchor = 'end';
        dominantBaseline = 'auto';
        break;
      case 'CENTER':
      default:
        textX = '50%';
        textY = '50%';
        textAnchor = 'middle';
        dominantBaseline = 'middle';
        break;
    }

    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .watermark-text {
            fill: #ffffff;
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: ${opacity};
          }
        </style>
        <text x="${textX}" y="${textY}" class="watermark-text" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${text}</text>
      </svg>
    `;
    return sharp(imageBuffer)
      .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
      .toBuffer();
  } else if (type === 'LOGO' && logoUrl) {
    try {
      const logoBuffer = await downloadUrlToBuffer(logoUrl);
      // Size relative to image width
      const logoResizedWidth = Math.round(width * (widthPercentage / 100));
      
      let sharpLogo = sharp(logoBuffer);
      if (heightPercentage) {
        const refHeight = Math.round(width * 0.75); // Assume ~4:3 reference relative to width
        const logoResizedHeight = Math.round(refHeight * (heightPercentage / 100));
        sharpLogo = sharpLogo.resize({ width: logoResizedWidth, height: logoResizedHeight, fit: 'fill' });
      } else {
        sharpLogo = sharpLogo.resize({ width: logoResizedWidth });
      }

      // Convert to PNG buffer first so we can wrap it in SVG for opacity
      const resizedLogoBuffer = await sharpLogo.png().toBuffer();
      const logoMeta = await sharp(resizedLogoBuffer).metadata();
      const logoW = logoMeta.width || logoResizedWidth;
      const logoH = logoMeta.height || 100;

      // Apply opacity using an SVG wrapper
      const svgWrapper = `
        <svg width="${logoW}" height="${logoH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <image xlink:href="data:image/png;base64,${resizedLogoBuffer.toString('base64')}" width="${logoW}" height="${logoH}" opacity="${opacity}" />
        </svg>
      `;

      const finalLogoBuffer = await sharp(Buffer.from(svgWrapper)).png().toBuffer();

      const pos = getWatermarkPosition(position, width, height, logoW, logoH);

      return sharp(imageBuffer)
        .composite([{ input: finalLogoBuffer, top: pos.top, left: pos.left }])
        .toBuffer();
    } catch (err) {
      console.error('Error applying logo watermark, saving unwatermarked image:', err);
      return imageBuffer;
    }
  }

  return imageBuffer;
};

// Refactored async process methods so they can be called directly
export const processPhoto = async (mediaId: string, studioId: string) => {
  const media = await Media.findById(mediaId);
  if (!media) throw new Error('Media document not found');

  await Media.findByIdAndUpdate(mediaId, { processedStatus: 'PROCESSING' });

  try {
    const originalBuffer = await downloadUrlToBuffer(media.r2Url);
    const metadata = await sharp(originalBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    let galleryImage = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 95 })
      .toBuffer();

    galleryImage = await applyWatermark(galleryImage, studioId, media.eventId.toString());

    const folderForCloudinary = `events/${media.eventId}/photos/gallery`;
    const { url: compressedUrl } = await uploadFile(galleryImage, folderForCloudinary);

    const thumbnailImage = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 400 })
      .jpeg({ quality: 75 })
      .toBuffer();

    const thumbFolder = `events/${media.eventId}/photos/thumb`;
    const { url: thumbnailUrl } = await uploadFile(thumbnailImage, thumbFolder);

    const formData = new FormData();
    // CRITICAL: Send ORIGINAL high-res image to AI service for best face detection
    // Previously sent the watermarked 1600px gallery image which missed small/covered faces
    const fileBlob = new Blob([new Uint8Array(originalBuffer)], { type: 'image/jpeg' });
    formData.append('file', fileBlob, 'image.jpg');

    let faces = [];
    let faceIndexStatus: 'INDEXED' | 'NO_FACE' | 'FAILED' = 'NO_FACE';
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
        timeout: 60000, // 60 second timeout for large images
      });
      faces = aiResponse.data.faces || [];
      faceIndexStatus = faces.length > 0 ? 'INDEXED' : 'NO_FACE';
    } catch (aiErr: any) {
      console.warn(`[AI Warning]: AI Face Service offline. Skipping face detection for photo ${mediaId}:`, aiErr.message);
      faceIndexStatus = 'FAILED';
    }
    console.log(`Detected ${faces.length} faces in photo ${mediaId}`);

    for (const face of faces) {
      const faceDoc = await FaceEmbedding.create({
        mediaId: media._id,
        eventId: media.eventId,
        studioId: media.studioId,
        embedding: face.embedding,
        bbox: face.bbox,
        faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
        detectionConfidence: face.det_score || 0,
        faceQuality: face.quality || 0,
        modelVersion: 'buffalo_l_v1',
        imageWidth: width,
        imageHeight: height,
      });
      
      try {
        if (await isQdrantAvailable()) {
          await insertFaceEmbedding(
            media.eventId.toString(),
            media._id.toString(),
            face.embedding,
            faceDoc._id.toString()
          );
        }
      } catch (qErr) {
        console.warn(`[Qdrant] Failed to insert face embedding for photo ${mediaId}:`, qErr);
      }
    }

    await Media.findByIdAndUpdate(mediaId, {
      processedStatus: 'COMPLETED',
      thumbnailUrl,
      compressedUrl,
      width,
      height,
      faceIndexStatus,
      faceCount: faces.length,
    });
  } catch (err: any) {
    console.error(`Failed to process photo ${mediaId}:`, err);
    await Media.findByIdAndUpdate(mediaId, { processedStatus: 'FAILED' });
    throw err;
  }
};

try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }
  if (ffprobeInstaller && ffprobeInstaller.path) {
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
  }
} catch (err: any) {
  console.log('[MediaWorker] Note on ffmpeg installers:', err?.message || err);
}

export const processVideo = async (mediaId: string, studioId: string) => {
  const media = await Media.findById(mediaId);
  if (!media) throw new Error('Media document not found');

  await Media.findByIdAndUpdate(mediaId, { processedStatus: 'PROCESSING' });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-proc-'));
  const tempVideoPath = path.join(tempDir, `video_${mediaId}.mp4`);
  const framesDir = path.join(tempDir, 'frames');
  fs.mkdirSync(framesDir);

  let duration = 0;
  let thumbnailUrl = media.thumbnailUrl || '';

  // Default ImageKit video thumbnail if available
  if (!thumbnailUrl && media.r2Url && media.r2Url.includes('imagekit.io')) {
    thumbnailUrl = `${media.r2Url}/ik-thumbnail.jpg`;
  }

  try {
    const originalBuffer = await downloadUrlToBuffer(media.r2Url);
    fs.writeFileSync(tempVideoPath, originalBuffer);

    try {
      duration = await new Promise((resolve) => {
        ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
          if (err) {
            console.warn('[Video Proc] ffprobe warning:', err.message);
            resolve(0);
          } else {
            resolve(metadata?.format?.duration || 0);
          }
        });
      });
    } catch (ffprobeErr) {
      console.warn('[Video Proc] ffprobe caught:', ffprobeErr);
    }

    try {
      await new Promise<void>((resolve) => {
        ffmpeg(tempVideoPath)
          .outputOptions([
            '-vf', 'fps=1/2',
            '-vsync', 'vfr',
          ])
          .output(path.join(framesDir, 'frame-%03d.jpg'))
          .on('end', () => resolve())
          .on('error', (err) => {
            console.warn('[Video Proc] Frame extraction warning:', err.message);
            resolve();
          })
          .run();
      });

      const frameFiles = fs.readdirSync(framesDir).sort();
      console.log(`Extracted ${frameFiles.length} frames from video ${mediaId}`);

      for (let i = 0; i < frameFiles.length; i++) {
        const frameFile = frameFiles[i];
        const framePath = path.join(framesDir, frameFile);
        const timestamp = i * 2 + 1;

        const frameBuffer = fs.readFileSync(framePath);

        const formData = new FormData();
        const fileBlob = new Blob([new Uint8Array(frameBuffer)], { type: 'image/jpeg' });
        formData.append('file', fileBlob, 'frame.jpg');

        try {
          const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
          });

          const faces = aiResponse.data?.faces || [];
          for (const face of faces) {
            const faceDoc = await FaceEmbedding.create({
              mediaId: media._id,
              eventId: media.eventId,
              studioId: media.studioId,
              embedding: face.embedding,
              bbox: face.bbox,
              faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
              timestamp,
            });
            
            try {
              if (await isQdrantAvailable()) {
                await insertFaceEmbedding(
                  media.eventId.toString(),
                  media._id.toString(),
                  face.embedding,
                  faceDoc._id.toString()
                );
              }
            } catch (qErr) {
              console.warn(`[Qdrant] Failed to insert video face embedding for ${mediaId}:`, qErr);
            }
          }
        } catch (aiErr) {
          // AI face detection is optional per frame
        }
      }
    } catch (framesErr) {
      console.warn('[Video Proc] Frames processing error:', framesErr);
    }

    try {
      const thumbFolder = `events/${media.eventId}/videos/thumb`;
      const tempThumbPath = path.join(tempDir, 'vid_thumb.jpg');

      await new Promise<void>((resolve) => {
        ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: [Math.min(2, Math.max(1, duration / 2))],
            folder: tempDir,
            filename: 'vid_thumb.jpg',
            size: '400x?',
          })
          .on('end', () => resolve())
          .on('error', (err) => {
            console.warn('[Video Proc] Screenshot warning:', err.message);
            resolve();
          });
      });

      if (fs.existsSync(tempThumbPath)) {
        const thumbBuffer = fs.readFileSync(tempThumbPath);
        const { url } = await uploadFile(thumbBuffer, thumbFolder);
        if (url) thumbnailUrl = url;
      }
    } catch (thumbErr) {
      console.warn('[Video Proc] Thumbnail generation warning:', thumbErr);
    }

    // ── Video Compression to strictly max 15-20MB (Target ~17.5MB) ──
    let finalCompressedUrl = media.r2Url;
    let finalSize = originalBuffer.length;

    try {
      const TARGET_MAX_BYTES = 18 * 1024 * 1024; // 18MB target size
      const tempCompressedPath = path.join(tempDir, `comp_${mediaId}.mp4`);

      // Compress if the video exceeds 18MB, or optimize for web streaming
      if (originalBuffer.length > TARGET_MAX_BYTES) {
        const safeDuration = Math.max(duration || 0, 5); // Minimum 5s
        const totalTargetBits = TARGET_MAX_BYTES * 8; // ~150,994,944 bits
        const audioBitrateBps = 128 * 1000; // 128 kbps audio
        const totalAudioBits = audioBitrateBps * safeDuration;
        const availableVideoBits = Math.max(totalTargetBits - totalAudioBits, totalTargetBits * 0.85);
        const rawVideoBitrateBps = Math.floor(availableVideoBits / safeDuration);

        // Clamp video bitrate between 500kbps and 3200kbps
        const targetBitrateKbps = Math.max(500, Math.min(3200, Math.floor(rawVideoBitrateBps / 1000)));
        const maxRateKbps = Math.floor(targetBitrateKbps * 1.15);
        const bufSizeKbps = Math.floor(targetBitrateKbps * 1.8);

        // Adaptive resolution: 1080p max for <= 90s, 720p for longer videos
        const scaleFilter = safeDuration <= 90
          ? 'scale=w=min(1920\\,iw):h=min(1080\\,ih):force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2'
          : 'scale=w=min(1280\\,iw):h=min(720\\,ih):force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2';

        console.log(`[Video Proc] Compressing video ${mediaId} (${(originalBuffer.length / (1024 * 1024)).toFixed(2)}MB, duration: ${safeDuration}s) to target 15-20MB with bitrate ${targetBitrateKbps}kbps...`);

        await new Promise<void>((resolve) => {
          ffmpeg(tempVideoPath)
            .outputOptions([
              '-c:v', 'libx264',
              '-preset', 'fast',
              '-b:v', `${targetBitrateKbps}k`,
              '-maxrate', `${maxRateKbps}k`,
              '-bufsize', `${bufSizeKbps}k`,
              '-vf', scaleFilter,
              '-c:a', 'aac',
              '-b:a', '128k',
              '-pix_fmt', 'yuv420p',
              '-movflags', '+faststart',
            ])
            .output(tempCompressedPath)
            .on('end', () => resolve())
            .on('error', (err) => {
              console.warn(`[Video Proc] Video compression warning for ${mediaId}:`, err.message);
              resolve();
            })
            .run();
        });

        if (fs.existsSync(tempCompressedPath)) {
          const compStats = fs.statSync(tempCompressedPath);
          console.log(`[Video Proc] Video ${mediaId} compression result: ${(originalBuffer.length / (1024 * 1024)).toFixed(2)}MB -> ${(compStats.size / (1024 * 1024)).toFixed(2)}MB`);

          if (compStats.size > 0 && compStats.size < originalBuffer.length) {
            const compBuffer = fs.readFileSync(tempCompressedPath);
            const compFolder = `events/${media.eventId}/videos/compressed`;
            const { url: compUrl } = await uploadFile(compBuffer, compFolder);
            if (compUrl) {
              finalCompressedUrl = compUrl;
              finalSize = compStats.size;
            }
          }
        }
      } else {
        console.log(`[Video Proc] Video ${mediaId} is already ${(originalBuffer.length / (1024 * 1024)).toFixed(2)}MB (<= 18MB), within 15-20MB limit.`);
      }
    } catch (compErr) {
      console.warn(`[Video Proc] Compression step failed for ${mediaId}:`, compErr);
    }

    // Always mark as COMPLETED so video is fully playable!
    await Media.findByIdAndUpdate(mediaId, {
      processedStatus: 'COMPLETED',
      thumbnailUrl: thumbnailUrl || (media.r2Url.includes('imagekit.io') ? `${media.r2Url}/ik-thumbnail.jpg` : media.r2Url),
      compressedUrl: finalCompressedUrl,
      size: finalSize,
      duration,
    });

    await Studio.findByIdAndUpdate(studioId, { $inc: { 'usage.videosUploaded': 1 } });
  } catch (err: any) {
    console.error(`Error processing video ${mediaId}, falling back to COMPLETED:`, err);
    // Graceful fallback to COMPLETED so the video is never stuck in FAILED state!
    await Media.findByIdAndUpdate(mediaId, {
      processedStatus: 'COMPLETED',
      thumbnailUrl: thumbnailUrl || (media.r2Url && media.r2Url.includes('imagekit.io') ? `${media.r2Url}/ik-thumbnail.jpg` : media.r2Url),
      compressedUrl: media.r2Url,
      duration: 0,
    });
    await Studio.findByIdAndUpdate(studioId, { $inc: { 'usage.videosUploaded': 1 } });
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.error('Error cleaning up temp directory:', cleanupErr);
    }
  }
};

export const processMediaLocal = async (mediaId: string, type: 'PHOTO' | 'VIDEO', studioId: string) => {
  if (type === 'PHOTO') {
    await processPhoto(mediaId, studioId);
  } else {
    await processVideo(mediaId, studioId);
  }
};

/**
 * Super-fast re-watermarking:
 * Skips AI face detection and vector indexing (since faces already exist).
 * Regenerates the 1600px gallery view with the updated watermark and uploads to storage.
 */
export const reapplyWatermarkToPhoto = async (mediaId: string, studioId: string, eventId: string) => {
  try {
    const media = await Media.findById(mediaId);
    if (!media) return;

    const sourceUrl = media.r2Url;
    if (!sourceUrl) return;

    const originalBuffer = await downloadUrlToBuffer(sourceUrl);

    let galleryImage = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 95 })
      .toBuffer();

    galleryImage = await applyWatermark(galleryImage, studioId, eventId);

    const folderForCloudinary = `events/${eventId}/photos/gallery`;
    const { url: compressedUrl } = await uploadFile(galleryImage, folderForCloudinary);

    await Media.findByIdAndUpdate(mediaId, {
      compressedUrl,
      processedStatus: 'COMPLETED'
    });
    console.log(`[Watermark Fast-Lane] Photo ${mediaId} re-watermarked successfully.`);
  } catch (err: any) {
    console.error(`[Watermark Fast-Lane] Failed for photo ${mediaId}:`, err.message);
  }
};


// Initialize BullMQ workers only when Redis is available
function initWorkers() {
  const photoWorker = new Worker(
    'photo-processing',
    async (job: Job) => {
      const { mediaId, studioId } = job.data;
      await processPhoto(mediaId, studioId);
    },
    { connection: redisConfig }
  );

  const videoWorker = new Worker(
    'video-processing',
    async (job: Job) => {
      const { mediaId, studioId } = job.data;
      await processVideo(mediaId, studioId);
    },
    { connection: redisConfig }
  );

  photoQueue!.on('error', (err) => console.warn('BullMQ photoQueue warning:', err.message));
  videoQueue!.on('error', (err) => console.warn('BullMQ videoQueue warning:', err.message));
  photoWorker.on('error', (err) => console.warn('BullMQ photoWorker warning:', err.message));
  videoWorker.on('error', (err) => console.warn('BullMQ videoWorker warning:', err.message));
}
