import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './src/models';

dotenv.config();

const run = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maraphoto';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const email = 'maraphoto303@gmail.com';
    const password = 'password123'; // we'll set a standard password

    let user = await User.findOne({ email });
    if (!user) {
      console.log('User not found. Creating new SUPER_ADMIN...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user = await User.create({
        name: 'Super Admin',
        email,
        passwordHash,
        role: 'SUPER_ADMIN'
      });
      console.log('Created user:', user.email);
    } else {
      console.log('User found. Updating to SUPER_ADMIN and resetting password...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user.role = 'SUPER_ADMIN';
      user.passwordHash = passwordHash;
      await user.save();
      console.log('Updated user:', user.email);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
