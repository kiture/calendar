import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration for the default database
const defaultClient = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to the default 'postgres' database
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Function to create the database if it doesn't exist
async function createDatabaseIfNotExists() {
  try {
    await defaultClient.connect();
    console.log('Connected to the default database.');

    const res = await defaultClient.query("SELECT 1 FROM pg_database WHERE datname = 'calendar'");
    if (res.rowCount === 0) {
      await defaultClient.query('CREATE DATABASE calendar');
      console.log('Database "calendar" created.');
    } else {
      console.log('Database "calendar" already exists.');
    }
  } catch (err) {
    console.error('Error checking/creating database:', err);
  } finally {
    await defaultClient.end();
    console.log('Disconnected from the default database.');
  }
}

// Function to run the migration
async function runMigration(migrationFileName: string): Promise<void> {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'calendar',
    password: process.env.DB_PASSWORD || 'Bleble91@',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  try {
    const migrationFilePath: string = path.join(__dirname, migrationFileName);
    const sql: string = fs.readFileSync(migrationFilePath, 'utf8');

    await client.connect();
    console.log('Connected to the database.');

    await client.query(sql);
    console.log('Migration executed successfully.');

  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
    console.log('Disconnected from the database.');
  }
}

// Execute the database creation and migration
(async () => {
    await createDatabaseIfNotExists();
    await runMigration('20231124123000_create_functions_schema.sql'); 
    await runMigration('20231124123000_create_initial_schema.sql'); 
})();