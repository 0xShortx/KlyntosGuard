import Link from 'next/link'

export default function GettingStartedPage() {
  return (
    <div>
      <h1 className="text-5xl font-black mb-6">Getting Started</h1>

      <p className="text-xl mb-8">
        This guide will walk you through setting up KlyntosGuard and scanning your first file.
      </p>

      <h2 className="text-3xl font-black mb-4 mt-12">Prerequisites</h2>
      <ul className="space-y-2 mb-8">
        <li>Python 3.8 or higher</li>
        <li>pip (Python package manager)</li>
        <li>A KlyntosGuard account</li>
      </ul>

      <h2 className="text-3xl font-black mb-4 mt-12">Step 1: Create an Account</h2>
      <ol className="space-y-2 mb-8 list-decimal list-inside">
        <li>Visit <Link href="/" className="underline font-bold">guard.klyntos.com</Link></li>
        <li>Click "Get Started" or "Sign Up"</li>
        <li>Choose your plan:
          <ul className="ml-8 mt-2 space-y-1">
            <li><strong>Guard Basic</strong> ($29/month) - 1,000 scans/month</li>
            <li><strong>Guard Pro</strong> ($99/month) - Unlimited scans + advanced features</li>
          </ul>
        </li>
      </ol>

      <h2 className="text-3xl font-black mb-4 mt-12">Step 2: Generate an API Key</h2>
      <ol className="space-y-2 mb-4 list-decimal list-inside">
        <li>Log in to your dashboard</li>
        <li>Navigate to <strong>Settings</strong> → <strong>CLI</strong></li>
        <li>Click "Generate New API Key"</li>
        <li>Give it a descriptive name (e.g., "My MacBook")</li>
        <li><strong>Copy the key immediately</strong> - it won't be shown again!</li>
      </ol>

      <p className="mb-2">Your API key will look like this:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-8">
        <code>kg_a1b2c3d4e5f6789...</code>
      </pre>

      <h2 className="text-3xl font-black mb-4 mt-12">Step 3: Install the CLI</h2>
      <p className="mb-2">Install KlyntosGuard globally using pip:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-4">
        <code>pip install klyntos-guard</code>
      </pre>

      <p className="mb-2">Verify the installation:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-8">
        <code>kg --version</code>
      </pre>

      <h2 className="text-3xl font-black mb-4 mt-12">Step 4: Authenticate</h2>
      <p className="mb-2">Log in with your API key:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-4">
        <code>kg auth login --api-key kg_a1b2c3d4e5f6789...</code>
      </pre>

      <p className="mb-2">You should see:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-4">
        <code>{`✓ Successfully logged in as user@example.com
Token saved to ~/.klyntos_guard/auth.json`}</code>
      </pre>

      <p className="mb-2">Check your auth status:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-8">
        <code>kg auth status</code>
      </pre>

      <h2 className="text-3xl font-black mb-4 mt-12">Step 5: Scan Your First File</h2>
      <p className="mb-2">Create a test file with a vulnerability:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-4">
        <code>{`# test.py
API_KEY = "sk-1234567890"  # Hardcoded secret!
password = "admin123"      # Another secret!

def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"  # SQL injection!
    return query`}</code>
      </pre>

      <p className="mb-2">Now scan it:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-4">
        <code>kg scan test.py</code>
      </pre>

      <p className="mb-2">You'll see output like:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-8">
        <code>{`🔍 Scanning test.py...

🔴 CRITICAL (Line 2)
   Hardcoded API key detected
   💡 Fix: Move to environment variables

🔴 CRITICAL (Line 3)
   Hardcoded password detected
   💡 Fix: Use secure password management

🟠 HIGH (Line 6)
   SQL injection vulnerability
   💡 Fix: Use parameterized queries

✓ Scan complete: 3 issues found in 2.3s`}</code>
      </pre>

      <h2 className="text-3xl font-black mb-4 mt-12">Next Steps</h2>
      <p className="mb-4">Now that you're set up, explore these features:</p>
      <div className="grid gap-4 mb-8">
        <Link
          href="/docs/pro-features"
          className="border-4 border-black p-4 hover:bg-black hover:text-white transition-colors"
        >
          <strong>Pro Features</strong> - Unlock advanced capabilities with Pro
        </Link>
      </div>

      <h2 className="text-3xl font-black mb-4 mt-12">Environment Variables</h2>
      <p className="mb-2">For easier setup, add these to your <code className="bg-gray-100 px-2 py-1">.bashrc</code> or <code className="bg-gray-100 px-2 py-1">.zshrc</code>:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-8">
        <code>{`# KlyntosGuard Configuration
export KLYNTOS_GUARD_API="https://guard.klyntos.com/api"

# Optional: Set custom config directory
export KLYNTOS_GUARD_CONFIG_DIR="$HOME/.klyntos_guard"`}</code>
      </pre>

      <h2 className="text-3xl font-black mb-4 mt-12">Troubleshooting</h2>

      <h3 className="text-2xl font-black mb-2">"Command not found: kg"</h3>
      <p className="mb-2">Make sure pip's bin directory is in your PATH:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-6">
        <code>{`# macOS/Linux
export PATH="$PATH:$HOME/.local/bin"

# Or use python -m
python -m klyntos_guard auth login`}</code>
      </pre>

      <h3 className="text-2xl font-black mb-2">"Unauthorized" error</h3>
      <p className="mb-6">Your API key may have expired or been revoked. Generate a new one from the dashboard.</p>

      <h3 className="text-2xl font-black mb-2">Can't connect to API</h3>
      <p className="mb-2">Check your internet connection and verify the API URL:</p>
      <pre className="bg-black text-white p-4 border-4 border-black mb-8">
        <code>{`echo $KLYNTOS_GUARD_API
# Should show: https://guard.klyntos.com/api`}</code>
      </pre>

      <div className="border-4 border-black bg-blue-100 p-6 mt-12">
        <h3 className="text-xl font-black mb-2">Need Help?</h3>
        <p className="mb-2">We're here for you:</p>
        <ul className="space-y-1">
          <li><strong>Email</strong>: support@klyntos.com</li>
          <li><strong>GitHub</strong>: <a href="https://github.com/0xShortx/KlyntosGuard/issues" className="underline">github.com/0xShortx/KlyntosGuard/issues</a></li>
        </ul>
      </div>
    </div>
  )
}
