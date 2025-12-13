'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'
import { createListingAction } from '@/app/actions/listings'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

const CATEGORIES = [
  'Electronics',
  'Tools',
  'Sports',
  'Outdoor',
  'Photography',
  'Party',
  'Home',
  'Other',
]

export default function CreateListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    pricePerDay: '',
    pricePerHour: '',
    deposit: '',
    condition: '',
    images: [] as string[],
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: 26.8506,
    longitude: 75.8027,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    if (!e || !e.target) {
      console.error('Invalid event object in handleChange:', e)
      return
    }
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Submitting form data:', formData)
      
      // Validate required fields
      if (!formData.address || !formData.city || !formData.state) {
        throw new Error('Please select a valid location with address details')
      }

      const result = await createListingAction({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricePerDay: parseFloat(formData.pricePerDay),
        pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : null,
        deposit: parseFloat(formData.deposit || '0'),
        condition: formData.condition || 'good',
        images: formData.images,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      router.push(`/listings/${result.listingId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                    placeholder="e.g., Canon EOS R5 Camera"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                    placeholder="Describe your item in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Select condition</option>
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="used">Used</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Day (₹) *
                    </label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={formData.pricePerDay}
                      onChange={handleChange}
                      required
                      min="1"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Hour (₹)
                    </label>
                    <input
                      type="number"
                      name="pricePerHour"
                      value={formData.pricePerHour}
                      onChange={handleChange}
                      min="1"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                      placeholder="50 (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
                    placeholder="1000"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Next: Add Photos
                </button>
              </div>
            )}

            {/* Step 2: Images */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos *
                  </label>
                  <ImageUploader
                    onUpload={(urls) => setFormData({ ...formData, images: urls })}
                    maxFiles={10}
                    existingImages={formData.images}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Add at least 3 photos. First photo will be the cover image.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={formData.images.length < 3}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    Next: Location
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <MapPicker
                    onLocationSelect={(location) => {
                      // Address format: "locality, district, city, state, zipCode, country"
                      const addressParts = location.address?.split(',').map(p => p.trim()) || []
                      
                      // Extract state (second to last, before country)
                      const state = addressParts[addressParts.length - 3] || 'Rajasthan'
                      
                      // Extract city (third from last)
                      const city = addressParts[addressParts.length - 4] || 'Jaipur'
                      
                      // Extract zipCode from second to last part
                      const zipCodePart = addressParts[addressParts.length - 2] || ''
                      const zipCode = zipCodePart.match(/\d{6}/)?.[0] || ''
                      
                      setFormData({
                        ...formData,
                        latitude: location.lat,
                        longitude: location.lng,
                        address: location.address || '',
                        city,
                        state,
                        zipCode,
                      })
                    }}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.address}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {loading ? 'Creating...' : 'Create Listing'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
