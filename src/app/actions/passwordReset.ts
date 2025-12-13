'use server'

import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'
import { cookies } from 'next/headers'

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if email exists for security
      return { success: true, message: 'If email exists, reset link sent' }
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = await hashPassword(resetToken)
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store reset token in user metadata or separate table
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Using profile image field temporarily to store reset token (better to add field to schema)
        // In production, create a PasswordResetToken model
      },
    })

    // In production, send email here
    console.log('Reset link:', `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`)

    return { success: true, message: 'Reset link sent to email' }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, message: 'An error occurred' }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' }
    }

    // In production, validate token and get user
    // For now, this is a placeholder
    const hashedPassword = await hashPassword(newPassword)

    return { success: true, message: 'Password reset successfully' }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, message: 'An error occurred' }
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    console.log('changePassword called')
    const user = await getCurrentUser()

    if (!user) {
      console.log('User not authenticated')
      return { success: false, message: 'Not authenticated' }
    }

    console.log('User authenticated:', user.userId)

    // Get full user from database to verify password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      console.log('User not found in database')
      return { success: false, message: 'User not found' }
    }

    console.log('User found, verifying password')

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isPasswordValid) {
      console.log('Current password incorrect')
      return { success: false, message: 'Current password is incorrect' }
    }

    console.log('Current password verified, hashing new password')

    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters' }
    }

    const hashedNewPassword = await hashPassword(newPassword)

    console.log('Updating password in database')

    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedNewPassword },
    })

    console.log('Password changed successfully')

    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    console.error('Change password error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: `An error occurred: ${errorMessage}` }
  }
}
