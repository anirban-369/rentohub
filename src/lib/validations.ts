import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Listing schemas
export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  pricePerDay: z.number().positive('Price per day must be positive'),
  pricePerHour: z.number().positive('Price per hour must be positive').nullable().optional(),
  deposit: z.number().min(0, 'Deposit cannot be negative'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().optional(),
})

export const updateListingSchema = createListingSchema.partial()

// Booking schemas
export const createBookingSchema = z.object({
  listingId: z.string().uuid(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
})

// Review schemas
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

// Delivery schemas
export const updateDeliveryStatusSchema = z.object({
  status: z.enum([
    'ASSIGNED',
    'PICKUP_STARTED',
    'PICKED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'RETURN_STARTED',
    'RETURNED',
  ]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// Dispute schemas
export const createDisputeSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
})

// KYC schemas
export const submitKYCSchema = z.object({
  idProofUrl: z.string().url(),
  addressProofUrl: z.string().url(),
})

// Types
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>
export type SubmitKYCInput = z.infer<typeof submitKYCSchema>
