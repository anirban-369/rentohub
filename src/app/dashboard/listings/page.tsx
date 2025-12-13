import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import PauseListingButton from '@/components/PauseListingButton'
import { getProxyImageUrl } from '@/lib/image-utils'

export default async function MyListingsPage() {
  const user = await getCurrentUser()
  if (!user) {
    return <div className="p-8 text-center">Please log in to view your listings.</div>
  }

  const listings = await prisma.listing.findMany({
    where: { userId: user.userId },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Listings</h1>
          <Link
            href="/dashboard/listings/create"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Create New Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No listings yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start earning by renting out your items
            </p>
            <Link
              href="/dashboard/listings/create"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing: any) => (
              <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                {listing.images.length > 0 ? (
                  <img
                    src={getProxyImageUrl(listing.images[0])}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2 items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          listing.isAvailable && !listing.isPaused
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {listing.isAvailable && !listing.isPaused ? 'Available' : 'Unavailable'}
                      </span>
                      <PauseListingButton listingId={listing.id} isPaused={listing.isPaused} />
                    </div>
                    <span className="text-sm text-gray-500">
                      {listing._count.bookings} bookings
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-600">
                      ₹{listing.pricePerDay}/day
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="flex-1 text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/listings/${listing.id}/edit`}
                      className="flex-1 text-center py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
