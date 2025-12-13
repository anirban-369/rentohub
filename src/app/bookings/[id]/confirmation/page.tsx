import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getProxyImageUrl } from '@/lib/image-utils'
import Navbar from '@/components/Navbar'

export default async function BookingConfirmationPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: {
        include: {
          user: true,
        },
      },
      renter: true,
    },
  })

  if (!booking) notFound()
  if (booking.renterId !== user.userId) redirect('/dashboard')

  const days = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">Booking Request Sent!</h1>
            <p className="text-green-700">
              Your booking request has been sent to the lender. You will be notified once they accept it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

              <div className="space-y-4">
                <div>
                  <img
                    src={getProxyImageUrl(booking.listing.images[0])}
                    alt={booking.listing.title}
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                  <h3 className="font-semibold">{booking.listing.title}</h3>
                  <p className="text-sm text-gray-600">by {booking.listing.user.name}</p>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-xs">{booking.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dates:</span>
                    <span className="font-medium">
                      {new Date(booking.startDate).toLocaleDateString()} -{' '}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{days} day{days > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Waiting for Approval
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rental cost</span>
                    <span>₹{booking.rentAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform fee</span>
                    <span>₹{booking.platformFee}</span>
                  </div>
                  {booking.depositAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Security deposit (refundable)</span>
                      <span>₹{booking.depositAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>₹{booking.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Cash on Delivery</p>
                      <p className="text-sm text-green-600">Pay via UPI or Cash</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold mt-0.5">1.</span>
                    <p>Wait for the lender to accept your booking request</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold mt-0.5">2.</span>
                    <p>Once accepted, the item will be delivered to you</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold mt-0.5">3.</span>
                    <p>Pay ₹{booking.totalAmount} to the delivery person via UPI or Cash</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold mt-0.5">4.</span>
                    <p>Receive the item and enjoy your rental!</p>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                <p className="text-sm text-blue-700">
                  The lender will review your booking request. You'll receive a notification when they accept or decline. 
                  Keep an eye on your dashboard for updates!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href="/dashboard/bookings"
                  className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  View My Bookings
                </Link>
                <Link
                  href="/browse"
                  className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Continue Browsing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
