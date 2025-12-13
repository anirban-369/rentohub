import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getAdminAnalyticsAction } from '@/app/actions/admin'
import Link from 'next/link'

export default async function AdminDashboard() {
  await requireAdmin()

  const result = await getAdminAnalyticsAction()
  if (!result.success) redirect('/dashboard')

  const analytics = result.analytics

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-primary-600">
              {analytics.totalUsers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Listings</p>
            <p className="text-3xl font-bold text-primary-600">
              {analytics.totalListings}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-primary-600">
              {analytics.totalBookings}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Active Bookings</p>
            <p className="text-3xl font-bold text-primary-600">
              {analytics.activeBookings}
            </p>
          </div>
        </div>

        {/* Pending Items */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pending KYC</h2>
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                {analytics.pendingKYCs}
              </span>
            </div>
            <Link
              href="/admin/kyc"
              className="block text-center py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              Review KYC Submissions
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Disputes</h2>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {analytics.openDisputes}
              </span>
            </div>
            <Link
              href="/admin/disputes"
              className="block text-center py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              Review Disputes
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="p-4 border rounded-lg hover:border-primary-600 hover:bg-primary-50 transition"
            >
              <h3 className="font-semibold mb-1">Manage Users</h3>
              <p className="text-sm text-gray-600">
                View and manage all registered users
              </p>
            </Link>
            <Link
              href="/admin/listings"
              className="p-4 border rounded-lg hover:border-primary-600 hover:bg-primary-50 transition"
            >
              <h3 className="font-semibold mb-1">Manage Listings</h3>
              <p className="text-sm text-gray-600">Review and moderate listings</p>
            </Link>
            <Link
              href="/admin/bookings"
              className="p-4 border rounded-lg hover:border-primary-600 hover:bg-primary-50 transition"
            >
              <h3 className="font-semibold mb-1">View Bookings</h3>
              <p className="text-sm text-gray-600">Monitor all booking activity</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
