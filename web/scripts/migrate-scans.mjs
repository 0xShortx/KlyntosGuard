#!/usr/bin/env node
/**
 * Migration runner for Scans and Vulnerabilities tables
 * Runs the 003_create_scans_and_vulnerabilities.sql migration
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
console.log(`📍 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);

const sql = neon(databaseUrl);

// Read migration file
const migrationPath = join(__dirname, '..', 'migrations', '003_create_scans_and_vulnerabilities.sql');
const migration = readFileSync(migrationPath, 'utf8');

console.log('\n📝 Running migration: 003_create_scans_and_vulnerabilities.sql');
console.log('─────────────────────────────────────────────────');

try {
  // Split migration into individual statements
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...\n`);

  for (const statement of statements) {
    if (statement.length > 0) {
      await sql(statement);
    }
  }

  console.log('✅ Migration completed successfully!');
  console.log('\n📊 Verifying tables...');

  // Verify tables were created
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('guard_scans', 'guard_vulnerabilities', 'guard_api_keys')
    ORDER BY table_name
  `;

  console.log(`\n✅ ${tables.length} tables verified:`);
  tables.forEach(t => console.log(`   - ${t.table_name}`));

  // Check indexes
  const indexes = await sql`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename IN ('guard_scans', 'guard_vulnerabilities', 'guard_api_keys')
    AND indexname NOT LIKE '%_pkey'
    ORDER BY indexname
  `;

  console.log(`\n✅ ${indexes.length} indexes created:`);
  indexes.forEach(idx => {
    console.log(`   - ${idx.indexname}`);
  });

  console.log('\n🎉 Scan history setup complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Implement API key generation endpoint');
  console.log('   2. Update scan endpoint to save results');
  console.log('   3. Create scan history API endpoints');
  console.log('   4. Build dashboard UI for scans and API keys');

} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('\n💡 Tables/indexes already exist! Verifying...');

    // Verify tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('guard_scans', 'guard_vulnerabilities', 'guard_api_keys')
      ORDER BY table_name
    `;

    console.log(`\n✅ ${tables.length} tables verified:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    console.log('\n🎉 Database is ready!');
    process.exit(0);
  }

  console.error('\n❌ Migration failed:');
  console.error(error.message);
  process.exit(1);
}
