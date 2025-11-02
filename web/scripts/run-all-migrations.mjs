#!/usr/bin/env node
/**
 * Comprehensive migration runner
 * Runs ALL migration files in order on the new database
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
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
console.log('');

const sql = neon(databaseUrl);

// Get all migration files in order
const migrationsDir = join(__dirname, '..', 'migrations');
const migrationFiles = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort(); // Alphabetical order ensures 001, 002, etc. run in sequence

console.log(`📁 Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(f => console.log(`   - ${f}`));
console.log('');

async function runMigration(filename) {
  console.log(`📝 Running migration: ${filename}`);
  console.log('─────────────────────────────────────────────────');

  try {
    const migrationPath = join(migrationsDir, filename);
    const migration = readFileSync(migrationPath, 'utf8');

    // Split migration into individual statements
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await sql(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists')) {
            console.log(`   ⏭️  Skipped: ${err.message.split(':')[0]} (already exists)`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log(`   ✅ ${filename} completed successfully!\n`);
  } catch (error) {
    console.error(`   ❌ ${filename} failed:`);
    console.error(`   ${error.message}\n`);
    throw error;
  }
}

// Run all migrations
try {
  for (const file of migrationFiles) {
    await runMigration(file);
  }

  console.log('🎉 All migrations completed successfully!');
  console.log('');

  // Verify all tables
  console.log('📊 Verifying database schema...');
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log(`✅ Found ${tables.length} tables:`);
  tables.forEach(t => console.log(`   - ${t.table_name}`));

  // Check indexes
  const indexes = await sql`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;

  console.log(`\n✅ Found ${indexes.length} indexes:`);
  let currentTable = '';
  indexes.forEach(idx => {
    if (idx.tablename !== currentTable) {
      currentTable = idx.tablename;
      console.log(`\n   ${currentTable}:`);
    }
    console.log(`      - ${idx.indexname}`);
  });

  console.log('\n🎉 Database setup complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Visit http://localhost:3001/signup');
  console.log('   3. Create your first account!');

} catch (error) {
  console.error('\n❌ Migration failed!');
  console.error(error);
  process.exit(1);
}
