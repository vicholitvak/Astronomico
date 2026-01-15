# Viator API Certification - Back-end Checks (v2 API)

## General Questions

**What is your company name?**
Atacama Dark Sky

**Is this a B2B or B2C implementation, or both?**
Both B2B and B2C

**Is this implementation for desktop, mobile, or app?**
Desktop and Mobile Web (responsive website)

**How many destinations do you support? Which destinations do you exclude, if any, and why?**
We support 1 destination: San Pedro de Atacama, Chile (destination ID: 5499). This is our local market where we operate our own stargazing tours and want to offer complementary experiences to our customers.

**How many products do you currently support? If you filter out certain products, what criteria is that based on? Do you plan to add more products after launch?**
We plan to support all products available in San Pedro de Atacama (~235 products). We filter out:
- Manual confirmation products (confirmationType != INSTANT) - we only support instant confirmation
- Products without availability in the next 90 days

---

## Endpoint Usage

| Endpoint | Ingestion | Real-time | Additional notes |
|----------|-----------|-----------|------------------|
| /products/modified-since | Every 30 min | - | Delta updates for product catalog |
| /products/bulk | - | On-demand | For new products from recommendations |
| /products/{product-code} | - | On-demand | Single product details |
| /availability/schedules/modified-since | Every 30 min | - | Delta updates for availability |
| /availability/schedules/bulk | - | - | Not used |
| /availability/schedules/{product-code} | - | On-demand | When customer views product |
| /products/search | - | On-demand | Customer search requests |
| /search/freetext | - | - | Not used initially |
| /products/tags | Weekly | - | Cache tags for filtering |
| /products/booking-questions | - | On-demand | During checkout |
| /locations/bulk | Monthly | On-demand | When new locations found |
| /exchange-rates | Based on expiry | - | Cache and refresh on expiry |
| /reviews/product | Weekly | - | Cache reviews |
| /suppliers/search/product-codes | - | - | Not used |
| /destinations | Monthly | - | Cache destinations |
| /attractions/search | - | - | Not used initially |
| /attractions/{attraction-id} | - | - | Not used initially |
| /products/recommendations | - | On-demand | On product pages |
| /availability/check | - | On-demand | Before booking hold |
| /bookings/hold | - | - | Not used (using cart/hold) |
| /bookings/book | - | - | Not used (using cart/book) |
| /bookings/cart/hold | - | On-demand | At checkout, strong purchase intent |
| /bookings/cart/book | - | On-demand | After payment confirmation |
| /v1/checkoutsessions/{sessionToken}/paymentaccounts | - | On-demand | API payments solution |
| /bookings/status | - | On-demand | Verify booking, hourly for PENDING |
| /bookings/modified-since | Every 5 min | - | Supplier cancellations |
| /bookings/modified-since/acknowledge | - | On-demand | Acknowledge cancellations |
| /bookings/cancel-reasons | Monthly | - | Cache reasons |
| /bookings/{booking-reference}/cancel-quote | - | On-demand | Before cancellation |
| /bookings/{booking-reference}/cancel | - | On-demand | Process cancellation |
| /amendment/check/{booking-reference} | - | - | Not used initially |
| /amendment/quote | - | - | Not used initially |
| /amendment/amend/{quote-reference} | - | - | Not used initially |

---

## Booking Flow

### Flow Diagram

```
1. Customer searches products
   → GET /products/search (destination: 5499)

2. Customer views product details
   → GET /products/{product-code}
   → GET /availability/schedules/{product-code}

3. Customer selects date and travelers
   → POST /availability/check (real-time verification)

4. Customer proceeds to checkout
   → GET /products/booking-questions/{product-code}

5. Customer enters details and payment info (strong purchase intent)
   → POST /bookings/cart/hold
   → Verify hold status (CONFIRMED/REJECTED)

6. Process payment
   → POST /v1/checkoutsessions/{sessionToken}/paymentaccounts
   → Get paymentToken

7. Complete booking
   → POST /bookings/cart/book (with paymentToken)
   → Verify booking status

8. Confirmation
   → Display voucher to customer
   → Send confirmation email
```

### Booking Logs
**Note:** We are awaiting Full + Booking Access to complete test bookings in sandbox. Our current API key (cd109c4f-1b0d-4810-976d-eef12ee178d0) only has Basic Access. Once upgraded, we will provide complete booking logs.

---

## Product Search

**Do you provide search results to customers that are returned by our search endpoint or do you return search results directly from your database?**
We use a hybrid approach:
- Initial catalog is ingested via /products/modified-since into our database
- Search results are returned from our database for performance
- Real-time /products/search is used when customer applies specific filters

**Can you confirm that the pagination has been applied in your implementation?**
Yes, we paginate with count=20 per page (below the 50 maximum). Additional requests are only made when the customer clicks "Load more" or navigates to the next page.

---

## Attractions

**Do you use attraction data from the API? If so, could you confirm that it's not indexed?**
Not using attractions data initially. If implemented later, we will add noindex meta tags to prevent indexing.

---

## Reviews

**Do you display Viator or Tripadvisor reviews from the API? If so, could you confirm that this data is not indexed?**
Yes, we display reviews. We add noindex meta tags to review content and include the attribution text: "Total review count and overall rating based on Viator and Tripadvisor reviews"

**Do you indicate the provider of the reviews (Viator/Tripadvisor)?**
Yes, we display: "Reviews from Viator & Tripadvisor" next to all review content.

---

## Exchange Rates

**Do you use the Viator exchange rates from the /exchange-rates endpoint?**
Yes, we cache exchange rates and refresh based on the expiry timestamp from the response. We convert prices to USD for display and booking.

---

## Locations

**Do you have access to Google Places API to retrieve details of Google locations?**
Yes, we have Google Places API access for our existing implementation and will use it to resolve Google location references.

---

## Recommendations

**Do you use the /products/recommendations endpoint?**
Yes, we use it on product detail pages to show "Similar experiences" and at checkout when a selected product becomes unavailable.

**Which product content endpoint do you use to retrieve product content details for products returned in the /products/recommendations response?**
We use /products/bulk to retrieve details for up to 10 recommended products at a time, as these products may not be in our ingested catalog.

---

## Real-time Availability and Pricing

**Can you confirm that you check real-time availability and pricing with the /availability/check endpoint before submitting a booking request?**
Yes, we always call /availability/check after the customer selects a date and passenger mix, and before proceeding to checkout.

**If /availability/check returns a different price than previously displayed, do you apply the new price?**
Yes, if the price differs from /schedules, we display the updated price from /availability/check and require customer confirmation before proceeding.

---

## Contact Details

**How do you collect booker contact details?**
We collect during checkout:
- First name (required)
- Last name (required)
- Email (required)
- Phone number (required for products that need it)
- Country code (required)

---

## Booking Questions

**Do you display all booking questions returned by the /products/booking-questions endpoint?**
Yes, we display all mandatory booking questions and collect answers per traveler when required.

**Do you validate booking question answers before submitting the booking?**
Yes, we validate:
- Required questions are answered
- Format validation (email, phone, etc.)
- Age band requirements

---

## Booking Hold

**Do you use the /bookings/cart/hold endpoint?**
Yes, we use /bookings/cart/hold exclusively (not /bookings/hold).

**When do you place a booking hold?**
Only when there is strong purchase intent - specifically when the customer:
1. Has completed all required booking information
2. Is on the payment page ready to enter card details

**Do you verify the hold status before proceeding with payment?**
Yes, we check the status field:
- CONFIRMED: Proceed with payment
- REJECTED: Display error with rejectionReasonCode explanation

**How do you handle hold expiration?**
We track availabilityHoldExpiresAt and pricingHoldExpiresAt. If either expires before booking completes, we place a new hold with the new bookingRef.

---

## Making a Booking

**Payment Solution:**
We will use the API payments solution (PARTNER_FORM).

**Implementation Details:**
1. Use paymentDataSubmissionUrl from /bookings/cart/hold response
2. POST to /v1/checkoutsessions/{sessionToken}/paymentaccounts with:
   - Full card details (number, cvv, expMonth, expYear, name)
   - Billing address (country, postalCode)
3. Include x-trip-clientid header with partner PID
4. Include x-trip-requestid header with unique request ID
5. Use sessionAccountToken as paymentToken in /bookings/cart/book
6. Include device fingerprint via JavaScript library

**Currency:**
We will use USD for all bookings (supported currency for affiliate partners).

**Error Handling:**
- Success: Display confirmation and voucher
- Failure: Display appropriate error message, allow retry

---

## Timeout

**What timeout do you have configured for API services?**
We use 120 seconds timeout for all booking endpoints (/bookings/cart/hold, /bookings/cart/book, /bookings/status).

**How do you handle timeout responses from booking endpoints?**
On timeout or error from /bookings/cart/book:
1. Do NOT assume booking failed
2. Poll /bookings/status until final status received
3. Wait at least 1 minute between retries
4. Only communicate status to customer once confirmed by API

---

## Checking Booking Status

**Do you verify the status field before confirming to the customer?**
Yes, we only confirm booking to customer when status = CONFIRMED.

**How do you handle PENDING status?**
We do not support manual confirmation products, so PENDING status should not occur. If it does, we poll /bookings/status hourly until resolved.

**How do you handle error/timeout responses?**
We poll /bookings/status until we receive a definitive response, waiting at least 1 minute between retries.

---

## Vouchers

**How do you provide vouchers to customers?**
1. Display voucher immediately after booking confirmation
2. Send voucher via email to booker
3. Provide voucher download link in booking confirmation page

---

## Traveler Cancellations

**Do you call /bookings/{booking-reference}/cancel-quote before canceling?**
Yes, we always show the refund amount (refundAmount, refundPercentage) before processing cancellation.

**Do you include a cancellation reason from /bookings/cancel-reasons?**
Yes, we cache cancellation reasons (monthly refresh) and require customer to select one.

---

## Supplier Cancellations and Amendments

**Do you poll /bookings/modified-since for supplier cancellations?**
Yes, we poll every 5 minutes to detect supplier cancellations.

**Do you acknowledge cancellations?**
Yes, we call /bookings/modified-since/acknowledge within the acknowledgeBy timeframe.

**How do you notify customers of supplier cancellations?**
We send immediate email notification with cancellation details and refund information.

---

## Traveler-initiated Amendments

**Do you support amendments?**
Not initially. We will implement in a future phase if needed.

---

## Manual Confirmation Type Products

**Do you sell manual confirmation type products?**
No, we filter out all products where confirmationType != "INSTANT". Our implementation only supports instant confirmation products.

---

## HTTPS

**Is your implementation served over HTTPS?**
Yes, our site (atacamadarksky.cl) uses HTTPS with valid SSL certificate.

---

## PCI DSS Compliance

**Are you PCI DSS compliant?**
We use Viator's API payments solution which handles card data securely. Our implementation:
- Does not store card details
- Uses secure iframe/API for payment submission
- All payment data transmitted over HTTPS
- We are SAQ A compliant (card data handled by third party)
