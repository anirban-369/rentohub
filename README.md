# RentoHub - Two-Sided Rental Marketplace

A comprehensive full-stack rental marketplace built with Next.js 14, featuring in-house delivery tracking, secure payments, and verified transactions.

## 🚀 Features

### Core Functionality
- **Two-Sided Marketplace**: Users can both rent and lend items
- **In-House Delivery**: Live GPS tracking for pickups and returns
- **Secure Payments**: Stripe integration with escrow-like payment holding
- **KYC Verification**: Lender verification with document uploads
- **Photo Verification**: Timestamped photos at pickup and return
- **Real-Time Tracking**: Live map tracking similar to food delivery apps
- **Rating & Review System**: Two-way ratings for trust building
- **Admin Dashboard**: Complete system management interface

### Item Categories
- Electronics (phones, laptops, tablets)
- Tools (power tools, hand tools)
- Furniture
- Appliances
- Cycles & Bikes
- Books
- Cameras & Photography Equipment
- Musical Instruments

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Mapbox/Google Maps** for location and tracking
- **React Dropzone** for file uploads

### Backend
- **Next.js Server Actions** & API Routes
- **PostgreSQL** database
- **Prisma ORM**
- **JWT** authentication
- **Stripe** payment processing
- **AWS S3** for file storage
- **bcrypt** for password hashing

### Key Features
- Server-side rendering
- API route handlers
- Real-time updates
- Responsive design
- Mobile-first approach

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account
- AWS S3 bucket (or Supabase Storage)
- Mapbox API key

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd rentohub-new
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rentohub"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_BUCKET_NAME="rentohub-uploads"
AWS_REGION="us-east-1"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
rentohub-new/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── actions/           # Server actions
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   └── listings.ts
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Protected dashboard pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── browse/
│   │   ├── listings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React components
│   │   ├── Navbar.tsx
│   │   ├── ListingCard.tsx
│   │   └── ...
│   └── lib/
│       ├── auth.ts            # Authentication utilities
│       ├── prisma.ts          # Prisma client
│       ├── stripe.ts          # Stripe utilities
│       ├── storage.ts         # S3 upload utilities
│       ├── validations.ts     # Zod schemas
│       └── utils.ts           # Helper functions
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🗃️ Database Schema

### Key Models

- **User**: User accounts with roles (USER, ADMIN, DELIVERY_AGENT)
- **KYC**: KYC verification documents and status
- **Listing**: Rental items with location, pricing, and images
- **Booking**: Rental transactions with status tracking
- **DeliveryJob**: Delivery tracking with GPS coordinates
- **Review**: Two-way rating system
- **Dispute**: Dispute resolution system
- **Notification**: In-app notifications
- **StripeLog**: Payment event logging
- **AdminAction**: Admin activity tracking

## 🔐 Authentication Flow

1. User registers with email/password
2. JWT token generated and stored in HTTP-only cookie
3. Token validated on protected routes
4. Role-based access control (USER, ADMIN, DELIVERY_AGENT)

## 💳 Payment Flow

1. **Booking Creation**: User selects dates and initiates booking
2. **Payment Intent**: Stripe PaymentIntent created with `manual` capture
3. **Payment Hold**: Rent + deposit charged but not captured
4. **Booking Acceptance**: Lender accepts/rejects booking
5. **Delivery**: Item delivered and rental begins
6. **Return**: Item returned with photo verification
7. **Payment Capture**: Rent goes to lender, deposit refunded to renter
8. **Platform Fee**: 10% deducted from rent amount

## 🚚 Delivery Workflow

1. **Assignment**: Delivery job assigned to agent
2. **Pickup**: Agent picks up item from lender
3. **Delivery**: Real-time GPS tracking to renter
4. **Active Rental**: Item in use during rental period
5. **Return Pickup**: Agent picks up from renter
6. **Return Delivery**: Agent returns to lender
7. **Completion**: Photos verified, payments processed

## 📱 API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Listings
- `GET /api/listings` - Browse listings
- `GET /api/listings/:id` - Get listing details
- `POST /api/listings` - Create listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/accept` - Accept booking
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/payments/capture` - Capture payment
- `POST /api/payments/refund` - Refund payment

### Delivery
- `PUT /api/delivery/:id/status` - Update delivery status
- `POST /api/delivery/:id/location` - Update GPS location
- `POST /api/delivery/:id/photo` - Upload proof photo

## 🎨 UI Components

### Key Components
- `Navbar`: Navigation with auth state
- `ListingCard`: Item display card
- `BookingCard`: Booking status display
- `MapTracker`: Real-time delivery tracking
- `ImageUploader`: Multi-image upload with preview
- `DateRangePicker`: Rental date selection
- `PaymentForm`: Stripe payment form
- `ReviewForm`: Rating and review submission

## 👨‍💼 Admin Panel

Access at `/admin` (admin role required)

### Admin Capabilities
- **User Management**: View, disable users, approve KYC
- **Listing Management**: Approve/remove listings
- **Booking Management**: View all bookings, override status
- **Delivery Tracking**: Monitor all deliveries
- **Dispute Resolution**: Review disputes, adjust refunds
- **Payment Management**: View logs, issue refunds
- **Analytics**: Platform metrics and reports

## 🔒 Security Features

- HTTP-only cookies for auth tokens
- Password hashing with bcrypt (10 rounds)
- Input validation with Zod
- SQL injection protection via Prisma
- CSRF protection
- Rate limiting on sensitive endpoints
- Role-based access control
- Secure file uploads (type & size validation)

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Configure Environment Variables** in Vercel Dashboard

4. **Setup Database**: Use managed PostgreSQL (Neon, Supabase, or Railway)

5. **Configure Stripe Webhook**: Point to `https://your-domain.vercel.app/api/stripe/webhook`

### Database Migrations in Production

```bash
npx prisma migrate deploy
```

## 🔄 Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## 📊 Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists

### Stripe Issues
- Verify API keys (test vs live mode)
- Check webhook secret matches
- Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Image Upload Issues
- Verify AWS credentials
- Check S3 bucket permissions (public read)
- Ensure bucket CORS is configured

## 📝 Development Notes

### Adding New Features

1. Update Prisma schema if needed
2. Run `npx prisma migrate dev`
3. Create server actions in `src/app/actions/`
4. Create UI components
5. Add routes/pages
6. Test thoroughly

### Code Organization

- **Server Actions**: Use for data mutations
- **API Routes**: Use for webhooks and external APIs
- **Components**: Keep them small and reusable
- **Lib**: Shared utilities and configurations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For issues or questions:
- Create an issue on GitHub
- Contact: support@rentohub.com

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] AI-powered item recommendations
- [ ] Instant messaging between users
- [ ] Multi-language support
- [ ] Insurance integration
- [ ] Subscription plans for frequent renters
- [ ] Social sharing features
- [ ] Advanced analytics dashboard

## ⚡ Performance Tips

- Use `next/image` for optimized images
- Implement lazy loading for listings
- Cache frequently accessed data
- Use server components where possible
- Optimize database queries with indexes
- Compress images before upload

## 🔧 Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
DATABASE_URL="postgresql://localhost:5432/rentohub_dev"
```

### Production
```bash
NODE_ENV=production
DATABASE_URL="your-production-db-url"
```

## 📱 Mobile Responsiveness

All pages are mobile-responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

Built with ❤️ using Next.js 14, Prisma, and Stripe
