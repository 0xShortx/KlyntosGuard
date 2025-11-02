import Link from 'next/link'
import { Shield, Zap, Code, CheckCircle, AlertTriangle, ArrowRight, Sparkles, Terminal, Globe } from 'lucide-react'

export const metadata = {
  title: 'How It Works - KlyntosGuard',
  description: 'Understand how KlyntosGuard provides proactive and reactive security for AI-generated code'
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b-4 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl">
            <Shield className="w-8 h-8" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KLYNTOS GUARD
            </span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              How KlyntosGuard Works
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              A hybrid security system combining{' '}
              <span className="font-bold text-blue-600">proactive guardrails</span> (prevents AI from writing bad code)
              and{' '}
              <span className="font-bold text-purple-600">reactive scanning</span> (detects issues in existing code)
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-4xl font-black mb-4">The Problem</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              AI coding assistants like ChatGPT, Claude, and Copilot can generate vulnerable code without realizing it
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="border-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 rounded-lg">
              <h3 className="text-xl font-black mb-3 text-red-700 dark:text-red-400">SQL Injection</h3>
              <code className="text-sm bg-white dark:bg-black p-4 block rounded border-2 border-red-300 dark:border-red-800 overflow-x-auto">
                query = f"SELECT * FROM users <br/>
                WHERE id = {'{user_id}'}"
              </code>
              <p className="mt-3 text-sm text-red-700 dark:text-red-400 font-bold">
                ❌ AI generates string concatenation
              </p>
            </div>

            <div className="border-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 rounded-lg">
              <h3 className="text-xl font-black mb-3 text-red-700 dark:text-red-400">XSS Attacks</h3>
              <code className="text-sm bg-white dark:bg-black p-4 block rounded border-2 border-red-300 dark:border-red-800 overflow-x-auto">
                element.innerHTML = <br/>
                userInput
              </code>
              <p className="mt-3 text-sm text-red-700 dark:text-red-400 font-bold">
                ❌ Unescaped user input in HTML
              </p>
            </div>

            <div className="border-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 rounded-lg">
              <h3 className="text-xl font-black mb-3 text-red-700 dark:text-red-400">Hardcoded Secrets</h3>
              <code className="text-sm bg-white dark:bg-black p-4 block rounded border-2 border-red-300 dark:border-red-800 overflow-x-auto">
                api_key = <br/>
                "sk-1234567890"
              </code>
              <p className="mt-3 text-sm text-red-700 dark:text-red-400 font-bold">
                ❌ Credentials committed to code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-4xl font-black mb-4">Our Solution: Hybrid Security</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We combine two approaches to ensure your code is secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Proactive */}
            <div className="border-4 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900 p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Proactive Guardrails</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Prevention Before Generation</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Advanced Guardrails Engine</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise-grade framework for LLM safety and security</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Code className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Input Rails</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Block dangerous requests like "bypass authentication"</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Output Rails</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Scan generated code before showing it to you</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Secure Alternatives</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automatically provide safe code patterns instead</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  ✨ You only see secure code - vulnerable patterns never reach you
                </p>
              </div>
            </div>

            {/* Reactive */}
            <div className="border-4 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900 p-8 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Reactive Scanner</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">Detection in Existing Code</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Claude 3.5 Sonnet</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Most advanced AI model for code analysis</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Code className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Deep Code Analysis</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Understands context, not just pattern matching</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Multi-Language Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Python, JavaScript, TypeScript, Go, Rust, Java, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">SARIF Export</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Integrate with GitHub, VS Code, CI/CD pipelines</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                  🔍 Catch vulnerabilities before they reach production
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works in Practice */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-12 text-center">Step-by-Step Workflow</h2>

          <div className="space-y-8 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: 'You Ask AI for Code',
                description: 'Chat with Claude 3.5 Sonnet in the /guardrails page',
                example: '"Write a secure login function with password hashing"'
              },
              {
                step: 2,
                title: 'AI Generates Code',
                description: 'Claude generates a complete solution',
                example: 'Function with authentication logic'
              },
              {
                step: 3,
                title: 'Guardrails Validate',
                description: 'Output rails automatically scan the generated code',
                example: 'Check for SQL injection, XSS, secrets, auth issues'
              },
              {
                step: 4,
                title: 'Issues Detected?',
                description: 'If vulnerabilities are found...',
                example: 'SQL injection pattern detected!'
              },
              {
                step: 5,
                title: 'Secure Alternative Generated',
                description: 'Guardrails replace vulnerable code with secure version',
                example: 'Parameterized queries, bcrypt hashing, rate limiting'
              },
              {
                step: 6,
                title: 'You Receive Safe Code',
                description: 'Only secure, production-ready code is shown',
                example: '✅ Ready to use without security concerns'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-xl">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{item.description}</p>
                  <p className="text-sm italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded border-2 border-gray-200 dark:border-gray-800">
                    {item.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-12 text-center">Technical Architecture</h2>

          <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 rounded-lg max-w-4xl mx-auto">
            <pre className="text-sm overflow-x-auto">
{`User Request
    ↓
Input Rails
    ├─ Block dangerous requests ❌
    └─ Validate language ✓
    ↓
LLM (Claude 3.5 Sonnet)
    ↓
Generated Code
    ↓
Output Rails
    ├─ Execute validate_code() action
    │   ↓
    │   KlyntosGuard Scanner (Claude-powered)
    │   ↓
    │   Returns vulnerabilities
    │
    ├─ If unsafe: Generate secure version
    └─ If safe: Return code to user
    ↓
User Receives Secure Code ✅`}
            </pre>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="font-black text-xl mb-3">Guardrails Engine</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Programmable security framework with declarative configuration
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="font-black text-xl mb-3">Claude 3.5 Sonnet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anthropic's most advanced model for code generation and analysis
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="font-black text-xl mb-3">Custom Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Python bridge connecting guardrails to our security scanner
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6">Ready to Secure Your AI Coding?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Start generating secure code with guardrails today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg rounded-lg hover:shadow-2xl transition-all border-4 border-black dark:border-white"
            >
              Get Started Free
            </Link>
            <Link
              href="/guardrails"
              className="px-8 py-4 bg-white dark:bg-black text-black dark:text-white font-black text-lg rounded-lg border-4 border-black dark:border-white hover:shadow-2xl transition-all"
            >
              Try Guardrails Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
