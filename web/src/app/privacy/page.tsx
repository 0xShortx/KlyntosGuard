import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | KlyntosGuard',
  description: 'Privacy Policy for KlyntosGuard AI Security Scanner',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8" strokeWidth={2.5} />
            <span className="text-2xl font-black">
              KLYNTOS<span className="text-blue-600">GUARD</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-black font-bold uppercase text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <h1 className="text-5xl font-black mb-4">PRIVACY POLICY</h1>
        <p className="text-gray-600 font-bold mb-12">Last updated: November 2, 2025</p>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          <section>
            <h2 className="text-3xl font-black mb-4">1. INFORMATION WE COLLECT</h2>
            <h3 className="text-xl font-bold mb-3">Account Information</h3>
            <p className="mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
              <li>Name and email address</li>
              <li>GitHub or Google account information (when using OAuth)</li>
              <li>Payment information (processed securely via Stripe)</li>
            </ul>

            <h3 className="text-xl font-bold mb-3">Code Scanning Data</h3>
            <p className="mb-4">
              When you scan repositories, we temporarily process:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Code content for analysis</li>
              <li>File names and structure</li>
              <li>Repository metadata</li>
              <li>Scan results and vulnerabilities found</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">2. HOW WE USE YOUR INFORMATION</h2>
            <p className="mb-4">We use collected information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and improve the Service</li>
              <li>Process security scans of your code</li>
              <li>Send scan results and notifications</li>
              <li>Process payments and manage subscriptions</li>
              <li>Respond to support requests</li>
              <li>Send important Service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">3. DATA SECURITY</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All data transmission is encrypted using TLS/SSL</li>
              <li>GitHub access tokens are encrypted at rest</li>
              <li>Code is only temporarily cached during scanning</li>
              <li>Database access is restricted and monitored</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">4. DATA RETENTION</h2>
            <p className="mb-4">
              We retain different types of data for varying periods:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Scan Results:</strong> Stored indefinitely for your reference</li>
              <li><strong>Code Content:</strong> Temporarily cached (24 hours max)</li>
              <li><strong>Account Data:</strong> Retained until account deletion</li>
              <li><strong>Payment Records:</strong> Retained for 7 years (legal requirement)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">5. THIRD-PARTY SERVICES</h2>
            <p className="mb-4">We use the following third-party services:</p>

            <h3 className="text-xl font-bold mb-3">Authentication</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>GitHub OAuth - for GitHub authentication and API access</li>
              <li>Google OAuth - for Google authentication</li>
            </ul>

            <h3 className="text-xl font-bold mb-3">Infrastructure & Processing</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Vercel - hosting and deployment</li>
              <li>Neon - database hosting</li>
              <li>Anthropic (Claude) - AI analysis of code</li>
            </ul>

            <h3 className="text-xl font-bold mb-3">Payments</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Stripe - payment processing (we never store card details)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">6. YOUR RIGHTS</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your scan results</li>
              <li><strong>Revoke Access:</strong> Disconnect GitHub/Google access anytime</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">7. COOKIES & TRACKING</h2>
            <p className="mb-4">
              We use essential cookies for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Session management (keeping you logged in)</li>
              <li>Security (CSRF protection)</li>
              <li>Analytics (understanding Service usage)</li>
            </ul>
            <p className="mt-4">
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">8. GDPR COMPLIANCE</h2>
            <p className="mb-4">
              For users in the European Union, we comply with GDPR requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Lawful basis for processing: Legitimate interest & consent</li>
              <li>Data processing agreement with all third-party services</li>
              <li>Right to data portability and erasure</li>
              <li>EU-based data centers where possible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">9. CHILDREN'S PRIVACY</h2>
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly collect information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">10. CHANGES TO PRIVACY POLICY</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">11. CONTACT US</h2>
            <p className="mb-4">
              For privacy-related questions or to exercise your rights, contact us at:
            </p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@klyntos.com" className="text-blue-600 font-bold hover:underline">
                privacy@klyntos.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-gray-50 mt-24">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="font-bold text-gray-600">
            © 2025 Klyntos. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
