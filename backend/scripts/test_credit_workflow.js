const mongoose = require('mongoose');
const { Media, Studio, Event } = require('../dist/models');
const { calculateStudioCredits } = require('../dist/controllers/studioController');

async function testWorkflow() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maraphoto');
  
  const studio = await Studio.findById('6aa16cea56226ec787dad414');
  const event = await Event.findOne({ studioId: studio._id });
  console.log('Testing with Studio:', studio.name, 'Event:', event?.name);

  const initialCredits = await calculateStudioCredits(studio._id, studio.subscriptionPlan);
  console.log('Initial Credits:', {
    used: initialCredits.photos.used,
    remaining: initialCredits.photos.remaining,
    pendingSave: initialCredits.photos.pendingSave,
    projectedRemaining: initialCredits.photos.projectedRemaining
  });

  // 1. Simulate upload of 2 new photos (creditDeducted: false)
  const testMedia = await Media.insertMany([
    {
      type: 'PHOTO',
      r2Key: 'test-credit-1',
      r2Url: 'https://test.com/1.jpg',
      eventId: event._id,
      studioId: studio._id,
      size: 1000,
      uploadedBy: studio.ownerId,
      processedStatus: 'PENDING',
      creditDeducted: false
    },
    {
      type: 'PHOTO',
      r2Key: 'test-credit-2',
      r2Url: 'https://test.com/2.jpg',
      eventId: event._id,
      studioId: studio._id,
      size: 1000,
      uploadedBy: studio.ownerId,
      processedStatus: 'PENDING',
      creditDeducted: false
    }
  ]);
  console.log('Inserted 2 test photos with creditDeducted: false');

  // 2. Check credits after upload
  const creditsAfterUpload = await calculateStudioCredits(studio._id, studio.subscriptionPlan);
  console.log('Credits After Upload (Pending Save):', {
    used: creditsAfterUpload.photos.used,
    remaining: creditsAfterUpload.photos.remaining,
    pendingSave: creditsAfterUpload.photos.pendingSave,
    projectedRemaining: creditsAfterUpload.photos.projectedRemaining
  });

  if (creditsAfterUpload.photos.pendingSave !== 2) {
    throw new Error(`Expected pendingSave to be 2, got ${creditsAfterUpload.photos.pendingSave}`);
  }
  if (creditsAfterUpload.photos.projectedRemaining !== initialCredits.photos.remaining - 2) {
    throw new Error(`Expected projectedRemaining to be ${initialCredits.photos.remaining - 2}, got ${creditsAfterUpload.photos.projectedRemaining}`);
  }

  // 3. Simulate Event Save: Deduct uncredited photos
  const uncredited = await Media.find({ eventId: event._id, creditDeducted: { $ne: true } });
  const toDeduct = uncredited.filter(m => m.type === 'PHOTO').length;
  console.log(`Saving Event: Found ${toDeduct} uncredited photos to deduct.`);

  await Studio.findByIdAndUpdate(studio._id, {
    $inc: { 'usage.photosUploaded': toDeduct }
  });
  await Media.updateMany(
    { _id: { $in: uncredited.map(m => m._id) } },
    { $set: { creditDeducted: true } }
  );

  // 4. Check credits after Event Save
  const creditsAfterSave = await calculateStudioCredits(studio._id, studio.subscriptionPlan);
  console.log('Credits After Event Save (Deducted):', {
    used: creditsAfterSave.photos.used,
    remaining: creditsAfterSave.photos.remaining,
    pendingSave: creditsAfterSave.photos.pendingSave,
    projectedRemaining: creditsAfterSave.photos.projectedRemaining
  });

  if (creditsAfterSave.photos.used !== initialCredits.photos.used + 2) {
    throw new Error(`Expected used to increase by 2, got ${creditsAfterSave.photos.used}`);
  }
  if (creditsAfterSave.photos.remaining !== initialCredits.photos.remaining - 2) {
    throw new Error(`Expected remaining to decrease by 2, got ${creditsAfterSave.photos.remaining}`);
  }
  if (creditsAfterSave.photos.pendingSave !== 0) {
    throw new Error(`Expected pendingSave to be 0, got ${creditsAfterSave.photos.pendingSave}`);
  }

  // 5. Clean up test data and restore studio usage
  await Media.deleteMany({ _id: { $in: testMedia.map(m => m._id) } });
  await Studio.findByIdAndUpdate(studio._id, {
    $inc: { 'usage.photosUploaded': -2 }
  });
  console.log('Cleaned up test data and restored initial usage successfully.');

  const finalCredits = await calculateStudioCredits(studio._id, studio.subscriptionPlan);
  console.log('Final Restored Credits:', {
    used: finalCredits.photos.used,
    remaining: finalCredits.photos.remaining,
    pendingSave: finalCredits.photos.pendingSave
  });

  console.log('\n>>> ALL CREDIT WORKFLOW TESTS PASSED PERFECTLY! <<<');
  await mongoose.disconnect();
}

testWorkflow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
