'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createListingSchema, updateListingSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getSignedUrl } from '@/lib/storage'

export async function createListingAction(data: any) {
  try {
    console.log('📝 Creating listing with data:', JSON.stringify(data, null, 2))
    const user = await requireAuth()

    // Check if user has approved KYC
    const kyc = await prisma.kYC.findUnique({
      where: { userId: user.userId },
    })

    if (!kyc || kyc.status !== 'APPROVED') {
      return { error: 'KYC verification required to list items' }
    }

    console.log('✅ KYC approved, validating data...')
    
    let validated
    try {
      validated = createListingSchema.parse(data)
      console.log('✅ Validation passed, creating listing...')
    } catch (validationError: any) {
      console.error('❌ Zod validation failed')
      if (validationError.errors) {
        console.error('Validation errors:', JSON.stringify(validationError.errors, null, 2))
      }
      return { error: validationError.errors?.[0]?.message || 'Validation failed' }
    }

    const listing = await prisma.listing.create({
      data: {
        ...validated,
        userId: user.userId,
        images: data.images || [],
      },
    })

    console.log('✅ Listing created:', listing.id)
    revalidatePath('/dashboard/listings')
    revalidatePath('/browse')
    return { success: true, listingId: listing.id }
  } catch (error: any) {
    console.error('❌ Create listing error:', error)
    console.error('Error stack:', error.stack)
    return { error: error.message || 'Failed to create listing' }
  }
}

export async function updateListingAction(listingId: string, data: any) {
  try {
    const user = await requireAuth()

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing || listing.userId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    let validated
    try {
      validated = updateListingSchema.parse(data)
    } catch (validationError: any) {
      console.error('❌ Validation failed:', validationError.errors)
      return { error: validationError.errors?.[0]?.message || 'Validation failed' }
    }
    
    console.log('📝 Updating listing:', listingId)
    console.log('📸 Images being updated:', data.images)

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...validated,
        images: data.images || listing.images, // Use new images or keep old ones
      },
    })
    
    console.log('✅ Listing updated successfully')
    console.log('📸 Images in DB now:', updated.images)

    revalidatePath('/dashboard/listings')
    revalidatePath(`/listings/${listingId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Update listing error:', error)
    return { error: error.message || 'Failed to update listing' }
  }
}

export async function deleteListingAction(listingId: string) {
  try {
    const user = await requireAuth()

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing || listing.userId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    await prisma.listing.delete({
      where: { id: listingId },
    })

    revalidatePath('/dashboard/listings')
    return { success: true }
  } catch (error: any) {
    console.error('Delete listing error:', error)
    return { error: error.message || 'Failed to delete listing' }
  }
}

export async function toggleListingAvailabilityAction(listingId: string) {
  try {
    const user = await requireAuth()

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing || listing.userId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { isPaused: !listing.isPaused },
    })

    revalidatePath('/dashboard/listings')
    return { success: true, isPaused: !listing.isPaused }
  } catch (error: any) {
    console.error('Toggle availability error:', error)
    return { error: error.message || 'Failed to toggle availability' }
  }
}

export async function getMyListingsAction() {
  try {
    const user = await requireAuth()

    const listings = await prisma.listing.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    return { success: true, listings }
  } catch (error: any) {
    console.error('Get listings error:', error)
    return { error: error.message || 'Failed to fetch listings' }
  }
}

export async function getListingByIdAction(listingId: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            kyc: {
              select: {
                status: true,
              },
            },
            reviewsReceived: {
              select: {
                rating: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: {
              in: ['ACCEPTED', 'IN_DELIVERY', 'ACTIVE'],
            },
          },
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!listing) {
      return { error: 'Listing not found' }
    }

    // Calculate average rating
    const reviews = listing.user.reviewsReceived
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
        : 0

    // Generate signed URL for profile image if exists
    const userWithSignedUrl = {
      ...listing.user,
      profileImage: listing.user.profileImage ? getSignedUrl(listing.user.profileImage) : null,
      avgRating,
      reviewCount: reviews.length,
    }

    return {
      success: true,
      listing: {
        ...listing,
        user: userWithSignedUrl,
      },
    }
  } catch (error: any) {
    console.error('Get listing error:', error)
    return { error: error.message || 'Failed to fetch listing' }
  }
}

export async function searchListingsAction(params: {
  query?: string
  category?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  latitude?: number
  longitude?: number
  radius?: number
  userId?: string
}) {
  try {
    const where: any = {
      isAvailable: true,
      isPaused: false,
    }

    if (params.userId) {
      where.userId = params.userId
    }

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ]
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' }
    }

    if (params.minPrice) {
      where.pricePerDay = { gte: params.minPrice }
    }

    if (params.maxPrice) {
      where.pricePerDay = { ...where.pricePerDay, lte: params.maxPrice }
    }

    const listings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        pricePerDay: true,
        images: true,
        category: true,
        city: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // TODO: Filter by location radius if provided
    // This would require a more complex query or post-processing

    return { success: true, listings }
  } catch (error: any) {
    console.error('Search listings error:', error)
    return { error: error.message || 'Failed to search listings' }
  }
}
