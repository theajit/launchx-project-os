import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './db.js';

export async function ensureSchema() {
  const autoMigrate = process.env.AUTO_MIGRATE ?? 'true';
  if (autoMigrate !== 'true') {
    console.log('AUTO_MIGRATE is disabled. Skipping schema bootstrap.');
    return;
  }

  const schemaPath = join(process.cwd(), 'api', 'schema.sql');
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Database schema is ready.');
}
