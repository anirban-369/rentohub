'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, differenceInDays } from 'date-fns'
import DateRangePicker from './DateRangePicker'
import { createBookingAction } from '@/app/actions/bookings'
import { calculateRentalCost } from '@/lib/utils'

interface BookingFormProps {
  listing: any
}

export default function BookingForm({ listing }: BookingFormProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [pricingType, setPricingType] = useState<'daily' | 'hourly'>('daily')
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY'>('CASH_ON_DELIVERY')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate blocked dates from existing bookings
  const blockedDates = listing.bookings
    ?.filter((b: any) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status))
    .flatMap((b: any) => {
      const dates = []
      let current = new Date(b.startDate)
      const end = new Date(b.endDate)
      while (current <= end) {
        dates.push(new Date(current))
        current = addDays(current, 1)
      }
      return dates
    }) || []

  function handleDateSelect(start: Date, end: Date) {
    setStartDate(start)
    setEndDate(end)
    setShowCalendar(false)
  }

  const days = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0
  const hours = startDate && endDate ? Math.ceil(differenceInDays(endDate, startDate) * 24) : 0
  
  const costs = startDate && endDate
    ? {
        rentAmount: pricingType === 'daily' 
          ? listing.pricePerDay * days
          : (listing.pricePerHour || listing.pricePerDay / 24) * hours,
        platformFee: Math.round(((pricingType === 'daily' 
          ? listing.pricePerDay * days
          : (listing.pricePerHour || listing.pricePerDay / 24) * hours)) * 0.1),
        deposit: listing.deposit,
        total: (pricingType === 'daily' 
          ? listing.pricePerDay * days
          : (listing.pricePerHour || listing.pricePerDay / 24) * hours) + Math.round(((pricingType === 'daily' 
          ? listing.pricePerDay * days
          : (listing.pricePerHour || listing.pricePerDay / 24) * hours)) * 0.1) + listing.deposit,
      }
    : null

  async function handleBooking() {
    if (!startDate || !endDate) {
      setError('Please select dates')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createBookingAction({
        listingId: listing.id,
        startDate,
        endDate,
        paymentMethod: paymentMethod,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Redirect to booking confirmation page
      router.push(`/bookings/${result.bookingId}/confirmation`)
    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Book this item</h2>

      {/* Pricing Type Selection */}
      {listing.pricePerHour && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setPricingType('daily')}
            className={`flex-1 py-2 rounded-lg transition ${
              pricingType === 'daily'
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 hover:border-primary-600'
            }`}
          >
            Daily Rental (₹{listing.pricePerDay}/day)
          </button>
          <button
            onClick={() => setPricingType('hourly')}
            className={`flex-1 py-2 rounded-lg transition ${
              pricingType === 'hourly'
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 hover:border-primary-600'
            }`}
          >
            Hourly Rental (₹{listing.pricePerHour}/hour)
          </button>
        </div>
      )}

      {/* Date Selection */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full p-3 border rounded-lg text-left hover:border-primary-600 transition"
        >
          {startDate && endDate ? (
            <div>
              <p className="text-sm text-gray-600">Rental Period</p>
              <p className="font-medium">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">{days} days</p>
            </div>
          ) : (
            <p className="text-gray-500">Select dates</p>
          )}
        </button>

        {showCalendar && (
          <div className="border rounded-lg p-4">
            <DateRangePicker
              onSelect={handleDateSelect}
              blockedDates={blockedDates}
              minDate={new Date()}
              maxDate={addDays(new Date(), 180)}
            />
          </div>
        )}

        {/* Cost Breakdown */}
        {costs && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>
                {pricingType === 'daily' 
                  ? `₹${listing.pricePerDay} × ${days} days`
                  : `₹${(listing.pricePerHour || listing.pricePerDay / 24).toFixed(2)} × ${hours} hours`
                }
              </span>
              <span>₹{costs.rentAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform fee (10%)</span>
              <span>₹{costs.platformFee}</span>
            </div>
            {costs.deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span>Security deposit (refundable)</span>
                <span>₹{costs.deposit}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{costs.total}</span>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="pt-4 border-t">
          <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800">Cash on Delivery</p>
                <p className="text-sm text-green-600">Pay by UPI or Cash when item is delivered</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleBooking}
          disabled={!startDate || !endDate || loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? 'Creating booking...' : 'Confirm Booking (Pay on Delivery)'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Pay to the delivery person via UPI or Cash when item is delivered
        </p>
      </div>
    </div>
  )
}
