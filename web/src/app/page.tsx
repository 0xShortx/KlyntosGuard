import Link from 'next/link'
import { ArrowRight, Shield, Code, Zap, Users, CheckCircle, Lock, Eye, Terminal } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b-4 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-black dark:text-white" strokeWidth={2.5} />
              <span className="text-2xl font-black text-black dark:text-white tracking-tight">KLYNTOS<span className="text-blue-600">GUARD</span></span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Features</a>
              <a href="#how-it-works" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">How It Works</a>
              <a href="#pricing" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Pricing</a>
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
                Get Started
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
                <span className="text-sm font-black uppercase tracking-wider text-white dark:text-black">AI-Powered Security</span>
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-black dark:text-white leading-none">
              CATCH BUGS
              <span className="block text-blue-600 dark:text-blue-500">BEFORE PROD</span>
            </h1>

            <p className="max-w-3xl mx-auto text-xl sm:text-2xl font-mono text-black dark:text-white leading-relaxed">
              AI security analysis for your IDE. Detect secrets, SQL injection, XSS, and 100+ vulnerability types in &lt;6 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/pricing"
                className="group px-10 py-5 bg-blue-600 border-4 border-blue-600 text-white font-black text-lg uppercase tracking-wide hover:bg-black hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white transition-colors flex items-center space-x-3"
              >
                <span>Start Now</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
              </Link>
              <a
                href="#how-it-works"
                className="px-10 py-5 border-4 border-black dark:border-white text-black dark:text-white font-black text-lg uppercase tracking-wide hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                How It Works
              </a>
            </div>

            {/* Stats */}
            <div className="pt-20 grid grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-black">
                <div className="text-5xl font-black font-mono text-black dark:text-white">100+</div>
                <div className="text-sm font-bold uppercase tracking-wide text-black dark:text-white mt-2">Vulnerability Types</div>
              </div>
              <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-black">
                <div className="text-5xl font-black font-mono text-black dark:text-white">&lt;6s</div>
                <div className="text-sm font-bold uppercase tracking-wide text-black dark:text-white mt-2">Scan Time</div>
              </div>
              <div className="border-4 border-black dark:border-white p-6 bg-white dark:bg-black">
                <div className="text-5xl font-black font-mono text-black dark:text-white">99.9%</div>
                <div className="text-sm font-bold uppercase tracking-wide text-black dark:text-white mt-2">Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-24 bg-white dark:bg-black border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl font-black text-black dark:text-white tracking-tight">
                SCAN CODE IN SECONDS
              </h2>
              <p className="text-lg font-mono text-black dark:text-white leading-relaxed">
                Install CLI → Authenticate → Scan. Works with Python, JavaScript, TypeScript, Go, Java. Instant security feedback.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 border-l-4 border-black dark:border-white pl-4">
                  <div>
                    <div className="font-black uppercase text-sm tracking-wide text-black dark:text-white">Hardcoded Secrets</div>
                    <div className="font-mono text-sm text-black dark:text-white mt-1">API keys, passwords, tokens</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4 border-l-4 border-black dark:border-white pl-4">
                  <div>
                    <div className="font-black uppercase text-sm tracking-wide text-black dark:text-white">SQL Injection</div>
                    <div className="font-mono text-sm text-black dark:text-white mt-1">Unsafe database queries</div>
                  </div>
                </div>
                <div className="flex items-start space-x-4 border-l-4 border-black dark:border-white pl-4">
                  <div>
                    <div className="font-black uppercase text-sm tracking-wide text-black dark:text-white">PII Exposure</div>
                    <div className="font-mono text-sm text-black dark:text-white mt-1">Personal data risks</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black dark:bg-white border-4 border-black dark:border-white p-8">
              <div className="flex items-center space-x-2 mb-6 pb-4 border-b-2 border-white dark:border-black">
                <Terminal className="w-5 h-5 text-white dark:text-black" strokeWidth={3} />
                <span className="font-mono text-sm font-bold text-white dark:text-black">TERMINAL</span>
              </div>
              <pre className="text-sm font-mono text-green-400 dark:text-green-600 leading-relaxed">
{`$ kg scan app.py

🔍 Scanning app.py...

🔴 CRITICAL (Line 15)
   Hardcoded API key detected
   💡 Fix: Move to environment variables

🟠 HIGH (Line 42)
   SQL injection vulnerability
   💡 Fix: Use parameterized queries

✓ Scan complete: 2 issues found`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-black dark:bg-white border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-white dark:text-black mb-6 tracking-tight">
              THREE STEPS
            </h2>
            <p className="text-xl font-mono text-white dark:text-black max-w-2xl mx-auto">
              Get started in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <div className="bg-white dark:bg-black border-4 border-white dark:border-black p-8 hover:bg-blue-600 hover:border-blue-600 transition-all">
                <div className="text-7xl font-black font-mono text-black dark:text-white group-hover:text-white mb-6">01</div>
                <Lock className="w-14 h-14 text-black dark:text-white group-hover:text-white mb-6" strokeWidth={3} />
                <h3 className="text-xl font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white mb-4">Sign Up + API Key</h3>
                <p className="font-mono text-sm text-black dark:text-white group-hover:text-white leading-relaxed">
                  Create account → Generate secure API key → Ready in 30 seconds
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white dark:bg-black border-4 border-white dark:border-black p-8 hover:bg-blue-600 hover:border-blue-600 transition-all">
                <div className="text-7xl font-black font-mono text-black dark:text-white group-hover:text-white mb-6">02</div>
                <Terminal className="w-14 h-14 text-black dark:text-white group-hover:text-white mb-6" strokeWidth={3} />
                <h3 className="text-xl font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white mb-4">Install + Auth</h3>
                <p className="font-mono text-sm text-black dark:text-white group-hover:text-white leading-relaxed">
                  pip install klyntos-guard → kg auth login → One command done
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white dark:bg-black border-4 border-white dark:border-black p-8 hover:bg-blue-600 hover:border-blue-600 transition-all">
                <div className="text-7xl font-black font-mono text-black dark:text-white group-hover:text-white mb-6">03</div>
                <Eye className="w-14 h-14 text-black dark:text-white group-hover:text-white mb-6" strokeWidth={3} />
                <h3 className="text-xl font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white mb-4">Scan + Fix</h3>
                <p className="font-mono text-sm text-black dark:text-white group-hover:text-white leading-relaxed">
                  kg scan file.py → AI analysis → Get actionable fixes instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white dark:bg-black border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-black dark:text-white mb-6 tracking-tight">
              ENTERPRISE SECURITY
            </h2>
            <p className="text-xl font-mono text-black dark:text-white max-w-3xl mx-auto">
              Ship fast. Stay secure. Built for modern dev teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
              <Shield className="w-12 h-12 text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-6" strokeWidth={3} />
              <h3 className="text-lg font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-3">AI Detection</h3>
              <p className="font-mono text-sm text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Claude 3 + 99.9% accuracy</p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
              <Code className="w-12 h-12 text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-6" strokeWidth={3} />
              <h3 className="text-lg font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-3">Multi-Language</h3>
              <p className="font-mono text-sm text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Python, JS, TS, Go, Java +</p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
              <Zap className="w-12 h-12 text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-6" strokeWidth={3} />
              <h3 className="text-lg font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-3">Lightning Fast</h3>
              <p className="font-mono text-sm text-black dark:text-white group-hover:text-white dark:group-hover:text-black">&lt;6s scans. Instant feedback.</p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
              <Users className="w-12 h-12 text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-6" strokeWidth={3} />
              <h3 className="text-lg font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-3">IDE Integration</h3>
              <p className="font-mono text-sm text-black dark:text-white group-hover:text-white dark:group-hover:text-black">VS Code, Cursor, PyCharm</p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
              <Lock className="w-12 h-12 text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-6" strokeWidth={3} />
              <h3 className="text-lg font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-3">Zero Storage</h3>
              <p className="font-mono text-sm text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Code analyzed, never stored</p>
            </div>

            <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group transition-all">
              <Eye className="w-12 h-12 text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-6" strokeWidth={3} />
              <h3 className="text-lg font-black uppercase tracking-wide text-black dark:text-white group-hover:text-white dark:group-hover:text-black mb-3">Fix Suggestions</h3>
              <p className="font-mono text-sm text-black dark:text-white group-hover:text-white dark:group-hover:text-black">Actionable fixes, not errors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-black dark:bg-white border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-white dark:text-black mb-6 tracking-tight">
              SIMPLE PRICING
            </h2>
            <p className="text-xl font-mono text-white dark:text-black">
              Pick a plan. Start scanning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-black border-4 border-white dark:border-black p-10">
              <h3 className="text-3xl font-black uppercase text-black dark:text-white mb-4">BASIC</h3>
              <div className="flex items-baseline mb-8 border-b-4 border-black dark:border-white pb-6">
                <span className="text-6xl font-black font-mono text-black dark:text-white">$29</span>
                <span className="text-lg font-bold font-mono text-black dark:text-white ml-3">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start space-x-3 border-l-4 border-black dark:border-white pl-4">
                  <span className="font-mono text-sm text-black dark:text-white">1,000 scans/month</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-black dark:border-white pl-4">
                  <span className="font-mono text-sm text-black dark:text-white">Standard policies</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-black dark:border-white pl-4">
                  <span className="font-mono text-sm text-black dark:text-white">CLI access</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-black dark:border-white pl-4">
                  <span className="font-mono text-sm text-black dark:text-white">Email support</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-black dark:border-white pl-4">
                  <span className="font-mono text-sm text-black dark:text-white">All languages</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full px-6 py-4 bg-black dark:bg-white border-4 border-black dark:border-white text-white dark:text-black text-center font-black uppercase tracking-wide hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 transition-colors"
              >
                Start Basic
              </Link>
            </div>

            <div className="bg-blue-600 border-4 border-blue-600 p-10 relative">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-black dark:bg-white border-4 border-black dark:border-white">
                <span className="text-xs font-black uppercase tracking-wider text-white dark:text-black">POPULAR</span>
              </div>
              <h3 className="text-3xl font-black uppercase text-white mb-4">PRO</h3>
              <div className="flex items-baseline mb-8 border-b-4 border-white pb-6">
                <span className="text-6xl font-black font-mono text-white">$99</span>
                <span className="text-lg font-bold font-mono text-white ml-3">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start space-x-3 border-l-4 border-white pl-4">
                  <span className="font-mono text-sm text-white font-bold">Unlimited scans</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-white pl-4">
                  <span className="font-mono text-sm text-white font-bold">Custom policies</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-white pl-4">
                  <span className="font-mono text-sm text-white font-bold">Real-time guardrails</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-white pl-4">
                  <span className="font-mono text-sm text-white font-bold">24/7 priority support</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-white pl-4">
                  <span className="font-mono text-sm text-white font-bold">API access</span>
                </li>
                <li className="flex items-start space-x-3 border-l-4 border-white pl-4">
                  <span className="font-mono text-sm text-white font-bold">Compliance reports</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full px-6 py-4 bg-black border-4 border-black text-white text-center font-black uppercase tracking-wide hover:bg-white hover:text-black hover:border-white transition-colors"
              >
                Start Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 border-b-4 border-black dark:border-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-8 tracking-tight">
            READY TO SHIP SECURE CODE?
          </h2>
          <p className="text-xl font-mono text-white mb-12 max-w-3xl mx-auto">
            Join developers catching vulnerabilities before production.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/settings/cli"
              className="px-12 py-5 bg-black border-4 border-black text-white font-black text-lg uppercase tracking-wide hover:bg-white hover:text-black hover:border-white transition-colors"
            >
              Start Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-8 h-8 text-black dark:text-white" strokeWidth={3} />
                <span className="font-black text-xl text-black dark:text-white">KLYNTOS<span className="text-blue-600">GUARD</span></span>
              </div>
              <p className="font-mono text-sm text-black dark:text-white">
                AI security for devs who ship fast.
              </p>
            </div>

            <div>
              <h4 className="font-black uppercase text-sm tracking-wide text-black dark:text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm font-mono">
                <li><a href="#features" className="text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Features</a></li>
                <li><a href="#pricing" className="text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase text-sm tracking-wide text-black dark:text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm font-mono">
                <li><Link href="/settings/cli" className="text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase text-sm tracking-wide text-black dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm font-mono">
                <li><span className="text-black dark:text-white">Privacy Policy</span></li>
                <li><span className="text-black dark:text-white">Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t-4 border-black dark:border-white text-center">
            <p className="font-mono text-sm font-bold text-black dark:text-white">
              &copy; {new Date().getFullYear()} KLYNTOSGUARD. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
