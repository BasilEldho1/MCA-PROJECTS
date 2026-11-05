import mongoose from 'mongoose';

let isConnected = false;
let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/3d-floorplan-designer';
  
  // 1. Try connecting to specified MONGODB_URI or local MongoDB service
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // Quick timeout to fall back to in-memory MongoDB
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to MongoDB at: ${uri}`);
    return;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to external MongoDB at "${uri}".`);
    console.log(`[MongoDB] Trying embedded MongoDB engine or built-in Memory Store...`);
  }

  // 2. Try spinning up embedded MongoMemoryServer if available
  try {
    const mms = await import('mongodb-memory-server');
    if (mms && mms.MongoMemoryServer) {
      mongoMemoryServer = await mms.MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      isConnected = true;
      console.log(`[MongoDB] Successfully started & connected to MongoDB (In-Memory Engine) at: ${memUri}`);
      return;
    }
  } catch (memError) {
    console.warn(`[MongoDB] Embedded MongoMemoryServer skipped (${memError.message || 'using standalone store'}).`);
  }

  // 3. Fallback to active built-in Memory Data Store
  console.log(`[Data Engine] Active: Built-in High-Performance Memory & JSON Persistent Store`);
  isConnected = false;
};

export const isDBConnected = () => isConnected;


