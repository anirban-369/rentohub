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
        { error: 'Only delivery agents can update location' },
        { status: 403 }
      )
    }

    const deliveryJob = await prisma.deliveryJob.findUnique({
      where: { id: params.id },
    })

    if (!deliveryJob) {
      return NextResponse.json({ error: 'Delivery job not found' }, { status: 404 })
    }

    if (deliveryJob.deliveryAgentId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Update location
    await prisma.deliveryJob.update({
      where: { id: params.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}
