import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function DashboardPage() {
  // Middleware already protects this route, so we know user is authenticated
  const user = await getCurrentUser()
  
  // If somehow middleware let through without user, show error
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">Unable to load user session. Please try logging in again.</p>
          <a href="/login" className="text-primary-600 hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }

  // Fetch user data
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      kyc: true,
      listings: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      bookingsAsRenter: {
        take: 5,
        orderBy: { requestedAt: 'desc' },
        include: {
          listing: true,
        },
      },
      bookingsAsLender: {
        take: 5,
        orderBy: { requestedAt: 'desc' },
        include: {
          listing: true,
          renter: true,
        },
      },
    },
  })

  const kycStatus = userData?.kyc?.status || 'NOT_SUBMITTED'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userData?.name}!</p>
        </div>

        {/* KYC Status Banner */}
        {kycStatus !== 'APPROVED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-yellow-800 mb-1">
              {kycStatus === 'NOT_SUBMITTED'
                ? 'Complete KYC to List Items'
                : kycStatus === 'PENDING'
                ? 'KYC Under Review'
                : 'KYC Rejected'}
            </h3>
            <p className="text-sm text-yellow-700 mb-2">
              {kycStatus === 'NOT_SUBMITTED'
                ? 'You need to complete KYC verification to list items for rent.'
                : kycStatus === 'PENDING'
                ? 'Your KYC documents are under review. You will be notified once approved.'
                : 'Your KYC was rejected. Please resubmit with correct documents.'}
            </p>
            {(kycStatus === 'NOT_SUBMITTED' || kycStatus === 'REJECTED') && (
              <Link
                href="/dashboard/kyc"
                className="text-sm text-yellow-800 font-medium underline"
              >
                {kycStatus === 'REJECTED' ? 'Resubmit KYC Documents →' : 'Submit KYC Documents →'}
              </Link>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-1">Active Listings</h3>
            <p className="text-3xl font-bold text-primary-600">
              {userData?.listings.filter((l) => l.isAvailable).length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-1">As Renter</h3>
            <p className="text-3xl font-bold text-blue-600">
              {userData?.bookingsAsRenter.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-1">As Lender</h3>
            <p className="text-3xl font-bold text-green-600">
              {userData?.bookingsAsLender.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm text-gray-600 mb-1">Total Listings</h3>
            <p className="text-3xl font-bold text-purple-600">
              {userData?.listings.length || 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/dashboard/listings/create"
            className="bg-primary-600 text-white p-6 rounded-lg hover:bg-primary-700 transition text-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <div className="font-semibold">List New Item</div>
          </Link>
          <Link
            href="/browse"
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition text-center"
          >
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold">Browse Items</div>
          </Link>
          <Link
            href="/dashboard/bookings"
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition text-center"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="font-semibold">My Bookings</div>
          </Link>
          <Link
            href="/dashboard/listings"
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition text-center"
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold">My Listings</div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Recent Bookings (Renter)</h2>
            {userData?.bookingsAsRenter.length === 0 ? (
              <p className="text-gray-500">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {userData?.bookingsAsRenter.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="border-l-4 border-primary-600 pl-3"
                  >
                    <p className="font-medium">{booking.listing.title}</p>
                    <p className="text-sm text-gray-600">{booking.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Recent Bookings (Lender)</h2>
            {userData?.bookingsAsLender.length === 0 ? (
              <p className="text-gray-500">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {userData?.bookingsAsLender.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="border-l-4 border-green-600 pl-3"
                  >
                    <p className="font-medium">{booking.listing.title}</p>
                    <p className="text-sm text-gray-600">
                      {booking.renter.name} - {booking.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
