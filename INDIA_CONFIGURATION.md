# India-Specific Configuration

## Location Settings

### Default Location: Jagatpura, Jaipur, Rajasthan
- **Latitude**: 26.8506
- **Longitude**: 75.8027
- **Zoom Level**: 13 (neighborhood view)

All map components default to Jagatpura, Jaipur area when no location is specified.

## Currency & Localization

### Currency
- **Currency Code**: INR (Indian Rupee)
- **Symbol**: ₹
- **Format**: Using `en-IN` locale with Intl.NumberFormat
- **Example**: ₹1,500.00

### Date & Time
- **Timezone**: Asia/Kolkata (IST - Indian Standard Time)
- **Locale**: en-IN
- **Date Format**: DD MMM YYYY (e.g., 09 Dec 2025)
- **Time Format**: 12-hour with AM/PM

### Address Geocoding
- **API**: OpenStreetMap Nominatim (Free)
- **Languages**: English & Hindi (`en,hi`)
- **Format**: Supports Indian address format with city, state, PIN code

## Map Integration

### Leaflet + OpenStreetMap
- **No API Key Required**: 100% free, no registration needed
- **Tile Server**: OpenStreetMap standard tiles
- **Coverage**: Excellent coverage of Jaipur and all of India
- **Features**:
  - Interactive location picker
  - Reverse geocoding for addresses
  - Real-time delivery tracking
  - Custom markers for pickup/dropoff points

### Map Components
1. **MapPicker**: Interactive selection for listing locations
2. **MapView**: Static display of listing location
3. **LiveMapTracker**: Real-time agent tracking for deliveries

## Payment Gateway

### Stripe (International)
- Supports INR currency
- Configure in Stripe Dashboard → Settings → Business Settings → Currency
- Indian payment methods supported:
  - UPI
  - Cards (Visa, Mastercard, RuPay)
  - Netbanking
  - Wallets

### Stripe Setup for India
```bash
# In Stripe Dashboard:
1. Business Profile → India
2. Currency → INR
3. Payment Methods → Enable UPI, Cards, Netbanking
```

## AWS S3 Configuration

Current Region: **eu-north-1** (Stockholm)

### Recommendation for India:
Change to Asia Pacific region for better performance:
- **ap-south-1** (Mumbai) - Recommended
- **ap-southeast-1** (Singapore) - Alternative

Update in `.env`:
```env
AWS_REGION="ap-south-1"
```

## Target Audience

### Primary Market
- **City**: Jaipur, Rajasthan
- **Area**: Jagatpura and surrounding neighborhoods
- **Demographics**: Students, young professionals, event organizers
- **Use Cases**:
  - Electronics for students
  - Party equipment
  - Photography gear
  - Tools and equipment
  - Sports equipment
  - Outdoor/camping gear

### Language Support
- **Primary**: English
- **Secondary**: Hindi (future enhancement)
- Address geocoding supports both English and Hindi

## Pricing Considerations

### Typical Rental Prices (Reference)
- Electronics: ₹200-1,000/day
- Photography: ₹500-2,000/day
- Tools: ₹100-500/day
- Party Equipment: ₹300-1,500/day
- Sports: ₹150-800/day

### Platform Fees
- **Service Fee**: 10% of rental amount
- **Delivery Fee**: Calculated based on distance
- **Deposit**: Set by lender (typically 50-100% of item value)

## Delivery Zones

### Recommended Service Area
- **Primary**: Jagatpura, Malviya Nagar, Mansarovar
- **Secondary**: All Jaipur zones
- **Maximum Distance**: 25-30 km radius from city center

### Delivery Fee Structure (Suggested)
- Within 5 km: ₹50
- 5-10 km: ₹100
- 10-15 km: ₹150
- 15+ km: ₹200

## Local Compliance

### Business Registration
For launching in India, ensure:
- GST Registration (if applicable)
- Business license in Rajasthan
- Terms of Service compliance with Indian laws
- Privacy Policy adhering to IT Act 2000

### Tax Considerations
- GST applicable on platform fees (18%)
- TDS if applicable
- Consult CA for proper tax structure

## Next Steps for India Launch

1. ✅ Location set to Jagatpura, Jaipur
2. ✅ Currency changed to INR (₹)
3. ✅ Timezone set to IST
4. ✅ Maps configured (no API key needed)
5. ⚠️ Setup Stripe for INR payments
6. ⚠️ Consider moving AWS S3 to Mumbai (ap-south-1)
7. ⚠️ Add Hindi language support (future)
8. ⚠️ Setup local payment methods (UPI, etc.)
9. ⚠️ Register business in India
10. ⚠️ Ensure legal compliance

## Contact & Support

For launching in Jaipur market:
- Focus on college campuses (Manipal, Amity, etc.)
- Partner with event management companies
- Target photography and videography professionals
- Engage with local sports clubs and outdoor enthusiasts

---

**Note**: This configuration is optimized for Jagatpura, Jaipur, Rajasthan, India market. Adjust as needed for expansion to other cities.
