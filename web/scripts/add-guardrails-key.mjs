#!/usr/bin/env node

/**
 * Add Guardrails System API Key to Database
 *
 * This script adds the API key that guardrails will use to authenticate with the scanner
 */

import { createHash, randomUUID } from 'crypto'
import { drizzle } from 'drizzle-orm/node-postgres'
import pkg from 'pg'
const { Pool } = pkg
import * as schema from '../src/lib/db/schema.js'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const db = drizzle(pool, { schema })

const GUARDRAILS_API_KEY = 'kg_c3eecae2212dbfbae263d0d6bcd844d3ac9b94d90db169865334a6486d52d1d5'
const HASHED_KEY = '66a9f0d9f4190aa86083eedd02879712473ff36ac4d14952a82c55574784ffd8'

async function addGuardrailsKey() {
  try {
    console.log('🔑 Adding Guardrails System API Key...\n')

    // Check if key already exists
    const existing = await db
      .select()
      .from(schema.guardApiKeys)
      .where(eq(schema.guardApiKeys.name, 'Guardrails System'))
      .limit(1)

    if (existing.length > 0) {
      console.log('✅ Guardrails API key already exists!')
      console.log(`   ID: ${existing[0].id}`)
      console.log(`   Name: ${existing[0].name}`)
      console.log(`   Created: ${existing[0].createdAt}`)
      console.log('\nNo changes needed.')
      return
    }

    // Insert new key
    const [newKey] = await db
      .insert(schema.guardApiKeys)
      .values({
        id: randomUUID(),
        key: HASHED_KEY,
        name: 'Guardrails System',
        userId: 'system',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    console.log('✅ Successfully added Guardrails API key!')
    console.log(`   ID: ${newKey.id}`)
    console.log(`   Name: ${newKey.name}`)
    console.log(`   Hashed Key: ${HASHED_KEY}`)
    console.log('\n📝 Add this to your .env file:')
    console.log(`   KLYNTOS_GUARD_API_KEY=${GUARDRAILS_API_KEY}`)
    console.log('\n🎉 Done! Guardrails can now authenticate with the scanner.')

  } catch (error) {
    console.error('❌ Error adding guardrails key:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addGuardrailsKey()
