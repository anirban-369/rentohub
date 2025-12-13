import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { capturePaymentIntent } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Log the event
  await prisma.stripeLog.create({
    data: {
      eventType: event.type,
      eventId: event.id,
      paymentIntentId: (event.data.object as any).id,
      status: (event.data.object as any).status || 'unknown',
      amount: (event.data.object as any).amount / 100 || 0,
      metadata: JSON.stringify(event.data.object),
      rawEvent: JSON.stringify(event),
    },
  })

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
      break

    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  // Update booking payment status
  const booking = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  if (booking) {
    await prisma.notification.create({
      data: {
        userId: booking.renterId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully',
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)

  // Update booking and notify user
  const booking = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    })

    await prisma.notification.create({
      data: {
        userId: booking.renterId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      },
    })
  }
}

async function handleRefund(charge: Stripe.Charge) {
  console.log('Refund processed:', charge.id)

  // Find booking and update refund status
  const booking = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: charge.payment_intent as string },
  })

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { depositRefunded: true },
    })
  }
}
