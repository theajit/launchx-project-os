import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function ensureSchema() {
  const autoMigrate = process.env.AUTO_MIGRATE ?? 'true';
  if (autoMigrate !== 'true') {
    console.log('AUTO_MIGRATE is disabled. Skipping schema bootstrap.');
    return;
  }

  const schemaPath = join(__dirname, '..', 'schema.sql');
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Database schema is ready.');
}
