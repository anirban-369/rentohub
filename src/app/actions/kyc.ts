'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { submitKYCSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function submitKYCAction(data: any) {
  try {
    const user = await requireAuth()
    const validated = submitKYCSchema.parse(data)

    // Check if KYC already exists
    const existingKYC = await prisma.kYC.findUnique({
      where: { userId: user.userId },
    })

    if (existingKYC) {
      // Update existing KYC
      await prisma.kYC.update({
        where: { userId: user.userId },
        data: {
          idProofUrl: validated.idProofUrl,
          addressProofUrl: validated.addressProofUrl,
          status: 'PENDING',
          submittedAt: new Date(),
        },
      })
    } else {
      // Create new KYC
      await prisma.kYC.create({
        data: {
          userId: user.userId,
          idProofUrl: validated.idProofUrl,
          addressProofUrl: validated.addressProofUrl,
        },
      })
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Submit KYC error:', error)
    return { error: error.message || 'Failed to submit KYC' }
  }
}

export async function getMyKYCAction() {
  try {
    const user = await requireAuth()

    const kyc = await prisma.kYC.findUnique({
      where: { userId: user.userId },
    })

    return { success: true, kyc }
  } catch (error: any) {
    console.error('Get KYC error:', error)
    return { error: error.message || 'Failed to fetch KYC' }
  }
}
