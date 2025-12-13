'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createDisputeSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createDisputeAction(data: any) {
  try {
    const user = await requireAuth()
    const validated = createDisputeSchema.parse(data)

    // Check booking
    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
    })

    if (!booking) {
      return { error: 'Booking not found' }
    }

    if (booking.renterId !== user.userId && booking.lenderId !== user.userId) {
      return { error: 'Unauthorized' }
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findUnique({
      where: { bookingId: validated.bookingId },
    })

    if (existingDispute) {
      return { error: 'Dispute already exists for this booking' }
    }

    // Create dispute
    await prisma.dispute.create({
      data: {
        bookingId: validated.bookingId,
        reportedBy: user.userId,
        reason: validated.reason,
        description: validated.description,
        evidenceUrls: data.evidenceUrls || [],
      },
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: validated.bookingId },
      data: { status: 'DISPUTED' },
    })

    // Notify other party
    const otherPartyId =
      booking.renterId === user.userId ? booking.lenderId : booking.renterId

    await prisma.notification.create({
      data: {
        userId: otherPartyId,
        type: 'DISPUTE_OPENED',
        title: 'Dispute Opened',
        message: 'A dispute has been opened for one of your bookings',
        relatedEntityId: validated.bookingId,
        relatedEntityType: 'booking',
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (error: any) {
    console.error('Create dispute error:', error)
    return { error: error.message || 'Failed to create dispute' }
  }
}

export async function getMyDisputesAction() {
  try {
    const user = await requireAuth()

    const disputes = await prisma.dispute.findMany({
      where: { reportedBy: user.userId },
      include: {
        booking: {
          include: {
            listing: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, disputes }
  } catch (error: any) {
    console.error('Get disputes error:', error)
    return { error: error.message || 'Failed to fetch disputes' }
  }
}
