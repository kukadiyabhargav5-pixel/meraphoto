import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maraphoto');
    console.log('Connected to DB');
    
    // Clear Media, FaceEmbeddings
    const db = mongoose.connection.db;
    await db!.collection('media').deleteMany({});
    await db!.collection('faceembeddings').deleteMany({});
    
    console.log('Cleared Media and FaceEmbeddings');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clearDB();
