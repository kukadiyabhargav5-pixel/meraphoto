const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/maraphoto')
  .then(async () => {
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
