'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Shield, Zap, ArrowRight } from 'lucide-react'

type BillingCycle = 'monthly' | 'yearly'
type PlanTier = 'basic' | 'pro'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (tier: PlanTier) => {
    setLoading(tier)

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          cycle: billingCycle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout')
      setLoading(null)
    }
  }

  const plans = [
    {
      id: 'basic' as const,
      name: 'GUARD BASIC',
      description: 'Essential security for individual developers',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        '1,000 code scans per month',
        'Claude 3 Haiku AI model',
        'Standard security policies',
        'CLI access with API keys',
        'Email support',
        'Basic threat detection (10 categories)',
      ],
    },
    {
      id: 'pro' as const,
      name: 'GUARD PRO',
      description: 'Advanced security for teams and organizations',
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        'Unlimited code scans',
        'Claude 3 Opus AI model',
        'Deep analysis mode (18 categories)',
        'Custom security policies',
        'Real-time guardrails',
        'Priority support (24/7)',
        'API access',
        'Team collaboration',
        'Compliance reports',
      ],
      popular: true,
    },
  ]

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan: typeof plans[0]) => {
    const yearlyCost = plan.monthlyPrice * 12
    const savings = yearlyCost - plan.yearlyPrice
    const percentage = Math.round((savings / yearlyCost) * 100)
    return { amount: savings, percentage }
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
              <Link href="/dashboard" className="text-sm font-bold uppercase hover:text-blue-600">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-blue-600 border-4 border-black mb-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-white" strokeWidth={3} />
              <span className="text-sm font-black uppercase text-white">Simple Pricing</span>
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black mb-6 tracking-tight">
            CHOOSE YOUR PLAN
          </h1>
          <p className="text-xl text-gray-700 font-bold max-w-2xl mx-auto">
            Start protecting your code today. All plans include 14-day money-back guarantee.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex border-4 border-black">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 font-black uppercase transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-3 font-black uppercase transition-colors border-l-4 border-black ${
                billingCycle === 'yearly'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-500 text-black text-xs">
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => {
            const price = getPrice(plan)
            const savings = getSavings(plan)

            return (
              <div
                key={plan.id}
                className={`relative border-4 border-black ${
                  plan.popular ? 'shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 border-4 border-black px-6 py-2">
                      <span className="text-white font-black uppercase text-sm">
                        Most Popular
                      </span>
                    </div>
                  </div>
                )}

                <div className={`${plan.popular ? 'bg-blue-50' : 'bg-white'} p-8`}>
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-3xl font-black mb-2">{plan.name}</h3>
                    <p className="text-gray-700 font-bold">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-6xl font-black">${price}</span>
                      <span className="text-2xl font-bold text-gray-600 ml-2">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm font-bold text-green-600 mt-2">
                        Save ${savings.amount}/year ({savings.percentage}% off)
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-6 font-black text-lg uppercase border-4 transition-colors mb-8 ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-black text-white border-blue-600 hover:border-black'
                        : 'bg-black hover:bg-blue-600 text-white border-black hover:border-blue-600'
                    }`}
                  >
                    {loading === plan.id ? (
                      'LOADING...'
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <span>GET STARTED</span>
                        <ArrowRight className="w-5 h-5" strokeWidth={3} />
                      </span>
                    )}
                  </Button>

                  {/* Features List */}
                  <div className="space-y-4">
                    <p className="font-black uppercase text-sm text-gray-500 mb-4">
                      WHAT'S INCLUDED:
                    </p>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 border-2 border-black bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto border-4 border-black p-8 bg-yellow-50">
          <h2 className="text-3xl font-black mb-6 uppercase">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-black text-lg mb-2">Can I switch plans later?</h3>
              <p className="text-gray-700 font-bold">
                Yes! Upgrade or downgrade anytime from your dashboard. Changes take effect at the next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-black text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-700 font-bold">
                We accept all major credit cards (Visa, Mastercard, Amex) via Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-black text-lg mb-2">Do you offer refunds?</h3>
              <p className="text-gray-700 font-bold">
                Yes! We offer a 14-day money-back guarantee. No questions asked.
              </p>
            </div>

            <div>
              <h3 className="font-black text-lg mb-2">Need an Enterprise plan?</h3>
              <p className="text-gray-700 font-bold mb-2">
                Contact us for custom pricing, on-premise deployment, SLA guarantees, and dedicated support.
              </p>
              <a
                href="mailto:sales@klyntos.com"
                className="inline-block px-6 py-3 bg-black text-white border-4 border-black font-black uppercase hover:bg-blue-600 hover:border-blue-600 transition-colors"
              >
                CONTACT SALES →
              </a>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-16 text-center">
          <p className="text-sm font-bold uppercase text-gray-500 mb-4">TRUSTED BY DEVELOPERS AT</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-2xl font-black text-gray-400">
            <span>STARTUP INC</span>
            <span>•</span>
            <span>TECH CORP</span>
            <span>•</span>
            <span>DEV TEAM</span>
            <span>•</span>
            <span>CODE CO</span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center border-4 border-black p-12 bg-blue-600">
          <h2 className="text-4xl font-black text-white mb-4">
            READY TO SECURE YOUR CODE?
          </h2>
          <p className="text-xl text-white font-bold mb-8">
            Join thousands of developers protecting their applications
          </p>
          <Link
            href="/docs/getting-started"
            className="inline-block px-10 py-5 bg-white text-black border-4 border-black font-black text-lg uppercase hover:bg-yellow-300 transition-colors"
          >
            VIEW DOCUMENTATION →
          </Link>
        </div>
      </div>
    </div>
  )
}
