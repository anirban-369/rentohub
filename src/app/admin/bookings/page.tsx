import { requireAdmin } from '@/lib/auth'
import { getAllBookingsAction } from '@/app/actions/admin'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function AdminBookingsPage() {
  await requireAdmin()

  const result = await getAllBookingsAction()
  const bookings = result.success ? result.bookings : []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">All Bookings</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Renter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/listings/${booking.listing.id}`}
                        className="font-medium hover:text-primary-600"
                      >
                        {booking.listing.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.renter.name} {booking.renter.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.listing.lender.name}{' '}
                      {booking.listing.lender.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(booking.startDate), 'MMM dd')} -{' '}
                      {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-700'
                            : booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'DISPUTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${booking.totalAmount}
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
