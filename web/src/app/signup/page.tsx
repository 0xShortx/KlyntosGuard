'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Shield, ArrowRight, Loader2, Github, CheckCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Basic validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      await authClient.signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      // Redirect to welcome page
      router.push('/welcome')
      router.refresh()
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err?.message || 'Failed to create account. Email may already be registered.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    setIsLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/welcome',
      })
    } catch (err: any) {
      console.error('GitHub signup error:', err)
      setError(err?.message || 'Failed to sign up with GitHub')
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/welcome',
      })
    } catch (err: any) {
      console.error('Google signup error:', err)
      setError(err?.message || 'Failed to sign up with Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6">
            <Shield className="w-12 h-12" strokeWidth={2.5} />
            <span className="text-4xl font-black">
              KLYNTOS<span className="text-blue-600">GUARD</span>
            </span>
          </Link>
          <h1 className="text-4xl font-black mb-2">CREATE ACCOUNT</h1>
          <p className="text-lg text-gray-700 font-bold">
            Start protecting your code today
          </p>
        </div>

        {/* Social Signup Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleGitHubSignup}
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-800 text-white border-4 border-black font-black py-6 text-base uppercase"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Github className="w-5 h-5 mr-2" />
                Sign up with GitHub
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-black border-4 border-black font-black py-6 text-base uppercase"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </>
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-4 border-black"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-sm font-black uppercase">Or</span>
          </div>
        </div>

        {/* Signup Form */}
        <div className="border-4 border-black bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-black uppercase">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoComplete="name"
                disabled={isLoading}
                className="border-2 border-black focus:border-blue-600 focus:ring-0 font-bold"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black uppercase">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
                disabled={isLoading}
                className="border-2 border-black focus:border-blue-600 focus:ring-0 font-bold"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-black uppercase">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  minLength={8}
                  className="border-2 border-black focus:border-blue-600 focus:ring-0 font-bold pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
              <p className="text-xs font-bold text-gray-600">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="border-4 border-red-600 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-4 border-blue-600 hover:border-blue-700 font-black py-6 text-lg uppercase"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" strokeWidth={3} />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* What You Get */}
        <div className="border-4 border-green-600 bg-green-50 p-6">
          <p className="text-sm font-black uppercase mb-4">What You Get:</p>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-sm font-bold">AI-powered code security scanning</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-sm font-bold">1,000 scans/month (Guard Basic)</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-sm font-bold">CLI integration for your workflow</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-sm font-bold">14-day money-back guarantee</span>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="border-4 border-black bg-gray-50 p-6 text-center">
          <p className="text-sm font-bold uppercase mb-2">Already have an account?</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-white border-4 border-black font-black uppercase hover:bg-yellow-300 transition-colors"
          >
            Sign In →
          </Link>
        </div>

        {/* Back to Home */}
        <p className="text-center">
          <Link href="/" className="text-sm font-bold text-gray-600 hover:text-black uppercase">
            ← Back to Homepage
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 font-bold">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
