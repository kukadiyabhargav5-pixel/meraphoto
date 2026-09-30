import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import { Media, FaceEmbedding } from './src/models';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  const allMedia = await Media.find({ type: 'PHOTO' });
  console.log(`Found ${allMedia.length} photos. Checking for missing face embeddings...`);

  let processedCount = 0;

  for (const media of allMedia) {
    const faceCount = await FaceEmbedding.countDocuments({ mediaId: media._id });
    if (faceCount > 0) {
      console.log(`Media ${media._id} already has ${faceCount} faces. Skipping.`);
      continue;
    }

    console.log(`Processing media ${media._id}...`);
    try {
      const url = media.compressedUrl || media.r2Url;
      if (!url) {
        console.log(`No URL for media ${media._id}. Skipping.`);
        continue;
      }
      
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(res.data);
      
      const formData = new FormData();
      const fileBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
      formData.append('file', fileBlob, 'image.jpg');

      const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const faces = aiResponse.data.faces || [];
      console.log(`Detected ${faces.length} faces in photo ${media._id}`);

      for (const face of faces) {
        await FaceEmbedding.create({
          mediaId: media._id,
          eventId: media.eventId,
          studioId: media.studioId,
          embedding: face.embedding,
          bbox: face.bbox,
          faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
        });
      }
      processedCount++;
    } catch (err: any) {
      console.error(`Failed to process media ${media._id}:`, err.message);
    }
  }

  console.log(`Done. Processed ${processedCount} photos.`);
  process.exit(0);
}

main().catch(console.error);
