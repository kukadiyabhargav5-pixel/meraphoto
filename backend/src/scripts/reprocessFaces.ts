import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Media, FaceEmbedding } from '../models';
import { processPhoto } from '../workers/mediaWorker';

import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected.');

    console.log('Deleting all existing face embeddings (they were tiny 400px versions)...');
    await FaceEmbedding.deleteMany({});
    console.log('Cleared old embeddings.');

    const photos = await Media.find({ type: 'PHOTO' });
    console.log(`Found ${photos.length} photos. Starting re-processing using high-res engine...`);

    let count = 0;
    for (const photo of photos) {
      try {
        console.log(`Processing photo ${count + 1}/${photos.length}: ${photo._id}`);
        await processPhoto(photo._id.toString(), photo.studioId.toString());
        count++;
      } catch (err) {
        console.error(`Failed to process ${photo._id}`, err);
      }
    }

    console.log(`Finished reprocessing ${count}/${photos.length} photos.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
