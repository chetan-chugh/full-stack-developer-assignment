import mongoose from 'mongoose';

async function connectDB(): Promise<void> {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB is connected successfully');
  } catch (error) {
    console.error(`MongoDB connection failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

export default connectDB;