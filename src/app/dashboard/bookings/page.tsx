'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getProxyImageUrl } from '@/lib/image-utils'
import { getMyBookingsAction } from '@/app/actions/bookings'
import Navbar from '@/components/Navbar'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<'renter' | 'lender'>('renter')
  const [asRenter, setAsRenter] = useState<any[]>([])
  const [asLender, setAsLender] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      const [renterResult, lenderResult] = await Promise.all([
        getMyBookingsAction('renter'),
        getMyBookingsAction('lender'),
      ])
      setAsRenter(renterResult.success ? renterResult.bookings || [] : [])
      setAsLender(lenderResult.success ? lenderResult.bookings || [] : [])
      setLoading(false)
    }
    fetchBookings()
  }, [])

  function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
      REQUESTED: 'bg-yellow-100 text-yellow-700',
      ACCEPTED: 'bg-green-100 text-green-700',
      IN_DELIVERY: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-purple-100 text-purple-700',
      RETURN_IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
      DISPUTED: 'bg-orange-100 text-orange-700',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    )
  }

  function BookingCard({ booking, role }: { booking: any; role: 'renter' | 'lender' }) {
    const listing = booking.listing
    const counterparty = role === 'renter' ? listing?.user : booking.renter

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <img
            src={listing?.images?.[0] ? getProxyImageUrl(listing.images[0]) : '/placeholder.png'}
            alt={listing?.title || 'Item'}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Link
                  href={`/listings/${listing?.id}`}
                  className="font-semibold hover:text-primary-600"
                >
                  {listing?.title || 'Unknown Item'}
                </Link>
                <p className="text-sm text-gray-600">
                  {role === 'renter' ? 'Lender' : 'Renter'}:{' '}
                  {counterparty?.name || 'Unknown'}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                {format(new Date(booking.startDate), 'MMM dd')} -{' '}
                {format(new Date(booking.endDate), 'MMM dd, yyyy')}
              </p>
              <p className="font-semibold text-gray-900">
                Total: ₹{booking.totalAmount}
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/dashboard/bookings/${booking.id}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                View Details
              </Link>
              {role === 'lender' && booking.status === 'REQUESTED' && (
                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                >
                  Respond
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentBookings = activeTab === 'renter' ? asRenter : asLender

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('renter')}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'renter'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  As Renter ({asRenter.length})
                </button>
                <button
                  onClick={() => setActiveTab('lender')}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'lender'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  As Lender ({asLender.length})
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {currentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'renter'
                      ? "You haven't made any bookings yet"
                      : "You haven't received any booking requests yet"}
                  </p>
                  {activeTab === 'renter' && (
                    <Link
                      href="/browse"
                      className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                    >
                      Browse Items
                    </Link>
                  )}
                </div>
              ) : (
                currentBookings.map((booking: any) => (
                  <BookingCard key={booking.id} booking={booking} role={activeTab} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
