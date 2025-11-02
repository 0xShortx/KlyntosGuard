'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, Download, Terminal, Code2, Zap } from 'lucide-react'

export default function IDESetupPage() {
  const [apiKey, setApiKey] = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedIDE, setSelectedIDE] = useState<'vscode' | 'cursor'>('vscode')

  useEffect(() => {
    // Fetch user's API key
    fetchAPIKey()
  }, [])

  const fetchAPIKey = async () => {
    try {
      const response = await fetch('/api/v1/api-keys')
      const data = await response.json()
      if (data.keys && data.keys.length > 0) {
        setApiKey(data.keys[0].key)
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const vscodeSettings = JSON.stringify({
    "klyntos.guard.apiKey": apiKey,
    "klyntos.guard.autoScan": true,
    "klyntos.guard.scanOnSave": true,
    "klyntos.guard.policy": "moderate"
  }, null, 2)

  const downloadVSIX = () => {
    window.location.href = '/api/v1/generate-vsix'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b-4 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a className="text-2xl font-black text-black dark:text-white tracking-tight" href="/">
              KLYNTOS<span className="text-blue-600">GUARD</span>
            </a>
            <a
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase tracking-wide hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-colors text-sm"
              href="/dashboard"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b-4 border-black dark:border-white bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-black py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="inline-block px-6 py-2 bg-blue-600 border-4 border-black dark:border-white">
              <span className="text-sm font-black uppercase tracking-wider text-white">
                IDE INTEGRATION
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-black dark:text-white">
              Scan While You Code
              <span className="block text-blue-600 dark:text-blue-500">
                Security In Your IDE
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl font-bold text-gray-700 dark:text-gray-300">
              Get instant security feedback as you write code. No context switching.
            </p>
          </div>
        </div>
      </section>

      {/* IDE Selector */}
      <section className="py-12 border-b-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-8 uppercase">Choose Your IDE</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedIDE('vscode')}
              className={`p-8 border-4 font-black uppercase transition-all ${
                selectedIDE === 'vscode'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-black dark:border-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Code2 className="w-16 h-16 mx-auto mb-4" strokeWidth={3} />
              <h3 className="text-2xl mb-2">VS CODE</h3>
              <p className={`text-sm font-bold ${selectedIDE === 'vscode' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                Microsoft Visual Studio Code
              </p>
            </button>

            <button
              onClick={() => setSelectedIDE('cursor')}
              className={`p-8 border-4 font-black uppercase transition-all ${
                selectedIDE === 'cursor'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-black dark:border-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Zap className="w-16 h-16 mx-auto mb-4" strokeWidth={3} />
              <h3 className="text-2xl mb-2">CURSOR</h3>
              <p className={`text-sm font-bold ${selectedIDE === 'cursor' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                AI-First Code Editor
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Setup Methods */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Method 1: Download Extension (Coming Soon) */}
          <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600 border-4 border-black dark:border-white flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">Download Pre-Configured Extension</h3>
                <p className="font-bold text-gray-700 dark:text-gray-300">
                  One-click install with your API key already configured
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border-4 border-black dark:border-white p-6 mb-4">
              <p className="text-center font-black text-lg mb-4 text-gray-600 dark:text-gray-400">
                🚧 COMING SOON 🚧
              </p>
              <button
                onClick={downloadVSIX}
                disabled
                className="w-full px-8 py-4 bg-gray-400 border-4 border-gray-400 text-white font-black uppercase opacity-50 cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" strokeWidth={3} />
                Download Extension (.vsix)
              </button>
            </div>

            <div className="space-y-2 text-sm font-bold text-gray-600 dark:text-gray-400">
              <p>• ✅ API key pre-configured</p>
              <p>• ✅ Zero manual setup</p>
              <p>• ✅ Works offline</p>
              <p>• ⏳ Publishing to marketplace (ETA: 2 weeks)</p>
            </div>
          </div>

          {/* Method 2: Manual Configuration */}
          <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-green-600 border-4 border-black dark:border-white flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">Manual Setup (Available Now)</h3>
                <p className="font-bold text-gray-700 dark:text-gray-300">
                  Configure {selectedIDE === 'vscode' ? 'VS Code' : 'Cursor'} settings manually
                </p>
              </div>
            </div>

            {/* Step 1: Install Extension (Future) */}
            <div className="mb-6">
              <h4 className="font-black uppercase mb-3 text-lg">Step 1: Install Extension (Optional)</h4>
              <div className="bg-gray-900 dark:bg-black border-4 border-black dark:border-white p-4 mb-3">
                <code className="text-white dark:text-green-400 font-mono text-sm">
                  # Coming soon - Official extension not yet published
                  <br />
                  # For now, use CLI or web interface
                </code>
              </div>
            </div>

            {/* Step 2: Configure Settings */}
            <div className="mb-6">
              <h4 className="font-black uppercase mb-3 text-lg">Step 2: Configure API Key</h4>
              <p className="text-sm font-bold mb-3 text-gray-600 dark:text-gray-400">
                Add these settings to your {selectedIDE === 'vscode' ? 'VS Code' : 'Cursor'} <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1">settings.json</code>
              </p>

              <div className="relative">
                <div className="bg-gray-900 dark:bg-black border-4 border-black dark:border-white p-6 overflow-x-auto">
                  <pre className="text-green-400 font-mono text-sm">
                    {vscodeSettings}
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(vscodeSettings, 'settings')}
                  className="absolute top-4 right-4 px-4 py-2 bg-blue-600 border-2 border-white text-white font-black text-xs uppercase hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {copied === 'settings' ? (
                    <>
                      <Check className="w-4 h-4" strokeWidth={3} />
                      COPIED!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={3} />
                      COPY
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 3: Open Settings */}
            <div className="mb-6">
              <h4 className="font-black uppercase mb-3 text-lg">Step 3: Open Settings File</h4>
              <div className="space-y-3">
                <div className="border-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="font-black mb-2">macOS / Linux:</p>
                  <code className="font-mono text-sm">Cmd + Shift + P → "Preferences: Open User Settings (JSON)"</code>
                </div>
                <div className="border-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="font-black mb-2">Windows:</p>
                  <code className="font-mono text-sm">Ctrl + Shift + P → "Preferences: Open User Settings (JSON)"</code>
                </div>
              </div>
            </div>

            {/* Step 4: Paste & Save */}
            <div>
              <h4 className="font-black uppercase mb-3 text-lg">Step 4: Paste & Save</h4>
              <ol className="space-y-2 text-sm font-bold list-decimal list-inside text-gray-700 dark:text-gray-300">
                <li>Paste the copied settings into your <code>settings.json</code></li>
                <li>Save the file (Cmd+S or Ctrl+S)</li>
                <li>Reload {selectedIDE === 'vscode' ? 'VS Code' : 'Cursor'} (Cmd+R or Ctrl+R)</li>
                <li>Start coding! Security scans will run automatically</li>
              </ol>
            </div>
          </div>

          {/* Method 3: CLI Integration */}
          <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-600 border-4 border-black dark:border-white flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">Use CLI Instead</h3>
                <p className="font-bold text-gray-700 dark:text-gray-300">
                  Prefer the terminal? Use our CLI tool
                </p>
              </div>
            </div>

            <div className="bg-gray-900 dark:bg-black border-4 border-black dark:border-white p-6 space-y-4 font-mono text-sm">
              <div>
                <span className="text-green-400 font-bold"># Install CLI</span>
                <pre className="text-white mt-1">pip install klyntos-guard</pre>
              </div>
              <div>
                <span className="text-green-400 font-bold"># Login with your API key</span>
                <pre className="text-white mt-1">kg auth login</pre>
              </div>
              <div>
                <span className="text-green-400 font-bold"># Scan current directory</span>
                <pre className="text-white mt-1">kg scan . --recursive</pre>
              </div>
              <div>
                <span className="text-green-400 font-bold"># Watch mode (auto-scan on file changes)</span>
                <pre className="text-white mt-1">kg scan . --watch</pre>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <a
                href="/settings/api-keys"
                className="px-8 py-4 bg-purple-600 border-4 border-purple-600 text-white font-black uppercase hover:bg-purple-700 transition-colors flex items-center gap-3"
              >
                <Terminal className="w-6 h-6" strokeWidth={3} />
                Get Your API Key
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 border-t-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-12 uppercase">What You Get</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-black uppercase mb-2">Real-Time Scanning</h3>
              <p className="font-bold text-gray-700 dark:text-gray-300">
                Get instant feedback as you type. No manual uploads.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-black uppercase mb-2">Inline Warnings</h3>
              <p className="font-bold text-gray-700 dark:text-gray-300">
                See security issues directly in your code with line numbers.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-black uppercase mb-2">Quick Fixes</h3>
              <p className="font-bold text-gray-700 dark:text-gray-300">
                Get suggested fixes you can apply with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-20 border-t-4 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-6 uppercase">Need Help?</h2>
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-8">
            Having trouble setting up? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/docs"
              className="px-8 py-4 border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              Read Documentation
            </a>
            <a
              href="mailto:support@klyntos.com"
              className="px-8 py-4 bg-blue-600 border-4 border-blue-600 text-white font-black uppercase hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
