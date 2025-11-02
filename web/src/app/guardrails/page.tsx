'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Terminal, Folder, FileCode, AlertTriangle, CheckCircle, ArrowRight, Shield, Github, Upload } from 'lucide-react'
import { RepoSelector } from '@/components/github/repo-selector'

type ScanType = 'github-url' | 'github-selector' | 'local' | 'upload'

export default function GuardrailsPage() {
  const [scanType, setScanType] = useState<ScanType>('github-url')
  const [projectPath, setProjectPath] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasGitHubAccess, setHasGitHubAccess] = useState(false)

  useEffect(() => {
    checkGitHubAccess()
  }, [])

  const checkGitHubAccess = async () => {
    try {
      const response = await fetch('/api/v1/github/repos')
      setHasGitHubAccess(response.ok)
    } catch (error) {
      setHasGitHubAccess(false)
    }
  }

  const handleGitHubUrlScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl.trim()) return

    setIsScanning(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/v1/scan-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: githubUrl.trim(), policy: 'moderate' }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || 'Scan failed')

      setResults(data)
    } catch (err: any) {
      setError(err.message || 'Failed to scan repository')
    } finally {
      setIsScanning(false)
    }
  }

  const handleRepoSelect = async (fullName: string, branch: string) => {
    setGithubUrl(`https://github.com/${fullName}`)
    setIsScanning(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/v1/scan-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUrl: `https://github.com/${fullName}`,
          branch,
          policy: 'moderate'
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || 'Scan failed')

      setResults(data)
    } catch (err: any) {
      setError(err.message || 'Failed to scan repository')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b-4 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-2xl font-black text-black dark:text-white tracking-tight">
              KLYNTOS<span className="text-blue-600">GUARD</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                Dashboard
              </Link>
              <Link href="/scans" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                Scans
              </Link>
              <Link href="/settings/api-keys" className="text-sm font-bold uppercase tracking-wide text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                API Keys
              </Link>
            </div>

            <Link
              href="/dashboard"
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase tracking-wide hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-colors text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b-4 border-black dark:border-white bg-white dark:bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="inline-block px-6 py-2 bg-black dark:bg-white border-4 border-black dark:border-white">
              <span className="text-sm font-black uppercase tracking-wider text-white dark:text-black">
                PROACTIVE SECURITY
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-black dark:text-white">
              Scan Your Project
              <span className="block text-blue-600 dark:text-blue-500">Before You Deploy</span>
            </h1>

            <p className="max-w-3xl mx-auto text-xl font-bold text-black dark:text-white">
              Point KlyntosGuard at your codebase. We'll scan every file for vulnerabilities using Claude 3.5 Sonnet.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-black dark:text-white mb-8 text-center">
            HOW IT WORKS
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 border-4 border-black dark:border-white flex items-center justify-center">
                  <span className="text-white font-black text-lg">1</span>
                </div>
                <h3 className="text-xl font-black uppercase">Code in Your IDE</h3>
              </div>
              <p className="font-bold text-black dark:text-white">
                Write code in VS Code, Cursor, or any editor. Use Claude Code, GitHub Copilot, or code manually.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 border-4 border-black dark:border-white flex items-center justify-center">
                  <span className="text-white font-black text-lg">2</span>
                </div>
                <h3 className="text-xl font-black uppercase">Run Scan</h3>
              </div>
              <p className="font-bold text-black dark:text-white">
                Use the CLI or this dashboard to scan your project directory for security issues.
              </p>
            </div>

            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 border-4 border-black dark:border-white flex items-center justify-center">
                  <span className="text-white font-black text-lg">3</span>
                </div>
                <h3 className="text-xl font-black uppercase">Fix Issues</h3>
              </div>
              <p className="font-bold text-black dark:text-white">
                Get detailed reports with line numbers, severity levels, and fix suggestions. Deploy with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scan Form */}
      <section className="py-20 border-b-4 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8">
            <h2 className="text-3xl font-black mb-6 uppercase">Scan Your Project</h2>

            {/* Scan Type Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                type="button"
                onClick={() => setScanType('github-url')}
                className={`p-4 border-4 font-black uppercase text-sm transition-all ${
                  scanType === 'github-url'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Github className="w-6 h-6 mx-auto mb-2" strokeWidth={3} />
                GitHub URL
              </button>

              <button
                type="button"
                onClick={() => setScanType('github-selector')}
                className={`p-4 border-4 font-black uppercase text-sm transition-all ${
                  scanType === 'github-selector'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Folder className="w-6 h-6 mx-auto mb-2" strokeWidth={3} />
                My Repos
              </button>

              <button
                type="button"
                onClick={() => setScanType('local')}
                className={`p-4 border-4 font-black uppercase text-sm transition-all ${
                  scanType === 'local'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Terminal className="w-6 h-6 mx-auto mb-2" strokeWidth={3} />
                Local Path
              </button>

              <button
                type="button"
                onClick={() => setScanType('upload')}
                className={`p-4 border-4 font-black uppercase text-sm transition-all ${
                  scanType === 'upload'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto mb-2" strokeWidth={3} />
                Upload ZIP
              </button>
            </div>

            {/* GitHub URL Scan */}
            {scanType === 'github-url' && (
              <form onSubmit={handleGitHubUrlScan} className="space-y-6">
                <div>
                  <label className="block text-sm font-black uppercase tracking-wide mb-2">
                    GitHub Repository URL
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-4 border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-bold text-lg focus:outline-none focus:border-blue-600"
                    disabled={isScanning}
                  />
                  <p className="mt-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                    Supports: https://github.com/owner/repo or git@github.com:owner/repo.git
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isScanning || !githubUrl.trim()}
                  className="w-full px-8 py-5 bg-blue-600 border-4 border-blue-600 text-white font-black text-lg uppercase tracking-wide hover:bg-black hover:border-black dark:hover:bg-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                >
                  {isScanning ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      SCANNING...
                    </>
                  ) : (
                    <>
                      <Github className="w-6 h-6" strokeWidth={3} />
                      SCAN GITHUB REPOSITORY
                    </>
                  )}
                </button>
              </form>
            )}

            {/* GitHub Selector */}
            {scanType === 'github-selector' && (
              <RepoSelector
                onSelectRepo={handleRepoSelect}
                accessToken={hasGitHubAccess ? 'connected' : undefined}
              />
            )}

            {/* Local Path - CLI Only */}
            {scanType === 'local' && (
              <div className="border-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <Terminal className="w-16 h-16 mx-auto mb-4 text-gray-400" strokeWidth={3} />
                <h3 className="text-xl font-black mb-2">Local Path Scanning Requires CLI</h3>
                <p className="text-gray-600 dark:text-gray-400 font-bold mb-6">
                  Use the KlyntosGuard CLI to scan local projects
                </p>
                <div className="border-4 border-black dark:border-white bg-black dark:bg-white p-4 font-mono text-sm text-left">
                  <div className="text-green-400 dark:text-green-600 font-bold"># Install CLI</div>
                  <pre className="text-white dark:text-black font-bold">pip install klyntos-guard</pre>
                  <div className="text-green-400 dark:text-green-600 font-bold mt-2"># Scan project</div>
                  <pre className="text-white dark:text-black font-bold">kg scan . --recursive</pre>
                </div>
              </div>
            )}

            {/* Upload - Coming Soon */}
            {scanType === 'upload' && (
              <div className="border-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900 p-12 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" strokeWidth={3} />
                <h3 className="text-xl font-black mb-2">File Upload Coming Soon</h3>
                <p className="text-gray-600 dark:text-gray-400 font-bold mb-6">
                  Upload a ZIP file of your project for scanning
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 font-bold">
                  For now, use GitHub URL or CLI scanning
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6 border-4 border-red-600 bg-red-50 dark:bg-red-950/20 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" strokeWidth={3} />
                  <div>
                    <h3 className="font-black text-lg text-red-900 dark:text-red-100 mb-2">Scan Failed</h3>
                    <p className="text-red-700 dark:text-red-300 font-bold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="mt-8 space-y-4">
                <div className="border-4 border-black dark:border-white bg-gray-50 dark:bg-gray-900 p-6">
                  <h3 className="text-2xl font-black mb-4 uppercase">Scan Results</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-4 text-center">
                      <div className="text-3xl font-black text-black dark:text-white">{results.files}</div>
                      <div className="text-sm font-black uppercase">Files Scanned</div>
                    </div>
                    <div className="border-4 border-red-600 bg-white dark:bg-black p-4 text-center">
                      <div className="text-3xl font-black text-red-600">{results.critical}</div>
                      <div className="text-sm font-black uppercase text-red-600">Critical</div>
                    </div>
                    <div className="border-4 border-orange-600 bg-white dark:bg-black p-4 text-center">
                      <div className="text-3xl font-black text-orange-600">{results.high}</div>
                      <div className="text-sm font-black uppercase text-orange-600">High</div>
                    </div>
                    <div className="border-4 border-green-600 bg-white dark:bg-black p-4 text-center">
                      <div className="text-3xl font-black text-black dark:text-white">{results.files - results.issues}</div>
                      <div className="text-sm font-black uppercase text-green-600">Clean</div>
                    </div>
                  </div>

                  <Link
                    href="/scans"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white transition-colors"
                  >
                    VIEW DETAILED REPORT
                    <ArrowRight className="w-5 h-5" strokeWidth={3} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CLI Alternative */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-4 uppercase">Prefer the Terminal?</h2>
            <p className="text-xl font-bold text-black dark:text-white">
              Use the KlyntosGuard CLI for faster scans
            </p>
          </div>

          <div className="border-4 border-black dark:border-white bg-black dark:bg-white p-6">
            <div className="space-y-4 font-mono text-sm">
              <div>
                <span className="text-green-400 dark:text-green-600 font-bold"># Install CLI</span>
                <pre className="text-white dark:text-black font-bold mt-1">pip install klyntos-guard</pre>
              </div>

              <div>
                <span className="text-green-400 dark:text-green-600 font-bold"># Authenticate</span>
                <pre className="text-white dark:text-black font-bold mt-1">kg auth login</pre>
              </div>

              <div>
                <span className="text-green-400 dark:text-green-600 font-bold"># Scan your project</span>
                <pre className="text-white dark:text-black font-bold mt-1">kg scan . --recursive</pre>
              </div>

              <div>
                <span className="text-green-400 dark:text-green-600 font-bold"># Export results for CI/CD</span>
                <pre className="text-white dark:text-black font-bold mt-1">kg scan . -r --format sarif -o report.sarif</pre>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/settings/api-keys"
              className="inline-flex items-center gap-2 px-6 py-3 border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-black uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <Shield className="w-5 h-5" strokeWidth={3} />
              GET YOUR API KEY
            </Link>
          </div>
        </div>
      </section>

      {/* What Gets Detected */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-12 text-center uppercase">What We Detect</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔓', title: 'SQL INJECTION', desc: 'Unsafe database queries' },
              { icon: '🚨', title: 'XSS ATTACKS', desc: 'Unescaped user input' },
              { icon: '🔑', title: 'HARDCODED SECRETS', desc: 'API keys, passwords in code' },
              { icon: '🔐', title: 'AUTH ISSUES', desc: 'Weak authentication patterns' },
              { icon: '⚠️', title: 'INSECURE CRYPTO', desc: 'MD5, weak hashing' },
              { icon: '📁', title: 'PATH TRAVERSAL', desc: 'File system vulnerabilities' }
            ].map((item, idx) => (
              <div key={idx} className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-black uppercase mb-2">{item.title}</h3>
                <p className="font-bold text-gray-700 dark:text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
