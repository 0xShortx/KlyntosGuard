import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guardApiKeys } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const GUARDRAILS_API_KEY_HASHED = '66a9f0d9f4190aa86083eedd02879712473ff36ac4d14952a82c55574784ffd8'

export async function POST() {
  try {
    // Check if key already exists
    const existing = await db
      .select()
      .from(guardApiKeys)
      .where(eq(guardApiKeys.name, 'Guardrails System'))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Guardrails API key already exists',
        key: existing[0]
      })
    }

    // Insert new key
    const [newKey] = await db
      .insert(guardApiKeys)
      .values({
        id: randomUUID(),
        key: GUARDRAILS_API_KEY_HASHED,
        name: 'Guardrails System',
        userId: 'system',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    return NextResponse.json({
      success: true,
      message: 'Successfully added Guardrails API key',
      key: newKey,
      rawKey: 'kg_c3eecae2212dbfbae263d0d6bcd844d3ac9b94d90db169865334a6486d52d1d5'
    })

  } catch (error) {
    console.error('Error adding guardrails key:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add API key' },
      { status: 500 }
    )
  }
}
