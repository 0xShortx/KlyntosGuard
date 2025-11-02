import Link from 'next/link'

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-5xl font-black mb-6">KlyntosGuard Documentation</h1>

      <p className="text-xl mb-8">
        Welcome to the KlyntosGuard documentation! This guide will help you integrate AI-powered code security into your development workflow.
      </p>

      <h2 className="text-3xl font-black mb-4 mt-12">What is KlyntosGuard?</h2>

      <p className="mb-4">
        KlyntosGuard is an AI-powered code security platform that helps developers catch vulnerabilities before they ship to production. It uses advanced language models (Claude 3) to analyze your code and detect:
      </p>

      <ul className="space-y-2 mb-8">
        <li>🔑 <strong>Hardcoded Secrets</strong> - API keys, passwords, tokens</li>
        <li>🛡️ <strong>SQL Injection</strong> - Unsafe database queries</li>
        <li>🔒 <strong>PII Exposure</strong> - Personal identifiable information</li>
        <li>⚡ <strong>Command Injection</strong> - Unsafe shell commands</li>
        <li>🌐 <strong>XSS Vulnerabilities</strong> - Cross-site scripting risks</li>
        <li>📁 <strong>Path Traversal</strong> - File access vulnerabilities</li>
        <li>🔐 <strong>Weak Cryptography</strong> - Insecure algorithms</li>
        <li>👤 <strong>Auth Issues</strong> - Missing authentication/authorization</li>
      </ul>

      <h2 className="text-3xl font-black mb-4 mt-12">Quick Start</h2>

      <p className="mb-4">Get up and running in under 5 minutes:</p>

      <pre className="bg-black text-white p-6 overflow-x-auto border-4 border-black mb-8">
        <code>{`# 1. Install the CLI
pip install klyntos-guard

# 2. Authenticate
kg auth login --api-key <your-api-key>

# 3. Scan your code
kg scan myfile.py`}</code>
      </pre>

      <h2 className="text-3xl font-black mb-4 mt-12">Features</h2>

      <h3 className="text-2xl font-black mb-3">For Individual Developers</h3>
      <ul className="space-y-2 mb-6">
        <li><strong>IDE Integration</strong> - Works with VS Code, Cursor, PyCharm, and more</li>
        <li><strong>Pre-commit Hooks</strong> - Catch issues before they're committed</li>
        <li><strong>Real-time Feedback</strong> - Get instant security insights as you code</li>
        <li><strong>Multi-language Support</strong> - Python, JavaScript, TypeScript, Go, Java, and more</li>
      </ul>

      <h3 className="text-2xl font-black mb-3">For Teams (Pro)</h3>
      <ul className="space-y-2 mb-8">
        <li><strong>Custom Policies</strong> - Define your own security rules</li>
        <li><strong>Unlimited Scans</strong> - No monthly limits</li>
        <li><strong>Priority Support</strong> - 24/7 assistance</li>
        <li><strong>Compliance Reports</strong> - PCI-DSS, HIPAA, SOC2 ready</li>
        <li><strong>API Access</strong> - Integrate into your CI/CD pipeline</li>
      </ul>

      <h2 className="text-3xl font-black mb-4 mt-12">What's Next?</h2>

      <div className="grid grid-cols-2 gap-4 my-8">
        <Link
          href="/docs/getting-started"
          className="border-4 border-black p-6 hover:bg-black hover:text-white transition-colors"
        >
          <h3 className="text-xl font-black mb-2">Getting Started →</h3>
          <p>Install and configure KlyntosGuard</p>
        </Link>

        <Link
          href="/docs/pro-features"
          className="border-4 border-black p-6 hover:bg-black hover:text-white transition-colors"
        >
          <h3 className="text-xl font-black mb-2">API Reference →</h3>
          <p>Integrate via REST API</p>
        </Link>
      </div>

      <h2 className="text-3xl font-black mb-4 mt-12">Support</h2>
      <ul className="space-y-2 mb-8">
        <li><strong>Email</strong>: support@klyntos.com</li>
        <li><strong>GitHub</strong>: <a href="https://github.com/0xShortx/KlyntosGuard" className="underline">github.com/0xShortx/KlyntosGuard</a></li>
      </ul>

      <div className="border-4 border-black bg-green-100 p-6 mt-12">
        <h3 className="text-xl font-black mb-2">✓ System Status</h3>
        <p className="mb-2">All systems operational</p>
        <ul className="space-y-1 text-sm">
          <li>API Uptime: 99.99%</li>
          <li>Average Response Time: &lt;100ms</li>
          <li>Last Incident: None</li>
        </ul>
      </div>
    </div>
  )
}
