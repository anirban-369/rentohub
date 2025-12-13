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
  booking?: {
    id: string
    listing?: {
      title: string
    }
  }
}

export default function PartnerJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<DeliveryJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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

        const response = await fetch('/api/delivery-jobs', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setJobs(data.deliveryJobs || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [router])

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      PICKUP_STARTED: 'bg-purple-100 text-purple-800',
      PICKED_UP: 'bg-indigo-100 text-indigo-800',
      OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
      DELIVERED: 'bg-green-100 text-green-800',
      RETURN_STARTED: 'bg-orange-100 text-orange-800',
      RETURNED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerNavbar />
      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Delivery Jobs</h1>
          <p className="text-gray-600">View and manage all your delivery assignments</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All Jobs' : formatStatus(status)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-600">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Job #{job.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {formatStatus(job.status)}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">📍</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pickup</p>
                      <p className="text-sm text-gray-600">{job.pickupAddress || 'Address not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">📍</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Delivery</p>
                      <p className="text-sm text-gray-600">{job.deliveryAddress || 'Address not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <button
                    onClick={() => router.push(`/delivery-partner/jobs/${job.id}`)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    {job.status === 'ASSIGNED' ? 'Start Pickup' : 
                     job.status === 'PICKUP_STARTED' ? 'Continue Pickup' :
                     job.status === 'PICKED' ? 'Start Delivery' :
                     job.status === 'OUT_FOR_DELIVERY' ? 'Complete Delivery' :
                     'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
