'use client'

import { useEffect, useState } from 'react'
import { getListingsForApprovalAction, approveListing, rejectListing } from '@/app/actions/admin'
import Link from 'next/link'
import { getProxyImageUrl } from '@/lib/image-utils'

export default function AdminListingsApprovalPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({})
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null)

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    try {
      const result = await getListingsForApprovalAction()
      if (result.success) {
        setListings(result.listings || [])
      } else {
        setError(result.error || 'Failed to load listings')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(listingId: string) {
    setProcessingId(listingId)
    try {
      const result = await approveListing(listingId)
      if (result.success) {
        setListings(listings.filter((l) => l.id !== listingId))
      } else {
        setError(result.error || 'Failed to approve listing')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(listingId: string) {
    const reason = rejectReason[listingId]
    if (!reason) {
      setError('Please provide a rejection reason')
      return
    }

    setProcessingId(listingId)
    try {
      const result = await rejectListing(listingId, reason)
      if (result.success) {
        setListings(listings.filter((l) => l.id !== listingId))
        setShowRejectForm(null)
        setRejectReason({})
      } else {
        setError(result.error || 'Failed to reject listing')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading listings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Listing Approvals</h1>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">
            ← Back to Admin
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        {listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No listings pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing: any) => (
              <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex gap-6">
                    {listing.images?.[0] && (
                      <img
                        src={getProxyImageUrl(listing.images[0])}
                        alt={listing.title}
                        className="w-32 h-32 object-cover rounded"
                      />
                    )}

                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {listing.title}
                      </h2>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Lender:</span>
                          <p className="font-medium">{listing.user.name}</p>
                          <p className="text-gray-500">{listing.user.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <p className="font-medium">₹{listing.pricePerDay}/day</p>
                          <p className="text-gray-500">Category: {listing.category}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={processingId === listing.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                        >
                          {processingId === listing.id ? 'Approving...' : 'Approve'}
                        </button>

                        {showRejectForm === listing.id ? (
                          <div className="flex gap-2 flex-1">
                            <textarea
                              value={rejectReason[listing.id] || ''}
                              onChange={(e) =>
                                setRejectReason({
                                  ...rejectReason,
                                  [listing.id]: e.target.value,
                                })
                              }
                              placeholder="Reason for rejection..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              rows={2}
                            />
                            <button
                              onClick={() => handleReject(listing.id)}
                              disabled={processingId === listing.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition whitespace-nowrap"
                            >
                              {processingId === listing.id ? 'Rejecting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setShowRejectForm(null)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowRejectForm(listing.id)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
