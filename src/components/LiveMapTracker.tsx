"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LiveMapTrackerProps {
  deliveryJobId: string
  pickupLocation: { lat: number; lng: number }
  dropoffLocation: { lat: number; lng: number }
}

// Fix for default marker icon in production
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom icons
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 14px;">${label}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const pickupIcon = createCustomIcon('#2563eb', 'P')
const dropoffIcon = createCustomIcon('#16a34a', 'D')
const agentIcon = createCustomIcon('#4f46e5', '●')

function FitBounds({
  pickup,
  dropoff,
  agent,
}: {
  pickup: [number, number]
  dropoff: [number, number]
  agent: [number, number] | null
}) {
  const map = useMap()
  const prevBounds = useRef<string>('')

  useEffect(() => {
    const bounds = L.latLngBounds([pickup, dropoff])
    if (agent) bounds.extend(agent)

    const boundsKey = bounds.toBBoxString()
    if (boundsKey !== prevBounds.current) {
      map.fitBounds(bounds, { padding: [50, 50] })
      prevBounds.current = boundsKey
    }
  }, [agent, dropoff, map, pickup])

  return null
}

export default function LiveMapTracker({
  deliveryJobId,
  pickupLocation,
  dropoffLocation,
}: LiveMapTrackerProps) {
  const [agentLocation, setAgentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState('EN_ROUTE_TO_PICKUP')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/delivery/${deliveryJobId}/location`)
        const data = await response.json()
        if (data.location) {
          setAgentLocation(data.location)
          setStatus(data.status)
        }
      } catch (error) {
        console.error('Failed to fetch agent location', error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [deliveryJobId])

  const routePath = useMemo<[number, number][]>(() => {
    if (!agentLocation) return []
    const destination =
      status === 'EN_ROUTE_TO_PICKUP' ? pickupLocation : dropoffLocation
    return [
      [agentLocation.lat, agentLocation.lng],
      [destination.lat, destination.lng],
    ]
  }, [agentLocation, dropoffLocation, pickupLocation, status])

  const mapCenter = useMemo<[number, number]>(() => {
    if (agentLocation) return [agentLocation.lat, agentLocation.lng]
    return [
      (pickupLocation.lat + dropoffLocation.lat) / 2,
      (pickupLocation.lng + dropoffLocation.lng) / 2,
    ]
  }, [agentLocation, dropoffLocation, pickupLocation])

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="h-96 rounded-lg border flex items-center justify-center bg-gray-50">
          Loading map…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={[pickupLocation.lat, pickupLocation.lng]}
            icon={pickupIcon}
          />

          <Marker
            position={[dropoffLocation.lat, dropoffLocation.lng]}
            icon={dropoffIcon}
          />

          {agentLocation && (
            <Marker
              position={[agentLocation.lat, agentLocation.lng]}
              icon={agentIcon}
            />
          )}

          {routePath.length > 0 && (
            <Polyline positions={routePath} color="#6366f1" weight={4} opacity={0.9} />
          )}

          <FitBounds
            pickup={[pickupLocation.lat, pickupLocation.lng]}
            dropoff={[dropoffLocation.lat, dropoffLocation.lng]}
            agent={agentLocation ? [agentLocation.lat, agentLocation.lng] : null}
          />
        </MapContainer>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Delivery Status</p>
            <p className="font-semibold text-lg">
              {status.replace(/_/g, ' ')}
            </p>
          </div>
          {agentLocation && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Agent Location</p>
              <p className="text-xs font-mono">
                {agentLocation.lat.toFixed(4)}, {agentLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Delivery Timeline</h3>
        <div className="space-y-3">
          {[
            { key: 'ASSIGNED', label: 'Agent Assigned' },
            { key: 'EN_ROUTE_TO_PICKUP', label: 'En Route to Pickup' },
            { key: 'PICKED_UP', label: 'Item Picked Up' },
            { key: 'EN_ROUTE_TO_DROPOFF', label: 'En Route to Delivery' },
            { key: 'DELIVERED', label: 'Delivered' },
          ].map((step) => {
            const isComplete = ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'DELIVERED'].indexOf(status) >= 
                               ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'DELIVERED'].indexOf(step.key)
            const isCurrent = status === step.key

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete
                      ? 'bg-green-600 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isComplete ? '✓' : step.key[0]}
                </div>
                <span className={isCurrent ? 'font-semibold' : ''}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
