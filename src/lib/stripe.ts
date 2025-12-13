import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export default stripe

export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    capture_method: 'manual', // Hold payment until rental completes
    metadata,
  })
}

export async function capturePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(paymentIntentId)
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  })
}

export async function createTransfer(
  amount: number,
  destination: string,
  metadata?: Record<string, string>
): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination,
    metadata,
  })
}
