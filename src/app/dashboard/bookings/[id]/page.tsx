'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { getProxyImageUrl } from '@/lib/image-utils'
import { calculateRefund } from '@/lib/refund-calculator'
import { acceptBookingAction, cancelBookingAction, initiateReturnAction } from '@/app/actions/bookings'
import Navbar from '@/components/Navbar'

export default function BookingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnConfirmed, setReturnConfirmed] = useState(false)

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${params.id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch booking')
        }
        const data = await res.json()
        setBooking(data.booking)
        setCurrentUserId(data.currentUserId)
      } catch (err) {
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [params.id])

  async function handleAccept() {
    setActionLoading(true)
    const result = await acceptBookingAction(params.id)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard/bookings')
    }
    setActionLoading(false)
  }

  async function handleRejectConfirm() {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setActionLoading(true)
    const result = await cancelBookingAction(params.id, rejectionReason)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard/bookings')
    }
    setActionLoading(false)
  }

  async function handleInitiateReturn() {
    setActionLoading(true)
    const result = await initiateReturnAction(params.id)
    if (result.error) {
      setError(result.error)
    } else {
      setError(null)
      setShowReturnModal(false)
      setReturnConfirmed(true)
      // Refresh booking data
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
    setActionLoading(false)
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-8 text-center">
          {error || 'Booking not found'}
        </div>
      </div>
    )
  }

  const isRenter = booking.renterId === currentUserId
  const canAcceptOrReject = !isRenter && booking.status === 'REQUESTED'
  
  // Calculate rental timing
  const today = new Date()
  const endDate = new Date(booking.endDate)
  const nextDayAfterEnd = new Date(endDate)
  nextDayAfterEnd.setDate(nextDayAfterEnd.getDate() + 1)
  
  const isBeforeEndDate = today < endDate
  const isEndDateOrAfter = today >= endDate
  const isAfterNextDay = today > nextDayAfterEnd
  const daysPastDue = Math.max(0, Math.floor((today.getTime() - nextDayAfterEnd.getTime()) / (1000 * 60 * 60 * 24)))
  
  // For renters: determine which action to show
  let returnActionLabel = 'Request Early Return'
  let returnActionDescription = 'Return before the end date and get 50% refund for unused days'
  
  if (isBeforeEndDate) {
    returnActionLabel = 'Request Early Return'
    returnActionDescription = 'Return before the end date and get 50% refund for unused days'
  } else if (isEndDateOrAfter && !isAfterNextDay) {
    returnActionLabel = 'Schedule Pickup'
    returnActionDescription = 'End date has passed. Schedule pickup by tomorrow to avoid 2x daily penalty'
  } else if (isAfterNextDay) {
    returnActionLabel = 'Schedule Pickup (⚠️ Penalty Applied)'
    returnActionDescription = `You're ${daysPastDue} day(s) late. 2x daily penalty is being charged: ₹${daysPastDue * (booking.listing.pricePerDay * 2)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/dashboard/bookings"
            className="text-primary-600 hover:underline mb-4 inline-block"
          >
            ← Back to Bookings
          </Link>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Booking Details</h1>
                <p className="text-gray-600">
                  Booking #{booking.id.slice(0, 8)}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full font-medium ${
                  booking.status === 'COMPLETED'
                    ? 'bg-gray-100 text-gray-700'
                    : booking.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-700'
                    : booking.status === 'ACTIVE'
                    ? 'bg-purple-100 text-purple-700'
                    : booking.status === 'DISPUTED'
                    ? 'bg-red-100 text-red-700'
                    : booking.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {booking.status.replace('_', ' ')}
              </span>
            </div>

            {/* Listing Info */}
            <div className="border-t pt-6 mb-6">
              <div className="flex gap-4">
                {booking.listing.images.length > 0 && (
                  <img
                    src={getProxyImageUrl(booking.listing.images[0])}
                    alt={booking.listing.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <Link
                    href={`/listings/${booking.listing.id}`}
                    className="text-xl font-semibold hover:text-primary-600"
                  >
                    {booking.listing.title}
                  </Link>
                  <p className="text-gray-600 mt-1">
                    {booking.listing.category}
                  </p>
                  <p className="text-gray-600">
                    ₹{booking.listing.pricePerDay}/day
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="border-t pt-6 mb-6 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Rental Period</h3>
                <p className="text-gray-700">
                  {format(new Date(booking.startDate), 'MMMM dd, yyyy')}
                </p>
                <p className="text-gray-700">to</p>
                <p className="text-gray-700">
                  {format(new Date(booking.endDate), 'MMMM dd, yyyy')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Payment</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{booking.totalAmount}</span>
                  </div>
                  {booking.depositAmount && booking.depositAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deposit:</span>
                      <span className="font-medium">₹{booking.depositAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {booking.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Online'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="border-t pt-6 mb-6 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Renter</h3>
                <p className="text-gray-700">{booking.renter.name}</p>
                <p className="text-sm text-gray-600">{booking.renter.email}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Lender</h3>
                <p className="text-gray-700">{booking.listing.user.name}</p>
                <p className="text-sm text-gray-600">{booking.listing.user.email}</p>
              </div>
            </div>

            {/* Delivery Info */}
            {booking.deliveryJob && (
              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold mb-3">Delivery Status</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Status: <span className="font-medium">{booking.deliveryJob.status.replace(/_/g, ' ')}</span>
                  </p>
                  {booking.deliveryJob.deliveryAgent && (
                    <p className="text-sm text-gray-600 mb-2">
                      Delivery Partner: <span className="font-medium">{booking.deliveryJob.deliveryAgent.name}</span>
                    </p>
                  )}
                  <Link
                    href={`/delivery/track/${booking.deliveryJob.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Track Delivery →
                  </Link>
                </div>

                {/* Pickup Proof - Show to Lender */}
                {!isRenter && booking.deliveryJob.pickupPhotos?.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-800 mb-3">📦 Pickup Condition Proof</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      These photos/videos were captured when the item was picked up from you.
                    </p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {booking.deliveryJob.pickupPhotos.map((photo: string, index: number) => (
                        <a
                          key={index}
                          href={getProxyImageUrl(photo)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getProxyImageUrl(photo)}
                            alt={`Pickup proof ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                    {booking.deliveryJob.pickupVideoUrl && (
                      <a
                        href={getProxyImageUrl(booking.deliveryJob.pickupVideoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        🎥 View Pickup Video
                      </a>
                    )}
                    {booking.deliveryJob.pickedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Picked up: {format(new Date(booking.deliveryJob.pickedAt), 'MMM dd, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                )}

                {/* Delivery Proof - Show to Renter */}
                {isRenter && booking.deliveryJob.deliveryPhotos?.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-green-800 mb-3">🏠 Delivery Condition Proof</h4>
                    <p className="text-sm text-green-700 mb-3">
                      These photos/videos were captured when the item was delivered to you.
                    </p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {booking.deliveryJob.deliveryPhotos.map((photo: string, index: number) => (
                        <a
                          key={index}
                          href={getProxyImageUrl(photo)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getProxyImageUrl(photo)}
                            alt={`Delivery proof ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                    {booking.deliveryJob.deliveryVideoUrl && (
                      <a
                        href={getProxyImageUrl(booking.deliveryJob.deliveryVideoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline"
                      >
                        🎥 View Delivery Video
                      </a>
                    )}
                    {booking.deliveryJob.deliveredAt && (
                      <p className="text-xs text-green-600 mt-2">
                        Delivered: {format(new Date(booking.deliveryJob.deliveredAt), 'MMM dd, yyyy h:mm a')}
                      </p>
                    )}
                    {booking.deliveryJob.amountCollected && (
                      <p className="text-sm text-green-700 mt-2">
                        Amount Collected: ₹{booking.deliveryJob.amountCollected}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Return Section - Show to Renter during ACTIVE rental */}
            {isRenter && booking.status === 'ACTIVE' && !booking.returnInitiatedAt && (
              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold mb-3">Return Item</h3>
                <div className={`rounded-lg p-4 ${
                  isAfterNextDay 
                    ? 'bg-red-50 border border-red-200' 
                    : isEndDateOrAfter 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className={`text-sm mb-4 ${
                    isAfterNextDay 
                      ? 'text-red-900' 
                      : isEndDateOrAfter 
                      ? 'text-yellow-900' 
                      : 'text-blue-900'
                  }`}>
                    {returnActionDescription}
                  </p>
                  
                  {isAfterNextDay && (
                    <div className="bg-white rounded-lg p-3 mb-4 border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-1">⚠️ Late Pickup Penalty</p>
                      <p className="text-xs text-red-700">
                        {daysPastDue} day(s) × 2x daily rate (₹{booking.listing.pricePerDay * 2}/day) = ₹{daysPastDue * (booking.listing.pricePerDay * 2)}
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className={`text-white px-6 py-2 rounded-lg transition font-medium ${
                      isAfterNextDay 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : isEndDateOrAfter 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {returnActionLabel}
                  </button>
                </div>
              </div>
            )}

            {/* Return In Progress - Show status */}
            {booking.returnInitiatedAt && booking.status === 'RETURN_IN_PROGRESS' && (
              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold mb-3 text-blue-600">Return In Progress</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Return Initiated:</span> {format(new Date(booking.returnInitiatedAt), 'MMM dd, yyyy h:mm a')}
                    </p>
                    {booking.earlyReturnRefund > 0 && (
                      <p className="text-sm text-green-700 font-medium">
                        ✓ Early Return Refund: ₹{booking.earlyReturnRefund}
                      </p>
                    )}
                  </div>
                  {!isRenter && (
                    <p className="text-xs text-gray-600 mt-3">
                      Renter has requested early return. Waiting for delivery pickup.
                    </p>
                  )}
                </div>

                {/* Return Proof - Show when return is completed */}
                {booking.deliveryJob?.returnPhotos?.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-purple-800 mb-3">📦 Return Condition Proof</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      These photos/videos were captured when the item was returned.
                    </p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {booking.deliveryJob.returnPhotos.map((photo: string, index: number) => (
                        <a
                          key={index}
                          href={getProxyImageUrl(photo)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getProxyImageUrl(photo)}
                            alt={`Return proof ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                    {booking.deliveryJob.returnVideoUrl && (
                      <a
                        href={getProxyImageUrl(booking.deliveryJob.returnVideoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:underline"
                      >
                        🎥 View Return Video
                      </a>
                    )}
                    {booking.deliveryJob.returnedAt && (
                      <p className="text-xs text-purple-600 mt-2">
                        Returned: {format(new Date(booking.deliveryJob.returnedAt), 'MMM dd, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dispute Info */}
            {booking.dispute && (
              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold mb-3 text-red-600">Dispute Filed</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Reason:</span> {booking.dispute.reason}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {booking.dispute.status}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            {canAcceptOrReject && (
              <div className="border-t pt-6 flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Accept Booking'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject Booking'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reject Booking</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this booking request.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value)
                  setError(null)
                }}
                placeholder="e.g., Item is no longer available, preferred another renter, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setError(null)
                }}
                disabled={actionLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md my-8">
            {!returnConfirmed ? (
              <>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{returnActionLabel}</h3>
                  <p className="text-gray-600 mb-4">
                    {isAfterNextDay 
                      ? 'Your item is overdue. You will be charged 2x the daily rate as penalty. See the breakdown below.'
                      : isEndDateOrAfter
                      ? 'Your rental period has ended. Schedule pickup to avoid penalty charges.'
                      : 'See the transparent breakdown of your refund below. You\'ll receive a 50% refund of the remaining rental fees plus your full security deposit.'}
                  </p>

                  {/* Transparent Refund Breakdown */}
                  {(() => {
                    const breakdown = calculateRefund(
                      booking.listing.pricePerDay,
                      booking.depositAmount || 0,
                      booking.startDate,
                      booking.endDate,
                      new Date()
                    )
                    
                    return (
                      <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-4 mb-6 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Days</p>
                            <p className="font-bold text-lg text-gray-900">{breakdown.totalRentalDays}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Days Used</p>
                            <p className="font-bold text-lg text-gray-900">{breakdown.daysUsed}</p>
                          </div>
                          <div className="col-span-2 border-t border-blue-200 pt-3">
                            <p className="text-gray-600 text-xs mb-2">Daily Rate: ₹{breakdown.dailyRate}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Charge for {breakdown.daysUsed} day(s):</span>
                                <span className="font-medium">₹{breakdown.chargeForDaysUsed}</span>
                              </div>
                              {breakdown.daysRemaining > 0 && (
                                <div className="flex justify-between text-green-700">
                                  <span>Refund for {breakdown.daysRemaining} day(s) (50%):</span>
                                  <span className="font-medium">+₹{breakdown.refundForUnusedDays}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                                <span className="font-semibold">Security Deposit (Returned):</span>
                                <span className="font-bold text-green-700">+₹{breakdown.depositToBeReturned}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                          <p className="text-xs text-gray-600">Total You'll Receive:</p>
                          <p className="text-2xl font-bold text-green-600">₹{breakdown.totalRefund}</p>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                    <p className="text-xs text-yellow-900">
                      <strong>ℹ️ Note:</strong> These amounts are calculated transparently. After the item is picked up and verified, the refund will be processed to your payment account within 5-7 business days.
                    </p>
                  </div>
                </div>

                <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3">
                  <button
                    onClick={() => setShowReturnModal(false)}
                    disabled={actionLoading}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInitiateReturn}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Return'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 text-center">
                  <div className="text-5xl mb-3">✓</div>
                  <h3 className="text-xl font-semibold text-green-600 mb-2">Return Request Submitted</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Your return request has been submitted. The delivery agent will pick up the item soon.
                  </p>

                  {/* Show refund summary */}
                  {(() => {
                    const breakdown = calculateRefund(
                      booking.listing.pricePerDay,
                      booking.depositAmount || 0,
                      booking.startDate,
                      booking.endDate,
                      new Date()
                    )
                    
                    return (
                      <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold">You'll receive: </span>
                          <span className="text-lg font-bold text-green-600">₹{breakdown.totalRefund}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          This includes ₹{breakdown.refundForUnusedDays} early return refund + ₹{breakdown.depositToBeReturned} security deposit
                        </p>
                      </div>
                    )
                  })()}

                  <button
                    onClick={() => {
                      setShowReturnModal(false)
                      setReturnConfirmed(false)
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
