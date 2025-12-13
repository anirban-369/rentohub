'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PartnerNavbar from '@/components/PartnerNavbar'

interface DeliveryJob {
  id: string
  bookingId: string
  status: string
  pickupAddress: string
  deliveryAddress: string
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function DeliveryPartnerPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<DeliveryJob[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // First check if user is authenticated and is a delivery agent
        const sessionRes = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!sessionRes.ok) {
          router.push('/partner/login')
          return
        }

        const sessionData = await sessionRes.json()
        
        if (!sessionData.user || sessionData.user.role !== 'DELIVERY_AGENT') {
          // Not a delivery agent, redirect to partner login
          router.push('/partner/login')
          return
        }

        setUser(sessionData.user)

        // Fetch delivery jobs
        const response = await fetch('/api/delivery-jobs', {
          credentials: 'include',
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/partner/login')
            return
          }
          throw new Error('Failed to fetch delivery jobs')
        }

        const data = await response.json()
        setJobs(data.deliveryJobs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [router])

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNavbar />
      <main className="max-w-6xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Partner Dashboard</h1>
              <p className="text-gray-600">Manage your delivery jobs and track assignments</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <span className="text-blue-600 text-xl">🚚</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                    <span className="text-yellow-600 text-xl">⏱️</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {jobs.filter((j) => j.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <span className="text-blue-600 text-xl">📍</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {jobs.filter((j) => j.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {jobs.filter((j) => j.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Delivery Jobs</h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">Loading jobs...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No delivery jobs available at the moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Job ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Pickup Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Delivery Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {job.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{job.pickupAddress}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{job.deliveryAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {job.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => router.push(`/delivery-partner/jobs/${job.id}`)}
                              className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition text-xs"
                            >
                              {job.status === 'ASSIGNED' ? 'Start Pickup' : 
                               job.status === 'PICKUP_STARTED' ? 'Continue' :
                               job.status === 'PICKED' ? 'Start Delivery' :
                               job.status === 'OUT_FOR_DELIVERY' ? 'Complete' :
                               'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      )
    }
