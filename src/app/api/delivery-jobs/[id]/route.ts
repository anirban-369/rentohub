import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          include: {
            listing: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
            renter: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        deliveryAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    if (!deliveryJob) {
      return NextResponse.json({ error: 'Delivery job not found' }, { status: 404 })
    }

    // Check authorization - delivery agent, lender, renter, or admin
    const isDeliveryAgent = deliveryJob.deliveryAgentId === user.userId
    const isLender = deliveryJob.booking.listing.userId === user.userId
    const isRenter = deliveryJob.booking.renterId === user.userId
    const isAdmin = user.role === 'ADMIN'

    if (!isDeliveryAgent && !isLender && !isRenter && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ deliveryJob })
  } catch (error) {
    console.error('Error fetching delivery job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery job' },
      { status: 500 }
    )
  }
}
