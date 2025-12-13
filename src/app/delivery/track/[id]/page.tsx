'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import Navbar from '@/components/Navbar'
import { getProxyImageUrl } from '@/lib/image-utils'

// Dynamically import the map component to avoid SSR issues
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
})

interface DeliveryJob {
  id: string
  status: string
  pickupAddress: string
  pickupLatitude: number
  pickupLongitude: number
  pickupStartedAt: string | null
  pickedAt: string | null
  deliveryAddress: string
  deliveryLatitude: number
  deliveryLongitude: number
  outForDeliveryAt: string | null
  deliveredAt: string | null
  currentLatitude: number | null
  currentLongitude: number | null
  lastLocationUpdate: string | null
  deliveryAgent: {
    id: string
    name: string
    phone: string | null
  } | null
  booking: {
    id: string
    totalAmount: number
    listing: {
      id: string
      title: string
      images: string[]
    }
  }
}

export default function DeliveryTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<DeliveryJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery-jobs/${jobId}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setJob(data.deliveryJob)
      } else {
        setError('Failed to fetch delivery details')
      }
    } catch (err) {
      setError('Failed to fetch delivery details')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()
    
    // Poll for updates every 10 seconds when delivery is in progress
    const interval = setInterval(() => {
      if (job && ['PICKUP_STARTED', 'PICKED', 'OUT_FOR_DELIVERY'].includes(job.status)) {
        fetchJob()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchJob, job?.status])

  const getStatusStep = (status: string) => {
    const steps = ['ASSIGNED', 'PICKUP_STARTED', 'PICKED', 'OUT_FOR_DELIVERY', 'DELIVERED']
    return steps.indexOf(status)
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-8 text-center">
          <p className="text-red-600">{error || 'Delivery not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline">
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentStep = getStatusStep(job.status)

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

          <h1 className="text-2xl font-bold mb-6">Track Delivery</h1>

          {/* Item Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex gap-4">
              {job.booking.listing.images[0] && (
                <img
                  src={getProxyImageUrl(job.booking.listing.images[0])}
                  alt={job.booking.listing.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div>
                <h2 className="font-semibold">{job.booking.listing.title}</h2>
                <p className="text-gray-600 text-sm">Total: ₹{job.booking.totalAmount}</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Delivery Progress</h2>
            <div className="space-y-4">
              {[
                { step: 0, label: 'Order Accepted', desc: 'Waiting for pickup' },
                { step: 1, label: 'Heading to Pickup', desc: 'Partner is on the way to lender' },
                { step: 2, label: 'Item Picked Up', desc: 'Item collected and verified' },
                { step: 3, label: 'Out for Delivery', desc: 'On the way to you' },
                { step: 4, label: 'Delivered', desc: 'Enjoy your rental!' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step <= currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < currentStep ? '✓' : step + 1}
                  </div>
                  <div className={step <= currentStep ? 'text-gray-900' : 'text-gray-400'}>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Map */}
          {['PICKUP_STARTED', 'OUT_FOR_DELIVERY'].includes(job.status) && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">📍 Live Tracking</h2>
                {job.lastLocationUpdate && (
                  <span className="text-xs text-gray-500">
                    Updated: {format(new Date(job.lastLocationUpdate), 'h:mm:ss a')}
                  </span>
                )}
              </div>
              <DeliveryMap
                pickupLat={job.pickupLatitude}
                pickupLng={job.pickupLongitude}
                deliveryLat={job.deliveryLatitude}
                deliveryLng={job.deliveryLongitude}
                currentLat={job.currentLatitude}
                currentLng={job.currentLongitude}
                showPickup={job.status === 'PICKUP_STARTED'}
                showDelivery={job.status === 'OUT_FOR_DELIVERY'}
                showCurrent={true}
                height="256px"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                {job.status === 'PICKUP_STARTED' 
                  ? 'Partner heading to pickup location' 
                  : 'Partner on the way to you'}
              </p>
            </div>
          )}

          {/* Delivery Partner */}
          {job.deliveryAgent && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="font-semibold mb-4">Delivery Partner</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xl">
                  🚚
                </div>
                <div>
                  <p className="font-medium">{job.deliveryAgent.name}</p>
                  {job.deliveryAgent.phone && (
                    <a
                      href={`tel:${job.deliveryAgent.phone}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      📞 {job.deliveryAgent.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-500">📍</span> Pickup Location
                </h3>
                <p className="text-gray-600 text-sm">{job.pickupAddress}</p>
                {job.pickedAt && (
                  <p className="text-green-600 text-xs mt-2">
                    ✓ Picked up: {format(new Date(job.pickedAt), 'MMM dd, h:mm a')}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-red-500">📍</span> Delivery Location
                </h3>
                <p className="text-gray-600 text-sm">{job.deliveryAddress}</p>
                {job.deliveredAt && (
                  <p className="text-green-600 text-xs mt-2">
                    ✓ Delivered: {format(new Date(job.deliveredAt), 'MMM dd, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Completion Message */}
          {job.status === 'DELIVERED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <span className="text-4xl mb-4 block">🎉</span>
              <h2 className="text-xl font-bold text-green-800 mb-2">Delivery Complete!</h2>
              <p className="text-green-700">
                Your rental item has been delivered. Enjoy!
              </p>
              <Link
                href={`/dashboard/bookings/${job.booking.id}`}
                className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                View Booking Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
