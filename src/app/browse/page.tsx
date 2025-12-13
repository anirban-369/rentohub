'use client'

import { useState, useEffect } from 'react'
import ListingCard from '@/components/ListingCard'
import Navbar from '@/components/Navbar'
import { searchListingsAction } from '@/app/actions/listings'

const CATEGORIES = [
  'Electronics',
  'Tools',
  'Furniture',
  'Appliances',
  'Cycles',
  'Books',
  'Cameras',
  'Instruments',
]

export default function BrowsePage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    city: '',
    minPrice: '',
    maxPrice: '',
  })

  useEffect(() => {
    loadListings()
  }, [])

  async function loadListings() {
    setLoading(true)
    const result = await searchListingsAction({
      query: filters.query || undefined,
      category: filters.category || undefined,
      city: filters.city || undefined,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    })

    if (result.success && result.listings) {
      setListings(result.listings)
    }
    setLoading(false)
  }

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadListings()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Browse Listings
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />

              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />

              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              {listings.length} {listings.length === 1 ? 'result' : 'results'}{' '}
              found
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {listings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No listings found. Try adjusting your filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
