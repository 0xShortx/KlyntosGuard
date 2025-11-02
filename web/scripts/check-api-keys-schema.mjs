#!/usr/bin/env node
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

const sql = neon(databaseUrl);

// Check guard_api_keys schema
const columns = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'guard_api_keys'
  ORDER BY ordinal_position
`;

console.log('\n📊 guard_api_keys table schema:');
console.log('─────────────────────────────────────');
columns.forEach(col => {
  console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
});

// Check if ID and user_id types
const idCol = columns.find(c => c.column_name === 'id');
const userIdCol = columns.find(c => c.column_name === 'user_id');
console.log(`\n📌 ID column type: ${idCol?.data_type}`);
console.log(`📌 user_id column type: ${userIdCol?.data_type}`);
