#!/usr/bin/env node
/**
 * Migration: Fix type mismatch between Better Auth and Guard tables
 * Converts UUID columns to TEXT to match Better Auth standard
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read DATABASE_URL from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const databaseUrl = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.replace(/"/g, '');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to Neon database...');
const sql = neon(databaseUrl);

// Read migration file
const migrationPath = join(__dirname, '..', 'migrations', '004_fix_type_mismatch.sql');
const migration = readFileSync(migrationPath, 'utf8');

console.log('\n📝 Running migration: 004_fix_type_mismatch.sql');
console.log('⚠️  WARNING: This will recreate guard_api_keys, guard_scans, and guard_vulnerabilities tables');
console.log('─────────────────────────────────────────────────\n');

try {
  // Split migration into individual statements
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length > 0) {
      // Show progress for table operations
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/)?.[1];
        console.log(`  Creating table: ${tableName}`);
      } else if (statement.includes('DROP TABLE')) {
        const tableName = statement.match(/DROP TABLE (?:IF EXISTS )?(\w+)/)?.[1];
        console.log(`  Dropping table: ${tableName}`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/)?.[1];
        console.log(`  Creating index: ${indexName}`);
      }

      await sql(statement);
    }
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('\n📊 Verifying new schema...\n');

  // Verify guard_api_keys
  const apiKeysColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'guard_api_keys'
    AND column_name IN ('id', 'user_id')
    ORDER BY column_name
  `;

  console.log('guard_api_keys:');
  apiKeysColumns.forEach(col => {
    const status = col.data_type === 'text' ? '✅' : '❌';
    console.log(`  ${status} ${col.column_name}: ${col.data_type}`);
  });

  // Verify guard_scans
  const scansColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'guard_scans'
    AND column_name IN ('id', 'user_id')
    ORDER BY column_name
  `;

  console.log('\nguard_scans:');
  scansColumns.forEach(col => {
    const status = col.data_type === 'text' ? '✅' : '❌';
    console.log(`  ${status} ${col.column_name}: ${col.data_type}`);
  });

  // Verify guard_vulnerabilities
  const vulnColumns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'guard_vulnerabilities'
    AND column_name IN ('id', 'scan_id')
    ORDER BY column_name
  `;

  console.log('\nguard_vulnerabilities:');
  vulnColumns.forEach(col => {
    const status = col.data_type === 'text' ? '✅' : '❌';
    console.log(`  ${status} ${col.column_name}: ${col.data_type}`);
  });

  console.log('\n🎉 Schema migration complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Update schema.ts to use text() instead of uuid()');
  console.log('   2. Enable Better Auth in API endpoints');
  console.log('   3. Test API key generation');

} catch (error) {
  console.error('\n❌ Migration failed:');
  console.error(error.message);
  process.exit(1);
}
