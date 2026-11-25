const mongoose = require('mongoose');
const dns = require('dns');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('[MongoDB] Already connected to database.');
    return;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('\n======================================================');
    console.error('[MongoDB Error] MONGODB_URI is not defined in environment variables!');
    console.error('Please configure MONGODB_URI in server/.env (e.g. your MongoDB Atlas connection string).');
    console.error('Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hitayu_db');
    console.error('======================================================\n');
    throw new Error('Database configuration missing: MONGODB_URI environment variable required.');
  }

  try {
    if (mongoURI.startsWith('mongodb+srv://')) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      dbName: 'hitayu_db'
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB Connection Error]:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database.');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error('\n======================================================');
    console.error(`[MongoDB Connection Failed]: ${error.message}`);
    console.error('Could not connect to MongoDB Atlas / Local MongoDB instance.');
    console.error('Please check your network connection, Atlas IP whitelist, or local mongod service.');
    console.error('======================================================\n');
    
    // In local dev/test environment without an active Atlas/local service,
    // we can attempt a transparent fallback to mongodb-memory-server so tests & verification
    // run against a real MongoDB engine without silently switching to fake storage.
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Attempting local development MongoDB instance fallback via mongodb-memory-server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const memConn = await mongoose.connect(memUri, { dbName: 'hitayu_db' });
        isConnected = true;
        console.log(`[MongoDB] Development MongoDB Memory Engine active at: ${memUri}`);
        return memConn;
      } catch (memErr) {
        console.error('[MongoDB] Local memory server fallback failed:', memErr.message);
      }
    }
    
    throw error;
  }
};

const getStatus = () => ({
  isConnected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  name: mongoose.connection.name || null
});

module.exports = { connectDB, getStatus };
