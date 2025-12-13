'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void
  initialLocation?: { lat: number; lng: number }
}

const DEFAULT_LOCATION = { lat: 26.8506, lng: 75.8027 } // Jagatpura, Jaipur, Rajasthan, India

// Fix for default marker icon in production
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationMarker({
  position,
  onPositionChange,
}: {
  position: [number, number]
  onPositionChange: (lat: number, lng: number) => void
}) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng)
    },
  })

  // Pan to new position when it changes
  useEffect(() => {
    map.flyTo(position, 15, { duration: 1.5 })
  }, [map, position])

  return <Marker position={position} />
}

export default function MapPicker({
  onLocationSelect,
  initialLocation = DEFAULT_LOCATION,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    initialLocation.lat,
    initialLocation.lng,
  ])
  const [address, setAddress] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.search-container')) {
        setShowResults(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    setPosition([initialLocation.lat, initialLocation.lng])
  }, [initialLocation])

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en,hi',
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.display_name) {
          setAddress(data.display_name)
          return data.display_name
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
    setAddress('')
    return undefined
  }, [])

  const handlePositionChange = useCallback(
    async (lat: number, lng: number) => {
      setPosition([lat, lng])
      const addr = await reverseGeocode(lat, lng)
      onLocationSelect({ lat, lng, address: addr })
    },
    [onLocationSelect, reverseGeocode]
  )

  useEffect(() => {
    reverseGeocode(initialLocation.lat, initialLocation.lng)
  }, [initialLocation.lat, initialLocation.lng, reverseGeocode])

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=10&addressdetails=1&countrycodes=in`
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en,hi',
          'User-Agent': 'RentoHub/1.0'
        },
      })
      
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setShowResults(true)
    } finally {
      setSearching(false)
    }
  }, [])

  // Auto-search as user types (with debounce)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const debounceTimer = setTimeout(() => {
      searchLocation(searchQuery)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchLocation])

  const handleResultSelect = useCallback(
    async (result: any) => {
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      await handlePositionChange(lat, lng)
      setShowResults(false)
      setSearchQuery('')
    },
    [handlePositionChange]
  )

  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setDetectingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await handlePositionChange(latitude, longitude)
        setDetectingLocation(false)
      },
      (error) => {
        let errorMessage = 'Unable to detect location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your device settings:\n\niOS: Settings → Safari/Chrome → Location → Allow\n\nAndroid: Settings → Apps → Chrome → Permissions → Location → Allow'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        setLocationError(errorMessage)
        setDetectingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [handlePositionChange])

  if (!isClient) {
    return (
      <div className="h-96 rounded-lg border flex items-center justify-center bg-gray-50">
        Loading map…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Select Location</p>
          <button
            type="button"
            onClick={detectCurrentLocation}
            disabled={detectingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {detectingLocation ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Detecting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              Detect My Location
            </>
          )}
        </button>
        </div>

        {/* Search Box */}
        <div className="relative search-container">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (searchQuery.trim() && !searching) {
                    searchLocation(searchQuery)
                  }
                }
              }}
              placeholder="Type to search locations in India (e.g., SKIT College Jaipur, Mumbai)"
              className="w-full px-4 py-2 pl-10 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white text-gray-900"
            />
            {searching ? (
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (searchQuery.trim() && !searching) {
                  searchLocation(searchQuery)
                }
              }}
              disabled={searching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-gray-400 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleResultSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition"
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.display_name}</p>
                      {result.address && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.type || 'Location'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
              ) : (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  No locations found. Try a different search term.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {locationError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold mb-1">Location Access Required</p>
              <p className="text-sm whitespace-pre-line">{locationError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      {address && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Selected Location:</p>
          <p className="font-medium">{address}</p>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Search for a location, click "Detect My Location", or click directly on the map to pin your listing location
        </span>
      </div>
    </div>
  )
}
