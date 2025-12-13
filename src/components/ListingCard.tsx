'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getProxyImageUrl } from '@/lib/image-utils'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    pricePerDay: number
    images: string[]
    category: string
    city: string
    userId: string
    user: {
      name: string
    }
  }
}

export default function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = getProxyImageUrl(listing.images[0])

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      <Link href={`/listings/${listing.id}`}>
        <div className="cursor-pointer">
          <div className="relative h-48 bg-gray-200">
            {listing.images[0] ? (
              <img
                src={imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-medium">
              {listing.category}
            </div>
          </div>
          <div className="p-4 pb-2">
            <h3 className="font-semibold text-lg mb-1 truncate">
              {listing.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{listing.city}</p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4 flex justify-between items-center">
        <span className="text-primary-600 font-bold">
          {formatCurrency(listing.pricePerDay)}/day
        </span>
        <span className="text-xs text-gray-600 font-medium">
          {listing.user.name}
        </span>
      </div>
    </div>
  )
}
