'use server'

import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  setAuthCookie,
  removeAuthCookie,
  getCurrentUser,
} from '@/lib/auth'
import { registerSchema, loginSchema } from '@/lib/validations'
import { getSignedUrl } from '@/lib/storage'

export async function registerAction(formData: FormData) {
  try {
    const data = {
      email: (formData.get('email') as string)?.trim().toLowerCase(),
      password: formData.get('password') as string,
      name: (formData.get('name') as string)?.trim(),
      phone: (formData.get('phone') as string)?.trim() || undefined,
    }

    console.log('📝 Registration attempt for:', data.email)
    const validated = registerSchema.parse(data)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      console.log('❌ User already exists:', data.email)
      return { error: 'User with this email already exists' }
    }

    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await hashPassword(validated.password)

    // Create user
    console.log('💾 Creating user in database...')
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        phone: validated.phone,
      },
    })

    console.log('✅ User created:', user.id)

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    await setAuthCookie(token)

    console.log('✅ Registration successful')
    return { success: true, userId: user.id }
  } catch (error: any) {
    console.error('❌ Registration error:', error.message || error)
    return { error: error.message || 'Registration failed' }
  }
}

export async function loginAction(formData: FormData) {
  try {
    const data = {
      email: (formData.get('email') as string)?.trim().toLowerCase(),
      password: formData.get('password') as string,
    }

    console.log('🔐 Login attempt for:', data.email)

    const validated = loginSchema.parse(data)

    // Find user
    console.log('🔍 Querying user from database...')
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      console.log('❌ User not found in database:', validated.email)
      return { success: false, error: 'Invalid email or password' }
    }

    console.log('✅ User found:', user.email)
    console.log('🔑 Verifying password...')
    
    // Verify password
    const isValid = await verifyPassword(validated.password, user.password)

    console.log('Password valid?', isValid)
    if (!isValid) {
      console.log('❌ Password does not match')
      return { success: false, error: 'Invalid email or password' }
    }

    // Generate token
    console.log('🎫 Generating token...')
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookie
    console.log('🍪 Setting auth cookie...')
    await setAuthCookie(token)

    console.log('✅ Login successful for:', data.email)
    
    // Return success without redirect - let client handle it
    return { success: true, userId: user.id, role: user.role }
  } catch (error: any) {
    console.error('❌ Login error:', error.message || error)
    return { success: false, error: error.message || 'Login failed' }
  }
}

export async function logoutAction() {
  console.log('🚪 Logging out...')
  await removeAuthCookie()
  console.log('✅ Cookie removed')
  // Don't redirect here - let the caller handle it
}

export async function getSessionAction() {
  const user = await getCurrentUser()
  if (!user) return null

  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profileImage: true,
      kyc: {
        select: {
          status: true,
        },
      },
    },
  })

  if (!userData) return null

  // Return user data with signed URL for profile image
  return {
    ...userData,
    profileImage: userData.profileImage ? getSignedUrl(userData.profileImage) : null,
  }
}
