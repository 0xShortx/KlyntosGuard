import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | KlyntosGuard',
  description: 'Terms of Service for KlyntosGuard AI Security Scanner',
}

export default function TermsPage() {
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

        <h1 className="text-5xl font-black mb-4">TERMS OF SERVICE</h1>
        <p className="text-gray-600 font-bold mb-12">Last updated: November 2, 2025</p>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          <section>
            <h2 className="text-3xl font-black mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p className="mb-4">
              By accessing and using KlyntosGuard ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">2. USE LICENSE</h2>
            <p className="mb-4">
              Permission is granted to temporarily use the Service for personal or commercial security scanning purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Service to scan code you don't have permission to access</li>
              <li>Attempt to reverse engineer or compromise the Service</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the Service to another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">3. DESCRIPTION OF SERVICE</h2>
            <p className="mb-4">
              KlyntosGuard provides AI-powered security scanning for code repositories. The Service uses large language models to analyze code for potential security vulnerabilities, compliance issues, and coding best practices.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">4. USER ACCOUNTS</h2>
            <p className="mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">5. GITHUB INTEGRATION</h2>
            <p className="mb-4">
              By connecting your GitHub account, you authorize KlyntosGuard to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your repositories for security scanning</li>
              <li>Post comments on pull requests with scan results</li>
              <li>Receive webhooks for automated scanning</li>
            </ul>
            <p className="mt-4">
              You can revoke this access at any time through your GitHub account settings.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">6. PRIVACY</h2>
            <p className="mb-4">
              Your use of the Service is also governed by our Privacy Policy. Please review our{' '}
              <Link href="/privacy" className="text-blue-600 font-bold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">7. PAYMENT TERMS</h2>
            <p className="mb-4">
              Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable. We reserve the right to change our pricing with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">8. LIMITATION OF LIABILITY</h2>
            <p className="mb-4">
              The Service is provided "as is" without any warranties. We are not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>False positives or missed vulnerabilities in scan results</li>
              <li>Any damages resulting from security issues in your code</li>
              <li>Service interruptions or data loss</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">9. TERMINATION</h2>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">10. CHANGES TO TERMS</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will provide notice of significant changes by email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">11. CONTACT</h2>
            <p>
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@klyntos.com" className="text-blue-600 font-bold hover:underline">
                legal@klyntos.com
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
