'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// User Management
export async function getAllUsersAction() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      include: {
        kyc: true,
        _count: {
          select: {
            listings: true,
            bookingsAsRenter: true,
            bookingsAsLender: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, users }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch users' }
  }
}

export async function approveKYCAction(kycId: string) {
  try {
    const admin = await requireAdmin()

    await prisma.kYC.update({
      where: { id: kycId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: admin.userId,
      },
    })

    // Get user and notify
    const kyc = await prisma.kYC.findUnique({
      where: { id: kycId },
    })

    if (kyc) {
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: 'KYC_STATUS',
          title: 'KYC Approved',
          message: 'Your KYC has been approved. You can now list items.',
        },
      })
    }

    revalidatePath('/admin/kyc')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to approve KYC' }
  }
}

export async function rejectKYCAction(kycId: string, reason: string) {
  try {
    const admin = await requireAdmin()

    await prisma.kYC.update({
      where: { id: kycId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: admin.userId,
        rejectionReason: reason,
      },
    })

    // Get user and notify
    const kyc = await prisma.kYC.findUnique({
      where: { id: kycId },
    })

    if (kyc) {
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: 'KYC_STATUS',
          title: 'KYC Rejected',
          message: `Your KYC was rejected. Reason: ${reason}`,
        },
      })
    }

    revalidatePath('/admin/kyc')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to reject KYC' }
  }
}

// Listing Management
export async function getAllListingsAction() {
  try {
    await requireAdmin()

    const listings = await prisma.listing.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, listings }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch listings' }
  }
}

export async function deleteListingAdminAction(listingId: string) {
  try {
    const admin = await requireAdmin()

    await prisma.listing.delete({
      where: { id: listingId },
    })

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'DELETE_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
      },
    })

    revalidatePath('/admin/listings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to delete listing' }
  }
}

// Booking Management
export async function getAllBookingsAction() {
  try {
    await requireAdmin()

    const bookings = await prisma.booking.findMany({
      include: {
        listing: true,
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deliveryJob: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: 100,
    })

    return { success: true, bookings }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch bookings' }
  }
}

// Dispute Management
export async function getAllDisputesAction() {
  try {
    await requireAdmin()

    const disputes = await prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            listing: true,
            renter: true,
            lender: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, disputes }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch disputes' }
  }
}

export async function resolveDisputeAction(
  disputeId: string,
  resolution: string,
  depositRefundAmount: number
) {
  try {
    const admin = await requireAdmin()

    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        depositRefundAmount,
        resolvedBy: admin.userId,
        resolvedAt: new Date(),
      },
      include: { booking: true },
    })

    // Update booking
    await prisma.booking.update({
      where: { id: dispute.bookingId },
      data: {
        status: 'COMPLETED',
        refundAmount: depositRefundAmount,
      },
    })

    // Notify both parties
    await prisma.notification.create({
      data: {
        userId: dispute.reportedBy,
        type: 'DISPUTE_OPENED',
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved: ${resolution}`,
        relatedEntityId: dispute.bookingId,
        relatedEntityType: 'booking',
      },
    })

    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'RESOLVE_DISPUTE',
        targetType: 'DISPUTE',
        targetId: disputeId,
        metadata: JSON.stringify({ resolution, depositRefundAmount }),
      },
    })

    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to resolve dispute' }
  }
}

// Analytics
export async function getAdminAnalyticsAction() {
  try {
    await requireAdmin()

    const [
      totalUsers,
      totalListings,
      totalBookings,
      activeBookings,
      pendingKYCs,
      openDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'ACTIVE' } }),
      prisma.kYC.count({ where: { status: 'PENDING' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
    ])

    return {
      success: true,
      analytics: {
        totalUsers,
        totalListings,
        totalBookings,
        activeBookings,
        pendingKYCs,
        openDisputes,
      },
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch analytics' }
  }
}

// Listing Management
export async function approveListing(listingId: string, reason?: string) {
  try {
    const admin = await requireAdmin()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return { error: 'Listing not found' }
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        isAvailable: true,
      },
    })

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'APPROVE_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
        reason,
      },
    })

    // Create notification for lender
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'BOOKING_ACCEPTED',
        title: 'Listing Approved',
        message: `Your listing "${listing.title}" has been approved and is now visible to renters.`,
        relatedEntityId: listingId,
        relatedEntityType: 'LISTING',
      },
    })

    revalidatePath('/admin/listings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to approve listing' }
  }
}

export async function rejectListing(listingId: string, reason: string) {
  try {
    const admin = await requireAdmin()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return { error: 'Listing not found' }
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        isAvailable: false,
        isPaused: true,
      },
    })

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: admin.userId,
        action: 'REJECT_LISTING',
        targetType: 'LISTING',
        targetId: listingId,
        reason,
      },
    })

    // Create notification for lender
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Listing Rejected',
        message: `Your listing "${listing.title}" has been rejected. Reason: ${reason}`,
        relatedEntityId: listingId,
        relatedEntityType: 'LISTING',
      },
    })

    revalidatePath('/admin/listings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to reject listing' }
  }
}

export async function getListingsForApprovalAction() {
  try {
    await requireAdmin()

    const listings = await prisma.listing.findMany({
      where: {
        isAvailable: false,
        isPaused: false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, listings }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch listings for approval' }
  }
}

export async function getAllListingsForAdminAction() {
  try {
    await requireAdmin()

    const listings = await prisma.listing.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return { success: true, listings }
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch listings' }
  }
}

