const mongoose = require('mongoose');
const { Media } = require('../dist/models');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maraphoto');
  const count = await Media.countDocuments({});
  console.log('Total media count:', count);
  // Set creditDeducted: true for all existing media
  const result = await Media.updateMany(
    {},
    { $set: { creditDeducted: true } }
  );
  console.log('Updated existing media with creditDeducted: true ->', result.modifiedCount);
  await mongoose.disconnect();
}

check().catch(console.error);
