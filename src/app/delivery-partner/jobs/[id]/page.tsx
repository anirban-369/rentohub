'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import PartnerNavbar from '@/components/PartnerNavbar'
import { getProxyImageUrl } from '@/lib/image-utils'

// Dynamically import the map component to avoid SSR issues
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
})

interface DeliveryJob {
  id: string
  bookingId: string
  status: string
  pickupAddress: string
  pickupLatitude: number
  pickupLongitude: number
  pickupStartedAt: string | null
  pickedAt: string | null
  pickupPhotos: string[]
  pickupVideoUrl: string | null
  deliveryAddress: string
  deliveryLatitude: number
  deliveryLongitude: number
  outForDeliveryAt: string | null
  deliveredAt: string | null
  deliveryPhotos: string[]
  deliveryVideoUrl: string | null
  amountCollected: number | null
  currentLatitude: number | null
  currentLongitude: number | null
  createdAt: string
  booking: {
    id: string
    totalAmount: number
    paymentMethod: string
    listing: {
      id: string
      title: string
      images: string[]
      pricePerDay: number
    }
    renter: {
      id: string
      name: string
      phone: string | null
      email: string
    }
  }
}

export default function DeliveryJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<DeliveryJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofPhotos, setProofPhotos] = useState<string[]>([])
  const [proofVideo, setProofVideo] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [amountCollected, setAmountCollected] = useState('')
  const [showProofModal, setShowProofModal] = useState(false)
  const [proofType, setProofType] = useState<'pickup' | 'delivery'>('pickup')

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const watchIdRef = useRef<number | null>(null)

  // Fetch job details
  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/delivery-jobs/${jobId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setJob(data.deliveryJob)
      } else {
        setError('Failed to fetch job details')
      }
    } catch (err) {
      setError('Failed to fetch job details')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // Start watching location
  const startLocationTracking = useCallback(() => {
    if (navigator.geolocation && !watchIdRef.current) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })
          // Update location on server
          updateLocationOnServer(latitude, longitude)
        },
        (error) => {
          console.error('Location error:', error)
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    }
  }, [])

  // Stop watching location
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => {
    // Start tracking when job is in progress
    if (job && ['PICKUP_STARTED', 'PICKED', 'OUT_FOR_DELIVERY'].includes(job.status)) {
      startLocationTracking()
    }
    return () => stopLocationTracking()
  }, [job?.status, startLocationTracking, stopLocationTracking])

  const updateLocationOnServer = async (lat: number, lng: number) => {
    try {
      await fetch(`/api/delivery-jobs/${jobId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      })
    } catch (err) {
      console.error('Failed to update location:', err)
    }
  }

  const updateStatus = async (newStatus: string, additionalData?: any) => {
    setUpdating(true)
    setError(null)
    try {
      const payload = {
        status: newStatus,
        latitude: currentLocation?.lat,
        longitude: currentLocation?.lng,
        ...additionalData,
      }
      
      console.log('Sending update status request:', payload)
      
      const response = await fetch(`/api/delivery-jobs/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()
      console.log('Status update response:', { ok: response.ok, data: responseData })

      if (response.ok) {
        await fetchJob()
        setProofPhotos([])
        setProofVideo(null)
        setShowProofModal(false)
      } else {
        setError(responseData.error || 'Failed to update status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingProof(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'delivery-proof')

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setProofPhotos((prev) => [...prev, data.url])
        }
      }
    } catch (err) {
      setError('Failed to upload photos')
    } finally {
      setUploadingProof(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate video duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    const validateAndUpload = () => {
      return new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = async () => {
          window.URL.revokeObjectURL(video.src)
          const duration = video.duration
          
          if (duration < 10) {
            setError('Video must be at least 10 seconds long')
            reject(new Error('Video too short'))
            return
          }
          
          if (duration > 60) {
            setError('Video must be maximum 60 seconds (1 minute)')
            reject(new Error('Video too long'))
            return
          }
          
          setVideoDuration(Math.round(duration))
          setUploadingProof(true)
          setError(null)
          
          try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'delivery-proof-video')

            const response = await fetch('/api/upload', {
              method: 'POST',
              credentials: 'include',
              body: formData,
            })

            if (response.ok) {
              const data = await response.json()
              setProofVideo(data.url)
              resolve()
            } else {
              const errorData = await response.json()
              setError(errorData.error || 'Failed to upload video')
              reject(new Error('Upload failed'))
            }
          } catch (err) {
            setError('Failed to upload video')
            reject(err)
          } finally {
            setUploadingProof(false)
          }
        }
        
        video.onerror = () => {
          setError('Could not read video file')
          reject(new Error('Invalid video'))
        }
      })
    }
    
    video.src = URL.createObjectURL(file)
    try {
      await validateAndUpload()
    } catch (err) {
      // Error already set in the promise
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  const handleStartPickup = () => {
    updateStatus('PICKUP_STARTED')
  }

  const handleConfirmPickup = () => {
    setProofType('pickup')
    setShowProofModal(true)
  }

  const handleStartDelivery = () => {
    updateStatus('OUT_FOR_DELIVERY')
  }

  const handleConfirmDelivery = () => {
    setProofType('delivery')
    setShowProofModal(true)
  }

  const submitProof = () => {
    if (proofPhotos.length === 0) {
      setError('Please upload at least one photo as proof')
      return
    }
    
    if (!proofVideo) {
      setError('Please upload a video (10-60 seconds) as condition proof')
      return
    }

    if (proofType === 'pickup') {
      updateStatus('PICKED', {
        pickupPhotos: proofPhotos,
        pickupVideoUrl: proofVideo,
      })
    } else {
      if (job?.booking.paymentMethod === 'CASH_ON_DELIVERY' && !amountCollected) {
        setError('Please enter the amount collected')
        return
      }
      updateStatus('DELIVERED', {
        deliveryPhotos: proofPhotos,
        deliveryVideoUrl: proofVideo,
        amountCollected: amountCollected ? parseFloat(amountCollected) : null,
      })
    }
  }

  const getStatusStep = (status: string) => {
    const steps = ['ASSIGNED', 'PICKUP_STARTED', 'PICKED', 'OUT_FOR_DELIVERY', 'DELIVERED']
    return steps.indexOf(status)
  }

  const openInMaps = (destLat: number, destLng: number) => {
    // Use current location as origin if available, otherwise let Google Maps use device location
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`
    if (currentLocation) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`
    }
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PartnerNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PartnerNavbar />
        <div className="p-8 text-center">
          <p className="text-red-600">{error || 'Job not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-orange-600 hover:underline"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentStep = getStatusStep(job.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNavbar />
      
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-orange-600 hover:underline mb-4 inline-block"
          >
            ← Back to Jobs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Delivery Job #{job.id.substring(0, 8)}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Status Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Delivery Progress</h2>
          <div className="flex items-center justify-between">
            {['Assigned', 'En Route to Pickup', 'Picked Up', 'Out for Delivery', 'Delivered'].map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className="text-xs text-gray-600 mt-1 text-center">{step}</span>
                {index < 4 && (
                  <div
                    className={`absolute h-1 w-full ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{ left: '50%', transform: 'translateX(50%)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Item Details</h2>
          <div className="flex gap-4">
            {job.booking.listing.images[0] && (
              <img
                src={getProxyImageUrl(job.booking.listing.images[0])}
                alt={job.booking.listing.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-medium text-gray-900">{job.booking.listing.title}</h3>
              <p className="text-gray-600">₹{job.booking.listing.pricePerDay}/day</p>
              <p className="text-sm text-gray-500 mt-2">
                Total: <span className="font-semibold text-gray-900">₹{job.booking.totalAmount}</span>
              </p>
              {job.booking.paymentMethod === 'CASH_ON_DELIVERY' && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  💵 Cash on Delivery
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Renter Contact */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Renter Contact</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">Name:</span> {job.booking.renter.name}
            </p>
            {job.booking.renter.phone && (
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span>{' '}
                <a href={`tel:${job.booking.renter.phone}`} className="text-orange-600 hover:underline">
                  {job.booking.renter.phone}
                </a>
              </p>
            )}
            <p className="text-gray-700">
              <span className="font-medium">Email:</span>{' '}
              <a href={`mailto:${job.booking.renter.email}`} className="text-orange-600 hover:underline">
                {job.booking.renter.email}
              </a>
            </p>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">📍 Pickup Location (Lender)</h2>
            {job.status === 'PICKUP_STARTED' && (
              <button
                onClick={() => openInMaps(job.pickupLatitude, job.pickupLongitude)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                🗺️ Navigate in Google Maps
              </button>
            )}
          </div>
          <p className="text-gray-600 mb-4">{job.pickupAddress}</p>
          
          {/* Leaflet Map with Live Tracking */}
          <DeliveryMap
            pickupLat={job.pickupLatitude}
            pickupLng={job.pickupLongitude}
            deliveryLat={job.deliveryLatitude}
            deliveryLng={job.deliveryLongitude}
            currentLat={currentLocation?.lat}
            currentLng={currentLocation?.lng}
            showPickup={true}
            showDelivery={false}
            showCurrent={job.status === 'PICKUP_STARTED'}
            height="280px"
          />
          {job.status === 'PICKUP_STARTED' && currentLocation && (
            <p className="text-xs text-blue-600 mt-2 text-center">
              🔵 Blue marker = Your live location | 🟢 Green marker = Pickup location
            </p>
          )}

          {job.pickupStartedAt && (
            <p className="text-sm text-gray-500 mt-3">
              Started: {new Date(job.pickupStartedAt).toLocaleString()}
            </p>
          )}
          {job.pickedAt && (
            <p className="text-sm text-green-600">
              ✓ Picked up: {new Date(job.pickedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Delivery Location */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">🏠 Delivery Location (Renter)</h2>
            {job.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => openInMaps(job.deliveryLatitude, job.deliveryLongitude)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                🗺️ Navigate in Google Maps
              </button>
            )}
          </div>
          <p className="text-gray-600 mb-4">{job.deliveryAddress}</p>
          
          {/* Leaflet Map with Live Tracking */}
          <DeliveryMap
            pickupLat={job.pickupLatitude}
            pickupLng={job.pickupLongitude}
            deliveryLat={job.deliveryLatitude}
            deliveryLng={job.deliveryLongitude}
            currentLat={currentLocation?.lat}
            currentLng={currentLocation?.lng}
            showPickup={false}
            showDelivery={true}
            showCurrent={job.status === 'OUT_FOR_DELIVERY'}
            height="280px"
          />
          {job.status === 'OUT_FOR_DELIVERY' && currentLocation && (
            <p className="text-xs text-blue-600 mt-2 text-center">
              🔵 Blue marker = Your live location | 🔴 Red marker = Delivery location
            </p>
          )}

          {job.outForDeliveryAt && (
            <p className="text-sm text-gray-500 mt-3">
              Started delivery: {new Date(job.outForDeliveryAt).toLocaleString()}
            </p>
          )}
          {job.deliveredAt && (
            <p className="text-sm text-green-600">
              ✓ Delivered: {new Date(job.deliveredAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
          
          {job.status === 'ASSIGNED' && (
            <button
              onClick={handleStartPickup}
              disabled={updating}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? 'Starting...' : '🚗 Start Pickup'}
            </button>
          )}

          {job.status === 'PICKUP_STARTED' && (
            <button
              onClick={handleConfirmPickup}
              disabled={updating}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? 'Processing...' : '📦 Confirm Pickup & Submit Proof'}
            </button>
          )}

          {job.status === 'PICKED' && (
            <button
              onClick={handleStartDelivery}
              disabled={updating}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? 'Starting...' : '🚚 Start Delivery'}
            </button>
          )}

          {job.status === 'OUT_FOR_DELIVERY' && (
            <button
              onClick={handleConfirmDelivery}
              disabled={updating}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? 'Processing...' : '✅ Confirm Delivery & Submit Proof'}
            </button>
          )}

          {job.status === 'DELIVERED' && (
            <div className="text-center py-4">
              <span className="text-2xl">🎉</span>
              <p className="text-green-600 font-semibold mt-2">Delivery Completed!</p>
              {job.amountCollected && (
                <p className="text-gray-600 mt-1">
                  Amount Collected: ₹{job.amountCollected}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Proof Modal */}
        {showProofModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {proofType === 'pickup' ? '📦 Pickup Proof' : '🏠 Delivery Proof'}
                  </h2>
                  <button
                    onClick={() => setShowProofModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-gray-600 mb-4">
                  {proofType === 'pickup'
                    ? 'Please verify the item condition and capture photos/video as proof for the lender.'
                    : 'Please capture photos/video of the item being delivered as proof for the renter.'}
                </p>

                {/* Photo Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (Required - minimum 1)
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingProof}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition flex items-center justify-center gap-2"
                  >
                    {uploadingProof ? 'Uploading...' : '📷 Take/Upload Photos'}
                  </button>
                  
                  {/* Photo Previews */}
                  {proofPhotos.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {proofPhotos.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={getProxyImageUrl(url)}
                            alt={`Proof ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setProofPhotos((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video (Required - 10 to 60 seconds) *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Record a video showing the item's condition. This serves as proof for both parties.
                  </p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingProof}
                    className={`w-full py-3 border-2 border-dashed rounded-lg transition flex items-center justify-center gap-2 ${
                      proofVideo 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-orange-500'
                    }`}
                  >
                    {uploadingProof ? 'Uploading...' : proofVideo ? '✅ Video Uploaded' : '🎥 Record/Upload Video (10-60 sec)'}
                  </button>
                  
                  {proofVideo && (
                    <div className="mt-3 flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <span>✓</span>
                        <span className="text-sm">Video uploaded ({videoDuration}s)</span>
                      </div>
                      <button
                        onClick={() => {
                          setProofVideo(null)
                          setVideoDuration(null)
                          if (videoInputRef.current) videoInputRef.current.value = ''
                        }}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Cash Collection (for delivery only) */}
                {proofType === 'delivery' && job?.booking.paymentMethod === 'CASH_ON_DELIVERY' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Collected (₹) *
                    </label>
                    <input
                      type="number"
                      value={amountCollected}
                      onChange={(e) => setAmountCollected(e.target.value)}
                      placeholder={`Expected: ₹${job.booking.totalAmount}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={submitProof}
                  disabled={updating || proofPhotos.length === 0 || !proofVideo}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {updating
                    ? 'Submitting...'
                    : proofType === 'pickup'
                    ? 'Confirm Pickup'
                    : 'Confirm Delivery'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
