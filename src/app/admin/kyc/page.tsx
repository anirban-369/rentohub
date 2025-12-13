'use client'

import { useState, useEffect } from 'react'
import { approveKYCAction, rejectKYCAction } from '@/app/actions/admin'

export default function AdminKYCPage() {
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [selectedKYC, setSelectedKYC] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    try {
      const response = await fetch('/api/admin/kyc')
      const data = await response.json()
      console.log('KYC Submissions:', data.submissions)
      if (data.submissions && data.submissions.length > 0) {
        console.log('First submission:', data.submissions[0])
      }
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Failed to load KYC submissions', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(kycId: string) {
    if (!confirm('Approve this KYC submission?')) return

    const result = await approveKYCAction(kycId)
    if (result.success) {
      alert('KYC approved successfully')
      loadSubmissions()
      setSelectedKYC(null)
    } else {
      alert(result.error || 'Failed to approve KYC')
    }
  }

  async function handleReject(kycId: string) {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    const result = await rejectKYCAction(kycId, rejectionReason)
    if (result.success) {
      alert('KYC rejected')
      loadSubmissions()
      setSelectedKYC(null)
      setRejectionReason('')
    } else {
      alert(result.error || 'Failed to reject KYC')
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
    <>
      {/* Full Screen Image Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-6xl max-h-screen">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕ Close
            </button>
            <img
              src={viewingImage}
              alt="Document"
              className="max-w-full max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">KYC Review</h1>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No pending KYC submissions</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {submissions.map((kyc: any) => (
              <div key={kyc.id} className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">
                    {kyc.user.name} {kyc.user.name}
                  </h3>
                  <p className="text-sm text-gray-600">{kyc.user.email}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      ID Proof
                    </p>
                    {kyc.idProofUrl ? (
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(kyc.idProofUrl)}`}
                        alt="ID Proof"
                        className="w-full h-64 object-contain border rounded-lg cursor-zoom-in hover:opacity-90 transition bg-gray-50"
                        onClick={() => setViewingImage(`/api/proxy-image?url=${encodeURIComponent(kyc.idProofUrl)}`)}
                        onError={(e) => {
                          console.error('Failed to load ID proof:', kyc.idProofUrl)
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Failed%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 border rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
                        No ID Proof Uploaded
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Address Proof
                    </p>
                    {kyc.addressProofUrl ? (
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(kyc.addressProofUrl)}`}
                        alt="Address Proof"
                        className="w-full h-64 object-contain border rounded-lg cursor-zoom-in hover:opacity-90 transition bg-gray-50"
                        onClick={() => setViewingImage(`/api/proxy-image?url=${encodeURIComponent(kyc.addressProofUrl)}`)}
                        onError={(e) => {
                          console.error('Failed to load address proof:', kyc.addressProofUrl)
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage Failed%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 border rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
                        No Address Proof Uploaded
                      </div>
                    )}
                  </div>
                </div>

                {selectedKYC?.id === kyc.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason..."
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(kyc.id)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setSelectedKYC(null)
                          setRejectionReason('')
                        }}
                        className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(kyc.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedKYC(kyc)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  )
}
