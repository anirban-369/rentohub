import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const data = {
      email: body.email?.trim().toLowerCase(),
      password: body.password,
      name: body.name?.trim(),
      phone: body.phone?.trim() || undefined,
      role: body.role?.toUpperCase() || 'USER', // Allow role selection
    }

    console.log('📝 API Registration attempt for:', data.email, 'as', data.role)

    // Validate basic fields
    const validated = registerSchema.parse({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
    })

    // Validate role
    const validRoles = ['USER', 'DELIVERY_AGENT']
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      console.log('❌ User already exists:', data.email)
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password)

    // Create user with role
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        phone: validated.phone,
        role: data.role,
      },
    })

    console.log('✅ User created:', user.id, 'with role:', user.role)

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    await setAuthCookie(token)

    console.log('✅ API Registration successful')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('❌ API Registration error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
