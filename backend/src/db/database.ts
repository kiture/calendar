import pg from 'pg';
const { Pool } = pg;
type QueryResult = pg.QueryResult;
import dotenv from 'dotenv';

dotenv.config();

// Create a PostgreSQL connection pool
// The pool manages multiple client connections
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'calendar',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listener for errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', client, err);
});

/**
 * Executes a SQL query against the database pool.
 *
 * @param text The SQL query string. Can include placeholders like $1, $2.
 * @param params An array of parameters to substitute into the query placeholders.
 * @returns A Promise resolving to the QueryResult.
 */
export const query = async (
  text: string,
  params?: unknown[]
): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), duration: `${duration}ms`, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), error });
    throw error;
  }
};

console.log('Database connection pool created.');

export default pool;