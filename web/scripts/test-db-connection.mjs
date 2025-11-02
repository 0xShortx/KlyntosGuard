#!/usr/bin/env node
/**
 * Test database connection with Drizzle ORM
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
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

console.log('🔗 Testing database connection...');
console.log(`📍 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

try {
  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log('✅ Drizzle ORM initialized');

  // Test query
  const result = await sql`SELECT current_database(), current_user, version()`;
  console.log('✅ Database query successful\n');
  console.log('📊 Connection Info:');
  console.log(`   Database: ${result[0].current_database}`);
  console.log(`   User: ${result[0].current_user}`);
  console.log(`   Version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);

  // List tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log(`\n✅ Found ${tables.length} tables:`);

  const authTables = tables.filter(t => ['user', 'session', 'account', 'verification'].includes(t.table_name));
  const guardTables = tables.filter(t => t.table_name.startsWith('guard_'));

  console.log('\n   Better Auth Tables:');
  authTables.forEach(t => console.log(`      ✓ ${t.table_name}`));

  console.log('\n   Guard Tables:');
  guardTables.forEach(t => console.log(`      ✓ ${t.table_name}`));

  console.log('\n🎉 Database connection test passed!');
  console.log('✅ Ready to accept user signups and authentication\n');

} catch (error) {
  console.error('\n❌ Database connection failed:');
  console.error(error.message);
  process.exit(1);
}
