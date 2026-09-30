import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maraphoto');
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    await db!.collection('users').deleteMany({});
    await db!.collection('studios').deleteMany({});
    await db!.collection('events').deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await db!.collection('users').insertOne({
      name: 'Test Admin',
      email: 'admin@meraphoto.com',
      passwordHash,
      role: 'STUDIO_OWNER',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const studio = await db!.collection('studios').insertOne({
      name: 'Test Studio',
      subdomain: 'teststudio',
      ownerId: user.insertedId,
      subscriptionPlan: 'STARTER',
      subscriptionStatus: 'FREE',
      watermark: {
        enabled: true,
        type: 'TEXT',
        text: 'Test Studio',
        position: 'BOTTOM_RIGHT',
        opacity: 0.5,
        fontSize: 48
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db!.collection('events').insertOne({
      name: 'Kukadiya Wedding',
      code: 'kukadiya-wedding',
      clientName: 'Test Client',
      clientMobile: '1234567890',
      clientEmail: 'client@test.com',
      type: 'WEDDING',
      studioId: studio.insertedId,
      date: new Date(),
      status: 'PUBLISHED',
      accessType: 'PUBLIC',
      coverImageR2Key: '',
      photoCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Successfully seeded User, Studio, and Event');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
