'use client'

import { useState, useEffect } from 'react'
import { resolveDisputeAction } from '@/app/actions/admin'
import { format } from 'date-fns'

export default function AdminDisputesPage() {
  const [loading, setLoading] = useState(true)
  const [disputes, setDisputes] = useState([])
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  useEffect(() => {
    loadDisputes()
  }, [])

  async function loadDisputes() {
    try {
      const response = await fetch('/api/admin/disputes')
      const data = await response.json()
      setDisputes(data.disputes || [])
    } catch (error) {
      console.error('Failed to load disputes', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve(disputeId: string, outcome: string) {
    if (!resolution.trim()) {
      alert('Please provide a resolution description')
      return
    }

    const amount = outcome === 'REFUND_RENTER' ? parseFloat(refundAmount || '0') : 0
    const fullResolution = `${outcome}: ${resolution}`

    const result = await resolveDisputeAction(disputeId, fullResolution, amount)
    if (result.success) {
      alert('Dispute resolved successfully')
      loadDisputes()
      setSelectedDispute(null)
      setResolution('')
      setRefundAmount('')
    } else {
      alert(result.error || 'Failed to resolve dispute')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Dispute Resolution</h1>

        {disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No active disputes</p>
          </div>
        ) : (
          <div className="space-y-6">
            {disputes.map((dispute: any) => (
              <div key={dispute.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {dispute.booking.listing.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Dispute #{dispute.id.slice(0, 8)} •{' '}
                      {format(new Date(dispute.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {dispute.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Filed by:</p>
                    <p className="font-medium">
                      {dispute.filedBy.name} {dispute.filedBy.name}
                    </p>
                    <p className="text-sm text-gray-600">{dispute.filedBy.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Booking Amount:</p>
                    <p className="font-semibold text-lg">
                      ${dispute.booking.totalAmount}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Reason:</p>
                  <p className="text-gray-900">{dispute.reason}</p>
                </div>

                {dispute.evidence && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Evidence:
                    </p>
                    <a
                      href={dispute.evidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm"
                    >
                      View Evidence →
                    </a>
                  </div>
                )}

                {selectedDispute?.id === dispute.id ? (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Details
                      </label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Describe how this dispute was resolved..."
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Refund Amount (if applicable)
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() =>
                          handleResolve(dispute.id, 'FAVOR_LENDER')
                        }
                        className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Favor Lender
                      </button>
                      <button
                        onClick={() =>
                          handleResolve(dispute.id, 'REFUND_RENTER')
                        }
                        className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                      >
                        Refund Renter
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDispute(null)
                          setResolution('')
                          setRefundAmount('')
                        }}
                        className="bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="w-full mt-4 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
