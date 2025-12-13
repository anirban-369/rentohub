'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PartnerLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(searchParams.get('error') || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      console.log('🔐 Partner login attempt for:', email)

      const response = await fetch('/api/auth/partner-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ Partner login successful')
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/delivery-partner'
      } else if (result.isNotPartner) {
        // Redirect regular users to user login
        setError('This account is not a delivery partner. Redirecting to user login...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setError(result.error || 'Login failed')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Partner login error:', err)
      setError('An error occurred during login. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Bar */}
      <nav className="bg-gradient-to-r from-orange-500 to-red-500 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🚚</span> RentoHub Partner
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-white hover:text-orange-100 transition">
              Home
            </Link>
            <Link href="/partner/register" className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-72px)]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚚</div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Login</h1>
          <p className="text-gray-600 mt-2">Sign in to your delivery partner account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/partner/register" className="text-blue-600 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Not a partner?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in as user
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
