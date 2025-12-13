'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ListingCard from '@/components/ListingCard'
import { searchListingsAction } from '@/app/actions/listings'

interface UserProfile {
  id: string
  name: string
  profileImage: string | null
}

interface Listing {
  id: string
  title: string
  pricePerDay: number
  images: string[]
  category: string
  city: string
  userId: string
  user: {
    name: string
  }
}

export default function UserListingsPage({ params }: { params: { userId: string } }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserListings()
  }, [params.userId])

  async function fetchUserListings() {
    try {
      setLoading(true)
      
      // Fetch user info
      const userRes = await fetch(`/api/user/profile/${params.userId}`)
      if (!userRes.ok) {
        throw new Error('User not found')
      }
      const userData = await userRes.json()
      setUser(userData.user)
      
      // Fetch listings
      const result = await searchListingsAction({ userId: params.userId })
      if (result.success && result.listings) {
        setListings(result.listings)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load listings')
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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'This user does not exist'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link href={`/profile/${user.id}`} className="hover:text-primary-600">
            {user.name}'s Profile
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Listings</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-100 flex-shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-600 text-2xl font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}'s Listings</h1>
              <p className="text-gray-600">{listings.length} item{listings.length !== 1 ? 's' : ''} available for rent</p>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Listings Yet</h2>
            <p className="text-gray-600">{user.name} hasn't listed any items for rent yet.</p>
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
