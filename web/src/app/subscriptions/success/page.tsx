'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Fetch subscription status
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/subscriptions/status')
        const data = await response.json()
        setSubscription(data)
      } catch (error) {
        console.error('Failed to fetch subscription status:', error)
      } finally {
        setLoading(false)
      }
    }

    // Wait a moment for webhook to process
    setTimeout(fetchStatus, 2000)
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-green-500">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Subscription Activated!</CardTitle>
            <CardDescription className="text-lg">
              Welcome to Klyntos Guard {subscription?.tier === 'pro' ? 'Pro' : 'Basic'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Subscription Details */}
            {subscription?.hasSubscription && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium capitalize">
                    {subscription.tier} ({subscription.billingCycle})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize text-green-600">
                    {subscription.status}
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next billing date:</span>
                    <span className="font-medium">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Next Steps:</h3>
              <ol className="space-y-2 list-decimal list-inside">
                <li className="text-gray-700">
                  Generate your CLI API key in{' '}
                  <Link href="/settings/cli" className="text-blue-600 hover:underline">
                    Settings
                  </Link>
                </li>
                <li className="text-gray-700">
                  Install the Klyntos Guard CLI: <code className="bg-gray-100 px-2 py-1 rounded">pip install klyntos-guard</code>
                </li>
                <li className="text-gray-700">
                  Login with your API key: <code className="bg-gray-100 px-2 py-1 rounded">kg auth login --api-key YOUR_KEY</code>
                </li>
                <li className="text-gray-700">
                  Start protecting your code: <code className="bg-gray-100 px-2 py-1 rounded">kg chat "Hello!"</code>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link href="/settings/cli" className="flex-1">
                <Button className="w-full" size="lg">
                  Generate API Key
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            {/* Support */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              <p>
                Need help getting started?{' '}
                <a href="mailto:support@klyntos.com" className="text-blue-600 hover:underline">
                  Contact support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Info */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          A receipt has been sent to your email. You can manage your subscription anytime in{' '}
          <Link href="/settings/subscription" className="text-blue-600 hover:underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
