const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jj_just_job');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMockDb = false;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('--- USER EXPERIENCE ENHANCEMENT ---');
    console.log('Local MongoDB instance is not running. Falling back to built-in JSON file database (db.json) for a seamless user experience!');
    console.log('------------------------------------');
    global.useMockDb = true;
  }
};

module.exports = connectDB;
