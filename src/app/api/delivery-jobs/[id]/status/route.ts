import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'DELIVERY_AGENT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only delivery agents can update status' },
        { status: 403 }
      )
    }

    const deliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: params.id },
      include: { booking: true },
    })

    if (!deliveryJob) {
      return NextResponse.json({ error: 'Delivery job not found' }, { status: 404 })
    }

    if (deliveryJob.deliveryAgentId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { status, latitude, longitude, pickupPhotos, pickupVideoUrl, deliveryPhotos, deliveryVideoUrl, amountCollected } = body

    console.log('Update delivery status request:', {
      jobId: params.id,
      status,
      pickupPhotos,
      pickupVideoUrl,
      deliveryPhotos,
      deliveryVideoUrl,
      amountCollected,
    })

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      ASSIGNED: ['PICKUP_STARTED'],
      PICKUP_STARTED: ['PICKED'],
      PICKED: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: ['RETURN_STARTED'],
      RETURN_STARTED: ['RETURNED'],
    }

    if (!validTransitions[deliveryJob.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${deliveryJob.status} to ${status}` },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = { status }

    // Update timestamps based on status
    switch (status) {
      case 'PICKUP_STARTED':
        updateData.pickupStartedAt = new Date()
        break
      case 'PICKED':
        updateData.pickedAt = new Date()
        if (pickupPhotos) updateData.pickupPhotos = pickupPhotos
        if (pickupVideoUrl) updateData.pickupVideoUrl = pickupVideoUrl
        break
      case 'OUT_FOR_DELIVERY':
        updateData.outForDeliveryAt = new Date()
        break
      case 'DELIVERED':
        updateData.deliveredAt = new Date()
        if (deliveryPhotos) updateData.deliveryPhotos = deliveryPhotos
        if (deliveryVideoUrl) updateData.deliveryVideoUrl = deliveryVideoUrl
        if (amountCollected) updateData.amountCollected = amountCollected
        // Update booking status to ACTIVE (item is with renter)
        await prisma.booking.update({
          where: { id: deliveryJob.bookingId },
          data: { status: 'ACTIVE' },
        })
        break
      case 'RETURN_STARTED':
        updateData.returnStartedAt = new Date()
        break
      case 'RETURNED':
        updateData.returnedAt = new Date()
        // Update booking status to COMPLETED
        await prisma.booking.update({
          where: { id: deliveryJob.bookingId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        })
        break
    }

    // Update GPS location if provided
    if (latitude && longitude) {
      updateData.currentLatitude = latitude
      updateData.currentLongitude = longitude
      updateData.lastLocationUpdate = new Date()
    }

    // Update delivery job
    await prisma.deliveryJob.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create notifications
    const booking = deliveryJob.booking
    
    // Notify renter
    await prisma.notification.create({
      data: {
        userId: booking.renterId,
        type: 'DELIVERY_UPDATE',
        title: 'Delivery Update',
        message: getStatusMessage(status, 'renter'),
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })

    // Notify lender
    await prisma.notification.create({
      data: {
        userId: booking.lenderId,
        type: 'DELIVERY_UPDATE',
        title: 'Delivery Update',
        message: getStatusMessage(status, 'lender'),
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating delivery status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to update delivery status: ${errorMessage}` },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: string, userType: 'renter' | 'lender'): string {
  const messages: Record<string, Record<string, string>> = {
    PICKUP_STARTED: {
      renter: 'Delivery partner is heading to pick up your rental item',
      lender: 'Delivery partner is on the way to pick up your item',
    },
    PICKED: {
      renter: 'Your rental item has been picked up and is being verified',
      lender: 'Your item has been picked up. Condition proof is available.',
    },
    OUT_FOR_DELIVERY: {
      renter: 'Your rental item is out for delivery!',
      lender: 'Your item is on the way to the renter',
    },
    DELIVERED: {
      renter: 'Your rental item has been delivered! Enjoy!',
      lender: 'Your item has been delivered to the renter. Delivery proof is available.',
    },
    RETURN_STARTED: {
      renter: 'Delivery partner is coming to pick up the item for return',
      lender: 'Your item is being picked up for return',
    },
    RETURNED: {
      renter: 'Item has been returned successfully',
      lender: 'Your item has been returned successfully!',
    },
  }
  return messages[status]?.[userType] || `Delivery status updated to ${status}`
}
