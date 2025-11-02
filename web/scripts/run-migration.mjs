#!/usr/bin/env node
/**
 * Simple migration runner for Neon database
 * Runs the 001_create_guard_api_keys.sql migration
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
const migrationPath = join(__dirname, '..', 'migrations', '001_create_guard_api_keys.sql');
const migration = readFileSync(migrationPath, 'utf8');

console.log('\n📝 Running migration: 001_create_guard_api_keys.sql');
console.log('─────────────────────────────────────────────────');

try {
  // Split migration into individual statements (Neon HTTP doesn't support multiple statements)
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
    AND table_name IN ('guard_api_keys', 'guard_usage')
    ORDER BY table_name
  `;

  if (tables.length === 2) {
    console.log('✅ guard_api_keys table created');
    console.log('✅ guard_usage table created');

    // Check indexes
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('guard_api_keys', 'guard_usage')
      ORDER BY indexname
    `;

    console.log(`\n✅ ${indexes.length} indexes created`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });

    console.log('\n🎉 Database setup complete!');
    console.log('\n📍 Next steps:');
    console.log('   1. npm run dev');
    console.log('   2. Visit http://localhost:3001/settings/cli');
    console.log('   3. Generate your first API key');

  } else {
    console.warn('⚠️  Warning: Expected 2 tables but found:', tables.length);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
  }

} catch (error) {
  console.error('\n❌ Migration failed:');
  console.error(error.message);

  if (error.message.includes('already exists')) {
    console.log('\n💡 Tables already exist! You\'re good to go.');
    console.log('   To start fresh, run:');
    console.log('   DROP TABLE IF EXISTS guard_usage;');
    console.log('   DROP TABLE IF EXISTS guard_api_keys;');
    process.exit(0);
  }

  process.exit(1);
}
