#!/usr/bin/env tsx

/**
 * Run database migrations
 *
 * Usage: tsx scripts/run-migration.ts <migration-file>
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

// Load environment variables
config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Please provide a migration file name')
  console.error('Usage: tsx scripts/run-migration.ts <migration-file>')
  process.exit(1)
}

async function runMigration() {
  const sql = neon(DATABASE_URL!)

  const migrationPath = join(process.cwd(), 'migrations', migrationFile)

  console.log(`🔄 Reading migration: ${migrationFile}`)

  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('🔄 Running migration...')

  try {
    await sql(migrationSQL)
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:')
    console.error(error)
    process.exit(1)
  }
}

runMigration()
