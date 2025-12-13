import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getSignedUrl } from '@/lib/storage'

// GET - Fetch user profile
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate signed URL for profile image if exists
    const userWithSignedUrl = {
      ...userData,
      profileImage: userData.profileImage ? getSignedUrl(userData.profileImage) : null,
    }

    return NextResponse.json({ user: userWithSignedUrl })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, phone, profileImage,
      deliveryAddress, deliveryCity, deliveryState, deliveryZipCode,
      refundUpiId, refundBankAccount,
      earningsUpiId, earningsBankAccount
    } = body

    // Validate inputs
    if (name && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    if (phone && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone || null
    if (profileImage !== undefined) updateData.profileImage = profileImage || null
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress || null
    if (deliveryCity !== undefined) updateData.deliveryCity = deliveryCity || null
    if (deliveryState !== undefined) updateData.deliveryState = deliveryState || null
    if (deliveryZipCode !== undefined) updateData.deliveryZipCode = deliveryZipCode || null
    if (refundUpiId !== undefined) updateData.refundUpiId = refundUpiId || null
    if (refundBankAccount !== undefined) updateData.refundBankAccount = refundBankAccount || null
    if (earningsUpiId !== undefined) updateData.earningsUpiId = earningsUpiId || null
    if (earningsBankAccount !== undefined) updateData.earningsBankAccount = earningsBankAccount || null

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    })

    // Generate signed URL for profile image if exists
    const userWithSignedUrl = {
      ...updatedUser,
      profileImage: updatedUser.profileImage ? getSignedUrl(updatedUser.profileImage) : null,
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: userWithSignedUrl 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
