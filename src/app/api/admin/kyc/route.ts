import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const submissions = await prisma.kYC.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Admin KYC error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
