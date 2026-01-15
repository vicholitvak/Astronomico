# Email to Viator API Integrations

**To:** affiliateapi@tripadvisor.com
**Subject:** Atacama Dark Sky - API Certification Documents + Full Booking Access Request

---

Hi Ewelina,

Thank you for approving our account for booking access! We're excited to integrate Viator's affiliate API into our platform.

I've completed both certification forms and attached them to this email:
- **Back-end certification form** (attached)
- **Front-end certification form** (attached)

## Quick Summary

| Item | Details |
|------|---------|
| Company | Atacama Dark Sky |
| Implementation | B2B + B2C |
| Platform | Desktop + Mobile Web |
| Destination | San Pedro de Atacama (ID: 5499) |
| Products | ~235 tours (instant confirmation only) |

## Request: Full + Booking Access API Key

I noticed that the production API key I generated from the Tools section has **"Basic Access"** only:
- Key: `cd109c4f-1b0d-4810-976d-eef12ee178d0`

With Basic Access, I can use:
- `/products/search` ✓
- `/products/{code}` ✓
- `/availability/schedules/{code}` ✓

But I cannot access the booking endpoints:
- `/availability/check` → "Endpoint access denied"
- `/bookings/cart/hold` → "Endpoint access denied"
- `/bookings/cart/book` → "Endpoint access denied"

Since our account was approved for booking access, could you please upgrade my API key to **Full + Booking Access** so I can:
1. Complete test bookings in sandbox
2. Provide the booking logs required for certification
3. Finish the front-end screenshots of the booking flow

## What's Ready

**Back-end implementation:**
- Content ingestion via `/products/modified-since` (every 30 min)
- Availability ingestion via `/availability/schedules/modified-since` (every 30 min)
- Full booking flow code ready (pending API access)
- Cancellation flow implemented
- Supplier cancellation polling (every 5 min)
- 120 second timeout configured

**Front-end implementation:**
- Product search and filtering
- Product detail pages with reviews
- Availability calendar
- Checkout flow
- Voucher display

## Pending Items (need Full + Booking Access)

- [ ] Test booking logs for back-end certification
- [ ] Screenshots of payment flow for front-end certification
- [ ] Test cancellation logs

Once I have Full + Booking Access, I can complete these items within 2-3 days.

Please let me know if you need any additional information or clarification on the certification forms.

Best regards,

**Vicente Litvak**
Atacama Dark Sky
vicente.litvak@gmail.com
+56 9 3513 4669

---

**Attachments:**
1. viator-certification-backend.md
2. viator-certification-frontend.md
