import Link from 'next/link'

export default function ProFeaturesPage() {
  return (
    <div>
      <h1 className="text-5xl font-black mb-6">Pro Features & API Reference</h1>

      <p className="text-xl mb-8">
        KlyntosGuard Pro unlocks advanced AI-powered capabilities for professional development teams.
      </p>

      <h2 className="text-3xl font-black mb-4 mt-12">What's Included</h2>

      <div className="space-y-8">
        {/* Unlimited Scans */}
        <div className="border-4 border-black p-6 bg-green-50">
          <h3 className="text-2xl font-black mb-3">✅ Unlimited Scans <span className="text-sm bg-green-600 text-white px-2 py-1">LIVE</span></h3>
          <p className="mb-2">No monthly limits. Scan as much code as you need.</p>
          <pre className="bg-black text-white p-4 border-2 border-black text-sm mb-2">
            <code>{`# Basic: 1,000 scans/month (enforced)
# Pro: Unlimited ✓
kg scan src/ --recursive`}</code>
          </pre>
          <p className="text-sm text-gray-700">
            <strong>How it works:</strong> Basic users hit a hard limit at 1,000 scans/month.
            System tracks scans in real-time via database. Clear upgrade prompts when limit reached. Pro users have no restrictions.
          </p>
        </div>

        {/* Enhanced AI */}
        <div className="border-4 border-black p-6 bg-blue-50">
          <h3 className="text-2xl font-black mb-3">✅ Enhanced AI Analysis <span className="text-sm bg-green-600 text-white px-2 py-1">LIVE</span></h3>
          <p className="mb-2">Pro users get access to more powerful AI models for deeper analysis:</p>
          <ul className="space-y-1 mb-3">
            <li><strong>Claude 3 Opus</strong> - Most capable model for complex vulnerabilities (vs Haiku for Basic)</li>
            <li><strong>Deep Analysis Mode</strong> - 18 vulnerability categories vs 10 for Basic</li>
            <li><strong>8192 Token Limit</strong> - Double the analysis depth (vs 4096 for Basic)</li>
            <li><strong>Dataflow Tracking</strong> - Traces untrusted input from source to sink</li>
          </ul>
          <pre className="bg-black text-white p-4 border-2 border-black text-sm">
            <code>kg scan app.py --depth deep --model opus</code>
          </pre>
        </div>

        {/* Custom Policies */}
        <div className="border-4 border-black p-6 bg-gray-100">
          <h3 className="text-2xl font-black mb-3">🚧 Custom Security Policies <span className="text-sm bg-yellow-500 text-black px-2 py-1">COMING SOON</span></h3>
          <p className="mb-2">Define your own security rules and compliance requirements.</p>
        </div>

        {/* API Access */}
        <div className="border-4 border-black p-6 bg-purple-50">
          <h3 className="text-2xl font-black mb-3">✅ API Access <span className="text-sm bg-green-600 text-white px-2 py-1">LIVE</span></h3>
          <p className="mb-3">Integrate KlyntosGuard into your CI/CD pipeline via REST API.</p>
          <h4 className="font-black mb-2">GitHub Actions Example:</h4>
          <pre className="bg-black text-white p-4 border-2 border-black text-sm overflow-x-auto">
            <code>{`# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: KlyntosGuard Scan
        uses: klyntos/guard-action@v1
        with:
          api-key: \${{ secrets.KLYNTOS_GUARD_API_KEY }}
          fail-on: critical,high
          output: sarif`}</code>
          </pre>
        </div>
      </div>

      {/* Pricing Table */}
      <h2 className="text-3xl font-black mb-4 mt-16">Pricing Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-4 border-black">
          <thead>
            <tr className="bg-black text-white">
              <th className="border-2 border-white p-3 text-left font-black">Feature</th>
              <th className="border-2 border-white p-3 text-left font-black">Basic ($29/mo)</th>
              <th className="border-2 border-white p-3 text-left font-black">Pro ($99/mo)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-2 border-black">
              <td className="border-2 border-black p-3"><strong>Scans per month</strong></td>
              <td className="border-2 border-black p-3">1,000</td>
              <td className="border-2 border-black p-3 bg-green-100"><strong>Unlimited</strong></td>
            </tr>
            <tr className="border-2 border-black bg-gray-50">
              <td className="border-2 border-black p-3"><strong>AI Model</strong></td>
              <td className="border-2 border-black p-3">Claude 3 Haiku</td>
              <td className="border-2 border-black p-3 bg-green-100"><strong>Claude 3 Opus</strong></td>
            </tr>
            <tr className="border-2 border-black">
              <td className="border-2 border-black p-3"><strong>Custom Policies</strong></td>
              <td className="border-2 border-black p-3">❌</td>
              <td className="border-2 border-black p-3 bg-green-100"><strong>✓</strong></td>
            </tr>
            <tr className="border-2 border-black bg-gray-50">
              <td className="border-2 border-black p-3"><strong>API Access</strong></td>
              <td className="border-2 border-black p-3">❌</td>
              <td className="border-2 border-black p-3 bg-green-100"><strong>✓</strong></td>
            </tr>
            <tr className="border-2 border-black">
              <td className="border-2 border-black p-3"><strong>Support</strong></td>
              <td className="border-2 border-black p-3">Email</td>
              <td className="border-2 border-black p-3 bg-green-100"><strong>24/7 Priority</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* API Reference */}
      <h2 className="text-3xl font-black mb-4 mt-16">API Reference</h2>

      <h3 className="text-2xl font-black mb-3">Scan Endpoint</h3>
      <div className="border-4 border-black p-6 mb-6">
        <p className="mb-2"><strong>Endpoint:</strong> <code className="bg-gray-100 px-2 py-1">POST /api/v1/scan</code></p>

        <h4 className="font-black mt-4 mb-2">Headers:</h4>
        <pre className="bg-black text-white p-4 border-2 border-black text-sm mb-3">
          <code>{`Authorization: Bearer <jwt_token>
Content-Type: application/json`}</code>
        </pre>

        <h4 className="font-black mt-4 mb-2">Request Body:</h4>
        <pre className="bg-black text-white p-4 border-2 border-black text-sm mb-3 overflow-x-auto">
          <code>{`{
  "code": "your code here",
  "language": "python",
  "filename": "app.py",
  "policies": ["all"],
  "model": "opus",        // Pro only: "haiku" or "opus"
  "depth": "deep"         // Pro only: "standard" or "deep"
}`}</code>
        </pre>

        <h4 className="font-black mt-4 mb-2">Basic Plan Restrictions:</h4>
        <ul className="space-y-1 mb-3 list-disc list-inside">
          <li>Maximum 1,000 scans/month (enforced)</li>
          <li>Always uses <code className="bg-gray-100 px-1">model: "haiku"</code></li>
          <li>Always uses <code className="bg-gray-100 px-1">depth: "standard"</code></li>
          <li>Returns 429 error when limit exceeded</li>
        </ul>

        <h4 className="font-black mt-4 mb-2">Pro Plan Benefits:</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>Unlimited scans</li>
          <li>Can specify <code className="bg-gray-100 px-1">model: "opus"</code> for advanced analysis</li>
          <li>Can specify <code className="bg-gray-100 px-1">depth: "deep"</code> for comprehensive review</li>
          <li>8192 token limit (vs 4096 for Basic)</li>
        </ul>
      </div>

      {/* Usage Tracking */}
      <div className="border-4 border-black bg-blue-50 p-6 mb-8">
        <h3 className="text-2xl font-black mb-3">✅ Usage Tracking <span className="text-sm bg-green-600 text-white px-2 py-1">LIVE</span></h3>
        <p className="mb-2">All scans are automatically tracked in the database:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>File name and size</li>
          <li>Issues found</li>
          <li>Severity level</li>
          <li>Scan duration</li>
          <li>Timestamp</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="border-4 border-black bg-yellow-100 p-8 text-center mt-12">
        <h3 className="text-3xl font-black mb-4">Ready to unlock Pro features?</h3>
        <Link
          href="/pricing"
          className="inline-block bg-black text-white px-8 py-4 font-black text-xl hover:bg-gray-800 transition-colors"
        >
          UPGRADE NOW →
        </Link>
      </div>
    </div>
  )
}
