const mongoose = require('mongoose');

async function sync() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maraphoto');
  console.log('Connected to DB');
  
  const events = await mongoose.connection.collection('events').find().toArray();
  for (const event of events) {
    const customer = await mongoose.connection.collection('customers').findOne({
      studioId: event.studioId,
      $or: [{ phone: event.clientMobile }, { email: event.clientEmail }]
    });
    
    if (!customer) {
      await mongoose.connection.collection('customers').insertOne({
        studioId: event.studioId,
        name: event.clientName,
        phone: event.clientMobile,
        email: event.clientEmail,
        totalEvents: 1,
        status: 'Active',
        createdAt: new Date(),
        lastActive: new Date()
      });
      console.log('Inserted customer for event:', event.name);
    } else {
      console.log('Customer already exists for event:', event.name);
    }
  }
  
  console.log('Sync complete');
  process.exit(0);
}
sync();
