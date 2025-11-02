'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Key, Terminal, BookOpen, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SubscriptionStatus {
  isActive: boolean
  plan: 'basic' | 'pro' | null
  scansUsed: number
  scansLimit: number
}

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch subscription status
      const subResponse = await fetch('/api/subscriptions/status')
      const subData = await subResponse.json()
      setSubscription(subData)

      // Check if user has API keys
      const keysResponse = await fetch('/api/cli/keys')
      const keysData = await keysResponse.json()
      setHasApiKey(keysData.keys && keysData.keys.length > 0)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const usagePercentage = subscription
    ? subscription.plan === 'pro'
      ? 0
      : (subscription.scansUsed / subscription.scansLimit) * 100
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 animate-pulse mx-auto mb-4" />
          <p className="font-bold">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Shield className="w-8 h-8" strokeWidth={2.5} />
              <span className="text-2xl font-black">KLYNTOS<span className="text-blue-600">GUARD</span></span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/docs" className="text-sm font-bold uppercase hover:text-blue-600">
                Docs
              </Link>
              <Link href="/pricing" className="text-sm font-bold uppercase hover:text-blue-600">
                Pricing
              </Link>
              <Link href="/settings/cli" className="text-sm font-bold uppercase hover:text-blue-600">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4">DASHBOARD</h1>
          <p className="text-xl text-gray-700">Protect your code from vulnerabilities</p>
        </div>

        {/* Subscription Status */}
        {subscription && subscription.isActive ? (
          <Card className="mb-8 border-4 border-black">
            <CardHeader className="bg-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black uppercase">
                    {subscription.plan === 'pro' ? 'Guard Pro' : 'Guard Basic'}
                  </CardTitle>
                  <CardDescription className="text-base font-bold">
                    {subscription.plan === 'pro' ? 'Unlimited scans with Claude Opus' : `${subscription.scansLimit} scans/month`}
                  </CardDescription>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </CardHeader>
            {subscription.plan === 'basic' && (
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Usage this month</span>
                    <span>{subscription.scansUsed} / {subscription.scansLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 border-2 border-black h-6">
                    <div
                      className={`h-full ${usagePercentage > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  {usagePercentage > 80 && (
                    <Link href="/pricing" className="block mt-4">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 font-black">
                        UPGRADE TO PRO FOR UNLIMITED SCANS →
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="mb-8 border-4 border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-black text-xl mb-2">No Active Subscription</h3>
                  <p className="mb-4 text-gray-700">Choose a plan to start scanning your code for vulnerabilities.</p>
                  <Link href="/pricing">
                    <Button className="bg-blue-600 hover:bg-blue-700 font-black">
                      VIEW PRICING →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* API Keys */}
          <Card className="border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
            <CardHeader>
              <Key className="w-12 h-12 mb-4" />
              <CardTitle className="text-2xl font-black">API KEYS</CardTitle>
              <CardDescription className="font-bold">
                {hasApiKey ? 'Manage your CLI authentication' : 'Generate your first API key'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/cli">
                <Button className="w-full bg-black text-white hover:bg-blue-600 font-black">
                  {hasApiKey ? 'MANAGE KEYS' : 'GENERATE KEY'} →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card className="border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
            <CardHeader>
              <BookOpen className="w-12 h-12 mb-4" />
              <CardTitle className="text-2xl font-black">DOCUMENTATION</CardTitle>
              <CardDescription className="font-bold">
                Learn how to integrate Klyntos Guard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/getting-started">
                <Button className="w-full bg-black text-white hover:bg-blue-600 font-black">
                  GET STARTED →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* CLI Setup */}
          <Card className="border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
            <CardHeader>
              <Terminal className="w-12 h-12 mb-4" />
              <CardTitle className="text-2xl font-black">CLI SETUP</CardTitle>
              <CardDescription className="font-bold">
                Install and configure the CLI tool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <pre className="bg-black text-white p-3 text-sm overflow-x-auto border-2 border-black">
                  <code>pip install klyntos-guard</code>
                </pre>
              </div>
              <Link href="/docs/getting-started">
                <Button variant="outline" className="w-full border-2 border-black font-bold hover:bg-black hover:text-white">
                  VIEW SETUP GUIDE
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Checklist */}
        <Card className="border-4 border-black">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-2xl font-black">GETTING STARTED CHECKLIST</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 border-2 border-black flex items-center justify-center ${subscription?.isActive ? 'bg-green-500' : 'bg-white'}`}>
                  {subscription?.isActive && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold">1. Choose a subscription plan</p>
                  {!subscription?.isActive && (
                    <Link href="/pricing" className="text-blue-600 hover:underline text-sm font-bold">
                      View pricing →
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 border-2 border-black flex items-center justify-center ${hasApiKey ? 'bg-green-500' : 'bg-white'}`}>
                  {hasApiKey && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold">2. Generate an API key</p>
                  {!hasApiKey && (
                    <Link href="/settings/cli" className="text-blue-600 hover:underline text-sm font-bold">
                      Generate now →
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 border-2 border-black flex items-center justify-center bg-white">
                </div>
                <div className="flex-1">
                  <p className="font-bold">3. Install the CLI</p>
                  <pre className="mt-2 bg-black text-white p-2 text-sm">
                    <code>pip install klyntos-guard</code>
                  </pre>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 border-2 border-black flex items-center justify-center bg-white">
                </div>
                <div className="flex-1">
                  <p className="font-bold">4. Scan your first file</p>
                  <pre className="mt-2 bg-black text-white p-2 text-sm">
                    <code>kg scan myfile.py</code>
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link href="/docs" className="block p-6 border-4 border-black hover:bg-black hover:text-white transition-colors">
            <BookOpen className="w-8 h-8 mb-2" />
            <h3 className="font-black text-lg mb-1">DOCUMENTATION</h3>
            <p className="text-sm">Complete guides and API reference</p>
          </Link>

          <Link href="/pricing" className="block p-6 border-4 border-black hover:bg-black hover:text-white transition-colors">
            <TrendingUp className="w-8 h-8 mb-2" />
            <h3 className="font-black text-lg mb-1">UPGRADE PLAN</h3>
            <p className="text-sm">Unlock unlimited scans with Pro</p>
          </Link>

          <Link href="/settings/cli" className="block p-6 border-4 border-black hover:bg-black hover:text-white transition-colors">
            <Key className="w-8 h-8 mb-2" />
            <h3 className="font-black text-lg mb-1">API KEYS</h3>
            <p className="text-sm">Manage CLI authentication</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
