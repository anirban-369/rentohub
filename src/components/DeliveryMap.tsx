'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import '@/styles/leaflet-override.css'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface DeliveryMapProps {
  pickupLat: number
  pickupLng: number
  deliveryLat: number
  deliveryLng: number
  currentLat?: number | null
  currentLng?: number | null
  showPickup?: boolean
  showDelivery?: boolean
  showCurrent?: boolean
  height?: string
}

export default function DeliveryMap({
  pickupLat,
  pickupLng,
  deliveryLat,
  deliveryLng,
  currentLat,
  currentLng,
  showPickup = true,
  showDelivery = true,
  showCurrent = true,
  height = '300px',
}: DeliveryMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Import Leaflet on client side only
    import('leaflet').then((leaflet) => {
      // Fix default icon issue
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setL(leaflet)
    })
  }, [])

  // Fetch actual route from OSRM (Open Source Routing Machine)
  useEffect(() => {
    if (!showCurrent || !currentLat || !currentLng) {
      setRoutePoints([])
      return
    }

    const fetchRoute = async () => {
      try {
        setLoading(true)
        const destLat = showDelivery ? deliveryLat : pickupLat
        const destLng = showDelivery ? deliveryLng : pickupLng

        console.log('Fetching route:', { currentLat, currentLng, destLat, destLng, showDelivery })

        // Use OSRM free public API for routing
        const url = `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destLng},${destLat}?geometries=geojson&overview=full`
        
        const response = await fetch(url)
        const data = await response.json()

        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          )
          console.log('Route fetched successfully:', { pointCount: coordinates.length })
          setRoutePoints(coordinates)
        } else {
          console.warn('No routes found in OSRM response')
        }
      } catch (error) {
        console.error('Failed to fetch route:', error)
        // Fallback to straight line if API fails
        const destLat = showDelivery ? deliveryLat : pickupLat
        const destLng = showDelivery ? deliveryLng : pickupLng
        setRoutePoints([[currentLat, currentLng], [destLat, destLng]])
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()
  }, [currentLat, currentLng, showDelivery, deliveryLat, deliveryLng, pickupLat, pickupLng, showCurrent])

  if (!isClient || !L) {
    return (
      <div 
        style={{ height }} 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  // Calculate center - prioritize current location when tracking is active
  let centerLat = pickupLat
  let centerLng = pickupLng
  
  if (showDelivery && !showPickup) {
    centerLat = deliveryLat
    centerLng = deliveryLng
  }
  
  if (currentLat && currentLng && showCurrent) {
    // Center between current location and destination
    const destLat = showDelivery ? deliveryLat : pickupLat
    const destLng = showDelivery ? deliveryLng : pickupLng
    centerLat = (currentLat + destLat) / 2
    centerLng = (currentLng + destLng) / 2
  }

  // Create custom icons
  const createIcon = (color: string, label: string) => {
    return L.divIcon({
      html: `<div style="
        background-color: ${color}; 
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        border: 3px solid white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 3px 6px rgba(0,0,0,0.3); 
        color: white; 
        font-weight: bold; 
        font-size: 16px;
      ">${label}</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
  }

  const pickupIcon = createIcon('#22c55e', '📍')
  const deliveryIcon = createIcon('#ef4444', '🏠')
  const currentIcon = createIcon('#3b82f6', '🚚')

  return (
    <div style={{ height, position: 'relative' }} className="rounded-lg overflow-hidden">
      <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}>
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-40 rounded-lg pointer-events-none">
            <div className="bg-white px-3 py-1 rounded text-sm text-gray-700">Loading route...</div>
          </div>
        )}
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          className="delivery-map-container"
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Actual route line from OSRM */}
        {routePoints.length > 1 && (
          <Polyline 
            positions={routePoints} 
            pathOptions={{ 
              color: '#3b82f6', 
              weight: 5, 
              opacity: 0.8,
            }} 
          />
        )}
        
        {showPickup && (
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>📍 Pickup Location</Popup>
          </Marker>
        )}
        
        {showDelivery && (
          <Marker position={[deliveryLat, deliveryLng]} icon={deliveryIcon}>
            <Popup>🏠 Delivery Location</Popup>
          </Marker>
        )}
        
        {showCurrent && currentLat && currentLng && (
          <Marker position={[currentLat, currentLng]} icon={currentIcon}>
            <Popup>🚚 Delivery Partner (You)</Popup>
          </Marker>
        )}
      </MapContainer>
      </div>
    </div>
  )
}
