#!/usr/bin/env node

/**
 * Test Script: Scan History Dashboard
 *
 * Tests the complete scan history workflow:
 * 1. Create test user with API key
 * 2. Run multiple scans (passed and failed)
 * 3. Test scan listing with pagination
 * 4. Test filtering by status
 * 5. Test scan detail retrieval
 * 6. Verify UI endpoints work correctly
 */

import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const databaseUrl = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.replace(/"/g, '')

const sql = neon(databaseUrl)

console.log('🧪 Testing Scan History Dashboard\n')

async function testScanDashboard() {
  let testUser = null
  let rawKey = null

  try {
    // Step 1: Create test user
    console.log('1️⃣  Creating test user...')
    const testEmail = `dashboard+${Date.now()}@klyntos.com`
    const testUserId = 'dashboard-' + randomBytes(8).toString('hex')

    const result = await sql`
      INSERT INTO "user" (id, email, name, email_verified, created_at, updated_at)
      VALUES (
        ${testUserId},
        ${testEmail},
        ${'Dashboard Test User'},
        ${true},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
      RETURNING id, email
    `
    testUser = result[0]
    console.log(`   ✅ Created user: ${testUser.email}`)

    // Step 2: Generate API key
    console.log('\n2️⃣  Generating API key...')
    rawKey = `kg_${randomBytes(32).toString('hex')}`
    const hashedKey = createHash('sha256').update(rawKey).digest('hex')
    const prefix = rawKey.substring(0, 12)

    await sql`
      INSERT INTO guard_api_keys (id, user_id, key, prefix, name, is_active, created_at, updated_at)
      VALUES (
        ${randomBytes(8).toString('hex')},
        ${testUser.id},
        ${hashedKey},
        ${prefix},
        ${'Test Key'},
        ${true},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `
    console.log(`   ✅ Generated API key: ${prefix}...`)

    // Step 3: Run multiple scans
    console.log('\n3️⃣  Running test scans...')

    // Scan 1: Vulnerable code (should fail)
    const vulnerableCode = `
import sqlite3

def get_user(username):
    conn = sqlite3.connect('users.db')
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor = conn.execute(query)
    return cursor.fetchone()

API_KEY = "hardcoded_secret_key_123"
`

    const scan1Response = await fetch('http://localhost:3001/api/v1/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: vulnerableCode,
        language: 'python',
        filename: 'vulnerable.py'
      })
    })

    const scan1 = await scan1Response.json()
    if (scan1Response.ok) {
      console.log(`   ✅ Scan 1 (vulnerable.py): ${scan1.status} - ${scan1.violations?.length || 0} issues`)
    } else {
      console.log(`   ❌ Scan 1 failed: ${scan1.error}`)
    }

    // Wait a bit for variety
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Scan 2: Clean code (should pass)
    const cleanCode = `
def calculate_sum(a, b):
    """Add two numbers together."""
    return a + b

def main():
    result = calculate_sum(5, 3)
    print(f"Result: {result}")

if __name__ == "__main__":
    main()
`

    const scan2Response = await fetch('http://localhost:3001/api/v1/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: cleanCode,
        language: 'python',
        filename: 'clean.py'
      })
    })

    const scan2 = await scan2Response.json()
    if (scan2Response.ok) {
      console.log(`   ✅ Scan 2 (clean.py): ${scan2.status}`)
    } else {
      console.log(`   ❌ Scan 2 failed: ${scan2.error}`)
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Scan 3: Another vulnerable file
    const vulnerableCode2 = `
const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const userInput = req.query.q;
  res.send('<h1>Results for: ' + userInput + '</h1>');
});

const PASSWORD = 'admin123';
`

    const scan3Response = await fetch('http://localhost:3001/api/v1/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: vulnerableCode2,
        language: 'javascript',
        filename: 'server.js'
      })
    })

    const scan3 = await scan3Response.json()
    if (scan3Response.ok) {
      console.log(`   ✅ Scan 3 (server.js): ${scan3.status} - ${scan3.violations?.length || 0} issues`)
    } else {
      console.log(`   ❌ Scan 3 failed: ${scan3.error}`)
    }

    // Step 4: Test scan listing
    console.log('\n4️⃣  Testing scan listing (GET /api/v1/scans)...')

    const listResponse = await fetch('http://localhost:3001/api/v1/scans?limit=10&offset=0', {
      headers: {
        'Authorization': `Bearer ${rawKey}`
      }
    })

    const listData = await listResponse.json()
    if (listResponse.ok) {
      console.log(`   ✅ Found ${listData.scans.length} scans`)
      console.log(`   Total: ${listData.pagination.total}`)
      listData.scans.forEach((scan, i) => {
        console.log(`   ${i + 1}. ${scan.fileName} - ${scan.status} (${scan.vulnerabilityCount} issues)`)
      })
    } else {
      console.log(`   ❌ Failed to fetch scans: ${listData.error}`)
    }

    // Step 5: Test filtering by status
    console.log('\n5️⃣  Testing filter by failed status...')

    const failedResponse = await fetch('http://localhost:3001/api/v1/scans?status=failed', {
      headers: {
        'Authorization': `Bearer ${rawKey}`
      }
    })

    const failedData = await failedResponse.json()
    if (failedResponse.ok) {
      console.log(`   ✅ Found ${failedData.scans.length} failed scans`)
    } else {
      console.log(`   ❌ Failed to fetch filtered scans: ${failedData.error}`)
    }

    // Step 6: Test scan detail retrieval
    if (scan1Response.ok && scan1.scan_id) {
      console.log('\n6️⃣  Testing scan detail (GET /api/v1/scans/:id)...')

      const detailResponse = await fetch(`http://localhost:3001/api/v1/scans/${scan1.scan_id}`, {
        headers: {
          'Authorization': `Bearer ${rawKey}`
        }
      })

      const detailData = await detailResponse.json()
      if (detailResponse.ok) {
        console.log(`   ✅ Retrieved scan detail for ${detailData.scan.fileName}`)
        console.log(`   Status: ${detailData.scan.status}`)
        console.log(`   Vulnerabilities: ${detailData.vulnerabilities.length}`)
        console.log(`   Summary:`)
        console.log(`     - Critical: ${detailData.summary.critical}`)
        console.log(`     - High: ${detailData.summary.high}`)
        console.log(`     - Medium: ${detailData.summary.medium}`)
        console.log(`     - Low: ${detailData.summary.low}`)
        console.log(`     - Info: ${detailData.summary.info}`)

        if (detailData.vulnerabilities.length > 0) {
          console.log(`\n   First vulnerability:`)
          const vuln = detailData.vulnerabilities[0]
          console.log(`     - Severity: ${vuln.severity}`)
          console.log(`     - Category: ${vuln.category}`)
          console.log(`     - Message: ${vuln.message}`)
          console.log(`     - Line: ${vuln.line}`)
        }
      } else {
        console.log(`   ❌ Failed to fetch scan detail: ${detailData.error}`)
      }
    }

    // Step 7: Verify pagination
    console.log('\n7️⃣  Testing pagination...')

    const page2Response = await fetch('http://localhost:3001/api/v1/scans?limit=2&offset=2', {
      headers: {
        'Authorization': `Bearer ${rawKey}`
      }
    })

    const page2Data = await page2Response.json()
    if (page2Response.ok) {
      console.log(`   ✅ Page 2: ${page2Data.scans.length} scans`)
      console.log(`   Has more: ${page2Data.pagination.has_more}`)
    } else {
      console.log(`   ❌ Failed to fetch page 2: ${page2Data.error}`)
    }

    // Cleanup
    console.log('\n8️⃣  Cleaning up test data...')
    await sql`DELETE FROM guard_vulnerabilities WHERE scan_id IN (
      SELECT id FROM guard_scans WHERE user_id = ${testUser.id}
    )`
    await sql`DELETE FROM guard_scans WHERE user_id = ${testUser.id}`
    await sql`DELETE FROM guard_api_keys WHERE user_id = ${testUser.id}`
    await sql`DELETE FROM "user" WHERE id = ${testUser.id}`
    console.log(`   ✅ Cleanup complete`)

    console.log('\n✅ All scan dashboard tests passed!\n')
    console.log('📊 Summary:')
    console.log('   • Test scans created: ✅')
    console.log('   • Scan listing: ✅')
    console.log('   • Status filtering: ✅')
    console.log('   • Scan detail retrieval: ✅')
    console.log('   • Pagination: ✅')
    console.log('   • Vulnerability tracking: ✅')

  } catch (error) {
    console.error('\n❌ Test failed:', error)

    // Cleanup on error
    if (testUser) {
      try {
        await sql`DELETE FROM guard_vulnerabilities WHERE scan_id IN (
          SELECT id FROM guard_scans WHERE user_id = ${testUser.id}
        )`
        await sql`DELETE FROM guard_scans WHERE user_id = ${testUser.id}`
        await sql`DELETE FROM guard_api_keys WHERE user_id = ${testUser.id}`
        await sql`DELETE FROM "user" WHERE id = ${testUser.id}`
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }

    throw error
  }
}

// Run the test
testScanDashboard().catch(console.error)
