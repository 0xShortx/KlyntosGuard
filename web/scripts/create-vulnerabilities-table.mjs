#!/usr/bin/env node
/**
 * Create guard_vulnerabilities table
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

const sql = neon(databaseUrl);

console.log('📝 Creating guard_vulnerabilities table...\n');

try {
  await sql`
    CREATE TABLE IF NOT EXISTS guard_vulnerabilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scan_id UUID NOT NULL REFERENCES guard_scans(id) ON DELETE CASCADE,

      -- Vulnerability details
      severity VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,

      -- Location in code
      line INTEGER,
      "column" INTEGER,
      end_line INTEGER,
      end_column INTEGER,

      -- Additional context
      code_snippet TEXT,
      suggestion TEXT,
      cwe VARCHAR(20),

      -- Timestamps
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  console.log('✅ Table created');

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_guard_vulnerabilities_scan_id ON guard_vulnerabilities(scan_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_guard_vulnerabilities_severity ON guard_vulnerabilities(severity)`;

  console.log('✅ Indexes created');

  // Verify
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'guard_vulnerabilities'
  `;

  if (tables.length === 1) {
    console.log('\n🎉 guard_vulnerabilities table is ready!');
  } else {
    console.error('\n❌ Table not found after creation');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
