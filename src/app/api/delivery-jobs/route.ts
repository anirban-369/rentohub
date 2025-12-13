import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'DELIVERY_AGENT') {
      return NextResponse.json(
        { error: 'Only delivery agents can access this' },
        { status: 403 }
      )
    }

    // Fetch delivery jobs assigned to this agent
    const deliveryJobs = await prisma.deliveryJob.findMany({
      where: {
        deliveryAgentId: user.userId,
      },
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
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ deliveryJobs })
  } catch (error) {
    console.error('Error fetching delivery jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery jobs' },
      { status: 500 }
    )
  }
}
