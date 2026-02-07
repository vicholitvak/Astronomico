/**
 * Script para ejecutar migraciones de base de datos
 * Uso: node scripts/run-migration.js database/some-migration.sql
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';

const { Pool } = pg;

// Load environment variables (try .env.local first, then .env.production)
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env.production' });

async function runMigration(filePath) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read SQL file
    const absolutePath = resolve(process.cwd(), filePath);
    console.log(`📄 Reading migration file: ${absolutePath}`);
    const sql = readFileSync(absolutePath, 'utf-8');

    console.log('🔄 Executing migration...\n');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables may already exist. This is usually OK for "IF NOT EXISTS" migrations.');
    }
  } finally {
    await pool.end();
  }
}

// Get file path from command line
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/run-migration.js <path-to-sql-file>');
  process.exit(1);
}
runMigration(filePath).catch(() => process.exit(1));
