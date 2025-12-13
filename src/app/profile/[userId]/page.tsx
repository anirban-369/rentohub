'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface PublicUserProfile {
  id: string
  name: string
  profileImage: string | null
  role: string
  joinedDate: string
  _count: {
    listings: number
  }
}

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPublicProfile()
  }, [params.userId])

  async function fetchPublicProfile() {
    try {
      setLoading(true)
      const res = await fetch(`/api/user/profile/${params.userId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'User not found')
      }
      const data = await res.json()
      setProfile(data.user)
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'This user profile is not available'}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const joinedDate = new Date(profile.joinedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">User Profile</span>
          </nav>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Profile Header with Gradient */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-24 relative"></div>

            {/* Profile Content */}
            <div className="relative px-6 pb-8">
              {/* Profile Image */}
              <div className="relative -mt-12 mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg mx-auto">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-5xl font-bold">
                      {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                <div className="flex justify-center gap-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    🏠 Renter/Lender
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-100 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile._count.listings}</div>
                  <div className="text-sm text-gray-500">Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">⭐</div>
                  <div className="text-sm text-gray-500">Highly Trusted</div>
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Member since</span> {joinedDate}
                </p>
              </div>

              {/* Listings Link */}
              <div className="space-y-3">
                <Link
                  href={`/user/${profile.id}/listings`}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  </svg>
                  View Their Listings
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                    Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
