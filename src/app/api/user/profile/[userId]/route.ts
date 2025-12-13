import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/storage'

// GET - Fetch public user profile by userId
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    // Validate userId format (UUID)
    if (!userId || userId.length !== 36) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        profileImage: true,
        role: true,
        createdAt: true,
        // Only include public info, no email, phone, password, etc.
        _count: {
          select: {
            listings: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't show delivery agent profiles publicly
    if (user.role === 'DELIVERY_AGENT') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate signed URL for profile image if exists
    const userWithSignedUrl = {
      ...user,
      profileImage: user.profileImage ? getSignedUrl(user.profileImage) : null,
      joinedDate: user.createdAt,
    }

    // Remove the createdAt field and return joinedDate instead
    const { createdAt, ...userPublic } = userWithSignedUrl

    return NextResponse.json({ user: userPublic })
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
