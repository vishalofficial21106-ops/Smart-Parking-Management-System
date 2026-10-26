const mongoose = require('mongoose');
const { seedInitialData } = require('../scripts/seedData');

let memoryServerInstance = null;

/**
 * Connect to MongoDB Atlas using MONGODB_URI from environment variables.
 * If local daemon is not running, falls back seamlessly to embedded in-memory MongoDB
 * so college project presentations run out-of-the-box with real database operations!
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_parking_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // Fast timeout on localhost if no daemon
    });

    const isAtlas = uri.includes('mongodb.net') || uri.includes('cluster');
    console.log(`=================================================`);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    console.log(`[Database Type]: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
    console.log(`[Database Name]: ${conn.connection.name}`);
    console.log(`=================================================`);

    // Auto-seed if newly deployed database has no parking slots
    await seedInitialData(false);
  } catch (error) {
    console.warn(`[Primary MongoDB Connection Warning]: ${error.message}`);

    // If local MongoDB is not running, spin up an embedded in-memory MongoDB server
    try {
      console.log(`[Embedded DB]: Launching zero-config In-Memory MongoDB Server for presentation demo...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();

      const memConn = await mongoose.connect(memoryUri);
      console.log(`=================================================`);
      console.log(`[Embedded MongoDB Connected]: ${memConn.connection.host}`);
      console.log(`[Database Mode]: Zero-Config Embedded Engine (Presentation Ready)`);
      console.log(`=================================================`);

      // Seed presentation data
      await seedInitialData(false);
    } catch (fallbackError) {
      console.error(`[Fallback DB Error]: ${fallbackError.message}`);
      console.error(`Tip: Ensure your MONGODB_URI in backend/.env is correct and your IP is whitelisted in MongoDB Atlas Network Access.`);
    }
  }
};

module.exports = connectDB;
