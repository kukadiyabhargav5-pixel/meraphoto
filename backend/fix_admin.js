const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const run = async () => {
  try {
    const MONGO_URI = 'mongodb://127.0.0.1:27017/maraphoto';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const email = 'maraphoto303@gmail.com';
    const password = 'maraphoto@2005';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await users.updateOne(
      { email },
      { 
        $set: { 
          passwordHash,
          role: 'SUPER_ADMIN',
          name: 'Super Admin',
          status: 'ACTIVE'
        } 
      },
      { upsert: true }
    );
    
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
