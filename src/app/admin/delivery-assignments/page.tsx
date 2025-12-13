'use client'

import { useEffect, useState } from 'react'
import {
  getUnassignedDeliveriesAction,
  getDeliveryAgentsAction,
  assignDeliveryAgentAction,
  unassignDeliveryAgentAction,
} from '@/app/actions/delivery'
import Link from 'next/link'

export default function DeliveryAssignmentsPage() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<{ [key: string]: string }>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      console.log('📦 Loading delivery data...')
      const [delivRes, agentsRes] = await Promise.all([
        getUnassignedDeliveriesAction(),
        getDeliveryAgentsAction(),
      ])

      console.log('📦 Deliveries result:', delivRes)
      console.log('👨‍💼 Agents result:', agentsRes)

      if (delivRes.success) {
        setDeliveries(delivRes.deliveries || [])
      } else {
        setError(delivRes.error || 'Failed to load deliveries')
      }
      
      if (agentsRes.success) {
        setAgents(agentsRes.agents || [])
      } else {
        setError(agentsRes.error || 'Failed to load agents')
      }
    } catch (err: any) {
      console.error('❌ Load error:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(deliveryId: string) {
    const agentId = selectedAgent[deliveryId]
    if (!agentId) {
      setError('Please select an agent')
      return
    }

    setProcessingId(deliveryId)
    try {
      console.log('🔗 Assigning delivery', deliveryId, 'to agent', agentId)
      const result = await assignDeliveryAgentAction(deliveryId, agentId)
      
      console.log('Assignment result:', result)
      
      if (result.success) {
        setDeliveries(deliveries.filter((d) => d.id !== deliveryId))
        setSelectedAgent({ ...selectedAgent, [deliveryId]: '' })
      } else {
        setError(result.error || 'Failed to assign agent')
      }
    } catch (err: any) {
      console.error('❌ Assign error:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Assignments</h1>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">
            ← Back to Admin
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Unassigned Deliveries */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Unassigned Deliveries ({deliveries.length})
            </h2>

            {deliveries.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                All deliveries have been assigned!
              </div>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery: any) => (
                  <div key={delivery.id} className="bg-white rounded-lg shadow p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900">
                        {delivery.booking.listing.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {delivery.booking.listing.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Renter:</span>
                        <p className="font-medium">{delivery.booking.renter.name}</p>
                        {delivery.booking.renter.phone && (
                          <p className="text-gray-500">{delivery.booking.renter.phone}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Lender:</span>
                        <p className="font-medium">{delivery.booking.lender.name}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={selectedAgent[delivery.id] || ''}
                        onChange={(e) =>
                          setSelectedAgent({
                            ...selectedAgent,
                            [delivery.id]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select agent...</option>
                        {agents.map((agent: any) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent._count.deliveryJobs} jobs)
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(delivery.id)}
                        disabled={processingId === delivery.id || !selectedAgent[delivery.id]}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                      >
                        {processingId === delivery.id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Agents */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Agents ({agents.length})
            </h2>

            {agents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No agents available
              </div>
            ) : (
              <div className="space-y-3">
                {agents.map((agent: any) => (
                  <div key={agent.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex gap-3">
                      {agent.profileImage && (
                        <img
                          src={agent.profileImage}
                          alt={agent.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-600">{agent.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {agent._count.deliveryJobs} assigned
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
