import bcrypt from 'bcryptjs';
import pool from '../database.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await pool.query(fs.readFileSync(path.join(scriptDirectory, '..', 'schema.sql'), 'utf8'));
  const migrationDirectory = path.join(scriptDirectory, '..', 'migrations');
  const migrations = fs.readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort();
  for (const migration of migrations) {
    await pool.query(fs.readFileSync(path.join(migrationDirectory, migration), 'utf8'));
  }
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Runtime administrator credentials are required');
  await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, 'Runtime Administrator')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name`,
    [email, await bcrypt.hash(password, 10)],
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
