'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  amount: number
  bookingId: string
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ amount, bookingId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    try {
      // Create payment method
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (methodError) {
        setError(methodError.message || 'Payment method creation failed')
        setProcessing(false)
        return
      }

      // Confirm payment with backend
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentMethodId: paymentMethod.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      // Handle 3D Secure if needed
      if (data.requiresAction) {
        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(data.clientSecret)

        if (confirmError) {
          throw new Error(confirmError.message)
        }

        if (paymentIntent.status === 'requires_capture') {
          onSuccess()
        }
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message)
      onError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
      >
        {processing ? 'Processing...' : `Pay ₹${(amount / 100).toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment will be held securely until the rental is completed
      </p>
    </form>
  )
}

export default function StripePaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
