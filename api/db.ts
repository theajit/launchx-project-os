import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set. API DB routes will fail until Postgres is configured.');
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = unknown>(text: string, params: unknown[] = []) {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
