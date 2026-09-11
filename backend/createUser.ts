import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb://127.0.0.1:27017/maraphoto';

async function createUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    const email = 'kukadiyabhargav5@gmail.com';
    const existingUser = await db!.collection('users').findOne({ email });

    if (existingUser) {
      console.log('User already exists. Updating password to password123');
      const passwordHash = await bcrypt.hash('password123', 10);
      await db!.collection('users').updateOne({ email }, { $set: { passwordHash } });
    } else {
      console.log('Creating new user');
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await db!.collection('users').insertOne({
        name: 'Bhargav Kukadiya',
        email,
        passwordHash,
        role: 'STUDIO_OWNER',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const studio = await db!.collection('studios').insertOne({
        name: 'Bhargav Studio',
        subdomain: 'bhargavstudio',
        ownerId: user.insertedId,
        subscriptionPlan: 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('User and studio created');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createUser();
