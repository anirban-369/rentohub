import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const disputes = await prisma.dispute.findMany({
      where: { status: 'OPEN' },
      include: {
        booking: {
          include: {
            listing: {
              select: { id: true, title: true },
            },
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ disputes })
  } catch (error) {
    console.error('Admin disputes error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
