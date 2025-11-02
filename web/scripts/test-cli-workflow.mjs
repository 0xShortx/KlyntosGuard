#!/usr/bin/env node
/**
 * End-to-End CLI Workflow Test
 * Tests the complete flow: create user → generate API key → test CLI commands
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes, createHash } from 'crypto';
import { nanoid } from 'nanoid';

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

console.log('🧪 Testing KlyntosGuard CLI Workflow\n');

async function testWorkflow() {
  // Step 1: Check for existing test user or create one
  console.log('1️⃣  Checking for test user...');

  let [testUser] = await sql`
    SELECT id, email, name FROM "user"
    WHERE email = 'test@klyntos.com'
    LIMIT 1
  `;

  if (!testUser) {
    console.log('   Creating test user...');
    [testUser] = await sql`
      INSERT INTO "user" (id, email, name, email_verified, created_at, updated_at)
      VALUES (
        ${nanoid()},
        'test@klyntos.com',
        'Test User',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, name
    `;
    console.log(`   ✅ Created user: ${testUser.email}`);
  } else {
    console.log(`   ✅ Found user: ${testUser.email}`);
  }

  // Step 2: Generate API key
  console.log('\n2️⃣  Generating API key...');

  const rawKey = `kg_${randomBytes(32).toString('hex')}`;
  const hashedKey = createHash('sha256').update(rawKey).digest('hex');
  const prefix = rawKey.substring(0, 12);

  const [apiKey] = await sql`
    INSERT INTO guard_api_keys (
      id, user_id, key, prefix, name, is_active, created_at, updated_at
    )
    VALUES (
      ${nanoid()},
      ${testUser.id},
      ${hashedKey},
      ${prefix},
      'Test CLI Key',
      true,
      NOW(),
      NOW()
    )
    RETURNING id, prefix, name, created_at
  `;

  console.log(`   ✅ Generated key: ${prefix}...`);
  console.log(`   📋 Full key: ${rawKey}\n`);
  console.log('   ⚠️  Save this key! Testing commands...\n');

  // Step 3: Test API key verification
  console.log('3️⃣  Testing /api/v1/auth/verify...');

  try {
    const verifyResponse = await fetch('http://localhost:3001/api/v1/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.valid) {
      console.log(`   ✅ API key verified`);
      console.log(`   User: ${verifyData.user.email}`);
    } else {
      console.log(`   ❌ API key verification failed:`, verifyData);
      return;
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return;
  }

  // Step 4: Test user info endpoint
  console.log('\n4️⃣  Testing /api/v1/user/me...');

  try {
    const meResponse = await fetch('http://localhost:3001/api/v1/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${rawKey}`
      }
    });

    const meData = await meResponse.json();

    if (meData.email) {
      console.log(`   ✅ User info retrieved`);
      console.log(`   Email: ${meData.email}`);
      console.log(`   Scans this month: ${meData.scans_this_month}`);
      console.log(`   Total scans: ${meData.total_scans}`);
    } else {
      console.log(`   ❌ Failed:`, meData);
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  // Step 5: Test scan endpoint
  console.log('\n5️⃣  Testing /api/v1/scan...');

  const testCode = `
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)

API_KEY = "sk-1234567890abcdef"
  `.trim();

  try {
    const scanResponse = await fetch('http://localhost:3001/api/v1/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: testCode,
        filename: 'test.py',
        language: 'python'
      })
    });

    const scanData = await scanResponse.json();

    if (scanData.success) {
      console.log(`   ✅ Scan completed`);
      console.log(`   Scan ID: ${scanData.result.scan_id}`);
      console.log(`   Vulnerabilities found: ${scanData.result.violations.length}`);
      console.log(`   Duration: ${scanData.result.scan_time_ms}ms`);

      if (scanData.result.violations.length > 0) {
        console.log(`\n   Found vulnerabilities:`);
        scanData.result.violations.forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.severity.toUpperCase()}: ${v.message} (line ${v.line})`);
        });
      }

      return scanData.result.scan_id;
    } else {
      console.log(`   ❌ Scan failed:`, scanData);
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  return null;
}

// Run tests
testWorkflow()
  .then(async (scanId) => {
    if (scanId) {
      console.log('\n6️⃣  Testing /api/v1/scans (list)...');

      try {
        const listResponse = await fetch('http://localhost:3001/api/v1/scans?limit=5', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.TEST_API_KEY || ''}`
          }
        });

        const listData = await listResponse.json();

        if (listData.scans) {
          console.log(`   ✅ Scan history retrieved`);
          console.log(`   Total scans: ${listData.pagination.total}`);
          console.log(`   Showing: ${listData.scans.length} scans`);
        }
      } catch (error) {
        console.log(`   ❌ Error:`, error.message);
      }

      console.log('\n7️⃣  Testing /api/v1/scans/[id] (details)...');

      try {
        const detailResponse = await fetch(`http://localhost:3001/api/v1/scans/${scanId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.TEST_API_KEY || ''}`
          }
        });

        const detailData = await detailResponse.json();

        if (detailData.id) {
          console.log(`   ✅ Scan details retrieved`);
          console.log(`   File: ${detailData.fileName}`);
          console.log(`   Status: ${detailData.status}`);
          console.log(`   Vulnerabilities: ${detailData.vulnerabilities.length}`);
        }
      } catch (error) {
        console.log(`   ❌ Error:`, error.message);
      }
    }

    console.log('\n✅ All tests completed!\n');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
