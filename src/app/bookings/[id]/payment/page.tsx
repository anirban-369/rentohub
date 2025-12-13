import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StripePaymentForm from '@/components/StripePaymentForm'
import { getProxyImageUrl } from '@/lib/image-utils'

export default async function BookingPaymentPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      renter: true,
    },
  })

  if (!booking) notFound()
  if (booking.renterId !== user.userId) redirect('/dashboard')

  // If already paid, redirect to booking details
  if (booking.status !== 'REQUESTED') {
    redirect(`/dashboard/bookings/${booking.id}`)
  }

  const days = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>
          <p className="text-gray-600">
            Your booking request has been created. Complete the payment to finalize your
            booking.
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
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dates:</span>
                  <span className="font-medium">
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily rate:</span>
                  <span className="font-medium">₹{booking.listing.pricePerDay}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Rental cost</span>
                  <span>${booking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${booking.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <StripePaymentForm
              amount={booking.totalAmount * 100} // Convert to cents
              bookingId={booking.id}
              onSuccess={() => {
                window.location.href = `/dashboard/bookings/${booking.id}?success=true`
              }}
              onError={(error) => {
                console.error('Payment error:', error)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
