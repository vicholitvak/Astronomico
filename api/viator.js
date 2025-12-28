/**
 * Viator Supplier API
 *
 * Implements Viator Supplier API specification:
 * - POST /api/viator/tour-list - Get list of products
 * - POST /api/viator/availability - Real-time availability check
 * - POST /api/viator/batch-availability - Batch availability for date ranges
 * - POST /api/viator/booking - Create booking
 * - POST /api/viator/cancel - Cancel booking
 * - POST /api/viator/amend - Amend booking (optional)
 *
 * Documentation: https://docs.viator.com/supplier-api/technical/
 */

import { insert, query } from '../lib/db.js';
import { addToGoogleCalendar } from './google-calendar.js';

// ============ VIATOR API CREDENTIALS ============
const VIATOR_API_KEY = process.env.VIATOR_API_KEY || '';
const VIATOR_SUPPLIER_ID = process.env.VIATOR_SUPPLIER_ID || 'ATACAMA_DARKSKY';

// ============ CONFIGURATION ============
const PRODUCTS = {
  // Tour Regular (grupo compartido)
  'ADS-REGULAR': {
    supplierProductCode: 'ADS-REGULAR',
    supplierOptionCode: 'DEFAULT',
    name: 'San Pedro de Atacama: Stargazing Tour with Telescope',
    description: 'Experience the clearest skies on Earth with our stargazing tour in the Atacama Desert. Professional astronomers guide you through the southern hemisphere constellations.',
    maxCapacity: 16,
    tourType: 'regular',
    currency: 'USD',
    pricePerPerson: 50.00, // USD
    netPricePerPerson: 35.00, // Net price to Viator (30% commission)
    cutoffHours: 2, // 2 hours before tour
    duration: 150, // 2.5 hours in minutes
    availableTimes: ['21:00'],
    ageRange: { min: 0, max: 99 },
    city: 'San Pedro de Atacama',
    country: 'CL'
  },
  // Tour Privado
  'ADS-PRIVATE': {
    supplierProductCode: 'ADS-PRIVATE',
    supplierOptionCode: 'DEFAULT',
    name: 'Atacama: Private Stargazing Expedition to Secret Spot',
    description: 'Exclusive 4x4 expedition to a Bortle Class 1 location with zero light pollution. Maximum 4 guests. Includes smart telescope, wine, hot drinks, and photo session.',
    maxCapacity: 4,
    tourType: 'private',
    currency: 'USD',
    pricePerPerson: 133.00, // USD
    netPricePerPerson: 93.00, // Net price to Viator
    cutoffHours: 4, // 4 hours before tour
    duration: 180, // 3 hours
    availableTimes: ['20:00', '20:30', '21:00'],
    ageRange: { min: 0, max: 99 },
    city: 'San Pedro de Atacama',
    country: 'CL'
  }
};

// USD to CLP exchange rate (update periodically)
const USD_TO_CLP = 980;

// Calculate payment amount in CLP from USD
function calculatePaymentCLP(priceUSD, persons) {
  return Math.round(priceUSD * persons * USD_TO_CLP);
}

// ============ CHILE TIMEZONE HELPER ============
function getChileTimezoneOffset(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const firstSundayApril = new Date(year, 3, 1);
  while (firstSundayApril.getDay() !== 0) {
    firstSundayApril.setDate(firstSundayApril.getDate() + 1);
  }

  const firstSundaySept = new Date(year, 8, 1);
  while (firstSundaySept.getDay() !== 0) {
    firstSundaySept.setDate(firstSundaySept.getDate() + 1);
  }

  const isWinterTime = (
    (month > 3 || (month === 3 && day >= firstSundayApril.getDate())) &&
    (month < 8 || (month === 8 && day < firstSundaySept.getDate()))
  );

  return isWinterTime ? '-04:00' : '-03:00';
}

// ============ AUTHENTICATION ============
function validateViatorAuth(data) {
  const apiKey = data.ApiKey || data.apiKey;

  if (!apiKey) {
    return { valid: false, error: 'Missing ApiKey in request' };
  }

  const expectedApiKey = process.env.VIATOR_WEBHOOK_API_KEY;

  if (apiKey === expectedApiKey) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid API key' };
}

// Generate unique booking ID for Viator
function generateViatorBookingId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VTR-${timestamp}-${random}`;
}

// Generate ISO timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// ============ MAIN HANDLER ============
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Viator only uses POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      Success: false,
      ErrorMessage: 'Method not allowed. Use POST.',
      Timestamp: getTimestamp()
    });
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/viator', '');
  const data = req.body || {};

  // Admin endpoints (no auth required - internal use)
  if (path.includes('/admin/') || req.query.admin === 'true') {
    return await handleAdminEndpoints(req, res, path, data);
  }

  // Validate authentication for Viator webhooks
  const auth = validateViatorAuth(data);
  if (!auth.valid) {
    return res.status(401).json({
      Success: false,
      ErrorMessage: auth.error,
      Timestamp: getTimestamp()
    });
  }

  // Detailed logging
  console.log(`[VIATOR] ========== REQUEST ==========`);
  console.log(`[VIATOR] Path: ${path}`);
  console.log(`[VIATOR] Body:`, JSON.stringify(data));

  try {
    // Route based on path
    if (path.includes('/tour-list') || path.includes('/tourlist')) {
      return await handleTourList(req, res, data);
    }
    if (path.includes('/batch-availability') || path.includes('/batchavailability')) {
      return await handleBatchAvailability(req, res, data);
    }
    if (path.includes('/availability')) {
      return await handleAvailability(req, res, data);
    }
    if (path.includes('/cancel')) {
      return await handleCancel(req, res, data);
    }
    if (path.includes('/amend')) {
      return await handleAmend(req, res, data);
    }
    if (path.includes('/booking') || path.includes('/book')) {
      return await handleBooking(req, res, data);
    }

    // Default: return API info
    return res.status(200).json({
      Success: true,
      Api: 'Viator Supplier API',
      Version: '2.0',
      Supplier: VIATOR_SUPPLIER_ID,
      Products: Object.keys(PRODUCTS),
      Endpoints: [
        'POST /api/viator/tour-list',
        'POST /api/viator/availability',
        'POST /api/viator/batch-availability',
        'POST /api/viator/booking',
        'POST /api/viator/cancel',
        'POST /api/viator/amend'
      ],
      Timestamp: getTimestamp()
    });

  } catch (error) {
    console.error('[VIATOR] API error:', error);
    return res.status(500).json({
      Success: false,
      ErrorMessage: error.message,
      Timestamp: getTimestamp()
    });
  }
}

// ============ TOUR LIST API ============
async function handleTourList(req, res, data) {
  const { SupplierId, ExternalReference } = data;

  console.log(`[VIATOR] Tour List request for supplier: ${SupplierId}`);

  const tours = Object.values(PRODUCTS).map(product => ({
    SupplierProductCode: product.supplierProductCode,
    SupplierOptionCode: product.supplierOptionCode,
    ProductName: product.name,
    ProductDescription: product.description,
    Duration: product.duration,
    Currency: product.currency,
    RetailPrice: product.pricePerPerson,
    NetPrice: product.netPricePerPerson,
    MaxParticipants: product.maxCapacity,
    CutoffHours: product.cutoffHours,
    AvailableTimes: product.availableTimes,
    Location: {
      City: product.city,
      Country: product.country
    },
    AgeRange: product.ageRange,
    Active: true
  }));

  return res.status(200).json({
    Success: true,
    SupplierId: VIATOR_SUPPLIER_ID,
    ExternalReference: ExternalReference || null,
    Tours: tours,
    Timestamp: getTimestamp()
  });
}

// ============ AVAILABILITY API (Real-time) ============
async function handleAvailability(req, res, data) {
  const {
    SupplierProductCode,
    SupplierOptionCode,
    StartDate,
    TravellerMix,
    ExternalReference
  } = data;

  console.log(`[VIATOR] Availability check: ${SupplierProductCode} on ${StartDate}`);

  const product = PRODUCTS[SupplierProductCode];
  if (!product) {
    return res.status(200).json({
      Success: true,
      Available: false,
      UnavailabilityReason: 'INACTIVE',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  const totalTravelers = parseInt(TravellerMix?.Total || TravellerMix?.Adult || 1);

  // Check if exceeds max capacity
  if (totalTravelers > product.maxCapacity) {
    return res.status(200).json({
      Success: true,
      Available: false,
      UnavailabilityReason: 'TRAVELLER_MISMATCH',
      Message: `Maximum ${product.maxCapacity} travelers allowed`,
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  // Check blocked dates
  const blockedResult = await query(
    `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
    [StartDate]
  );

  if (blockedResult.rows.length > 0) {
    const blockInfo = blockedResult.rows[0];
    if (blockInfo.block_type === 'full' ||
        (blockInfo.block_type === 'private_only' && product.tourType === 'regular')) {
      return res.status(200).json({
        Success: true,
        Available: false,
        UnavailabilityReason: 'BLOCKED_OUT',
        ExternalReference,
        Timestamp: getTimestamp()
      });
    }
  }

  // Check cutoff time
  const now = new Date();
  const tourDateTime = new Date(`${StartDate}T${product.availableTimes[0]}:00${getChileTimezoneOffset(StartDate)}`);
  const cutoffTime = new Date(tourDateTime.getTime() - (product.cutoffHours * 60 * 60 * 1000));

  if (now > cutoffTime) {
    return res.status(200).json({
      Success: true,
      Available: false,
      UnavailabilityReason: 'PAST_CUTOFF_DATE',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  // Check current bookings
  const bookingsResult = await query(
    `SELECT COALESCE(SUM(persons), 0) as total_persons
     FROM bookings
     WHERE date = $1 AND tour_type = $2
     AND status NOT IN ('cancelled', 'rejected')`,
    [StartDate, product.tourType]
  );

  const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
  const availableSpots = product.maxCapacity - bookedPersons;

  if (totalTravelers > availableSpots) {
    return res.status(200).json({
      Success: true,
      Available: false,
      UnavailabilityReason: 'SOLD_OUT',
      AvailableSpots: availableSpots,
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  // Available!
  return res.status(200).json({
    Success: true,
    Available: true,
    SupplierProductCode: product.supplierProductCode,
    SupplierOptionCode: product.supplierOptionCode,
    StartDate: StartDate,
    AvailableTimes: product.availableTimes,
    AvailableSpots: availableSpots,
    Currency: product.currency,
    RetailPrice: product.pricePerPerson,
    NetPrice: product.netPricePerPerson,
    TotalRetailPrice: product.pricePerPerson * totalTravelers,
    TotalNetPrice: product.netPricePerPerson * totalTravelers,
    ExternalReference,
    Timestamp: getTimestamp()
  });
}

// ============ BATCH AVAILABILITY API ============
async function handleBatchAvailability(req, res, data) {
  const {
    SupplierProductCode,
    StartDate,
    EndDate,
    ExternalReference
  } = data;

  console.log(`[VIATOR] Batch availability: ${SupplierProductCode} from ${StartDate} to ${EndDate}`);

  const product = PRODUCTS[SupplierProductCode];
  if (!product) {
    return res.status(200).json({
      Success: true,
      Availabilities: [],
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  const availabilities = [];
  let currentDate = new Date(StartDate + 'T12:00:00');
  const endDate = new Date(EndDate + 'T12:00:00');

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check blocked dates
    const blockedResult = await query(
      `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
      [dateStr]
    );

    let status = 'AVAILABLE';
    let availableSpots = product.maxCapacity;

    if (blockedResult.rows.length > 0) {
      const blockInfo = blockedResult.rows[0];
      if (blockInfo.block_type === 'full') {
        status = 'BLOCKED_OUT';
        availableSpots = 0;
      } else if (blockInfo.block_type === 'private_only' && product.tourType === 'regular') {
        status = 'BLOCKED_OUT';
        availableSpots = 0;
      }
    }

    // Check bookings if not blocked
    if (status === 'AVAILABLE') {
      const bookingsResult = await query(
        `SELECT COALESCE(SUM(persons), 0) as total_persons
         FROM bookings
         WHERE date = $1 AND tour_type = $2
         AND status NOT IN ('cancelled', 'rejected')`,
        [dateStr, product.tourType]
      );

      const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
      availableSpots = Math.max(0, product.maxCapacity - bookedPersons);

      if (availableSpots === 0) {
        status = 'SOLD_OUT';
      }
    }

    for (const time of product.availableTimes) {
      availabilities.push({
        Date: dateStr,
        Time: time,
        Status: status,
        AvailableSpots: availableSpots,
        Currency: product.currency,
        RetailPrice: product.pricePerPerson,
        NetPrice: product.netPricePerPerson
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return res.status(200).json({
    Success: true,
    SupplierProductCode: SupplierProductCode,
    Availabilities: availabilities,
    ExternalReference,
    Timestamp: getTimestamp()
  });
}

// ============ BOOKING API ============
async function handleBooking(req, res, data) {
  const {
    ViatorBookingReference,
    SupplierProductCode,
    SupplierOptionCode,
    StartDate,
    StartTime,
    TravellerMix,
    LeadTraveller,
    ContactDetails,
    PickupDetails,
    SpecialRequirements,
    ExternalReference
  } = data;

  console.log(`[VIATOR] Booking request: ${ViatorBookingReference} for ${SupplierProductCode}`);

  const product = PRODUCTS[SupplierProductCode];
  if (!product) {
    return res.status(200).json({
      Success: false,
      ErrorCode: 'INVALID_PRODUCT',
      ErrorMessage: `Product ${SupplierProductCode} not found`,
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  const totalPersons = parseInt(TravellerMix?.Total || TravellerMix?.Adult || 1);
  const time = StartTime || product.availableTimes[0];

  // Check if booking already exists (idempotency)
  const existingBooking = await query(
    `SELECT * FROM bookings WHERE viator_reference = $1`,
    [ViatorBookingReference]
  );

  if (existingBooking.rows.length > 0) {
    const existing = existingBooking.rows[0];
    return res.status(200).json({
      Success: true,
      SupplierBookingReference: existing.booking_id,
      ViatorBookingReference: ViatorBookingReference,
      Status: existing.status === 'confirmed' ? 'CONFIRMED' : 'PENDING',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  // Check availability one more time
  const bookingsResult = await query(
    `SELECT COALESCE(SUM(persons), 0) as total_persons
     FROM bookings
     WHERE date = $1 AND tour_type = $2
     AND status NOT IN ('cancelled', 'rejected')`,
    [StartDate, product.tourType]
  );

  const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
  const availableSpots = product.maxCapacity - bookedPersons;

  if (totalPersons > availableSpots) {
    return res.status(200).json({
      Success: false,
      ErrorCode: 'SOLD_OUT',
      ErrorMessage: `Only ${availableSpots} spots available`,
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  // Create booking
  const bookingId = generateViatorBookingId();
  const travelerName = LeadTraveller
    ? `${LeadTraveller.FirstName || ''} ${LeadTraveller.LastName || ''}`.trim()
    : 'Viator Guest';
  const email = ContactDetails?.Email || LeadTraveller?.Email || 'viator-booking@viator.com';
  const phone = ContactDetails?.Phone || LeadTraveller?.Phone || '';
  const hotel = PickupDetails?.HotelName || PickupDetails?.Location || null;

  const paymentAmount = calculatePaymentCLP(product.netPricePerPerson, totalPersons);

  await insert('bookings', {
    booking_id: bookingId,
    date: StartDate,
    time: time,
    name: travelerName,
    email: email,
    phone: phone,
    accommodation: hotel,
    persons: totalPersons,
    tour_type: product.tourType,
    status: 'confirmed',
    source: 'viator',
    payment_method: 'viator',
    payment_status: 'paid',
    payment_amount: paymentAmount,
    message: [
      `Viator Booking: ${ViatorBookingReference}`,
      `Product: ${SupplierProductCode}`,
      SpecialRequirements ? `Special: ${SpecialRequirements}` : null
    ].filter(Boolean).join('\n'),
    viator_reference: ViatorBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[VIATOR] Booking confirmed: ${bookingId} | Ref: ${ViatorBookingReference}`);

  // Sync to Google Calendar
  syncViatorBookingToCalendar({
    bookingId,
    date: StartDate,
    time,
    persons: totalPersons,
    tourType: product.tourType,
    name: travelerName,
    email,
    phone,
    message: `Viator: ${ViatorBookingReference}`
  });

  // Send admin notification
  try {
    await sendViatorAdminNotificationEmail({
      bookingId,
      viatorReference: ViatorBookingReference,
      date: StartDate,
      time,
      persons: totalPersons,
      tourType: product.tourType,
      name: travelerName,
      email,
      phone,
      accommodation: hotel,
      paymentAmount
    });
  } catch (e) { console.error('[VIATOR] Admin email failed:', e); }

  return res.status(200).json({
    Success: true,
    SupplierBookingReference: bookingId,
    ViatorBookingReference: ViatorBookingReference,
    Status: 'CONFIRMED',
    ConfirmationDetails: {
      TourName: product.name,
      Date: StartDate,
      Time: time,
      Travelers: totalPersons,
      MeetingPoint: 'Hotel pickup included - we will contact you'
    },
    ExternalReference,
    Timestamp: getTimestamp()
  });
}

// ============ CANCEL BOOKING API ============
async function handleCancel(req, res, data) {
  const {
    ViatorBookingReference,
    SupplierBookingReference,
    CancellationReason,
    ExternalReference
  } = data;

  console.log(`[VIATOR] Cancel request: ${ViatorBookingReference || SupplierBookingReference}`);

  let booking;
  if (ViatorBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE viator_reference = $1`, [ViatorBookingReference]);
    booking = result.rows[0];
  } else if (SupplierBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [SupplierBookingReference]);
    booking = result.rows[0];
  }

  if (!booking) {
    return res.status(200).json({
      Success: false,
      ErrorCode: 'INVALID_BOOKING',
      ErrorMessage: 'Booking not found',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  if (booking.status === 'cancelled') {
    return res.status(200).json({
      Success: true,
      SupplierBookingReference: booking.booking_id,
      Status: 'CANCELLED',
      Message: 'Booking was already cancelled',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  // Check if booking is in the past
  const tourDate = new Date(booking.date);
  const now = new Date();
  if (tourDate < now) {
    return res.status(200).json({
      Success: false,
      ErrorCode: 'BOOKING_IN_PAST',
      ErrorMessage: 'Cannot cancel a past booking',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  await query(
    `UPDATE bookings SET
      status = 'cancelled',
      cancellation_reason = $2,
      updated_at = NOW()
    WHERE id = $1`,
    [booking.id, CancellationReason || 'Cancelled via Viator']
  );

  console.log(`[VIATOR] Booking cancelled: ${booking.booking_id}`);

  return res.status(200).json({
    Success: true,
    SupplierBookingReference: booking.booking_id,
    Status: 'CANCELLED',
    CancellationConfirmed: true,
    ExternalReference,
    Timestamp: getTimestamp()
  });
}

// ============ AMEND BOOKING API ============
async function handleAmend(req, res, data) {
  const {
    ViatorBookingReference,
    SupplierBookingReference,
    NewStartDate,
    NewStartTime,
    NewTravellerMix,
    ExternalReference
  } = data;

  console.log(`[VIATOR] Amend request: ${ViatorBookingReference || SupplierBookingReference}`);

  let booking;
  if (ViatorBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE viator_reference = $1`, [ViatorBookingReference]);
    booking = result.rows[0];
  } else if (SupplierBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [SupplierBookingReference]);
    booking = result.rows[0];
  }

  if (!booking) {
    return res.status(200).json({
      Success: false,
      ErrorCode: 'INVALID_BOOKING',
      ErrorMessage: 'Booking not found',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  const updates = [];
  const values = [booking.id];
  let paramIndex = 2;

  if (NewStartDate) {
    updates.push(`date = $${paramIndex}`);
    values.push(NewStartDate);
    paramIndex++;
  }

  if (NewStartTime) {
    updates.push(`time = $${paramIndex}`);
    values.push(NewStartTime);
    paramIndex++;
  }

  if (NewTravellerMix?.Total) {
    updates.push(`persons = $${paramIndex}`);
    values.push(parseInt(NewTravellerMix.Total));
    paramIndex++;
  }

  if (updates.length === 0) {
    return res.status(200).json({
      Success: false,
      ErrorCode: 'NO_CHANGES',
      ErrorMessage: 'No amendment details provided',
      ExternalReference,
      Timestamp: getTimestamp()
    });
  }

  updates.push('updated_at = NOW()');

  await query(
    `UPDATE bookings SET ${updates.join(', ')} WHERE id = $1`,
    values
  );

  console.log(`[VIATOR] Booking amended: ${booking.booking_id}`);

  return res.status(200).json({
    Success: true,
    SupplierBookingReference: booking.booking_id,
    Status: 'AMENDED',
    AmendmentConfirmed: true,
    ExternalReference,
    Timestamp: getTimestamp()
  });
}

// ============ ADMIN ENDPOINTS ============
async function handleAdminEndpoints(req, res, path, data) {
  // Get Viator analytics
  if (path.includes('/analytics')) {
    const startDate = req.query.start_date || data.startDate;
    const endDate = req.query.end_date || data.endDate;

    const summaryResult = await query(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(persons) as total_persons,
        SUM(payment_amount) as total_revenue
      FROM bookings
      WHERE source = 'viator'
      AND status NOT IN ('cancelled', 'rejected')
      ${startDate ? `AND date >= '${startDate}'` : ''}
      ${endDate ? `AND date <= '${endDate}'` : ''}
    `);

    const byTourType = await query(`
      SELECT
        tour_type,
        COUNT(*) as bookings,
        SUM(persons) as persons,
        SUM(payment_amount) as revenue
      FROM bookings
      WHERE source = 'viator'
      AND status NOT IN ('cancelled', 'rejected')
      ${startDate ? `AND date >= '${startDate}'` : ''}
      ${endDate ? `AND date <= '${endDate}'` : ''}
      GROUP BY tour_type
    `);

    return res.status(200).json({
      success: true,
      summary: summaryResult.rows[0],
      byTourType: byTourType.rows
    });
  }

  // Get Viator products configuration
  if (path.includes('/products')) {
    return res.status(200).json({
      success: true,
      products: PRODUCTS
    });
  }

  // Get recent Viator bookings
  if (path.includes('/bookings')) {
    const limit = parseInt(req.query.limit) || 50;
    const bookingsResult = await query(`
      SELECT * FROM bookings
      WHERE source = 'viator'
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return res.status(200).json({
      success: true,
      bookings: bookingsResult.rows
    });
  }

  return res.status(404).json({
    success: false,
    error: 'Admin endpoint not found'
  });
}

// ============ HELPER FUNCTIONS ============

// Sync booking to Google Calendar
async function syncViatorBookingToCalendar(bookingData) {
  try {
    console.log(`[VIATOR] Syncing to Google Calendar: ${bookingData.bookingId}`);
    const result = await addToGoogleCalendar({
      bookingId: bookingData.bookingId,
      date: bookingData.date,
      time: bookingData.time,
      persons: bookingData.persons,
      tourType: bookingData.tourType,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      message: bookingData.message
    });

    if (result && result.error) {
      console.error(`[VIATOR] Calendar sync failed: ${result.error}`);
    } else if (result && result.id) {
      console.log(`[VIATOR] Calendar event created: ${result.htmlLink}`);
    }
  } catch (error) {
    console.error(`[VIATOR] Calendar sync error: ${error.message}`);
  }
}

// Send admin notification email
async function sendViatorAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (!resendApiKey) {
    console.log('[VIATOR] Skipping email notification - RESEND_API_KEY not configured');
    return;
  }

  try {
    const dateObj = new Date(booking.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const tourTypes = {
      'regular': 'Tour Astronomico Regular (Viator)',
      'private': 'Tour Privado Exclusivo (Viator)',
      'astrophoto': 'Tour Astrofotografico (Viator)'
    };

    const paymentCLP = booking.paymentAmount
      ? `$${booking.paymentAmount.toLocaleString('es-CL')} CLP`
      : 'Pagado via Viator';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
        to: [adminEmail],
        subject: `Viator Nueva Reserva: ${booking.name} - ${formattedDate}`,
        html: `
          <h2>Nueva Reserva via Viator</h2>
          <p><strong>ID:</strong> ${booking.bookingId}</p>
          <p><strong>Referencia Viator:</strong> ${booking.viatorReference}</p>
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${booking.time}</p>
          <p><strong>Tour:</strong> ${tourTypes[booking.tourType] || booking.tourType}</p>
          <p><strong>Personas:</strong> ${booking.persons}</p>
          <p><strong>Cliente:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Telefono:</strong> ${booking.phone || 'No proporcionado'}</p>
          <p><strong>Hotel:</strong> ${booking.accommodation || 'No proporcionado'}</p>
          <p><strong>Pago:</strong> ${paymentCLP}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Esta reserva fue procesada automaticamente desde Viator.</p>
        `,
        reply_to: booking.email
      })
    });
    console.log(`[VIATOR] Admin notification email sent for booking ${booking.bookingId}`);
  } catch (error) {
    console.error(`[VIATOR] Failed to send admin notification email: ${error.message}`);
  }
}

// Export for use in other modules
export { PRODUCTS as VIATOR_PRODUCTS };
