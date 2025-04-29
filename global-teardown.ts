import { Pool } from 'pg';
import { TEST_USER_EMAIL } from './global-setup.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function globalTeardown() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'calendar',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  try {
    // Delete test user from the database
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_USER_EMAIL]);
    console.log('Global teardown: Test user cleanup completed');
  } catch (error) {
    console.error('Global teardown: Error cleaning up test user:', error);
  } finally {
    await pool.end();
  }
}

export default globalTeardown; 