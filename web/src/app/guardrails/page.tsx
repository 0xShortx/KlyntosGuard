'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Shield, Code, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function GuardrailsPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI code security assistant powered by Claude 3.5 Sonnet with built-in security guardrails.\n\nI can help you:\n- Generate secure code following best practices\n- Review code for vulnerabilities\n- Answer security questions\n- Suggest fixes for common issues\n\nAll code I generate is automatically scanned for security vulnerabilities before being shown to you. Try asking me to write some code!'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // TODO: Replace with actual NeMo Guardrails API call
      // For now, we'll use a placeholder response

      const response = await fetch('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: 'user', content: userMessage }
          ].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage = data.messages?.[data.messages.length - 1]?.content ||
                                 'I received your message but couldn\'t generate a response.'

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: assistantMessage
        }])
      } else {
        // Fallback message if server is not running
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ **Guardrails server not running**\n\nTo use the AI guardrails:\n\n1. Start the guardrails server:\n   \`\`\`bash\n   cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard\n   ./start_guardrails.sh\n   \`\`\`\n\n2. The server will run on http://localhost:8000\n\n3. Come back here and try again!\n\nIn the meantime, you can use the [code scanner](/scans) to check existing files.`
        }])
      }
    } catch (error) {
      console.error('Error calling guardrails:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **Guardrails server not running**\n\nTo use the AI guardrails:\n\n1. Start the guardrails server:\n   \`\`\`bash\n   cd /Users/maltewagenbach/Notes/Projects/KlyntosGuard\n   ./start_guardrails.sh\n   \`\`\`\n\n2. The server will run on http://localhost:8000\n\n3. Come back here and try again!\n\nIn the meantime, you can use the [code scanner](/scans) to check existing files.`
      }])
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Code Generation with Guardrails
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by NVIDIA NeMo Guardrails + Claude 3.5 Sonnet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Claude 3.5 Sonnet</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Auto Security Scanning</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>Secure Code Patterns</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>SQL/XSS/Secrets Protection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">

          {/* Messages */}
          <div className="h-[calc(100vh-24rem)] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">
                      {message.content}
                    </pre>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    You
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to generate secure code or review code..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </form>

            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                All code generated is automatically scanned for vulnerabilities.
                Insecure patterns are blocked and replaced with secure alternatives.
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Input Rails</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Blocks dangerous requests like "bypass authentication" or "create SQL injection"
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Output Rails</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scans generated code for SQL injection, XSS, hardcoded secrets before showing you
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Secure Patterns</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Provides secure alternatives using parameterized queries, input validation, proper auth
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
