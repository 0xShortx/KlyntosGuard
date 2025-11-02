import Link from 'next/link'
import { Shield, Heart, Zap, Globe, Users, Code } from 'lucide-react'

export const metadata = {
  title: 'About - KlyntosGuard',
  description: 'Learn about KlyntosGuard and our mission to secure AI-generated code'
}

export default function AboutPage() {
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
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            About KlyntosGuard
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
            The Security Layer for AI Coding
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Heart className="w-12 h-12 text-red-600" />
            <h2 className="text-4xl font-black">Our Mission</h2>
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            We believe AI is transforming how software is built - but without proper guardrails,
            it introduces new security risks. Our mission is to make AI-generated code as secure
            as human-written code.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            KlyntosGuard provides developers with the tools to confidently use AI coding assistants
            while maintaining the highest security standards. We combine cutting-edge AI safety
            research (NVIDIA NeMo Guardrails) with state-of-the-art code analysis (Claude 3.5 Sonnet)
            to create a hybrid security system that prevents vulnerabilities before they're written
            and catches them if they exist.
          </p>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-12 text-center">What Makes Us Different</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <Zap className="w-12 h-12 mb-4 text-yellow-600" />
              <h3 className="text-2xl font-black mb-3">Hybrid Approach</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're the only solution combining <strong>proactive guardrails</strong> (prevention) with
                <strong> reactive scanning</strong> (detection). Get the best of both worlds.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <Globe className="w-12 h-12 mb-4 text-blue-600" />
              <h3 className="text-2xl font-black mb-3">Open Source Foundation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built on <strong>NVIDIA NeMo Guardrails</strong> - proven, open-source technology
                trusted by enterprises. We extend it specifically for code security.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <Code className="w-12 h-12 mb-4 text-purple-600" />
              <h3 className="text-2xl font-black mb-3">Claude-Powered Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Uses <strong>Claude 3.5 Sonnet</strong> - the most advanced AI for code understanding.
                Not just pattern matching, but deep semantic analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-8">Built With</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-2xl font-black mb-2">NVIDIA NeMo Guardrails</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Open-source toolkit for adding programmable guardrails to LLM-based conversational systems.
                Provides input rails, output rails, and execution rails.
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-6">
              <h3 className="text-2xl font-black mb-2">Anthropic Claude 3.5 Sonnet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                State-of-the-art AI model for code generation and analysis. Understands context,
                identifies vulnerabilities, and suggests secure alternatives.
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-6">
              <h3 className="text-2xl font-black mb-2">Next.js + PostgreSQL</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Modern web stack for fast, secure dashboard. Better Auth for authentication,
                Drizzle ORM for type-safe database access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team/Values */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Users className="w-12 h-12 text-blue-600" />
            <h2 className="text-4xl font-black">Our Values</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-6">
              <h3 className="text-xl font-black mb-2">🛡️ Security First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We never compromise on security. Every feature is designed with security as the top priority.
              </p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-6">
              <h3 className="text-xl font-black mb-2">🌍 Open & Transparent</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built on open-source foundations. We believe in transparency and community collaboration.
              </p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-6">
              <h3 className="text-xl font-black mb-2">⚡ Developer Experience</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Simple, intuitive tools that don't slow you down. Security shouldn't feel like a burden.
              </p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-6">
              <h3 className="text-xl font-black mb-2">🚀 Innovation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We embrace AI's potential while making it safer. Pioneering the future of secure AI coding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-6">Join Us in Making AI Coding Safer</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Start protecting your codebase today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg rounded-lg hover:shadow-2xl transition-all border-4 border-black dark:border-white"
            >
              Get Started Free
            </Link>
            <Link
              href="/how-it-works"
              className="px-8 py-4 bg-white dark:bg-black text-black dark:text-white font-black text-lg rounded-lg border-4 border-black dark:border-white hover:shadow-2xl transition-all"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
