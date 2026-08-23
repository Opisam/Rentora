import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// load the TEST env explicitly — plain 'dotenv/config' reads .env, which does
// not exist on CI runners (it is gitignored), leaving DB_PASSWORD undefined
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '..', '.env.test') });

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres',
});

async function main() {
  await client.connect();
  const dbName = process.env.TEST_DB_NAME || 'rental_platform_test';
  try {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database ${dbName}`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database ${dbName} already exists`);
    } else {
      throw err;
    }
  }
}

main()
  .catch((err) => { console.error('Failed:', err.message); process.exit(1); })
  .finally(() => client.end());
