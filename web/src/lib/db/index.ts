/**
 * Database Connection
 * Uses Drizzle ORM with Neon serverless driver
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Support both local DATABASE_URL and Vercel's storage_DATABASE_URL
const databaseUrl = process.env.storage_DATABASE_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL or storage_DATABASE_URL environment variable is not set')
}

// Create Neon HTTP client (optimized for serverless)
const sql = neon(databaseUrl)

// Create Drizzle instance
export const db = drizzle(sql, { schema })

// Export schema
export * from './schema'
