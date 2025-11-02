#!/usr/bin/env node
/**
 * Simple schema fix - Drop and recreate all guard tables with TEXT IDs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const sql = neon(databaseUrl);

console.log('🔄 Fixing schema type mismatch...\n');

try {
  // Drop all guard tables
  console.log('1. Dropping existing tables...');
  await sql`DROP TABLE IF EXISTS guard_vulnerabilities CASCADE`;
  await sql`DROP TABLE IF EXISTS guard_scans CASCADE`;
  await sql`DROP TABLE IF EXISTS guard_api_keys CASCADE`;
  console.log('   ✅ Tables dropped\n');

  // Create guard_api_keys
  console.log('2. Creating guard_api_keys...');
  await sql`
    CREATE TABLE guard_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      key TEXT NOT NULL UNIQUE,
      prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMP,
      expires_at TIMESTAMP
    )
  `;
  await sql`CREATE INDEX idx_guard_api_keys_user_id ON guard_api_keys(user_id)`;
  await sql`CREATE INDEX idx_guard_api_keys_key ON guard_api_keys(key)`;
  console.log('   ✅ guard_api_keys created\n');

  // Create guard_scans
  console.log('3. Creating guard_scans...');
  await sql`
    CREATE TABLE guard_scans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      file_name TEXT,
      language TEXT,
      code TEXT,
      policy TEXT DEFAULT 'moderate',
      status TEXT NOT NULL,
      vulnerability_count INTEGER DEFAULT 0,
      scan_duration_ms INTEGER,
      api_key_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX idx_guard_scans_user_id ON guard_scans(user_id)`;
  await sql`CREATE INDEX idx_guard_scans_created_at ON guard_scans(created_at DESC)`;
  console.log('   ✅ guard_scans created\n');

  // Create guard_vulnerabilities
  console.log('4. Creating guard_vulnerabilities...');
  await sql`
    CREATE TABLE guard_vulnerabilities (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL REFERENCES guard_scans(id) ON DELETE CASCADE,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      line INTEGER,
      "column" INTEGER,
      end_line INTEGER,
      end_column INTEGER,
      code_snippet TEXT,
      suggestion TEXT,
      cwe TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX idx_guard_vulnerabilities_scan_id ON guard_vulnerabilities(scan_id)`;
  await sql`CREATE INDEX idx_guard_vulnerabilities_severity ON guard_vulnerabilities(severity)`;
  console.log('   ✅ guard_vulnerabilities created\n');

  // Verify
  console.log('5. Verifying schema...\n');

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name IN ('guard_api_keys', 'guard_scans', 'guard_vulnerabilities')
    ORDER BY table_name
  `;

  console.log('   Tables created:');
  tables.forEach(t => console.log(`   ✅ ${t.table_name}`));

  const apiKeysCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'guard_api_keys'
    AND column_name IN ('id', 'user_id')
  `;

  console.log('\n   guard_api_keys types:');
  apiKeysCols.forEach(c => console.log(`   ✅ ${c.column_name}: ${c.data_type}`));

  const scansCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'guard_scans'
    AND column_name IN ('id', 'user_id')
  `;

  console.log('\n   guard_scans types:');
  scansCols.forEach(c => console.log(`   ✅ ${c.column_name}: ${c.data_type}`));

  console.log('\n🎉 Schema fixed successfully!\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
