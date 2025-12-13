'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/ImageUploader'
import { submitKYCAction, getMyKYCAction } from '@/app/actions/kyc'

export default function KYCPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [kycData, setKycData] = useState<any>(null)

  const [formData, setFormData] = useState({
    idProof: [] as string[],
    addressProof: [] as string[],
  })

  useEffect(() => {
    loadKYC()
  }, [])

  async function loadKYC() {
    const result = await getMyKYCAction()
    if (result.success && result.kyc) {
      setKycData(result.kyc)
      if (result.kyc.status === 'APPROVED') {
        // Already approved, show status only
      } else if (result.kyc.status === 'REJECTED') {
        // Allow resubmission
        setFormData({
          idProof: [],
          addressProof: [],
        })
      } else {
        // Pending
        setFormData({
          idProof: result.kyc.idProofUrl ? [result.kyc.idProofUrl] : [],
          addressProof: result.kyc.addressProofUrl ? [result.kyc.addressProofUrl] : [],
        })
      }
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (formData.idProof.length === 0 || formData.addressProof.length === 0) {
        throw new Error('Please upload both ID and address proof')
      }

      const result = await submitKYCAction({
        idProofUrl: formData.idProof[0],
        addressProofUrl: formData.addressProof[0],
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      router.push('/dashboard?kyc=submitted')
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (kycData?.status === 'APPROVED') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                KYC Verified ✓
              </h2>
              <p className="text-gray-600 mb-6">
                Your identity has been verified. You can now create listings.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">KYC Verification</h1>
          <p className="text-gray-600 mb-6">
            Complete your identity verification to start listing items for rent.
          </p>

          {kycData?.status === 'PENDING' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                ⏳ Your KYC is under review. This usually takes 1-2 business days.
              </p>
            </div>
          )}

          {kycData?.status === 'REJECTED' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium mb-1">
                ❌ Your KYC was rejected
              </p>
              {kycData.rejectionReason && (
                <p className="text-sm text-red-600">
                  Reason: {kycData.rejectionReason}
                </p>
              )}
              <p className="text-sm text-red-600 mt-2">
                Please upload clear documents and resubmit.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Proof * (Driver's License, Passport, or National ID)
              </label>
              <ImageUploader
                onUpload={(urls) => setFormData({ ...formData, idProof: urls })}
                maxFiles={1}
                existingImages={formData.idProof}
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload a clear photo of your government-issued ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Proof * (Utility Bill, Bank Statement, or Lease)
              </label>
              <ImageUploader
                onUpload={(urls) => setFormData({ ...formData, addressProof: urls })}
                maxFiles={1}
                existingImages={formData.addressProof}
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload a document showing your current address (dated within 3 months)
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Important Notes:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Documents must be clear and readable</li>
                <li>Personal information must be visible</li>
                <li>Documents must be valid and not expired</li>
                <li>Your information will be kept secure and confidential</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                formData.idProof.length === 0 ||
                formData.addressProof.length === 0 ||
                kycData?.status === 'PENDING'
              }
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {submitting
                ? 'Submitting...'
                : kycData?.status === 'PENDING'
                ? 'KYC Under Review'
                : kycData?.status === 'REJECTED'
                ? 'Resubmit for Verification'
                : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
