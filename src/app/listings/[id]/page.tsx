import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getListingByIdAction } from '@/app/actions/listings'
import { getUserReviewsAction } from '@/app/actions/reviews'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BookingWizard from '@/components/BookingWizard'
import ReviewCard from '@/components/ReviewCard'
import ImageGallery from '@/components/ImageGallery'
import Navbar from '@/components/Navbar'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default async function ListingPage({ params }: { params: { id: string } }) {
  const result = await getListingByIdAction(params.id)
  
  if (!result.success || !result.listing) {
    notFound()
  }

  const listing = result.listing
  const user = await getCurrentUser()

  // Get user's delivery address if logged in
  let userDeliveryAddress = null
  if (user) {
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        deliveryAddress: true,
        deliveryCity: true,
        deliveryState: true,
        deliveryZipCode: true,
        deliveryLatitude: true,
        deliveryLongitude: true,
      },
    })
    userDeliveryAddress = userData
  }

  // Get lender reviews
  const reviewsResult = await getUserReviewsAction(listing.userId)
  const reviews = reviewsResult.success ? reviewsResult.reviews : []

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={listing.images} title={listing.title} />

            {/* Listing Details */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-2">
                      {listing.category}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                    <p className="text-gray-600 mt-1">{listing.city}, {listing.state}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-600">
                      ₹{listing.pricePerDay}
                      <span className="text-lg text-gray-500">/day</span>
                    </p>
                  </div>
                </div>

                {listing.deposit > 0 && (
                  <p className="text-sm text-gray-600">
                    Security deposit: ₹{listing.deposit}
                  </p>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.condition && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">Condition</h2>
                  <p className="text-gray-700">{listing.condition}</p>
                </div>
              )}
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-primary-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-lg font-medium text-gray-900">{listing.city}, {listing.state}</p>
                  <p className="text-sm text-gray-500 mt-1">{listing.zipCode}</p>
                  <p className="text-sm text-gray-600 mt-3">
                    📍 Exact location will be shared after booking confirmation
                  </p>
                </div>
              </div>
            </div>

            {/* Lender Reviews */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Reviews for {listing.user.name}
                {avgRating > 0 && (
                  <span className="ml-2 text-yellow-500">
                    ⭐ {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </div>
          </div>

          {/* Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {listing.isAvailable && !listing.isPaused ? (
                user ? (
                  user.userId === listing.userId ? (
                    <div className="bg-white rounded-lg shadow p-6">
                      <p className="text-gray-700 mb-4">This is your listing</p>
                      <a
                        href={`/dashboard/listings/${listing.id}/edit`}
                        className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 transition"
                      >
                        Edit Listing
                      </a>
                    </div>
                  ) : (
                    <BookingWizard listing={listing} userDeliveryAddress={userDeliveryAddress} />
                  )
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-700 mb-4">
                      Please log in to book this item
                    </p>
                    <a
                      href="/login"
                      className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg hover:bg-primary-700 transition"
                    >
                      Log In
                    </a>
                  </div>
                )
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center py-4">
                    <p className="text-gray-700 font-medium">Currently Unavailable</p>
                    <p className="text-sm text-gray-500 mt-2">
                      This item is not available for rent at the moment
                    </p>
                  </div>
                </div>
              )}

              {/* Lender Info */}
              <div className="bg-white rounded-lg shadow p-6 mt-4">
                <h3 className="font-semibold mb-3">Lender Information</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {listing.user.profileImage ? (
                      <img
                        src={listing.user.profileImage}
                        alt={listing.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      listing.user.name[0]
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {listing.user.name}
                    </p>
                    {avgRating > 0 && (
                      <p className="text-sm text-gray-600">
                        ⭐ {avgRating.toFixed(1)} ({reviews.length} reviews)
                      </p>
                    )}
                  </div>
                </div>
                {listing.user.kyc?.status === 'APPROVED' && (
                  <div className="mt-3 flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified User
                                  <Link
                                    href={`/profile/${listing.userId}`}
                                    className="w-full mt-4 block bg-primary-600 text-white text-center py-2 rounded-lg hover:bg-primary-700 transition font-medium"
                                  >
                                    View Profile
                                  </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
