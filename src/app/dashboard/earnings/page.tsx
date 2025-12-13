'use client'

import { useEffect, useState } from 'react'
import { getEarningsAction, getMonthlyEarningsChartAction } from '@/app/actions/earnings'
import Link from 'next/link'

export default function EarningsDashboardPage() {
  const [earnings, setEarnings] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [earningsRes, chartRes] = await Promise.all([
          getEarningsAction(),
          getMonthlyEarningsChartAction(),
        ])

        if (earningsRes.success) {
          setEarnings(earningsRes.data)
        }
        if (chartRes.success) {
          setChartData(chartRes.data)
        }
      } catch (err) {
        setError('Failed to load earnings data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading earnings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        {earnings && (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm font-medium">Total Earnings</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ${earnings.totalEarnings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-2">All time</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm font-medium">Last 30 Days</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  ${earnings.earnings30Days.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-2">Past month</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm font-medium">Pending Earnings</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">
                  ${earnings.pendingEarnings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-2">Under review</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-500 text-sm font-medium">Total Rentals</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {earnings.totalTransactions}
                </div>
                <div className="text-xs text-gray-400 mt-2">Completed & disputed</div>
              </div>
            </div>

            {/* Chart */}
            {chartData && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
                <div className="flex items-end gap-2 h-48">
                  {chartData.map((data: any, idx: number) => {
                    const maxEarnings = Math.max(...chartData.map((d: any) => d.earnings))
                    const percentage = maxEarnings > 0 ? (data.earnings / maxEarnings) * 100 : 0
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${percentage}%`, minHeight: '20px' }}
                        />
                        <div className="text-xs text-gray-600 mt-2 text-center truncate">
                          {data.month}
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          ${data.earnings.toFixed(0)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              </div>

              {earnings.transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Renter
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Rent Amount
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Platform Fee
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Your Earnings
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.transactions.map((txn: any) => (
                        <tr key={txn.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {txn.renterName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {txn.listingTitle}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            ${txn.rentAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            -${txn.platformFee.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">
                            ${txn.earnings.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                txn.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {txn.completedAt
                              ? new Date(txn.completedAt).toLocaleDateString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
