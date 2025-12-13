import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { getProxyImageUrl } from '@/lib/image-utils'

export default async function AdminListingsPage() {
  await requireAdmin()

  const listings = await prisma.listing.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">All Listings</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price/Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {listing.images.length > 0 && (
                          <img
                            src={getProxyImageUrl(listing.images[0])}
                            alt={listing.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <Link
                          href={`/listings/${listing.id}`}
                          className="font-medium hover:text-primary-600"
                        >
                          {listing.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {listing.user.name}
                    </td>
                    <td className="px-6 py-4 text-sm">{listing.category}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ₹{listing.pricePerDay}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          listing.isAvailable && !listing.isPaused
                            ? 'bg-green-100 text-green-700'
                            : listing.isPaused
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {listing.isPaused ? 'PAUSED' : listing.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {listing._count.bookings}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(listing.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
