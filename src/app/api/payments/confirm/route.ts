import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import stripe from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, paymentMethodId } = await request.json()

    // Get booking and payment intent
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.renterId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!booking.stripePaymentIntentId) {
      return NextResponse.json({ error: 'No payment intent' }, { status: 400 })
    }

    // Confirm payment
    const paymentIntent = await stripe.paymentIntents.confirm(
      booking.stripePaymentIntentId,
      {
        payment_method: paymentMethodId,
      }
    )

    // Check if 3D Secure is required
    if (paymentIntent.status === 'requires_action') {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      })
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'ACCEPTED' },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: error.message || 'Payment failed' },
      { status: 500 }
    )
  }
}
