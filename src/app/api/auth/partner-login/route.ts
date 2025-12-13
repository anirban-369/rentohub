import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const data = {
      email: body.email?.trim().toLowerCase(),
      password: body.password,
    }

    console.log('🔐 Partner Login attempt for:', data.email)

    const validated = loginSchema.parse(data)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      console.log('❌ User not found:', validated.email)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(validated.password, user.password)

    if (!isValid) {
      console.log('❌ Password invalid')
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is a delivery partner
    if (user.role !== 'DELIVERY_AGENT') {
      console.log('❌ Non-partner tried to use partner login:', validated.email)
      return NextResponse.json(
        { success: false, error: 'This account is not registered as a delivery partner. Please use the regular login or sign up as a partner.', isNotPartner: true },
        { status: 403 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    await setAuthCookie(token)

    console.log('✅ Partner Login successful for:', data.email)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    return response
  } catch (error: any) {
    console.error('❌ Partner Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
