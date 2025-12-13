'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUploader from './ImageUploader'
import { updateListingAction, deleteListingAction } from '@/app/actions/listings'

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

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

interface EditListingFormProps {
  listing: any
}

export default function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description,
    category: listing.category,
    pricePerDay: listing.pricePerDay.toString(),
    deposit: listing.deposit?.toString() || '0',
    condition: listing.condition || '',
    images: listing.images as string[],
    location: listing.location || '',
    latitude: listing.latitude || 26.8506,
    longitude: listing.longitude || 75.8027,
    status: listing.status,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('📝 Submitting edit with images:', formData.images)
      
      const result = await updateListingAction(listing.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricePerDay: parseFloat(formData.pricePerDay),
        deposit: parseFloat(formData.deposit || '0'),
        condition: formData.condition,
        images: formData.images,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: formData.status as any,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      router.push(`/listings/${listing.id}`)
    } catch (err: any) {
      console.error('❌ Submit error:', err)
      setError(err.message || 'Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
      return
    }

    setLoading(true)
    const result = await deleteListingAction(listing.id)

    if (result.success) {
      router.push('/dashboard/listings')
    } else {
      alert(result.error || 'Failed to delete listing')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          >
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
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition
          </label>
          <input
            type="text"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Deposit ($)
            </label>
            <input
              type="number"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          >
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos *
          </label>
          <ImageUploader
            onUpload={(urls) => setFormData({ ...formData, images: urls })}
            maxFiles={10}
            existingImages={formData.images}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <MapPicker
            onLocationSelect={(location) =>
              setFormData({
                ...formData,
                latitude: location.lat,
                longitude: location.lng,
                location: location.address || '',
              })
            }
            initialLocation={{ lat: formData.latitude, lng: formData.longitude }}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
