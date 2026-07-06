import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function ensureSchema() {
  const autoMigrate = process.env.AUTO_MIGRATE ?? 'true';
  if (autoMigrate !== 'true') {
    console.log('AUTO_MIGRATE is disabled. Skipping migrations.');
    return;
  }

  await pool.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const migrationsDir = join(__dirname, '..', 'migrations');
  let files: string[] = [];
  try {
    files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  } catch {
    const schemaPath = join(__dirname, '..', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database schema is ready from legacy schema.sql.');
    return;
  }

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const existing = await pool.query('select version from schema_migrations where version=$1', [version]);
    if (existing.rowCount) continue;

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await pool.query('begin');
    try {
      await pool.query(sql);
      await pool.query('insert into schema_migrations (version) values ($1)', [version]);
      await pool.query('commit');
      console.log(`Applied migration ${version}`);
    } catch (error) {
      await pool.query('rollback');
      throw error;
    }
  }

  console.log('Database migrations are up to date.');
}
