'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function getEarningsAction() {
  try {
    const user = await requireAuth()

    // Get all completed bookings where user is lender
    const bookings = await prisma.booking.findMany({
      where: {
        lenderId: user.userId,
        status: {
          in: ['COMPLETED', 'DISPUTED'],
        },
      },
      include: {
        listing: {
          select: {
            title: true,
            pricePerDay: true,
          },
        },
        renter: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    // Calculate earnings
    let totalEarnings = 0
    let totalTransactions = 0
    let pendingEarnings = 0

    const transactions = bookings.map((booking: any) => {
      const platformFee = booking.platformFee || 0
      const rentAmount = booking.rentAmount || 0
      const earnings = rentAmount - platformFee

      if (booking.status === 'COMPLETED') {
        totalEarnings += earnings
      } else {
        pendingEarnings += earnings
      }
      totalTransactions += 1

      return {
        id: booking.id,
        listingTitle: booking.listing.title,
        renterName: booking.renter.name,
        rentAmount: booking.rentAmount,
        platformFee: booking.platformFee,
        earnings: earnings,
        status: booking.status,
        completedAt: booking.completedAt,
        deposit: booking.depositAmount,
        depositRefunded: booking.depositRefunded,
      }
    })

    // Get last 30 days earnings
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30DaysBookings = bookings.filter(
      (b: any) => b.completedAt && b.completedAt > thirtyDaysAgo
    )
    const earnings30Days = last30DaysBookings.reduce((sum: number, b: any) => {
      return sum + (b.rentAmount - (b.platformFee || 0))
    }, 0)

    return {
      success: true,
      data: {
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalTransactions,
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        earnings30Days: parseFloat(earnings30Days.toFixed(2)),
        transactions,
      },
    }
  } catch (error: any) {
    console.error('Get earnings error:', error)
    return { success: false, error: error.message || 'Failed to fetch earnings' }
  }
}

export async function getMonthlyEarningsChartAction() {
  try {
    const user = await requireAuth()

    // Get last 12 months of earnings
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const bookings = await prisma.booking.findMany({
      where: {
        lenderId: user.userId,
        status: 'COMPLETED',
        completedAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        completedAt: true,
        rentAmount: true,
        platformFee: true,
      },
    })

    // Group by month
    const monthlyData: { [key: string]: number } = {}
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    // Initialize all months with 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      monthlyData[monthKey] = 0
    }

    // Add earnings to respective months
    bookings.forEach((booking: any) => {
      if (booking.completedAt) {
        const date = new Date(booking.completedAt)
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
        const earnings = (booking.rentAmount || 0) - (booking.platformFee || 0)
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + earnings
      }
    })

    const chartData = Object.entries(monthlyData).map(([month, earnings]) => ({
      month,
      earnings: parseFloat(earnings.toFixed(2)),
    }))

    return { success: true, data: chartData }
  } catch (error: any) {
    console.error('Get chart data error:', error)
    return { success: false, error: error.message || 'Failed to fetch chart data' }
  }
}
