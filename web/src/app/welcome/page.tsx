'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle, Terminal, Key, BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function WelcomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [apiKeyGenerated, setApiKeyGenerated] = useState(false)

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-3">
            <Shield className="w-8 h-8" strokeWidth={2.5} />
            <span className="text-2xl font-black">KLYNTOS<span className="text-blue-600">GUARD</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-6 bg-green-100 border-4 border-black mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" strokeWidth={3} />
          </div>
          <h1 className="text-6xl font-black mb-4">WELCOME TO<br />KLYNTOS GUARD!</h1>
          <p className="text-xl text-gray-700 font-bold">
            Let's get you set up in 3 quick steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-12 h-12 border-4 border-black flex items-center justify-center font-black text-xl ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-white'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-2 border-2 border-black ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Generate API Key</span>
            <span>Install CLI</span>
            <span>First Scan</span>
          </div>
        </div>

        {/* Step 1: Generate API Key */}
        {currentStep === 1 && (
          <Card className="border-4 border-black">
            <CardHeader className="bg-blue-50">
              <Key className="w-12 h-12 mb-4" />
              <CardTitle className="text-3xl font-black">STEP 1: GENERATE YOUR API KEY</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <p className="text-lg">
                Your API key authenticates the CLI with our servers. You'll need this to scan your code.
              </p>

              <div className="border-4 border-yellow-500 bg-yellow-50 p-4">
                <p className="font-bold text-sm">
                  ⚠️ <strong>IMPORTANT:</strong> Copy your API key immediately - it won't be shown again!
                </p>
              </div>

              <Link href="/settings/cli">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-6"
                  onClick={() => setApiKeyGenerated(true)}
                >
                  GENERATE API KEY →
                </Button>
              </Link>

              {apiKeyGenerated && (
                <Button
                  variant="outline"
                  className="w-full border-2 border-black font-bold hover:bg-black hover:text-white"
                  onClick={() => setCurrentStep(2)}
                >
                  CONTINUE TO STEP 2 →
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Install CLI */}
        {currentStep === 2 && (
          <Card className="border-4 border-black">
            <CardHeader className="bg-blue-50">
              <Terminal className="w-12 h-12 mb-4" />
              <CardTitle className="text-3xl font-black">STEP 2: INSTALL THE CLI</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <p className="text-lg">
                Install Klyntos Guard globally using pip:
              </p>

              <div>
                <p className="font-bold mb-2">1. Install the package:</p>
                <pre className="bg-black text-white p-4 border-4 border-black text-sm overflow-x-auto">
                  <code>pip install klyntos-guard</code>
                </pre>
              </div>

              <div>
                <p className="font-bold mb-2">2. Verify installation:</p>
                <pre className="bg-black text-white p-4 border-4 border-black text-sm overflow-x-auto">
                  <code>kg --version</code>
                </pre>
              </div>

              <div>
                <p className="font-bold mb-2">3. Login with your API key:</p>
                <pre className="bg-black text-white p-4 border-4 border-black text-sm overflow-x-auto">
                  <code>kg auth login --api-key kg_YOUR_API_KEY_HERE</code>
                </pre>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-black font-bold hover:bg-gray-100"
                  onClick={() => setCurrentStep(1)}
                >
                  ← BACK
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black"
                  onClick={() => setCurrentStep(3)}
                >
                  CONTINUE →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: First Scan */}
        {currentStep === 3 && (
          <Card className="border-4 border-black">
            <CardHeader className="bg-green-50">
              <CheckCircle className="w-12 h-12 mb-4 text-green-600" />
              <CardTitle className="text-3xl font-black">STEP 3: RUN YOUR FIRST SCAN</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <p className="text-lg">
                You're all set! Try scanning a file:
              </p>

              <div>
                <p className="font-bold mb-2">Scan a single file:</p>
                <pre className="bg-black text-white p-4 border-4 border-black text-sm overflow-x-auto">
                  <code>kg scan myfile.py</code>
                </pre>
              </div>

              <div>
                <p className="font-bold mb-2">Scan a directory recursively:</p>
                <pre className="bg-black text-white p-4 border-4 border-black text-sm overflow-x-auto">
                  <code>kg scan src/ --recursive</code>
                </pre>
              </div>

              <div className="border-4 border-blue-500 bg-blue-50 p-6">
                <h3 className="font-black text-xl mb-3">🎉 YOU'RE READY TO GO!</h3>
                <p className="mb-4">
                  Your code is now protected by AI-powered security scanning. Check out these resources to get the most out of Klyntos Guard:
                </p>
                <div className="space-y-2">
                  <Link href="/docs" className="block text-blue-600 hover:underline font-bold">
                    → Read the full documentation
                  </Link>
                  <Link href="/docs/pro-features" className="block text-blue-600 hover:underline font-bold">
                    → Explore Pro features & API
                  </Link>
                  <Link href="/settings/cli" className="block text-blue-600 hover:underline font-bold">
                    → Manage your API keys
                  </Link>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-black font-bold hover:bg-gray-100"
                  onClick={() => setCurrentStep(2)}
                >
                  ← BACK
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black text-lg"
                  onClick={handleComplete}
                >
                  GO TO DASHBOARD →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Links */}
        <div className="mt-12 text-center space-x-6">
          <Link href="/docs" className="text-sm font-bold uppercase hover:text-blue-600">
            Documentation
          </Link>
          <Link href="/dashboard" className="text-sm font-bold uppercase hover:text-blue-600">
            Skip to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
