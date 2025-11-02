import Link from 'next/link'
import { ArrowRight, Code, Zap, Users, CheckCircle, Lock, Eye, Terminal, AlertTriangle, XCircle, Shield as ShieldIcon, TrendingUp, BarChart3, Activity } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation - NO SHIELD */}
      <nav className="sticky top-0 z-50 border-b-4 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-2xl font-black text-black dark:text-white tracking-tight">KLYNTOS<span className="text-blue-600">GUARD</span></span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#problem" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Problem</a>
              <a href="#solution" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Solution</a>
              <a href="#features" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Features</a>
              <a href="#integrations" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Integrations</a>
              <a href="#faq" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">FAQ</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase tracking-wide hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-black border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-12">
            <div className="inline-block px-6 py-2 bg-black dark:bg-white border-4 border-black dark:border-white">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-white dark:text-black" strokeWidth={3} />
                <span className="text-sm font-black uppercase tracking-wider text-white dark:text-black">The Security Layer for AI Coding</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-black dark:text-white leading-tight">
              AI is transforming how
              <span className="block text-blue-600 dark:text-blue-500">software is built.</span>
            </h1>

            <p className="max-w-3xl mx-auto text-xl sm:text-2xl font-bold text-black dark:text-white leading-relaxed">
              Klyntos Guard ensures it's built securely — from the first line of code.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/signup"
                className="group px-10 py-5 bg-blue-600 border-4 border-blue-600 text-white font-black text-lg uppercase tracking-wide hover:bg-black hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white transition-colors flex items-center space-x-3"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
              </Link>
              <a
                href="#problem"
                className="px-10 py-5 border-4 border-black dark:border-white text-black dark:text-white font-black text-lg uppercase tracking-wide hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-red-50 dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-16">
            <h2 className="text-5xl font-black text-black dark:text-white tracking-tight">
              The Problem
            </h2>
            <p className="text-2xl font-bold text-black dark:text-white max-w-3xl mx-auto">
              AI is accelerating development. Security hasn't caught up.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <p className="text-xl font-bold text-black dark:text-white leading-relaxed">
                AI coding assistants help developers ship code faster than ever.
              </p>
              <p className="text-xl font-bold text-black dark:text-white leading-relaxed">
                But traditional security tools only react <span className="text-red-600 dark:text-red-500">after</span> the code is written — when the risks are already live.
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-500 leading-relaxed">
                By then, you're chasing vulnerabilities instead of preventing them.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 space-y-6">
              <h3 className="text-2xl font-black text-black dark:text-white">The Old Way — Reactive Security</h3>
              <p className="font-bold text-gray-700 dark:text-gray-300">Fix vulnerabilities only after they've reached production.</p>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 border-2 border-gray-300 dark:border-gray-600 font-mono text-sm">
                <pre className="text-black dark:text-white">
{`const userInput = req.query.id;
db.query(\`SELECT * FROM users WHERE id=\${userInput}\`)

const filePath = req.body.path;
fs.readFile(filePath, callback);`}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-red-600 text-white font-black text-sm border-2 border-red-800">⚠️ SQL Injection</span>
                <span className="px-4 py-2 bg-red-600 text-white font-black text-sm border-2 border-red-800">⚠️ Path Traversal</span>
                <span className="px-4 py-2 bg-red-600 text-white font-black text-sm border-2 border-red-800">⚠️ XSS</span>
                <span className="px-4 py-2 bg-red-600 text-white font-black text-sm border-2 border-red-800">⚠️ Command Injection</span>
                <span className="px-4 py-2 bg-red-600 text-white font-black text-sm border-2 border-red-800">⚠️ Missing CSRF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-24 bg-green-50 dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-16">
            <h2 className="text-5xl font-black text-black dark:text-white tracking-tight">
              The Klyntos Guard Way — Proactive Guardrails
            </h2>
            <p className="text-2xl font-bold text-black dark:text-white max-w-4xl mx-auto">
              Klyntos Guard integrates directly with your AI coding agents — turning security from an afterthought into a built-in feature of your workflow.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 space-y-6">
              <h3 className="text-2xl font-black text-green-600 dark:text-green-500">Prevent Vulnerabilities at the Source</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <p className="font-bold text-black dark:text-white">Secure code before it's written</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <p className="font-bold text-black dark:text-white">Guardrails teach your AI to generate safe, compliant patterns</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <p className="font-bold text-black dark:text-white">No friction, no alerts, no context-switching</p>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 border-2 border-green-600 font-mono text-sm">
                <pre className="text-black dark:text-white">
{`# Secure file download endpoint
@app.route('/download', methods=['GET'])
def download_file():
    filename = secure_filename(
        request.args.get('file')
    )
    return send_file(
        safe_path,
        as_attachment=True
    )`}
                </pre>
              </div>

              <div className="bg-green-100 dark:bg-green-900 border-2 border-green-600 p-4">
                <p className="font-black text-green-800 dark:text-green-200 text-lg">
                  Klyntos Guard doesn't slow you down — it makes insecure code impossible to create.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Catch Vulnerabilities */}
              <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 space-y-4">
                <h3 className="text-2xl font-black text-black dark:text-white">Catch Vulnerabilities Before They Enter Your Codebase</h3>
                <p className="font-bold text-gray-700 dark:text-gray-300">
                  Klyntos Guard automatically reviews every pull request, surfacing vulnerabilities before they merge.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                    <span className="font-bold text-black dark:text-white">Detects security risks instantly</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                    <span className="font-bold text-black dark:text-white">Explains issues in plain language</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                    <span className="font-bold text-black dark:text-white">Guides developers toward secure fixes</span>
                  </li>
                </ul>

                <div className="bg-gray-100 dark:bg-gray-800 p-4 border-l-4 border-yellow-500">
                  <p className="font-mono text-sm text-black dark:text-white">
                    <span className="font-black">klyntos-guard-security bot:</span><br/>
                    "This endpoint lacks authorization checks, allowing a user to access another user's settings."
                  </p>
                </div>

                <p className="font-black text-blue-600 dark:text-blue-400">
                  Real-time feedback. No bottlenecks. No compromise.
                </p>
              </div>

              {/* Visibility */}
              <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 space-y-4">
                <h3 className="text-2xl font-black text-black dark:text-white">Visibility Like You've Never Had Before</h3>
                <p className="font-bold text-gray-700 dark:text-gray-300">
                  See exactly how AI tools generate code across your entire organization.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                    <span className="font-bold text-black dark:text-white">Track all AI-generated commits</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                    <span className="font-bold text-black dark:text-white">Monitor MCP servers and policy violations</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0" strokeWidth={3} />
                    <span className="font-bold text-black dark:text-white">Audit AI behavior with full transparency</span>
                  </li>
                </ul>

                <p className="font-black text-lg text-blue-600 dark:text-blue-400">
                  Your AI coding observability layer.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                  <div>
                    <div className="text-3xl font-black font-mono text-black dark:text-white">248</div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Active Developers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black font-mono text-black dark:text-white">1,429</div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Code Generations</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black font-mono text-black dark:text-white">847</div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Guardrail Invocations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-black border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-16">
            <h2 className="text-5xl font-black text-black dark:text-white tracking-tight">
              Built for Security & Engineering Teams
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* For Security Teams */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <Lock className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
                <h3 className="text-3xl font-black text-black dark:text-white">For Security Teams</h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <span className="font-bold text-lg text-black dark:text-white">Enforce policies at the moment of generation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <span className="font-bold text-lg text-black dark:text-white">Get complete visibility into AI-written code</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <span className="font-bold text-lg text-black dark:text-white">Meet compliance requirements with audit-ready logs</span>
                </li>
              </ul>
            </div>

            {/* For Engineering Teams */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <Code className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
                <h3 className="text-3xl font-black text-black dark:text-white">For Engineering Teams</h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <span className="font-bold text-lg text-black dark:text-white">Zero friction — works silently in the background</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <span className="font-bold text-lg text-black dark:text-white">Seamlessly integrates with Claude Code, Cursor, Copilot and more</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={3} />
                  <span className="font-bold text-lg text-black dark:text-white">Learns your codebase and adapts to your style</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-gray-50 dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-16">
            <h2 className="text-5xl font-black text-black dark:text-white tracking-tight">
              Integrates with Your Workflow
            </h2>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
              Works where your developers already work.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 text-center">
              <p className="font-black text-lg text-black dark:text-white">Claude Code</p>
            </div>
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 text-center">
              <p className="font-black text-lg text-black dark:text-white">Cursor</p>
            </div>
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 text-center">
              <p className="font-black text-lg text-black dark:text-white">GitHub Copilot</p>
            </div>
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 text-center">
              <p className="font-black text-lg text-black dark:text-white">Vercel</p>
            </div>
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 text-center">
              <p className="font-black text-lg text-black dark:text-white">Cognition Factory</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-black border-b-4 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-16">
            <h2 className="text-5xl font-black text-black dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                How does Klyntos Guard integrate with my AI coding tools?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                Klyntos Guard works as an MCP (Model Context Protocol) server that your AI coding assistant connects to. It analyzes code in real-time as it's being generated, providing instant feedback and preventing vulnerable patterns from ever being suggested.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                Will this slow down my development workflow?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                No. Scans complete in under 6 seconds, and guardrails work silently in the background. Your AI assistant will simply generate more secure code from the start, eliminating the need for security reviews and revisions later.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                What types of vulnerabilities can Klyntos Guard detect?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                We detect 100+ vulnerability types including SQL injection, XSS, CSRF, path traversal, command injection, insecure deserialization, authentication bypasses, API security issues, and more. Our AI model is continuously updated with the latest CVE data and OWASP Top 10 patterns.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                Does my code leave my infrastructure?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                Your code is sent to our secure API for analysis using Claude 3.5 Sonnet. We use enterprise-grade encryption in transit and at rest. Code is never stored permanently and is only kept in memory during the scan. For enterprise customers, we offer self-hosted deployments.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                Can I customize the security policies?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                Yes! You can configure custom security policies using our guardrails YAML format. Define what's acceptable for your organization, set severity levels, and even create custom rules specific to your tech stack and compliance requirements.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                How does the CLI chat feature work?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                The CLI includes an interactive chat mode powered by Claude AI. Ask security questions, get code reviews, learn about vulnerabilities, and get fix suggestions right from your terminal. Use <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 font-mono">kg chat --interactive</code> to start a conversation, or <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 font-mono">kg chat "your question"</code> for quick answers.
              </p>
            </div>

            {/* FAQ 7 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                What's the difference between scanning and guardrails?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                Scanning analyzes existing code and reports vulnerabilities. Guardrails prevent vulnerabilities before they're written by teaching your AI assistant to generate secure code patterns. Think of scanning as a security audit, and guardrails as a security coach embedded in your AI.
              </p>
            </div>

            {/* FAQ 8 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                Do you support team collaboration and audit logs?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                Yes. Our dashboard provides complete visibility into all scans, violations, and AI activity across your team. Every scan is logged with timestamps, commit hashes, and developer attribution for compliance and audit purposes.
              </p>
            </div>

            {/* FAQ 9 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                Can I try it before committing to a paid plan?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                Absolutely! Sign up for free and get 10 scans per month to test the platform. No credit card required. Upgrade anytime when you're ready for unlimited scans and advanced features.
              </p>
            </div>

            {/* FAQ 10 */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-3">
                What happens when Klyntos Guard finds a vulnerability?
              </h3>
              <p className="font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                You get an instant report with: (1) the exact vulnerability type and CWE reference, (2) a plain-English explanation of the risk, (3) the vulnerable code snippet with line numbers, and (4) specific fix suggestions with secure code examples. Our CLI also has an interactive chat where you can ask follow-up questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 border-b-4 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tight">
            Build Fast. Ship Safe. Stay Secure.
          </h2>
          <p className="text-2xl font-bold text-white">
            AI accelerates innovation.<br />
            Klyntos Guard keeps it under control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link
              href="/signup"
              className="px-12 py-5 bg-white text-blue-600 border-4 border-white font-black text-xl uppercase tracking-wide hover:bg-black hover:text-white hover:border-black transition-colors"
            >
              Get Started for Free
            </Link>
            <Link
              href="/docs"
              className="px-12 py-5 border-4 border-white text-white font-black text-xl uppercase tracking-wide hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black dark:bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center">
              <span className="text-2xl font-black text-white dark:text-black tracking-tight">KLYNTOS<span className="text-blue-600 dark:text-blue-500">GUARD</span></span>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/docs" className="text-sm font-bold uppercase text-white dark:text-black hover:text-blue-400 dark:hover:text-blue-600">
                Docs
              </Link>
              <Link href="/login" className="text-sm font-bold uppercase text-white dark:text-black hover:text-blue-400 dark:hover:text-blue-600">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-bold uppercase text-white dark:text-black hover:text-blue-400 dark:hover:text-blue-600">
                Get Started
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t-2 border-gray-800 dark:border-gray-200 text-center">
            <p className="text-sm font-bold text-gray-400 dark:text-gray-600">
              © 2025 Klyntos Guard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
