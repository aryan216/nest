import mongoose from "mongoose";

interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongo = globalThis as typeof globalThis & { mongoCache?: MongoCache };

function cache(): MongoCache {
  if (!globalForMongo.mongoCache) {
    globalForMongo.mongoCache = { conn: null, promise: null };
  }
  return globalForMongo.mongoCache;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  const current = cache();
  if (current.conn) return current.conn;
  if (!current.promise) {
    current.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "nestverify",
      serverSelectionTimeoutMS: 4000,
    });
  }
  try {
    current.conn = await current.promise;
    return current.conn;
  } catch (error) {
    current.promise = null;
    current.conn = null;
    throw error;
  }
}
