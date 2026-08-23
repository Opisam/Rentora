import pg from 'pg';
import 'dotenv/config';

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
