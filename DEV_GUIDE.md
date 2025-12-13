# 🛠️ RentoHub - Development Guide

## Quick Reference for Building Remaining Features

This guide helps you build the remaining UI components quickly by showing you exactly how to use the existing backend.

---

## 📝 How to Create a New Page

### Example: Creating Listing Detail Page

**1. Create the file**: `src/app/listings/[id]/page.tsx`

```typescript
import { getListingByIdAction } from '@/app/actions/listings'
import { notFound } from 'next/navigation'

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getListingByIdAction(params.id)

  if (result.error || !result.listing) {
    notFound()
  }

  const listing = result.listing

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">{listing.title}</h1>
      <p className="text-gray-600">{listing.description}</p>
      <p className="text-2xl font-bold text-primary-600">
        ${listing.pricePerDay}/day
      </p>
      {/* Add more UI here */}
    </div>
  )
}
```

**2. Add a booking form** (client component):

```typescript
'use client'

import { useState } from 'react'
import { createBookingAction } from '@/app/actions/bookings'
import { useRouter } from 'next/navigation'

export function BookingForm({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await createBookingAction({
      listingId,
      startDate,
      endDate,
    })

    if (result.success) {
      // Redirect to payment or booking page
      router.push(`/bookings/${result.bookingId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <button type="submit">Book Now</button>
    </form>
  )
}
```

---

## 🎨 Component Examples

### Image Uploader Component

```typescript
'use client'

import { useState } from 'react'
import { uploadToS3 } from '@/lib/storage'

export function ImageUploader({ onUpload }: { onUpload: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      return uploadToS3(buffer, file.name, file.type)
    })

    const urls = await Promise.all(uploadPromises)
    onUpload(urls)
    setUploading(false)
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
```

### Date Range Picker

```typescript
'use client'

import { useState } from 'react'

interface DateRange {
  startDate: string
  endDate: string
}

export function DateRangePicker({
  onChange,
}: {
  onChange: (range: DateRange) => void
}) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function handleChange() {
    if (startDate && endDate) {
      onChange({ startDate, endDate })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value)
            handleChange()
          }}
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      <div>
        <label>End Date</label>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => {
            setEndDate(e.target.value)
            handleChange()
          }}
          className="w-full px-4 py-2 border rounded"
        />
      </div>
    </div>
  )
}
```

### Stripe Payment Form

```typescript
'use client'

import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

function PaymentFormInner({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    })

    if (result.error) {
      alert(result.error.message)
    } else {
      alert('Payment successful!')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  )
}

export function PaymentForm({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner clientSecret={clientSecret} />
    </Elements>
  )
}
```

---

## 🗺️ Map Integration Examples

### Install Mapbox

```bash
npm install mapbox-gl react-map-gl
```

### Map Picker Component

```typescript
'use client'

import { useState } from 'react'
import Map, { Marker } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export function MapPicker({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void
}) {
  const [viewport, setViewport] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 12,
  })
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null)

  function handleMapClick(e: any) {
    const { lng, lat } = e.lngLat
    setMarker({ latitude: lat, longitude: lng })
    onLocationSelect(lat, lng)
  }

  return (
    <Map
      {...viewport}
      onMove={(evt) => setViewport(evt.viewState)}
      onClick={handleMapClick}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: '100%', height: 400 }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      {marker && (
        <Marker latitude={marker.latitude} longitude={marker.longitude}>
          <div className="w-4 h-4 bg-red-500 rounded-full" />
        </Marker>
      )}
    </Map>
  )
}
```

### Live Tracking Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import { getDeliveryJobAction } from '@/app/actions/delivery'

export function LiveMapTracker({ deliveryJobId }: { deliveryJobId: string }) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Fetch initial location
    fetchLocation()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchLocation, 5000)
    return () => clearInterval(interval)
  }, [deliveryJobId])

  async function fetchLocation() {
    const result = await getDeliveryJobAction(deliveryJobId)
    if (result.success && result.deliveryJob) {
      const { currentLatitude, currentLongitude } = result.deliveryJob
      if (currentLatitude && currentLongitude) {
        setLocation({ lat: currentLatitude, lng: currentLongitude })
      }
    }
  }

  if (!location) return <p>Loading map...</p>

  return (
    <Map
      latitude={location.lat}
      longitude={location.lng}
      zoom={14}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: '100%', height: 400 }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      <Marker latitude={location.lat} longitude={location.lng}>
        <div className="text-2xl">🚚</div>
      </Marker>
    </Map>
  )
}
```

---

## 🎯 Common Patterns

### Loading State

```typescript
'use client'

import { useState, useEffect } from 'react'

export function MyComponent() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const result = await someAction()
    if (result.success) {
      setData(result.data)
    }
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return <div>{/* Render data */}</div>
}
```

### Form with Validation

```typescript
'use client'

import { useState } from 'react'
import { createListingSchema } from '@/lib/validations'

export function ListingForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerDay: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate with Zod
    const result = createListingSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Submit
    const submitResult = await createListingAction(formData)
    // Handle result
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      {errors.title && <p className="text-red-500">{errors.title}</p>}
      {/* More fields */}
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Authenticated Actions

```typescript
'use server'

import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function myProtectedAction() {
  try {
    const user = await requireAuth() // Throws if not authenticated
    
    // Your logic here
    const data = await prisma.user.findUnique({
      where: { id: user.userId },
    })
    
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message }
  }
}
```

---

## 🔧 Useful Code Snippets

### Show Toast Notification

```typescript
// Simple toast (you can use a library like react-hot-toast)
function showToast(message: string, type: 'success' | 'error') {
  // Implement or use a library
  alert(message) // Temporary
}
```

### Format Currency

```typescript
import { formatCurrency } from '@/lib/utils'

const price = formatCurrency(49.99) // "$49.99"
```

### Calculate Rental Days

```typescript
import { calculateRentalDuration } from '@/lib/utils'

const days = calculateRentalDuration(
  new Date('2025-01-01'),
  new Date('2025-01-05')
) // 4 days
```

### Check if User is Admin

```typescript
import { getCurrentUser } from '@/lib/auth'

const user = await getCurrentUser()
const isAdmin = user?.role === 'ADMIN'
```

---

## 📚 Server Actions Quick Reference

### Listings
```typescript
import {
  createListingAction,
  updateListingAction,
  deleteListingAction,
  searchListingsAction,
  getListingByIdAction,
  getMyListingsAction,
} from '@/app/actions/listings'
```

### Bookings
```typescript
import {
  createBookingAction,
  acceptBookingAction,
  cancelBookingAction,
  getMyBookingsAction,
  getBookingByIdAction,
} from '@/app/actions/bookings'
```

### Reviews
```typescript
import {
  createReviewAction,
  getUserReviewsAction,
} from '@/app/actions/reviews'
```

### Admin
```typescript
import {
  approveKYCAction,
  rejectKYCAction,
  getAllUsersAction,
  getAllBookingsAction,
  getAdminAnalyticsAction,
} from '@/app/actions/admin'
```

---

## 🎨 Tailwind CSS Quick Classes

```css
/* Layout */
.container mx-auto px-4 py-8

/* Card */
.bg-white rounded-lg shadow-md p-6

/* Button */
.bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700

/* Input */
.w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600

/* Grid */
.grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

/* Spacing */
.space-y-4  /* Vertical spacing */
.space-x-4  /* Horizontal spacing */

/* Text */
.text-gray-600
.text-primary-600
.font-semibold
.text-2xl
```

---

## 🐛 Debugging Tips

### Check Server Action Response
```typescript
const result = await someAction()
console.log('Result:', result)
if (result.error) {
  console.error('Error:', result.error)
}
```

### View Database Data
```bash
npx prisma studio
```

### Check Cookies
```typescript
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const token = cookieStore.get('auth-token')
console.log('Token:', token)
```

### Test API Routes
```bash
curl http://localhost:3000/api/auth/session
```

---

## 🚀 Building Flow Summary

1. **Create the page file** in `src/app/`
2. **Import server actions** you need
3. **Call actions** to get/send data
4. **Render UI** with the data
5. **Add client components** for interactivity
6. **Style with Tailwind**
7. **Test the flow**
8. **Repeat** for next page

---

## 📖 Key Files to Reference

- **Prisma Schema**: `prisma/schema.prisma` (data models)
- **Validations**: `src/lib/validations.ts` (input schemas)
- **Utils**: `src/lib/utils.ts` (helper functions)
- **Actions**: `src/app/actions/` (all backend logic)
- **Existing Pages**: `src/app/` (see examples)

---

## 💡 Pro Tips

1. **Copy existing pages** as templates
2. **Use Prisma Studio** to view/edit database
3. **Test with fake data** in Prisma Studio
4. **One feature at a time** - don't build everything at once
5. **Mobile-first** - test on small screen
6. **Use TypeScript** - let it guide you
7. **Check errors** in browser console
8. **Read action files** - they show what data is available

---

**You have everything you need! Start building! 🚀**

Need help? Check the action files to see what functions are available!
