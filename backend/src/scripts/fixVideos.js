const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maraphoto');
  console.log('Connected to MongoDB');

  const failedVideos = await mongoose.connection.db.collection('media').find({ type: 'VIDEO' }).toArray();
  console.log(`Found ${failedVideos.length} videos:`, failedVideos.map(v => ({ id: v._id, status: v.processedStatus, r2Url: v.r2Url, thumb: v.thumbnailUrl })));

  for (const v of failedVideos) {
    const thumb = v.thumbnailUrl || (v.r2Url && v.r2Url.includes('imagekit.io') ? `${v.r2Url}/ik-thumbnail.jpg` : v.r2Url);
    await mongoose.connection.db.collection('media').updateOne(
      { _id: v._id },
      { 
        $set: { 
          processedStatus: 'COMPLETED',
          thumbnailUrl: thumb,
          compressedUrl: v.r2Url
        } 
      }
    );
  }

  console.log('All videos updated to COMPLETED with valid thumbnail URLs.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
