'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PartnerNavbar from '@/components/PartnerNavbar'

interface Earnings {
  totalEarnings: number
  pendingEarnings: number
  completedJobs: number
  thisMonthEarnings: number
}

export default function PartnerEarningsPage() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<Earnings>({
    totalEarnings: 0,
    pendingEarnings: 0,
    completedJobs: 0,
    thisMonthEarnings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!sessionRes.ok) {
          router.push('/partner/login')
          return
        }

        const sessionData = await sessionRes.json()
        
        if (!sessionData.user || sessionData.user.role !== 'DELIVERY_AGENT') {
          router.push('/partner/login')
          return
        }

        // For now, use mock data - would be replaced with actual API
        // const response = await fetch('/api/partner/earnings', { credentials: 'include' })
        setEarnings({
          totalEarnings: 0,
          pendingEarnings: 0,
          completedJobs: 0,
          thisMonthEarnings: 0,
        })
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNavbar />
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Earnings</h1>
          <p className="text-gray-600">Track your delivery earnings and payouts</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading earnings...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">₹{earnings.totalEarnings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <span className="text-blue-600 text-xl">📅</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">₹{earnings.thisMonthEarnings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">₹{earnings.pendingEarnings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg mr-4">
                    <span className="text-purple-600 text-xl">✅</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Completed Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{earnings.completedJobs}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings History */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Earnings History</h2>
              </div>
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-gray-600">No earnings history yet</p>
                <p className="text-sm text-gray-500 mt-2">Complete deliveries to start earning</p>
              </div>
            </div>

            {/* Payout Info */}
            <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow p-6 text-white">
              <h3 className="text-xl font-bold mb-2">💳 Payout Information</h3>
              <p className="text-orange-100">
                Earnings are paid out weekly to your registered bank account. 
                Make sure your bank details are up to date in your profile.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
