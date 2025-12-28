/**
 * Script para ejecutar migraciones de base de datos
 * Uso: node scripts/run-migration.js database/multi-agency-schema.sql
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';

const { Pool } = pg;

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

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
    const result = await pool.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('agencies', 'agency_products', 'commissions', 'agency_settlements')
    `);

    console.log('\n📊 Tables verified:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // Check agencies
    const agencies = await pool.query('SELECT agency_id, name FROM agencies');
    console.log('\n🏢 Agencies in database:');
    agencies.rows.forEach(row => console.log(`   - ${row.agency_id}: ${row.name}`));

    // Check products
    const products = await pool.query('SELECT agency_id, product_code, name FROM agency_products');
    console.log('\n🎫 Products in database:');
    products.rows.forEach(row => console.log(`   - [${row.agency_id}] ${row.product_code}: ${row.name}`));

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables may already exist. This is usually OK for "IF NOT EXISTS" migrations.');
    }
    // Don't throw - just log and continue
  } finally {
    await pool.end();
  }
}

// Get file path from command line
const filePath = process.argv[2] || 'database/multi-agency-schema.sql';
runMigration(filePath).catch(() => process.exit(1));
