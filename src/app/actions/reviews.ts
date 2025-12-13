'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createReviewSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createReviewAction(data: any) {
  try {
    const user = await requireAuth()
    const validated = createReviewSchema.parse(data)

    // Check if booking exists and user is part of it
    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
    })

    if (!booking) {
      return { error: 'Booking not found' }
    }

    if (booking.status !== 'COMPLETED') {
      return { error: 'Can only review completed bookings' }
    }

    if (booking.renterId !== user.userId && booking.lenderId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    // Determine reviewee
    const revieweeId = booking.renterId === user.userId ? booking.lenderId : booking.renterId

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId: validated.bookingId,
        reviewerId: user.userId,
      },
    })

    if (existingReview) {
      return { error: 'You have already reviewed this booking' }
    }

    // Create review
    await prisma.review.create({
      data: {
        bookingId: validated.bookingId,
        reviewerId: user.userId,
        revieweeId,
        rating: validated.rating,
        comment: validated.comment,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: 'REVIEW_RECEIVED',
        title: 'New Review',
        message: `You received a ${validated.rating}-star review`,
        relatedEntityId: validated.bookingId,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (error: any) {
    console.error('Create review error:', error)
    return { error: error.message || 'Failed to create review' }
  }
}

export async function getUserReviewsAction(userId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: {
            name: true,
            profileImage: true,
          },
        },
        booking: {
          select: {
            listing: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return { success: true, reviews, avgRating }
  } catch (error: any) {
    console.error('Get reviews error:', error)
    return { error: error.message || 'Failed to fetch reviews' }
  }
}
