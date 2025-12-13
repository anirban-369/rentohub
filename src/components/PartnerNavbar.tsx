'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function PartnerNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [pathname])

  async function fetchSession() {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
      if (res.ok) {
        const data = await res.json()
        // Check if user is a delivery agent
        if (data.user && data.user.role === 'DELIVERY_AGENT') {
          setUser(data.user)
        } else {
          // Not a delivery agent, redirect to partner login
          setUser(null)
          router.push('/partner/login')
        }
      } else {
        setUser(null)
        router.push('/partner/login')
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        setUser(null)
        window.location.href = '/partner/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-gradient-to-r from-orange-500 to-red-500 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/delivery-partner" className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🚚</span>
            <span>RentoHub Partner</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/delivery-partner"
              className={`text-white hover:text-orange-100 transition ${
                pathname === '/delivery-partner' ? 'font-semibold' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/delivery-partner/jobs"
              className={`text-white hover:text-orange-100 transition ${
                pathname === '/delivery-partner/jobs' ? 'font-semibold' : ''
              }`}
            >
              My Jobs
            </Link>
            <Link
              href="/delivery-partner/earnings"
              className={`text-white hover:text-orange-100 transition ${
                pathname === '/delivery-partner/earnings' ? 'font-semibold' : ''
              }`}
            >
              Earnings
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-white hover:text-orange-100 transition">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'P'
                    )}
                  </div>
                  <span className="text-sm">{user.name?.split(' ')[0] || 'Partner'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      href="/delivery-partner/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                    <Link
                      href="/delivery-partner"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      href="/delivery-partner/earnings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Earnings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/partner/login"
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-400">
            <div className="flex flex-col gap-4">
              <Link
                href="/delivery-partner"
                className="text-white hover:text-orange-100 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/delivery-partner/jobs"
                className="text-white hover:text-orange-100 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                My Jobs
              </Link>
              <Link
                href="/delivery-partner/earnings"
                className="text-white hover:text-orange-100 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Earnings
              </Link>
              {user ? (
                <>
                  <Link
                    href="/delivery-partner/profile"
                    className="text-white hover:text-orange-100 transition flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name?.charAt(0)?.toUpperCase() || 'P'
                      )}
                    </div>
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/partner/login"
                  className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
