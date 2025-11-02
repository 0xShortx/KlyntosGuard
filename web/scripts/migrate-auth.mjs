#!/usr/bin/env node
/**
 * Migration runner for Better Auth tables
 * Runs the 002_create_auth_tables.sql migration
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
const migrationPath = join(__dirname, '..', 'migrations', '002_create_auth_tables.sql');
const migration = readFileSync(migrationPath, 'utf8');

console.log('\n📝 Running migration: 002_create_auth_tables.sql');
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
    AND table_name IN ('user', 'session', 'account', 'verification')
    ORDER BY table_name
  `;

  if (tables.length === 4) {
    console.log('✅ user table created');
    console.log('✅ session table created');
    console.log('✅ account table created');
    console.log('✅ verification table created');

    // Check indexes
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('user', 'session', 'account', 'verification')
      ORDER BY indexname
    `;

    console.log(`\n✅ ${indexes.length} indexes created`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });

    console.log('\n🎉 Better Auth setup complete!');
    console.log('\n📍 Next steps:');
    console.log('   1. Set environment variables:');
    console.log('      - BETTER_AUTH_SECRET (run: openssl rand -base64 32)');
    console.log('      - BETTER_AUTH_URL=http://localhost:3001');
    console.log('      - GITHUB_CLIENT_ID (optional)');
    console.log('      - GITHUB_CLIENT_SECRET (optional)');
    console.log('      - GOOGLE_CLIENT_ID (optional)');
    console.log('      - GOOGLE_CLIENT_SECRET (optional)');
    console.log('   2. npm run dev');
    console.log('   3. Visit http://localhost:3001/login');

  } else {
    console.warn('⚠️  Warning: Expected 4 tables but found:', tables.length);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
  }

} catch (error) {
  console.error('\n❌ Migration failed:');
  console.error(error.message);

  if (error.message.includes('already exists')) {
    console.log('\n💡 Tables already exist! You\'re good to go.');
    console.log('   To start fresh, run:');
    console.log('   DROP TABLE IF EXISTS verification;');
    console.log('   DROP TABLE IF EXISTS account;');
    console.log('   DROP TABLE IF EXISTS session;');
    console.log('   DROP TABLE IF EXISTS "user";');
    process.exit(0);
  }

  process.exit(1);
}
