import { Pool } from '@neondatabase/serverless';

// Ensure the database URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Fix: Cast Pool to any to bypass constructor argument count mismatch and type issues in the current environment.
export const pool: any = new (Pool as any)({
  connectionString: process.env.DATABASE_URL,
});

export const query = async (text: string, params?: any[]) => {
  // Fix: Use pool.query directly to handle connection pooling and bypass PoolClient type issues.
  return pool.query(text, params);
};
