const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maraphoto');
  console.log('Connected to MongoDB');

  const user = await mongoose.connection.db.collection('users').findOne({ email: 'kukadiyabhargav5@gmail.com' });
  if (user) {
    const startDate = new Date();
    const oneYear = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    await mongoose.connection.db.collection('studios').updateOne(
      { ownerId: user._id },
      { 
        $set: { 
          subscriptionPlan: 'STANDARD', 
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: startDate,
          subscriptionExpiresAt: oneYear 
        } 
      }
    );
    const studio = await mongoose.connection.db.collection('studios').findOne({ ownerId: user._id });
    console.log('Studio successfully updated to STANDARD with 1-year validity:', studio);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
