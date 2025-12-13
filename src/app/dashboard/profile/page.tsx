'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ImageCropper from '@/components/ImageCropper'

interface UserProfile {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  profileImage: string | null
  isEmailVerified: boolean
  createdAt: string
  deliveryAddress?: string | null
  deliveryCity?: string | null
  deliveryState?: string | null
  deliveryZipCode?: string | null
  deliveryLatitude?: number | null
  deliveryLongitude?: number | null
  refundUpiId?: string | null
  refundBankAccount?: string | null
  earningsUpiId?: string | null
  earningsBankAccount?: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showImageCropper, setShowImageCropper] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZipCode: '',
    paymentUpiId: '',
    paymentBankAccountHolder: '',
    paymentAccountNumber: '',
    paymentIfscCode: '',
    paymentBankName: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/user/profile')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch profile')
      }
      const data = await res.json()
      setProfile(data.user)
      
      // Use refund account as unified payment account (fallback to earnings if not set)
      const unifiedAccount = data.user.refundBankAccount ? JSON.parse(data.user.refundBankAccount) : 
                            (data.user.earningsBankAccount ? JSON.parse(data.user.earningsBankAccount) : {})
      
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || '',
        deliveryAddress: data.user.deliveryAddress || '',
        deliveryCity: data.user.deliveryCity || '',
        deliveryState: data.user.deliveryState || '',
        deliveryZipCode: data.user.deliveryZipCode || '',
        paymentUpiId: data.user.refundUpiId || data.user.earningsUpiId || '',
        paymentBankAccountHolder: unifiedAccount.account_holder || '',
        paymentAccountNumber: unifiedAccount.account_number || '',
        paymentIfscCode: unifiedAccount.ifsc_code || '',
        paymentBankName: unifiedAccount.bank_name || '',
      })
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Prepare unified payment account data (used for both refunds and earnings)
      const paymentBankAccount = formData.paymentAccountNumber ? {
        account_holder: formData.paymentBankAccountHolder,
        account_number: formData.paymentAccountNumber,
        ifsc_code: formData.paymentIfscCode,
        bank_name: formData.paymentBankName,
      } : null

      const submitData = {
        name: formData.name,
        phone: formData.phone,
        deliveryAddress: formData.deliveryAddress,
        deliveryCity: formData.deliveryCity,
        deliveryState: formData.deliveryState,
        deliveryZipCode: formData.deliveryZipCode,
        // Store in both fields for backward compatibility
        refundUpiId: formData.paymentUpiId,
        refundBankAccount: paymentBankAccount ? JSON.stringify(paymentBankAccount) : null,
        earningsUpiId: formData.paymentUpiId,
        earningsBankAccount: paymentBankAccount ? JSON.stringify(paymentBankAccount) : null,
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await res.json()
      setProfile(data.user)
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    // Open the cropper modal instead of directly uploading
    setShowImageCropper(true)
  }

  async function handleCroppedImage(croppedBlob: Blob) {
    setSaving(true)
    setError('')
    setShowImageCropper(false)

    try {
      // Create a File from the Blob
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' })
      
      // Upload image
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const { url } = await uploadRes.json()

      // Update profile with new image URL
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: url }),
      })

      if (!res.ok) {
        throw new Error('Failed to update profile image')
      }

      const data = await res.json()
      setProfile(data.user)
      setSuccess('Profile image updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Profile</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Profile Header with Gradient */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-24 relative"></div>
              
              {/* Profile Image */}
              <div className="relative px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg mx-auto">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-3xl font-bold">
                        {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  
                  {/* Edit Image Button */}
                  <button
                    onClick={() => setShowImageCropper(true)}
                    disabled={saving}
                    className="absolute bottom-0 right-1/2 translate-x-8 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                    title="Change profile picture"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                
                {/* Name and Role */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
                  <p className="text-gray-500 text-sm">{profile?.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {profile?.role === 'USER' ? '🏠 Renter/Lender' : profile?.role}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-around text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {profile?.isEmailVerified ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-gray-500">Email Verified</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(profile?.createdAt || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">Member Since</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/dashboard" className="flex items-center gap-3 text-gray-600 hover:text-primary-600 py-2 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link href="/dashboard/kyc" className="flex items-center gap-3 text-gray-600 hover:text-primary-600 py-2 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  KYC Verification
                </Link>
                <Link href="/listings/create" className="flex items-center gap-3 text-gray-600 hover:text-primary-600 py-2 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Listing
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500">Update your profile details</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter your full name"
                      required
                      minLength={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Delivery Address Section */}
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Delivery Address</h4>
                    <p className="text-sm text-gray-500 mb-4">This address will be used when you rent items</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        placeholder="Enter your street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={formData.deliveryCity}
                          onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                          placeholder="Enter your city"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={formData.deliveryState}
                          onChange={(e) => setFormData({ ...formData, deliveryState: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                          placeholder="Enter your state"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={formData.deliveryZipCode}
                        onChange={(e) => setFormData({ ...formData, deliveryZipCode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        placeholder="Enter your ZIP code"
                      />
                    </div>
                  </div>

                  {/* Unified Payment Account Section */}
                  <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                    <h4 className="text-lg font-semibold text-primary-900 mb-2">💳 Payment Account</h4>
                    <p className="text-sm text-primary-700 mb-4">Add your UPI ID or bank account to receive refunds and rental earnings. This same account will be used for all payments.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID (Optional)</label>
                        <input
                          type="text"
                          value={formData.paymentUpiId}
                          onChange={(e) => setFormData({ ...formData, paymentUpiId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                          placeholder="e.g., yourname@upi"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                        <input
                          type="text"
                          value={formData.paymentBankAccountHolder}
                          onChange={(e) => setFormData({ ...formData, paymentBankAccountHolder: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                          placeholder="Your name"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                          <input
                            type="text"
                            value={formData.paymentAccountNumber}
                            onChange={(e) => setFormData({ ...formData, paymentAccountNumber: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            placeholder="Your account number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                          <input
                            type="text"
                            value={formData.paymentIfscCode}
                            onChange={(e) => setFormData({ ...formData, paymentIfscCode: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            placeholder="e.g., SBIN0001234"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={formData.paymentBankName}
                          onChange={(e) => setFormData({ ...formData, paymentBankName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                          placeholder="e.g., State Bank of India"
                        />
                      </div>

                      <div className="bg-primary-100 rounded-lg p-3 mt-4 text-sm text-primary-900">
                        <strong>ℹ️ Note:</strong> This account will receive both early return refunds and rental earnings from your listings.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        // Use refund account as unified payment account (fallback to earnings if not set)
                        const unifiedAccount = profile?.refundBankAccount ? JSON.parse(profile.refundBankAccount) : 
                                            (profile?.earningsBankAccount ? JSON.parse(profile.earningsBankAccount) : {})
                        setFormData({
                          name: profile?.name || '',
                          phone: profile?.phone || '',
                          deliveryAddress: profile?.deliveryAddress || '',
                          deliveryCity: profile?.deliveryCity || '',
                          deliveryState: profile?.deliveryState || '',
                          deliveryZipCode: profile?.deliveryZipCode || '',
                          paymentUpiId: profile?.refundUpiId || profile?.earningsUpiId || '',
                          paymentBankAccountHolder: unifiedAccount.account_holder || '',
                          paymentAccountNumber: unifiedAccount.account_number || '',
                          paymentIfscCode: unifiedAccount.ifsc_code || '',
                          paymentBankName: unifiedAccount.bank_name || '',
                        })
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center py-4 border-b border-gray-100">
                    <div className="w-32 text-sm text-gray-500">Full Name</div>
                    <div className="flex-1 text-gray-900 font-medium">{profile?.name}</div>
                  </div>
                  <div className="flex items-center py-4 border-b border-gray-100">
                    <div className="w-32 text-sm text-gray-500">Email</div>
                    <div className="flex-1 text-gray-900 font-medium flex items-center gap-2">
                      {profile?.email}
                      {profile?.isEmailVerified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center py-4 border-b border-gray-100">
                    <div className="w-32 text-sm text-gray-500">Phone</div>
                    <div className="flex-1 text-gray-900 font-medium">
                      {profile?.phone || <span className="text-gray-400">Not provided</span>}
                    </div>
                  </div>
                  <div className="flex items-center py-4 border-b border-gray-100">
                    <div className="w-32 text-sm text-gray-500">Role</div>
                    <div className="flex-1 text-gray-900 font-medium">
                      {profile?.role === 'USER' ? 'Renter/Lender' : profile?.role}
                    </div>
                  </div>
                  <div className="flex items-center py-4">
                    <div className="w-32 text-sm text-gray-500">Joined</div>
                    <div className="flex-1 text-gray-900 font-medium">
                      {new Date(profile?.createdAt || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Delivery Address Section */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Delivery Address</h4>
                      {profile?.deliveryAddress ? (
                        <div className="space-y-2">
                          <div className="flex items-center py-2">
                            <div className="w-32 text-sm text-gray-500">Address</div>
                            <div className="flex-1 text-gray-900 font-medium">{profile.deliveryAddress}</div>
                          </div>
                          <div className="flex items-center py-2">
                            <div className="w-32 text-sm text-gray-500">City</div>
                            <div className="flex-1 text-gray-900 font-medium">{profile.deliveryCity || '-'}</div>
                          </div>
                          <div className="flex items-center py-2">
                            <div className="w-32 text-sm text-gray-500">State</div>
                            <div className="flex-1 text-gray-900 font-medium">{profile.deliveryState || '-'}</div>
                          </div>
                          <div className="flex items-center py-2">
                            <div className="w-32 text-sm text-gray-500">ZIP Code</div>
                            <div className="flex-1 text-gray-900 font-medium">{profile.deliveryZipCode || '-'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          No delivery address set. Add one to ensure items are delivered to the correct location.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Account Display Section */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">💳 Payment Account</h4>
                      <p className="text-sm text-gray-600 mb-3">This account receives refunds and rental earnings</p>
                      {profile?.refundUpiId || profile?.refundBankAccount || profile?.earningsUpiId || profile?.earningsBankAccount ? (
                        <div className="space-y-2 bg-primary-50 rounded-lg p-4 border border-primary-200">
                          {(profile?.refundUpiId || profile?.earningsUpiId) && (
                            <div className="flex items-center py-2">
                              <div className="w-32 text-sm text-gray-500">UPI ID</div>
                              <div className="flex-1 text-gray-900 font-medium">{profile.refundUpiId || profile.earningsUpiId}</div>
                            </div>
                          )}
                          {(() => {
                            const bankData = profile?.refundBankAccount ? JSON.parse(profile.refundBankAccount) : 
                                            (profile?.earningsBankAccount ? JSON.parse(profile.earningsBankAccount) : null)
                            if (!bankData) return null
                            return (
                              <>
                                {bankData.account_holder && (
                                  <div className="flex items-center py-2">
                                    <div className="w-32 text-sm text-gray-500">Account Holder</div>
                                    <div className="flex-1 text-gray-900 font-medium">{bankData.account_holder}</div>
                                  </div>
                                )}
                                {bankData.account_number && (
                                  <div className="flex items-center py-2">
                                    <div className="w-32 text-sm text-gray-500">Account Number</div>
                                    <div className="flex-1 text-gray-900 font-medium">****{bankData.account_number.slice(-4)}</div>
                                  </div>
                                )}
                                {bankData.ifsc_code && (
                                  <div className="flex items-center py-2">
                                    <div className="w-32 text-sm text-gray-500">IFSC Code</div>
                                    <div className="flex-1 text-gray-900 font-medium">{bankData.ifsc_code}</div>
                                  </div>
                                )}
                                {bankData.bank_name && (
                                  <div className="flex items-center py-2">
                                    <div className="w-32 text-sm text-gray-500">Bank</div>
                                    <div className="flex-1 text-gray-900 font-medium">{bankData.bank_name}</div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm bg-primary-50 rounded-lg p-4 border border-primary-200">
                          No payment account set. Add one to receive refunds and rental earnings.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
              <p className="text-sm text-gray-500 mb-6">Manage your account security settings</p>
              
              <div className="space-y-4">
                <Link 
                  href="/dashboard/change-password"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Change Password</div>
                      <div className="text-sm text-gray-500">Update your password regularly</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showImageCropper && (
        <ImageCropper
          onCropComplete={handleCroppedImage}
          onCancel={() => setShowImageCropper(false)}
          aspectRatio={1}
        />
      )}
    </div>
  )
}
