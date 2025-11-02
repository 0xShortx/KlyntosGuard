import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { guardApiKeys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: Message[]
  max_tokens?: number
}

/**
 * Authenticate request using API key
 */
async function authenticateRequest(request: NextRequest): Promise<{ userId: string; apiKeyId: string } | null> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // API key authentication (kg_...)
  if (token.startsWith('kg_')) {
    const hashedKey = createHash('sha256').update(token).digest('hex')

    const [keyRecord] = await db
      .select()
      .from(guardApiKeys)
      .where(and(eq(guardApiKeys.key, hashedKey), eq(guardApiKeys.isActive, true)))
      .limit(1)

    if (!keyRecord) {
      return null
    }

    // Update last used timestamp
    await db
      .update(guardApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(guardApiKeys.id, keyRecord.id))

    return {
      userId: keyRecord.userId,
      apiKeyId: keyRecord.id
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: ChatRequest = await request.json()
    const { messages, max_tokens = 4096 } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Validate messages format
    if (!Array.isArray(messages) || !messages.every(m => m.role && m.content)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // System prompt for security-focused assistant
    const systemPrompt = `You are a security expert assistant for KlyntosGuard, an AI-powered code security scanner.

Your role is to help developers understand security vulnerabilities, fix code issues, and follow best practices.

Key guidelines:
- Be concise and practical
- Always provide code examples when relevant
- Focus on security best practices
- Explain vulnerabilities in simple terms
- Suggest specific fixes, not just general advice
- Reference CWE codes when applicable
- Use markdown formatting for code blocks

Topics you can help with:
- SQL injection, XSS, CSRF
- Authentication & authorization
- Secure coding practices
- Cryptography
- Input validation
- API security
- And all other security topics

Be friendly, helpful, and educational!`

    // Call Claude API with conversation history
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',  // Fast and cost-effective for chat
      max_tokens,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })

    const textContent = response.content.find(c => c.type === 'text')
    const assistantMessage = textContent && 'text' in textContent ? textContent.text : 'No response generated'

    return NextResponse.json({
      response: assistantMessage,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      }
    })

  } catch (error) {
    console.error('Chat error:', error)

    // Handle specific Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      if (error.status === 400) {
        return NextResponse.json(
          { error: 'Invalid request to AI service' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
