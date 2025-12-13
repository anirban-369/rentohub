'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, differenceInDays, format } from 'date-fns'
import DateRangePicker from './DateRangePicker'
import MapPicker from './MapPicker'
import { createBookingAction } from '@/app/actions/bookings'

interface BookingWizardProps {
  listing: any
  userDeliveryAddress?: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    latitude?: number
    longitude?: number
  }
}

export default function BookingWizard({ listing, userDeliveryAddress }: BookingWizardProps) {
  const router = useRouter()
  
  // Step 1: Pricing Type
  const [step, setStep] = useState(1)
  const [pricingType, setPricingType] = useState<'daily' | 'hourly'>('daily')
  
  // Step 2: Date/Time Selection
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  
  // Step 3: Delivery Address
  const [deliveryMode, setDeliveryMode] = useState<'saved' | 'map' | 'manual'>('saved')
  const [deliveryAddress, setDeliveryAddress] = useState(userDeliveryAddress?.address || '')
  const [deliveryCity, setDeliveryCity] = useState(userDeliveryAddress?.city || '')
  const [deliveryState, setDeliveryState] = useState(userDeliveryAddress?.state || '')
  const [deliveryZipCode, setDeliveryZipCode] = useState(userDeliveryAddress?.zipCode || '')
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(userDeliveryAddress?.latitude || null)
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(userDeliveryAddress?.longitude || null)
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [deliveryName, setDeliveryName] = useState('')
  
  // Step 4: Review & Confirm
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  function handleDateSelect(start: Date, end: Date) {
    setStartDate(start)
    setEndDate(end)
    setShowCalendar(false)
  }

  function handleMapLocationSelect(location: { lat: number; lng: number; address?: string }) {
    setDeliveryLatitude(location.lat)
    setDeliveryLongitude(location.lng)
    if (location.address) {
      setDeliveryAddress(location.address)
    }
  }

  async function handleConfirmBooking() {
    if (!startDate || !endDate) {
      setError('Please select dates')
      return
    }

    if (!deliveryName || !deliveryPhone) {
      setError('Please enter delivery contact name and phone')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createBookingAction({
        listingId: listing.id,
        startDate,
        endDate,
        paymentMethod: 'CASH_ON_DELIVERY',
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      router.push(`/dashboard/bookings/${result.bookingId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: Pricing Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Rental Type</h3>
            <p className="text-gray-600 text-sm mb-4">
              Select how you would like to rent this item
            </p>
          </div>

          <div className="space-y-3">
            {/* Daily Option */}
            <button
              onClick={() => setPricingType('daily')}
              className={`w-full p-4 border-2 rounded-lg transition text-left ${
                pricingType === 'daily'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">Daily Rental</h4>
                  <p className="text-sm text-gray-600">Best for extended rentals</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary-600">₹{listing.pricePerDay}</p>
                  <p className="text-xs text-gray-500">per day</p>
                </div>
              </div>
            </button>

            {/* Hourly Option */}
            {listing.pricePerHour && (
              <button
                onClick={() => setPricingType('hourly')}
                className={`w-full p-4 border-2 rounded-lg transition text-left ${
                  pricingType === 'hourly'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">Hourly Rental</h4>
                    <p className="text-sm text-gray-600">Best for short-term use</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary-600">₹{listing.pricePerHour}</p>
                    <p className="text-xs text-gray-500">per hour</p>
                  </div>
                </div>
              </button>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            {pricingType === 'hourly' ? 'Continue to Clock' : 'Continue to Dates'}
          </button>
        </div>
      )}

      {/* STEP 2: Date & Time Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Select {pricingType === 'daily' ? 'Dates' : 'Time Period'}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {pricingType === 'daily'
                ? 'Choose your rental start and end dates'
                : 'Choose your rental start time and hours'}
            </p>
          </div>

          {pricingType === 'daily' ? (
            <>
              {/* Date Selection for Daily Rentals */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full text-left"
                >
                  {startDate && endDate ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Start Date</p>
                          <p className="font-semibold">{format(startDate, 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">End Date</p>
                          <p className="font-semibold">{format(endDate, 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          Duration: {days} day{days !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 py-2">Click to select dates</p>
                  )}
                </button>

                {showCalendar && (
                  <div className="mt-4 pt-4 border-t">
                    <DateRangePicker
                      onSelect={handleDateSelect}
                      blockedDates={blockedDates}
                      minDate={new Date()}
                      maxDate={addDays(new Date(), 180)}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Time Selection for Hourly Rentals */}
              <div className="space-y-4">
                {/* Start Date and Time */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newStart = new Date(e.target.value)
                        setStartDate(newStart)
                        // Auto-set end time to 1 hour later if not set
                        if (!endDate) {
                          const newEnd = new Date(newStart.getTime() + 3600000)
                          setEndDate(newEnd)
                        }
                      }
                    }}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  />
                </div>

                {/* End Date and Time */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newEnd = new Date(e.target.value)
                        if (startDate && newEnd > startDate) {
                          setEndDate(newEnd)
                        }
                      }
                    }}
                    min={startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  />
                </div>

                {/* Duration Display */}
                {startDate && endDate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Start Time</p>
                          <p className="font-semibold">{format(startDate, 'MMM dd, yyyy hh:mm a')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">End Time</p>
                          <p className="font-semibold">{format(endDate, 'MMM dd, yyyy hh:mm a')}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-blue-200">
                        <p className="text-sm text-gray-700 font-semibold">
                          Duration: {hours} hour{hours !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Cost Preview */}
          {costs && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {pricingType === 'daily'
                    ? `₹${listing.pricePerDay} × ${days} day${days !== 1 ? 's' : ''}`
                    : `₹${(listing.pricePerHour || listing.pricePerDay / 24).toFixed(2)} × ${hours} hour${hours !== 1 ? 's' : ''}`}
                </span>
                <span className="font-semibold">₹{costs.rentAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform fee (10%)</span>
                <span className="font-semibold">₹{costs.platformFee}</span>
              </div>
              {costs.deposit > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security deposit (refundable)</span>
                  <span className="font-semibold">₹{costs.deposit}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total</span>
                <span className="text-primary-600">₹{costs.total}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!startDate || !endDate}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Continue to Delivery
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Delivery Address */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Delivery Address</h3>
            <p className="text-gray-600 text-sm mb-4">
              Where should we deliver this item?
            </p>
          </div>

          {/* Delivery Mode Selection */}
          <div className="space-y-3">
            {userDeliveryAddress?.address && (
              <button
                onClick={() => setDeliveryMode('saved')}
                className={`w-full p-4 border-2 rounded-lg transition text-left ${
                  deliveryMode === 'saved'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold">Use Saved Address</h4>
                    <p className="text-sm text-gray-600">{userDeliveryAddress.address}</p>
                    <p className="text-xs text-gray-500">
                      {userDeliveryAddress.city}, {userDeliveryAddress.state} {userDeliveryAddress.zipCode}
                    </p>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={() => setDeliveryMode('map')}
              className={`w-full p-4 border-2 rounded-lg transition text-left ${
                deliveryMode === 'map'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Select from Map</h4>
                  <p className="text-sm text-gray-600">Choose location on interactive map</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setDeliveryMode('manual')}
              className={`w-full p-4 border-2 rounded-lg transition text-left ${
                deliveryMode === 'manual'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Enter Manually</h4>
                  <p className="text-sm text-gray-600">Type your delivery address</p>
                </div>
              </div>
            </button>
          </div>

          {/* Map Picker */}
          {deliveryMode === 'map' && (
            <div className="border rounded-lg overflow-hidden">
              <MapPicker
                onLocationSelect={handleMapLocationSelect}
                initialLocation={
                  deliveryLatitude && deliveryLongitude
                    ? { lat: deliveryLatitude, lng: deliveryLongitude }
                    : undefined
                }
              />
            </div>
          )}

          {/* Manual Entry */}
          {deliveryMode === 'manual' && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter street address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    placeholder="State"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={deliveryZipCode}
                  onChange={(e) => setDeliveryZipCode(e.target.value)}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold text-gray-900">Delivery Contact Information</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={deliveryName}
                onChange={(e) => setDeliveryName(e.target.value)}
                placeholder="Name of person to receive delivery"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
                placeholder="Phone number for delivery"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!deliveryName || !deliveryPhone}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Review Booking
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Confirm */}
      {step === 4 && costs && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Review Your Booking</h3>
          </div>

          {/* Item Summary */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Item</h4>
            <p className="text-gray-700">{listing.title}</p>
          </div>

          {/* Rental Period */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Rental Period ({pricingType})</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Start</p>
                <p className="font-medium">{startDate && format(startDate, 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">End</p>
                <p className="font-medium">{endDate && format(endDate, 'MMM dd, yyyy')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Duration: {pricingType === 'daily' ? `${days} day${days !== 1 ? 's' : ''}` : `${hours} hour${hours !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Delivery Address */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Delivery Address</h4>
            <div className="text-sm space-y-1">
              {deliveryMode === 'saved' && userDeliveryAddress ? (
                <>
                  <p className="font-medium">{deliveryName}</p>
                  <p className="text-gray-600">{userDeliveryAddress.address}</p>
                  <p className="text-gray-600">
                    {userDeliveryAddress.city}, {userDeliveryAddress.state} {userDeliveryAddress.zipCode}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">{deliveryName}</p>
                  <p className="text-gray-600">{deliveryAddress}</p>
                  <p className="text-gray-600">
                    {deliveryCity}, {deliveryState} {deliveryZipCode}
                  </p>
                </>
              )}
              <p className="text-gray-600 pt-2">📞 {deliveryPhone}</p>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {pricingType === 'daily'
                  ? `₹${listing.pricePerDay} × ${days} day${days !== 1 ? 's' : ''}`
                  : `₹${(listing.pricePerHour || listing.pricePerDay / 24).toFixed(2)} × ${hours} hour${hours !== 1 ? 's' : ''}`}
              </span>
              <span className="font-semibold">₹{costs.rentAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform fee (10%)</span>
              <span className="font-semibold">₹{costs.platformFee}</span>
            </div>
            {costs.deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Security deposit (refundable)</span>
                <span className="font-semibold">₹{costs.deposit}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-3 border-t mt-3">
              <span>Total Amount</span>
              <span className="text-primary-600">₹{costs.total}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Cash on Delivery</h4>
                <p className="text-sm text-green-700">
                  Pay the delivery partner via UPI or Cash when the item is delivered
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Back
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Confirming...' : '✓ Confirm & Book'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By confirming, you agree to our terms and conditions
          </p>
        </div>
      )}
    </div>
  )
}
