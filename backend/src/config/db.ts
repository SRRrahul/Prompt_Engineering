import mongoose from 'mongoose';
import crypto from 'crypto';

export const uid = () => crypto.randomUUID();

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is missing');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');
}

export default mongoose;

