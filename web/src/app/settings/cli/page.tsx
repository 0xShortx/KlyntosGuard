'use client'

/**
 * Settings Page: CLI API Keys
 * /settings/cli
 *
 * Users can:
 * - Generate new API keys for CLI access
 * - View existing keys
 * - Revoke keys
 * - Copy setup commands
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Copy, Trash2, Key, Terminal, CheckCircle2 } from 'lucide-react'

interface ApiKey {
  id: string
  prefix: string
  name: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export default function CliSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/cli/keys')
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error('Failed to fetch keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/cli/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays: 90, // 90 days
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedKey(data.apiKey)
        setNewKeyName('')
        fetchKeys()
      } else {
        alert(`Failed to generate API key: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      alert('Failed to generate API key')
    } finally {
      setIsGenerating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/cli/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      })

      if (response.ok) {
        fetchKeys()
      } else {
        const data = await response.json()
        alert(`Failed to revoke key: ${data.error}`)
      }
    } catch (error) {
      console.error('Error revoking key:', error)
      alert('Failed to revoke key')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Terminal className="w-8 h-8" />
          CLI API Keys
        </h1>
        <p className="text-gray-600 mt-2">
          Generate API keys to authenticate the KlyntosGuard CLI for security scanning
        </p>
      </div>

      {/* Generate New Key Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New API Key</CardTitle>
          <CardDescription>
            Create an API key to use with the KlyntosGuard CLI tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Key name (e.g., 'My Laptop', 'CI/CD Pipeline')"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateKey()}
              className="flex-1"
            />
            <Button
              onClick={generateKey}
              disabled={isGenerating || !newKeyName.trim()}
            >
              <Key className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>

          {generatedKey && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-800 font-semibold">⚠️ Save this key - it won't be shown again!</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">API Key:</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-white rounded font-mono text-sm break-all border">
                      {generatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      {copiedKey ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Setup Command:</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-gray-900 text-green-400 rounded font-mono text-sm">
                      kg auth login --api-key {generatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`kg auth login --api-key ${generatedKey}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>• Install CLI: <code className="bg-gray-100 px-1 rounded">pip install klyntos-guard</code></p>
                  <p>• Run the command above to authenticate</p>
                  <p>• Scan code: <code className="bg-gray-100 px-1 rounded">kg scan your-file.py</code></p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Keys */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your API Keys</h2>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading...
            </CardContent>
          </Card>
        ) : keys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No API keys yet. Generate one above to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <Card key={key.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-sm px-2 py-1 bg-gray-100 rounded">
                          {key.prefix}...
                        </code>
                        <span className="font-medium">{key.name}</span>
                        {!key.isActive && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                            Revoked
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1 space-x-3">
                        <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.lastUsedAt && (
                          <span>• Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                        )}
                        {key.expiresAt && (
                          <span>• Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {key.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeKey(key.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-900">
            <p><strong>Install the CLI:</strong></p>
            <code className="block p-2 bg-white rounded">pip install klyntos-guard</code>

            <p className="pt-2"><strong>Login:</strong></p>
            <code className="block p-2 bg-white rounded">kg auth login --api-key YOUR_KEY</code>

            <p className="pt-2"><strong>Scan your code:</strong></p>
            <code className="block p-2 bg-white rounded">kg scan your-file.py</code>

            <p className="pt-2"><strong>View scan history:</strong></p>
            <code className="block p-2 bg-white rounded">kg report list</code>

            <p className="pt-2">
              <a href="https://github.com/0xShortx/KlyntosGuard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View documentation →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
