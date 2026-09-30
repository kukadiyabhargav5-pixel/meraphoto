const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
  const Media = mongoose.model('Media', new mongoose.Schema({}, { strict: false }));
  const FaceEmbedding = mongoose.model('FaceEmbedding', new mongoose.Schema({
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Studio' },
    embedding: { type: [Number], required: true },
    bbox: { type: [Number] },
    faceThumbnailUrl: { type: String },
    detectionConfidence: { type: Number },
    faceQuality: { type: Number },
    modelVersion: { type: String, default: 'buffalo_l_v1' },
    imageWidth: { type: Number },
    imageHeight: { type: Number },
  }, { timestamps: true }));

  // Find all photos pending face indexing
  const pendingPhotos = await Media.find({
    type: 'PHOTO',
    faceIndexStatus: { $in: ['PENDING', null, undefined] }
  });

  console.log(`Found ${pendingPhotos.length} photos pending face indexing.`);

  let indexedCount = 0;
  let noFaceCount = 0;
  let failCount = 0;

  for (let i = 0; i < pendingPhotos.length; i++) {
    const photo = pendingPhotos[i];
    const imageUrl = photo.compressedUrl || photo.r2Url || photo.url;
    console.log(`\n[${i + 1}/${pendingPhotos.length}] Processing photo ${photo._id}...`);
    console.log(`Image URL: ${imageUrl}`);

    if (!imageUrl) {
      console.warn('No image URL found, skipping.');
      await Media.findByIdAndUpdate(photo._id, { faceIndexStatus: 'FAILED' });
      failCount++;
      continue;
    }

    try {
      // 1. Download image
      const imgRes = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      const buffer = Buffer.from(imgRes.data);

      // 2. Call AI service
      const formData = new FormData();
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('file', blob, 'image.jpg');

      const aiRes = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const faces = aiRes.data.faces || [];
      console.log(`Detected ${faces.length} face(s) in photo ${photo._id}`);

      // Delete any previous embeddings for this mediaId
      await FaceEmbedding.deleteMany({ mediaId: photo._id });

      // Save face embeddings
      for (const face of faces) {
        await FaceEmbedding.create({
          mediaId: photo._id,
          eventId: photo.eventId,
          studioId: photo.studioId,
          embedding: face.embedding,
          bbox: face.bbox,
          faceThumbnailUrl: `data:image/jpeg;base64,${face.thumbnail}`,
          detectionConfidence: face.det_score || 0,
          faceQuality: face.quality || 0,
          modelVersion: 'buffalo_l_v1',
          imageWidth: 0,
          imageHeight: 0,
        });
      }

      const status = faces.length > 0 ? 'INDEXED' : 'NO_FACE';
      await Media.findByIdAndUpdate(photo._id, {
        faceIndexStatus: status,
        faceCount: faces.length,
      });

      if (faces.length > 0) indexedCount++;
      else noFaceCount++;

    } catch (err) {
      console.error(`Error processing photo ${photo._id}:`, err.message);
      await Media.findByIdAndUpdate(photo._id, { faceIndexStatus: 'FAILED' });
      failCount++;
    }
  }

  console.log(`\n=== Indexing Summary ===`);
  console.log(`Total: ${pendingPhotos.length}`);
  console.log(`Indexed (faces found): ${indexedCount}`);
  console.log(`No Face: ${noFaceCount}`);
  console.log(`Failed: ${failCount}`);

  await mongoose.disconnect();
}

run().catch(console.error);
