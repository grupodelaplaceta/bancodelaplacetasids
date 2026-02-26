import { Pool } from '@neondatabase/serverless';

// Fix: Use any type for pool to avoid type issues with Pool methods.
let pool: any = null;

export const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }
    // Fix: Cast Pool to any to bypass constructor argument count mismatch.
    pool = new (Pool as any)({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
};
