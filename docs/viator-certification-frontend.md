# Viator API Certification - Front-end Checks (v2 API)

## Partner Details

**Company name:**
Atacama Dark Sky

**PUID/partner unique ID:**
(Awaiting assignment)

**Email address:**
vicente.litvak@gmail.com

**Implementation details:**

| Field | Value |
|-------|-------|
| Link to test/staging environment | https://atacamadarksky.cl (production) |
| Business type | Both B2C and B2B |
| Platform | Desktop + Mobile Web (responsive) |

**Will you sell manual confirmation type products?**
No. We filter out manual confirmation products (confirmationType != "INSTANT") to ensure immediate booking confirmation for customers.

**Do you indicate the provider of the reviews (Viator/Tripadvisor)?**
Yes, we display "Reviews from Viator & Tripadvisor" next to all review content and ratings.

**Do you display the Viator/Tripadvisor logo anywhere on your site?**
Yes, we display the Viator logo on product cards and detail pages with proper attribution.

**Is there anything we need to know about your implementation?**
We are a local tour operator in San Pedro de Atacama offering our own stargazing tours. We want to integrate Viator's affiliate API to offer complementary experiences (day tours, adventure activities, cultural tours) to our customers, creating a one-stop platform for Atacama experiences.

---

## User Flow and Platform Navigation

**Please briefly describe your platform's user-flow:**

1. **Landing Page** → Customer arrives at atacamadarksky.cl
2. **Browse Tours** → Customer clicks "Explore More Tours" section
3. **Search/Filter** → Customer can search by keyword or filter by category, price, duration
4. **Product List** → Shows available tours with images, ratings, prices
5. **Product Detail** → Customer views full details, photos, reviews, availability calendar
6. **Select Date/Travelers** → Customer picks date and number of travelers
7. **Checkout** → Customer enters contact details and booking questions
8. **Payment** → Customer enters payment information
9. **Confirmation** → Booking confirmed, voucher displayed and emailed

---

## Search Functionality

**Search bar with contextual search suggestions:**
*[Screenshot to be provided]*
- Search input with placeholder "Search tours in Atacama..."
- Autocomplete suggestions based on product titles

**What search options do you offer?**
- [x] Search by destination (San Pedro de Atacama - fixed)
- [ ] Search by attraction (not implemented initially)
- [ ] Search by product code (admin only)
- [x] Freetext search (product titles and descriptions)

---

## Filtering Options

**Filter by category:**
*[Screenshot to be provided]*
Categories based on Viator tags:
- Adventure & Outdoor
- Cultural & Historical
- Day Trips
- Food & Drink
- Nature & Wildlife
- Photography Tours

**Filter by attraction:**
*[Screenshot to be provided]*
Not implemented initially.

**Other filtering options supported:**

| Filter | Implementation |
|--------|----------------|
| Price | Range slider (min-max USD) |
| Review rating | Stars (4+, 4.5+, 5 only) |
| Duration | Quick filters (< 3h, 3-6h, Full day, Multi-day) |
| Cancellation policy | Free cancellation toggle |
| Special offers | Discounted products toggle |

---

## Sort Orders

**Available sort order options:**
*[Screenshot to be provided]*

| Sort Option | API Parameter |
|-------------|---------------|
| Recommended (default) | TRAVELER_RATING + DESCENDING |
| Price: Low to High | PRICE + ASCENDING |
| Price: High to Low | PRICE + DESCENDING |
| Top Rated | TRAVELER_RATING + DESCENDING |
| Most Popular | REVIEW_COUNT + DESCENDING |

**Default sort order:**
Recommended (TRAVELER_RATING, DESCENDING) - Shows highest-rated products first.

---

## Tags Usage

| Tag ID | Tag Name | Usage |
|--------|----------|-------|
| 21972 | Excellent Quality | Backend: Boost in sort order |
| 22083 | Likely To Sell Out | Frontend: Badge "Likely to Sell Out" |
| 21074 | Unique experiences | Frontend: Badge "Unique Experience" |
| 367652 | Top Product | Backend: Boost in recommendations |
| 367651 | DSA non-compliant | Backend: Filter out these products |
| 367650 | Additional Fees | Frontend: Warning icon with tooltip |

---

## Product Details

**Important product information displayed:**
*[Screenshots to be provided]*

| Element | Displayed | Location |
|---------|-----------|----------|
| Product title | Yes | Header |
| Description (full) | Yes | Overview section |
| Duration | Yes | Quick facts |
| Cancellation policy | Yes | Quick facts + Booking section |
| Inclusions | Yes | What's Included section |
| Exclusions | Yes | What's Not Included section |
| Meeting point / Pickup | Yes | Meeting & Pickup section |
| Photos | Yes | Gallery carousel |
| Reviews | Yes | Reviews section |
| Review rating | Yes | Header + Reviews section |
| Price (from) | Yes | Header + Booking section |
| Availability calendar | Yes | Booking section |

---

## Age Bands / Passenger Mix

**Appropriate bucketing:**
We display age band options based on product's pricingInfo.ageBands:
- ADULT (default)
- CHILD (when available)
- INFANT (when available)
- SENIOR (when available)
- YOUTH (when available)

**Appropriate limiting:**
- Enforce minTravelersPerBooking and maxTravelersPerBooking per age band
- Validate total travelers against product capacity
- Display clear error if limits exceeded

---

## Availability and Pricing

**Calendar view:**
*[Screenshot to be provided]*
- Monthly calendar showing available dates
- Unavailable dates grayed out
- Selected date highlighted
- Price displayed for selected date

**Pricing calculation:**
- Base price from /availability/schedules
- Real-time price verification via /availability/check
- Price breakdown shown per traveler type
- Total price clearly displayed before checkout

**Real-time availability and pricing checks:**
- /availability/check called when date + travelers selected
- If price differs from displayed, show updated price with notification
- Customer must acknowledge price change before proceeding

---

## Product Options

**Product option title and description displayed:**
Yes, when multiple options available, we show:
- Option title
- Option description
- Price per option

**Start times included:**
Yes, available start times shown after date selection.

**Language guide verified:**
Yes, we display available language options from languageGuides.

**Pickup verified on product option level:**
Yes, we check logistics.travelerPickup and display pickup options when available.

---

## Booking Process

**Booker identified:**
Checkout form collects:
- First name (required)
- Last name (required)
- Email (required)
- Phone (when required by product)
- Country (required)

**Booking questions per person:**
- Display all questions from /products/booking-questions
- Per-traveler questions collected for each traveler
- Per-booking questions collected once

**Traveler pickup:**
When logistics.travelerPickup.allowCustomTravelerPickup = true:
- Display pickup location input
- Validate hotel/address format

**Cancellation policy clearly communicated:**
- Displayed on product detail page
- Repeated on checkout page
- Shown in confirmation email

**Contact details included:**
Booker contact details displayed in:
- Checkout summary
- Confirmation page
- Confirmation email

**Test booking confirmed:**
*[To be completed after Full+Booking Access granted]*

**Booking status communicated:**
- CONFIRMED: "Your booking is confirmed!"
- REJECTED: "Sorry, this tour is no longer available"
- Error/Timeout: "Processing your booking, please wait..."

**Viator voucher shared with customers:**
- Displayed immediately after booking
- Downloadable as PDF
- Sent via email

---

## HTTPS

**Is your checkout served over HTTPS?**
Yes, entire site including checkout is served over HTTPS with valid SSL certificate.

---

## Cancellation Process

**Refund amount communicated prior to cancellation:**
Yes, we call /cancel-quote and display:
- Refund amount
- Refund percentage
- Effective cancellation policy

**Test booking canceled:**
*[To be completed after Full+Booking Access granted]*

---

## Miscellaneous

**Appropriate use of branding:**
- Viator logo used according to brand guidelines
- "Powered by Viator" attribution on product pages
- No modification of Viator content

**Protected Viator Unique Content non-indexed:**
- Reviews: noindex meta tag applied
- Attraction content: noindex meta tag applied
- robots.txt excludes Viator content paths

---

## Screenshots Checklist

*[To be provided with implementation]*

| Screenshot | Status |
|------------|--------|
| Search bar with suggestions | Pending |
| Category filter | Pending |
| Price filter | Pending |
| Sort order options | Pending |
| Product list page | Pending |
| Product detail page | Pending |
| Availability calendar | Pending |
| Checkout form | Pending |
| Payment page | Pending |
| Confirmation page | Pending |
| Voucher display | Pending |
| Cancellation flow | Pending |
