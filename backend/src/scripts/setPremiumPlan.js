const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maraphoto');
  console.log('Connected to MongoDB');

  const studioCollection = mongoose.connection.db.collection('studios');
  const userCollection = mongoose.connection.db.collection('users');

  const user = await userCollection.findOne({ email: 'kukadiyabhargav5@gmail.com' });
  console.log('User:', user ? { id: user._id, email: user.email } : 'Not found');

  const now = new Date();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // Update all studios belonging to this user or any active studio to PREMIUM
  const updateResult = await studioCollection.updateMany(
    {},
    {
      $set: {
        subscriptionPlan: 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: now,
        subscriptionExpiresAt: oneYearLater,
        updatedAt: now
      }
    }
  );

  console.log('Updated studios count to PREMIUM:', updateResult.modifiedCount);

  const allStudios = await studioCollection.find({}).toArray();
  console.log('Studios:', allStudios.map(s => ({ id: s._id, name: s.name, plan: s.subscriptionPlan, status: s.subscriptionStatus, expiresAt: s.subscriptionExpiresAt })));

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
