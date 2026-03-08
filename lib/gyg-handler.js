/**
 * GetYourGuide Supplier API
 *
 * Implements GYG Supplier API specification:
 * - GET /api/gyg/1/get-availabilities/
 * - POST /api/gyg/1/reserve/
 * - POST /api/gyg/1/cancel-reservation/
 * - POST /api/gyg/1/book/
 * - POST /api/gyg/1/cancel-booking/
 * - GET /api/gyg/1/products/{productId}
 * - GET /api/gyg/1/products/{productId}/pricing-categories/
 * - POST /api/gyg/1/notification/ (THEMIS deactivation webhook)
 * - POST /api/gyg/1/reactivate/ (reactivate deactivated product)
 */

import { insert, query } from './db.js';
import { addToGoogleCalendar } from './google-calendar.js';
import { pushAvailabilityNotificationToViator } from './viator-handler.js';

// ============ GYG API CREDENTIALS (for calling GYG endpoints) ============
const GYG_API_URL = 'https://supplier-api.getyourguide.com';
const GYG_OUTBOUND_USERNAME = 'AtacamaDarkSky';
const GYG_OUTBOUND_PASSWORD = process.env.GYG_OUTBOUND_PASSWORD_V2 || '15ea726795960ec399a05b1d76882ca3';

// ============ CONFIGURATION ============
const PRODUCTS = {
  // Solo tour privado activo en GYG (el tour regular fue descontinuado)
  // Tour Privado (precio por persona, max 4) - Time Period format (GYG portal config)
  '1163787': {
    productId: '1163787',
    optionId: '1782507', // GYG Option ID (En revisión)
    name: 'Atacama: Private Stargazing Tour to Secret Spot',
    description: 'Small group 4x4 expedition to a Bortle Class 1 location with zero light pollution. Maximum 4 guests. Includes smart telescope, wine, hot drinks, and photo session.',
    maxCapacity: 4, // máximo 4 personas por tour
    tourType: 'private',
    currency: 'EUR',
    pricePerPerson: 13326, // €133.26 en GYG → CLP $100,000 neto después de 30% comisión (TC: 1 EUR = 1,072 CLP)
    cutoffSeconds: 14400, // 4 hours before tour
    availableTimes: ['20:00', '20:30', '21:00'], // used internally for booking time extraction
    openingHours: { fromTime: '20:00', toTime: '23:59' },
    timePeriod: true,
    pricingType: 'individual', // precio por persona
    categories: ['ADULT'],
    city: 'San Pedro de Atacama',
    country: 'CHL'
  }
};

// Time Period products (for GYG testing - opening hours format)
const PRODUCTS_TIME_PERIOD = {
  // Tour Privado - Time Period format
  '1163787-TP': {
    productId: '1163787-TP',
    name: 'Atacama: Private Stargazing Tour to Secret Spot (Time Period)',
    maxCapacity: 4,
    tourType: 'private',
    currency: 'EUR',
    pricePerPerson: 13326, // €133.26 en GYG → CLP $100,000 neto después de 30%
    cutoffSeconds: 14400,
    openingHours: { fromTime: '20:00', toTime: '23:59' },
    pricingType: 'individual',
    categories: ['ADULT'],
    timePeriod: true
  }
};

// Default product for backwards compatibility
const DEFAULT_PRODUCT_ID = '1163787';

// EUR to CLP exchange rate (approximate, update periodically)
const EUR_TO_CLP = 1072;

// Calculate payment amount in CLP from EUR cents
function calculatePaymentCLP(priceInCentsEUR, persons) {
  // priceInCentsEUR is in cents (e.g., 5000 = €50.00)
  const priceEUR = priceInCentsEUR / 100;
  const totalEUR = priceEUR * persons;
  return Math.round(totalEUR * EUR_TO_CLP);
}

// ============ CHILE TIMEZONE HELPER ============
// Chile DST: Summer time (CLST, -03:00) from first Sunday of September to first Sunday of April
//            Winter time (CLT, -04:00) from first Sunday of April to first Sunday of September
function getChileTimezoneOffset(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Find first Sunday of April
  const firstSundayApril = new Date(year, 3, 1); // April 1st
  while (firstSundayApril.getDay() !== 0) {
    firstSundayApril.setDate(firstSundayApril.getDate() + 1);
  }

  // Find first Sunday of September
  const firstSundaySept = new Date(year, 8, 1); // September 1st
  while (firstSundaySept.getDay() !== 0) {
    firstSundaySept.setDate(firstSundaySept.getDate() + 1);
  }

  // Summer time (CLST): from first Sunday of September to first Sunday of April (next year)
  // Winter time (CLT): from first Sunday of April to first Sunday of September
  const isWinterTime = (
    (month > 3 || (month === 3 && day >= firstSundayApril.getDate())) && // After first Sunday April
    (month < 8 || (month === 8 && day < firstSundaySept.getDate()))      // Before first Sunday September
  );

  return isWinterTime ? '-04:00' : '-03:00';
}

// ============ PRODUCT LOOKUP HELPER ============
// GYG may send either productId OR optionId, so we need to check both
function findProduct(id) {
  // First check by productId
  if (PRODUCTS[id]) return PRODUCTS[id];
  if (PRODUCTS_TIME_PERIOD[id]) return PRODUCTS_TIME_PERIOD[id];

  // Then check by optionId
  for (const product of Object.values(PRODUCTS)) {
    if (product.optionId === id) return product;
  }
  for (const product of Object.values(PRODUCTS_TIME_PERIOD)) {
    if (product.optionId === id) return product;
  }

  return null;
}

// ============ AUTHENTICATION ============
function validateGygAuth(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.GYG_WEBHOOK_USERNAME;
  const expectedPassword = process.env.GYG_WEBHOOK_PASSWORD;

  if (username === expectedUsername && password === expectedPassword) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid credentials' };
}

// Generate unique booking ID
function generateGygBookingId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GYG-${timestamp}-${random}`;
}

// ============ MAIN HANDLER ============
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the path to determine which endpoint is being called
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/gyg', '');

  // GYG Live Testing endpoint (no auth required - internal diagnostic tool)
  if (path.includes('/live-test') || req.query.action === 'live-test') {
    return await handleGygLiveTest(req, res);
  }

  // Validate authentication for all other endpoints
  const auth = validateGygAuth(req);
  if (!auth.valid) {
    return res.status(401).json({
      errorCode: 'AUTHORIZATION_FAILURE',
      errorMessage: auth.error
    });
  }

  // Detailed logging for debugging
  console.log(`[GYG] ========== REQUEST ==========`);
  console.log(`[GYG] Method: ${req.method}`);
  console.log(`[GYG] Path: ${path}`);
  console.log(`[GYG] URL: ${req.url}`);
  console.log(`[GYG] Query:`, JSON.stringify(req.query));
  console.log(`[GYG] Body:`, JSON.stringify(req.body));
  console.log(`[GYG] Headers:`, JSON.stringify(req.headers));

  try {
    // Route based on path
    if (path.includes('/get-availabilities') || req.query.action === 'availability') {
      return await handleGetAvailabilities(req, res);
    }
    if (path.includes('/cancel-reservation') || req.query.action === 'cancel-reservation') {
      return await handleCancelReservation(req, res);
    }
    if (path.includes('/reserve') || req.query.action === 'reservation') {
      return await handleReserve(req, res);
    }
    if (path.includes('/cancel-booking') || path.includes('/cancel') || req.query.action === 'cancellation') {
      return await handleCancelBooking(req, res);
    }
    if (path.includes('/book') || req.query.action === 'booking') {
      return await handleBook(req, res);
    }
    // GYG Notification webhook (THEMIS deactivation events)
    if (path.includes('/notification') || path.includes('/notify')) {
      return await handleNotification(req, res);
    }
    // Reactivate product on GYG
    if (path.includes('/reactivate')) {
      return await handleReactivateProduct(req, res);
    }
    // Push availability to GYG (internal endpoint)
    if (path.includes('/push-availability') || path.includes('/notify-availability-update')) {
      return await handlePushAvailability(req, res);
    }
    // Sync availability to GYG (calculates current availability and pushes)
    if (path.includes('/sync-availability') || path.includes('/sync')) {
      return await handleSyncAvailability(req, res);
    }
    // Supplier products list
    if (path.match(/\/suppliers\/([^/]+)\/products/)) {
      return await handleSupplierProducts(req, res, path);
    }
    // Product endpoints
    if (path.match(/\/products\/([^/]+)\/pricing-categories/)) {
      return await handlePricingCategories(req, res, path);
    }
    if (path.match(/\/products\/([^/]+)\/addons/)) {
      return await handleAddons(req, res, path);
    }
    if (path.match(/\/products\/([^/]+)$/)) {
      return await handleProductDetails(req, res, path);
    }

    // Default: return API info
    return res.status(200).json({
      api: 'GetYourGuide Supplier API',
      version: '1.0',
      products: Object.keys(PRODUCTS),
      endpoints: [
        'GET /api/gyg/1/get-availabilities/',
        'POST /api/gyg/1/reserve/',
        'POST /api/gyg/1/cancel-reservation/',
        'POST /api/gyg/1/book/',
        'POST /api/gyg/1/cancel-booking/',
        'POST /api/gyg/1/notification/',
        'POST /api/gyg/1/reactivate/',
        'GET /api/gyg/1/products/{productId}',
        'GET /api/gyg/1/products/{productId}/pricing-categories/'
      ]
    });

  } catch (error) {
    console.error('[GYG] API error:', error);
    return res.status(500).json({
      errorCode: 'INTERNAL_SYSTEM_FAILURE',
      errorMessage: error.message
    });
  }
}

// ============ GET AVAILABILITIES ============
async function handleGetAvailabilities(req, res) {
  // Support both GET (query params) and POST (body)
  const params = req.method === 'POST' ? req.body : req.query;
  const { productId, fromDateTime, toDateTime, dateTime } = params;

  console.log(`[GYG] Availability params:`, JSON.stringify(params));

  // Get product config - check by productId or optionId
  const product = findProduct(productId);
  if (!product) {
    console.log(`[GYG] Product not found for ID: ${productId}`);
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: `Product ${productId} not found`
    });
  }
  console.log(`[GYG] Found product: ${product.productId} (${product.name})`);

  // Support both GYG format (fromDateTime/toDateTime) and simple format (dateTime)
  // Extract dates directly from strings to avoid timezone conversion issues
  let startDateStr, endDateStr;

  if (fromDateTime && toDateTime) {
    // GYG sends ISO strings like 2025-01-15T00:00:00+00:00
    startDateStr = fromDateTime.split('T')[0];
    endDateStr = toDateTime.split('T')[0];
  } else if (dateTime) {
    startDateStr = dateTime.split('T')[0];
    endDateStr = dateTime.split('T')[0];
  } else {
    console.log(`[GYG] Missing date params - fromDateTime: ${fromDateTime}, toDateTime: ${toDateTime}, dateTime: ${dateTime}`);
    return res.status(400).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required parameters: fromDateTime and toDateTime (or dateTime)'
    });
  }

  const availabilities = [];

  // Generate availabilities for each day in the range
  // Use noon time to avoid DST edge cases when incrementing days
  let currentDate = new Date(startDateStr + 'T12:00:00');
  const endDate = new Date(endDateStr + 'T12:00:00');
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Handle Time Period products (opening hours)
    if (product.timePeriod) {
      // Check if date is blocked
      const blockedResult = await query(
        `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
        [dateStr]
      );

      let vacancies = product.pricingType === 'group' ? 1 : product.maxCapacity;
      let isBlocked = false;

      if (blockedResult.rows.length > 0) {
        const blockInfo = blockedResult.rows[0];
        if (blockInfo.block_type === 'full') {
          vacancies = 0;
          isBlocked = true;
        } else if (blockInfo.block_type === 'private_only' && product.tourType === 'regular') {
          vacancies = 0;
          isBlocked = true;
        }
      }

      // Count existing bookings if not blocked
      if (!isBlocked && vacancies > 0) {
        const bookingsResult = await query(
          `SELECT COALESCE(SUM(persons), 0) as total_persons
           FROM bookings
           WHERE date = $1 AND tour_type = $2
           AND status NOT IN ('cancelled', 'rejected')`,
          [dateStr, product.tourType]
        );
        const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
        vacancies = Math.max(0, product.maxCapacity - bookedPersons);
      }

      const availability = {
        productId: product.productId,
        dateTime: `${dateStr}T20:30:00${getChileTimezoneOffset(dateStr)}`,
        openingTimes: [product.openingHours],
        cutoffSeconds: product.cutoffSeconds,
        currency: product.currency
      };

      // Add vacancies and pricing - use simple vacancies field for all products
      availability.vacancies = vacancies;
      if (product.pricingType === 'group') {
        availability.pricesByCategory = {
          retailPrices: [{ category: 'GROUP', price: product.pricePerGroup }]
        };
      } else {
        availability.pricesByCategory = {
          retailPrices: [{ category: 'ADULT', price: product.pricePerPerson }]
        };
      }

      availabilities.push(availability);
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Handle Time Point products (fixed times)
    for (const time of product.availableTimes) {
      const dateTimeStr = `${dateStr}T${time}:00${getChileTimezoneOffset(dateStr)}`; // Chile timezone with DST

      // Check if date is blocked
      const blockedResult = await query(
        `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
        [dateStr]
      );

      let vacancies = product.maxCapacity;
      let isBlocked = false;

      if (blockedResult.rows.length > 0) {
        const blockInfo = blockedResult.rows[0];
        if (blockInfo.block_type === 'full') {
          vacancies = 0;
          isBlocked = true;
        } else if (blockInfo.block_type === 'private_only' && product.tourType === 'regular') {
          // Solo tours privados permitidos
          vacancies = 0;
          isBlocked = true;
        }
      }

      // Count current bookings if not fully blocked
      if (!isBlocked && vacancies > 0) {
        if (product.pricingType === 'group') {
          // Para tour privado: verificar si ya hay una reserva en ese horario
          const bookingsResult = await query(
            `SELECT COUNT(*) as count FROM bookings
             WHERE date = $1 AND time = $2 AND tour_type = 'private'
             AND status NOT IN ('cancelled', 'rejected')`,
            [dateStr, time]
          );
          const hasBooking = parseInt(bookingsResult.rows[0]?.count || 0) > 0;
          vacancies = hasBooking ? 0 : 1; // Solo 1 grupo por horario
        } else {
          // Contar personas reservadas para este tipo de tour
          const bookingsResult = await query(
            `SELECT COALESCE(SUM(persons), 0) as total_persons
             FROM bookings
             WHERE date = $1 AND time = $2 AND tour_type = $3
             AND status NOT IN ('cancelled', 'rejected')`,
            [dateStr, time, product.tourType]
          );
          const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
          vacancies = Math.max(0, product.maxCapacity - bookedPersons);
        }
      }

      // Build availability object based on pricing type
      const availability = {
        dateTime: dateTimeStr,
        productId: product.productId,
        cutoffSeconds: product.cutoffSeconds,
        currency: product.currency
      };

      // Add vacancies - use vacanciesByCategory for individual pricing, vacancies for group
      if (product.pricingType === 'group') {
        availability.vacancies = vacancies;
        availability.pricesByCategory = {
          retailPrices: [{
            category: 'GROUP',
            price: product.pricePerGroup
          }]
        };
      } else {
        // Individual pricing - use simple vacancies field (not vacanciesByCategory)
        availability.vacancies = vacancies;
        availability.pricesByCategory = {
          retailPrices: [{
            category: 'ADULT',
            price: product.pricePerPerson
          }]
        };
      }

      availabilities.push(availability);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return res.status(200).json({
    data: {
      availabilities: availabilities
    }
  });
}

// ============ RESERVE ============
async function handleReserve(req, res) {
  const data = req.body.data || req.body;
  const {
    gygBookingReference,
    productId,
    dateTime,
    bookingItems
  } = data;

  if (!gygBookingReference || !dateTime) {
    return res.status(200).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required fields: gygBookingReference, dateTime'
    });
  }

  // Get product config - check by productId or optionId
  const product = findProduct(productId);
  if (!product) {
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: `Product ${productId} not found`
    });
  }

  // Extract date directly from string to avoid timezone conversion issues
  // GYG sends: 2025-01-15T21:00:00-03:00 → we want 2025-01-15
  console.log(`[GYG] Reserve - Raw dateTime: ${dateTime}`);
  const date = dateTime.split('T')[0];
  // Extract time from ISO string properly
  // For timePeriod products, GYG sends T20:30:00 (opening-hours format), default to 20:30
  const timeMatch = dateTime.match(/T(\d{2}:\d{2})/);
  let time = timeMatch ? timeMatch[1] : '20:30';
  if (time === '00:00' && product.timePeriod) {
    time = '20:30';
  }
  console.log(`[GYG] Reserve - Parsed date: ${date}, time: ${time}`);

  // Calculate total persons from bookingItems
  let totalPersons = 0;
  let groupSize = 1;
  if (bookingItems && Array.isArray(bookingItems)) {
    for (const item of bookingItems) {
      if (item.category === 'GROUP') {
        groupSize = item.groupSize || item.count || 1;
        totalPersons = groupSize;
      } else {
        totalPersons += item.count || 0;
      }
    }
  }

  // Validate ticket categories
  if (bookingItems && Array.isArray(bookingItems)) {
    for (const item of bookingItems) {
      const validCategories = product.categories || ['ADULT'];
      if (!validCategories.includes(item.category)) {
        res.status(200);
        return res.json({
          errorCode: 'INVALID_TICKET_CATEGORY',
          errorMessage: `Invalid ticket category: ${item.category}. Valid categories: ${validCategories.join(', ')}`,
          ticketCategory: item.category
        });
      }
    }
  }

  // Validate participants configuration
  const maxParticipants = product.pricingType === 'group' ? product.maxGroupSize : product.maxCapacity;
  const minParticipants = product.pricingType === 'group' ? product.minGroupSize : 1;

  if (totalPersons > maxParticipants) {
    return res.status(200).json({
      errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION',
      errorMessage: `The activity cannot be reserved for more than ${maxParticipants} participants`,
      participantsConfiguration: {
        min: minParticipants,
        max: maxParticipants
      }
    });
  }

  if (totalPersons < minParticipants) {
    return res.status(200).json({
      errorCode: 'INVALID_PARTICIPANTS_CONFIGURATION',
      errorMessage: `The activity requires a minimum of ${minParticipants} participants`,
      participantsConfiguration: {
        min: minParticipants,
        max: maxParticipants
      }
    });
  }

  // Check if date is blocked
  const blockedResult = await query(
    `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
    [date]
  );
  if (blockedResult.rows.length > 0) {
    const blockInfo = blockedResult.rows[0];
    if (blockInfo.block_type === 'full' ||
        (blockInfo.block_type === 'private_only' && product.tourType === 'regular')) {
      return res.status(200).json({
        errorCode: 'NO_AVAILABILITY',
        errorMessage: `No availability for ${date}`
      });
    }
  }

  // Check availability
  const bookingsResult = await query(
    `SELECT COALESCE(SUM(persons), 0) as total_persons
     FROM bookings
     WHERE date = $1 AND time = $2 AND tour_type = $3
     AND status NOT IN ('cancelled', 'rejected')`,
    [date, time, product.tourType]
  );
  const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
  const availableSpots = maxParticipants - bookedPersons;

  if (totalPersons > availableSpots) {
    return res.status(200).json({
      errorCode: 'NO_AVAILABILITY',
      errorMessage: `Not enough availability. Only ${availableSpots} spots available.`
    });
  }

  // Format expiration time with timezone offset (ISO 8601) - without milliseconds
  const expirationDate = new Date(Date.now() + 60 * 60 * 1000);
  const expiration = expirationDate.toISOString().replace(/\.\d{3}Z$/, '+00:00');

  // Check if reservation already exists (idempotency)
  // But if it's a CONFIRMED booking, this is an Amendment Flow - create new reservation
  const existingReservation = await query(
    `SELECT * FROM bookings WHERE gyg_reference = $1`,
    [gygBookingReference]
  );

  if (existingReservation.rows.length > 0) {
    const existing = existingReservation.rows[0];
    // Only return existing if it's still pending (not confirmed)
    // If confirmed, this is an Amendment - create new reservation
    if (existing.status === 'pending') {
      return res.status(200).json({
        data: {
          reservationReference: existing.booking_id,
          reservationExpiration: expiration
        }
      });
    }
    // For amendments: continue to create a new reservation with a unique reference
  }

  // Create reservation
  const bookingId = generateGygBookingId();
  // For amendments, append a suffix to make gyg_reference unique
  const isAmendment = existingReservation.rows.length > 0;
  const gygRef = isAmendment ? `${gygBookingReference}-AMD${Date.now()}` : gygBookingReference;

  await insert('bookings', {
    booking_id: bookingId,
    date,
    time,
    name: 'GYG Reservation (Pending)',
    email: 'pending@getyourguide.com',
    phone: '',
    persons: totalPersons || 1,
    tour_type: product.tourType,
    status: 'pending',
    source: 'gyg',
    payment_method: 'getyourguide',
    payment_status: 'pending',
    message: isAmendment
      ? `GYG Amendment for: ${gygBookingReference} | Product: ${productId}`
      : `GYG Reservation: ${gygBookingReference} | Product: ${productId}`,
    gyg_reference: gygRef,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] Reservation created: ${bookingId} for ${gygBookingReference}`);

  return res.status(200).json({
    data: {
      reservationReference: bookingId,
      reservationExpiration: expiration
    }
  });
}

// ============ CANCEL RESERVATION ============
async function handleCancelReservation(req, res) {
  const data = req.body.data || req.body;
  const { gygBookingReference, reservationReference } = data;

  if (!gygBookingReference && !reservationReference) {
    return res.status(400).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required field: gygBookingReference or reservationReference'
    });
  }

  let booking;
  if (gygBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE gyg_reference = $1`, [gygBookingReference]);
    booking = result.rows[0];
  } else {
    const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [reservationReference]);
    booking = result.rows[0];
  }

  if (!booking) {
    return res.status(200).json({
      errorCode: 'INVALID_RESERVATION',
      errorMessage: 'Reservation not found'
    });
  }

  // Only cancel if it's still pending (not yet confirmed)
  if (booking.status === 'pending') {
    await query(
      `DELETE FROM bookings WHERE id = $1`,
      [booking.id]
    );
    console.log(`[GYG] Reservation cancelled and deleted: ${booking.booking_id}`);
  }

  return res.status(200).json({
    data: {}
  });
}

// ============ BOOK ============
async function handleBook(req, res) {
  const data = req.body.data || req.body;
  const {
    gygBookingReference,
    productId,
    dateTime,
    bookingItems,
    reservationReference,
    travelers,
    travelerHotel,
    comment,
    currency
  } = data;

  if (!gygBookingReference || !dateTime) {
    return res.status(200).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required fields: gygBookingReference, dateTime'
    });
  }

  // Get product config - check by productId or optionId, with fallback to default
  const product = findProduct(productId) || PRODUCTS[DEFAULT_PRODUCT_ID];

  // Calculate total persons from bookingItems in the request
  let totalPersons = 0;
  if (bookingItems && Array.isArray(bookingItems)) {
    for (const item of bookingItems) {
      if (item.category === 'GROUP') {
        totalPersons = item.groupSize || 1;
      } else {
        totalPersons += item.count || 0;
      }
    }
  }

  // First check if there's a pending reservation by reservationReference (for amendments)
  let existingReservation = null;
  if (reservationReference) {
    const reservationResult = await query(
      `SELECT * FROM bookings WHERE booking_id = $1 AND status = 'pending'`,
      [reservationReference]
    );
    existingReservation = reservationResult.rows[0];
  }

  // If found a pending reservation, confirm it
  if (existingReservation) {
    const travelerInfo = travelers && travelers[0] ? travelers[0] : {};
    const name = `${travelerInfo.firstName || ''} ${travelerInfo.lastName || ''}`.trim() || existingReservation.name;
    const email = travelerInfo.email || existingReservation.email;
    const phone = travelerInfo.phoneNumber || existingReservation.phone;

    // Update persons from request bookingItems
    const paymentAmount1 = calculatePaymentCLP(product.pricePerPerson, totalPersons || existingReservation.persons);
    await query(
      `UPDATE bookings SET
        status = 'confirmed',
        payment_status = 'paid',
        payment_amount = $8,
        name = $2,
        email = $3,
        phone = $4,
        accommodation = $5,
        persons = $6,
        message = COALESCE(message, '') || $7,
        updated_at = NOW()
      WHERE id = $1`,
      [existingReservation.id, name, email, phone, travelerHotel || null, totalPersons || existingReservation.persons, comment ? `\nComment: ${comment}` : '', paymentAmount1]
    );

    // Generate tickets using request bookingItems count
    const tickets = generateTickets(existingReservation.booking_id, totalPersons || existingReservation.persons, product);

    // Sync to Google Calendar (async, don't wait)
    const dateFromReservation = existingReservation.date instanceof Date
      ? existingReservation.date.toISOString().split('T')[0]
      : String(existingReservation.date).split('T')[0];
    syncGygBookingToCalendar({
      bookingId: existingReservation.booking_id,
      date: dateFromReservation,
      time: existingReservation.time,
      persons: totalPersons || existingReservation.persons,
      tourType: product.tourType,
      name: name,
      email: email,
      phone: phone,
      message: `GYG Booking: ${gygBookingReference}`
    });

    // Send admin notification email
    try {
      await sendGygAdminNotificationEmail({
        bookingId: existingReservation.booking_id,
        gygReference: gygBookingReference,
        date: dateFromReservation,
        time: existingReservation.time,
        persons: totalPersons || existingReservation.persons,
        tourType: product.tourType,
        name: name,
        email: email,
        phone: phone,
        accommodation: travelerHotel,
        paymentAmount: paymentAmount1
      });
    } catch (e) { console.error('[GYG] Admin email failed:', e); }

    // Block first private slot if private tour at 21:00
    syncPrivateAvailabilityAfterBooking(dateFromReservation, existingReservation.time, product.tourType);

    // Notify Viator of availability change
    pushAvailabilityNotificationToViator(dateFromReservation).catch(err => {
      console.error('[GYG] Viator push failed:', err.message);
    });

    return res.status(200).json({
      data: {
        bookingReference: existingReservation.booking_id,
        tickets: tickets
      }
    });
  }

  // Check if booking already exists by gygBookingReference (idempotency)
  const existingBooking = await query(
    `SELECT * FROM bookings WHERE gyg_reference = $1`,
    [gygBookingReference]
  );

  if (existingBooking.rows.length > 0) {
    const existing = existingBooking.rows[0];
    // Update if it was a pending reservation
    if (existing.status === 'pending') {
      const travelerInfo = travelers && travelers[0] ? travelers[0] : {};
      const name = `${travelerInfo.firstName || ''} ${travelerInfo.lastName || ''}`.trim() || existing.name;
      const email = travelerInfo.email || existing.email;
      const phone = travelerInfo.phoneNumber || existing.phone;

      const paymentAmount2 = calculatePaymentCLP(product.pricePerPerson, totalPersons || existing.persons);
      await query(
        `UPDATE bookings SET
          status = 'confirmed',
          payment_status = 'paid',
          payment_amount = $8,
          name = $2,
          email = $3,
          phone = $4,
          accommodation = $5,
          persons = $6,
          message = COALESCE(message, '') || $7,
          updated_at = NOW()
        WHERE id = $1`,
        [existing.id, name, email, phone, travelerHotel || null, totalPersons || existing.persons, comment ? `\nComment: ${comment}` : '', paymentAmount2]
      );
    }

    // Generate tickets using request bookingItems count
    const tickets = generateTickets(existing.booking_id, totalPersons || existing.persons, product);

    // Sync to Google Calendar (async, don't wait)
    const dateFromExisting = existing.date instanceof Date
      ? existing.date.toISOString().split('T')[0]
      : String(existing.date).split('T')[0];
    syncGygBookingToCalendar({
      bookingId: existing.booking_id,
      date: dateFromExisting,
      time: existing.time,
      persons: totalPersons || existing.persons,
      tourType: product.tourType,
      name: name,
      email: email,
      phone: phone,
      message: `GYG Booking: ${gygBookingReference}`
    });

    // Send admin notification email
    try {
      await sendGygAdminNotificationEmail({
        bookingId: existing.booking_id,
        gygReference: gygBookingReference,
        date: dateFromExisting,
        time: existing.time,
        persons: totalPersons || existing.persons,
        tourType: product.tourType,
        name: name,
        email: email,
        phone: phone,
        accommodation: travelerHotel,
        paymentAmount: paymentAmount2
      });
    } catch (e) { console.error('[GYG] Admin email failed:', e); }

    // Block first private slot if private tour at 21:00
    syncPrivateAvailabilityAfterBooking(dateFromExisting, existing.time, product.tourType);

    // Notify Viator of availability change
    pushAvailabilityNotificationToViator(dateFromExisting).catch(err => {
      console.error('[GYG] Viator push failed:', err.message);
    });

    return res.status(200).json({
      data: {
        bookingReference: existing.booking_id,
        tickets: tickets
      }
    });
  }

  // Extract date and time - log raw values for debugging
  console.log(`[GYG] Raw dateTime from GYG: ${dateTime}`);
  const timeMatch = dateTime.match(/T(\d{2}:\d{2})/);
  let time = timeMatch ? timeMatch[1] : '20:30';
  if (time === '00:00' && product.timePeriod) {
    time = '20:30';
  }
  const date = dateTime.split('T')[0];
  console.log(`[GYG] Parsed date: ${date}, time: ${time}`);

  // Get traveler info
  const travelerInfo = travelers && travelers[0] ? travelers[0] : {};
  const name = `${travelerInfo.firstName || ''} ${travelerInfo.lastName || ''}`.trim() || 'GetYourGuide Guest';
  const email = travelerInfo.email || 'gyg-booking@getyourguide.com';
  const phone = travelerInfo.phoneNumber || '';

  const notes = [
    `GYG Booking: ${gygBookingReference}`,
    `Product: ${productId} (${product.name})`,
    comment ? `Comment: ${comment}` : null
  ].filter(Boolean).join('\n');

  const bookingId = generateGygBookingId();
  const paymentAmount3 = calculatePaymentCLP(product.pricePerPerson, totalPersons || 1);
  await insert('bookings', {
    booking_id: bookingId,
    date,
    time,
    name,
    email,
    phone,
    accommodation: travelerHotel || null,
    persons: totalPersons || 1,
    tour_type: product.tourType,
    status: 'confirmed',
    source: 'gyg',
    payment_method: 'getyourguide',
    payment_status: 'paid',
    payment_amount: paymentAmount3,
    message: notes,
    gyg_reference: gygBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] ✓ Booking confirmed: ${bookingId} | Ref: ${gygBookingReference} | Date: ${date} | Time: ${time} | ${totalPersons || 1}p | ${product.tourType} | $${paymentAmount3} CLP`);

  // Sync to Google Calendar (async, don't wait)
  syncGygBookingToCalendar({
    bookingId: bookingId,
    date: date,
    time: time,
    persons: totalPersons || 1,
    tourType: product.tourType,
    name: name,
    email: email,
    phone: phone,
    message: notes
  });

  // Send admin notification email
  try {
    await sendGygAdminNotificationEmail({
      bookingId: bookingId,
      gygReference: gygBookingReference,
      date: date,
      time: time,
      persons: totalPersons || 1,
      tourType: product.tourType,
      name: name,
      email: email,
      phone: phone,
      accommodation: travelerHotel,
      paymentAmount: paymentAmount3
    });
  } catch (e) { console.error('[GYG] Admin email failed:', e); }

  // Block first private slot if private tour at 21:00
  syncPrivateAvailabilityAfterBooking(date, time, product.tourType);

  // Notify Viator of availability change
  pushAvailabilityNotificationToViator(date).catch(err => {
    console.error('[GYG] Viator push failed:', err.message);
  });

  // Generate tickets
  const tickets = generateTickets(bookingId, totalPersons || 1, product);

  return res.status(200).json({
    data: {
      bookingReference: bookingId,
      tickets: tickets
    }
  });
}

// Helper to send admin notification email for GyG bookings
async function sendGygAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (!resendApiKey) {
    console.log('[GYG] Skipping email notification - RESEND_API_KEY not configured');
    return;
  }

  try {
    const dateObj = new Date(booking.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tourTypes = {
      'regular': 'Tour Astronómico Regular (GYG)',
      'private': 'Tour Privado Exclusivo (GYG)',
      'astrophoto': 'Tour Astrofotográfico (GYG)'
    };

    const paymentCLP = booking.paymentAmount ? `$${booking.paymentAmount.toLocaleString('es-CL')} CLP` : 'Pagado vía GYG';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
        to: [adminEmail],
        subject: `🌟 Nueva Reserva GYG: ${booking.name} - ${formattedDate}`,
        html: `
          <h2>Nueva Reserva via GetYourGuide</h2>
          <p><strong>ID:</strong> ${booking.bookingId}</p>
          <p><strong>Referencia GYG:</strong> ${booking.gygReference}</p>
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${booking.time}</p>
          <p><strong>Tour:</strong> ${tourTypes[booking.tourType] || booking.tourType}</p>
          <p><strong>Personas:</strong> ${booking.persons}</p>
          <p><strong>Cliente:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Teléfono:</strong> ${booking.phone || 'No proporcionado'}</p>
          <p><strong>Hotel:</strong> ${booking.accommodation || 'No proporcionado'}</p>
          <p><strong>Pago:</strong> ${paymentCLP}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Esta reserva fue procesada automáticamente desde GetYourGuide.</p>
        `,
        reply_to: booking.email
      })
    });
    console.log(`[GYG] Admin notification email sent for booking ${booking.bookingId}`);
  } catch (error) {
    console.error(`[GYG] Failed to send admin notification email: ${error.message}`);
  }
}

// Helper to sync private tour availability to GYG after a booking
// Calculates real remaining capacity and pushes to GYG
async function syncPrivateAvailabilityAfterBooking(date, time, tourType) {
  // Only sync if it's a private tour at any GYG time slot
  const gygPrivateTimes = ['20:00', '20:30', '21:00'];
  if (tourType !== 'private' || !gygPrivateTimes.includes(time)) {
    return;
  }

  try {
    const privateProductId = '1163787';
    const product = PRODUCTS[privateProductId];
    const tzOffset = getChileTimezoneOffset(date);

    // Count total private persons booked for this date (across all time slots)
    const bookingsResult = await query(
      `SELECT COALESCE(SUM(persons), 0) as total_persons
       FROM bookings
       WHERE date = $1 AND tour_type = 'private'
       AND status NOT IN ('cancelled', 'rejected')`,
      [date]
    );
    const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
    const remainingCapacity = Math.max(0, product.maxCapacity - bookedPersons);

    console.log(`[GYG] Private tour ${date}: ${bookedPersons} booked, ${remainingCapacity} remaining of ${product.maxCapacity}`);

    // Push real availability to GYG for all private time slots
    const availabilities = product.availableTimes.map(t => ({
      dateTime: `${date}T${t}:00${tzOffset}`,
      vacancies: remainingCapacity
    }));

    await pushAvailabilityToGYG(privateProductId, availabilities, false);
    console.log(`[GYG] Pushed private availability for ${date}: ${remainingCapacity} vacancies`);
  } catch (error) {
    console.error(`[GYG] Failed to sync private availability: ${error.message}`);
  }
}

// Helper to sync booking to Google Calendar
async function syncGygBookingToCalendar(bookingData) {
  try {
    console.log(`[GYG] Syncing to Google Calendar: ${bookingData.bookingId}`);
    const result = await addToGoogleCalendar({
      bookingId: bookingData.bookingId,
      date: bookingData.date,
      time: bookingData.time,
      persons: bookingData.persons,
      tourType: bookingData.tourType,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      message: bookingData.message || `GYG Booking`
    });

    if (result && result.error) {
      console.error(`[GYG] Calendar sync failed: ${result.error}`);
    } else if (result && result.id) {
      console.log(`[GYG] Calendar event created: ${result.htmlLink}`);
    }
  } catch (error) {
    // Don't fail the booking if calendar sync fails
    console.error(`[GYG] Calendar sync error: ${error.message}`);
  }
}

// Helper to generate ticket codes
function generateTickets(bookingId, count, product) {
  const tickets = [];
  const category = product.pricingType === 'group' ? 'GROUP' : 'ADULT';

  if (product.pricingType === 'group') {
    // For group pricing, return 1 collective ticket
    tickets.push({
      category: 'COLLECTIVE',
      ticketCode: `${bookingId}`,
      ticketCodeType: 'TEXT'
    });
  } else {
    // For individual pricing, return one ticket per person
    for (let i = 0; i < count; i++) {
      tickets.push({
        category: 'ADULT',
        ticketCode: `${bookingId}-${String(i + 1).padStart(2, '0')}`,
        ticketCodeType: 'TEXT'
      });
    }
  }
  return tickets;
}

// ============ CANCEL BOOKING ============
async function handleCancelBooking(req, res) {
  const data = req.body.data || req.body;
  const { gygBookingReference, bookingReference, productId } = data;

  if (!gygBookingReference && !bookingReference) {
    return res.status(200).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required field: gygBookingReference or bookingReference'
    });
  }

  let booking;
  if (gygBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE gyg_reference = $1`, [gygBookingReference]);
    booking = result.rows[0];
  }
  if (!booking && bookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingReference]);
    booking = result.rows[0];
  }

  if (!booking) {
    // GYG connectivity tests may cancel bookings that don't exist — return success
    console.log(`[GYG] Cancel-booking: booking not found (ref: ${gygBookingReference || bookingReference}) — returning success`);
    return res.status(200).json({
      data: {}
    });
  }

  if (booking.status === 'cancelled') {
    // Already cancelled - return success (idempotent)
    return res.status(200).json({
      data: {}
    });
  }

  // Get date string before update for calendar/availability sync
  let dateStr = booking.date;
  if (dateStr instanceof Date) {
    dateStr = dateStr.toISOString().split('T')[0];
  } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  const tourType = booking.tour_type;

  await query(
    `UPDATE bookings SET
      status = 'cancelled',
      cancellation_reason = 'Cancelled via GYG API',
      updated_at = NOW()
    WHERE id = $1`,
    [booking.id]
  );

  console.log(`[GYG] Booking cancelled: ${booking.booking_id}`);

  // Sync availability to GYG (non-blocking) - so other products see freed capacity
  syncDateAvailabilityToGYG(dateStr).catch(err => {
    console.error('[GYG] Availability sync failed on cancel:', err.message);
  });

  // Notify Viator of availability change
  pushAvailabilityNotificationToViator(dateStr).catch(err => {
    console.error('[GYG] Viator push failed on cancel:', err.message);
  });

  // Refresh Google Calendar (non-blocking) - remove or recalculate event
  import('./google-calendar.js').then(({ refreshCalendarAfterCancellation }) => {
    refreshCalendarAfterCancellation(dateStr, tourType).catch(err => {
      console.error('[GYG] Calendar refresh failed on cancel:', err.message);
    });
  }).catch(err => {
    console.error('[GYG] Failed to import calendar module:', err.message);
  });

  // Send admin notification about the cancellation
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
    if (resendApiKey) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
          to: [adminEmail],
          subject: `❌ Reserva Cancelada GYG: ${booking.name} - ${formattedDate}`,
          html: `
            <h2>Reserva Cancelada via GetYourGuide</h2>
            <p><strong>ID:</strong> ${booking.booking_id}</p>
            <p><strong>Referencia GYG:</strong> ${gygBookingReference || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            <p><strong>Hora:</strong> ${booking.time}</p>
            <p><strong>Tour:</strong> ${tourType}</p>
            <p><strong>Personas:</strong> ${booking.persons}</p>
            <p><strong>Cliente:</strong> ${booking.name}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">La disponibilidad ha sido actualizada automáticamente.</p>
          `
        })
      });
      console.log(`[GYG] Cancellation notification email sent`);
    }
  } catch (e) {
    console.error('[GYG] Cancellation email failed:', e.message);
  }

  return res.status(200).json({
    data: {}
  });
}

// ============ PRODUCT DETAILS ============
async function handleProductDetails(req, res, path) {
  const match = path.match(/\/products\/([^/]+)$/);
  const productId = match ? match[1] : null;

  if (!productId || !PRODUCTS[productId]) {
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: 'Product not found'
    });
  }

  const product = PRODUCTS[productId];

  return res.status(200).json({
    data: {
      supplierId: 'atacama-darksky',
      productTitle: product.name,
      productDescription: product.description,
      destinationLocation: {
        city: product.city,
        country: product.country
      },
      configuration: {
        participantsConfiguration: {
          min: product.pricingType === 'group' ? product.minGroupSize : 1,
          max: product.pricingType === 'group' ? product.maxGroupSize : product.maxCapacity
        }
      }
    }
  });
}

// ============ PRICING CATEGORIES ============
async function handlePricingCategories(req, res, path) {
  const match = path.match(/\/products\/([^/]+)\/pricing-categories/);
  const productId = match ? match[1] : null;

  if (!productId || !PRODUCTS[productId]) {
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: 'Product not found'
    });
  }

  const product = PRODUCTS[productId];
  const categories = [];

  if (product.pricingType === 'group') {
    categories.push({
      category: 'GROUP',
      minTicketAmount: 1,
      maxTicketAmount: 1,
      groupSizeMin: product.minGroupSize,
      groupSizeMax: product.maxGroupSize,
      ageFrom: 0,
      ageTo: 99,
      bookingCategory: 'STANDARD',
      price: [{
        priceType: 'RETAIL_PRICE',
        price: product.pricePerGroup,
        currency: product.currency
      }]
    });
  } else {
    categories.push({
      category: 'ADULT',
      minTicketAmount: 1,
      maxTicketAmount: product.maxCapacity,
      ageFrom: 0,
      ageTo: 99,
      bookingCategory: 'STANDARD',
      price: [{
        priceType: 'RETAIL_PRICE',
        price: product.pricePerPerson,
        currency: product.currency
      }]
    });
  }

  return res.status(200).json({
    data: {
      pricingCategories: categories
    }
  });
}

// ============ SUPPLIER PRODUCTS LIST ============
async function handleSupplierProducts(req, res, path) {
  const match = path.match(/\/suppliers\/([^/]+)\/products/);
  const supplierId = match ? match[1] : null;

  // Accept any supplierId that matches our supplier
  const validSupplierIds = ['atacama-darksky', 'atacamadarksky', 'AtacamaDarkSky'];

  if (!supplierId || !validSupplierIds.includes(supplierId.toLowerCase().replace(/-/g, ''))) {
    return res.status(200).json({
      errorCode: 'INVALID_SUPPLIER',
      errorMessage: 'Supplier ID not found'
    });
  }

  // Build products list from PRODUCTS config
  const products = Object.values(PRODUCTS).map(p => ({
    productId: p.productId,
    productTitle: p.name
  }));

  return res.status(200).json({
    data: {
      supplierId: 'atacama-darksky',
      supplierName: 'Atacama Dark Sky',
      products: products
    }
  });
}

// ============ ADDONS ============
async function handleAddons(req, res, path) {
  const match = path.match(/\/products\/([^/]+)\/addons/);
  const productId = match ? match[1] : null;

  // Check both regular and time period products
  const product = PRODUCTS[productId] || PRODUCTS_TIME_PERIOD[productId];

  if (!productId || !product) {
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: 'Product not found'
    });
  }

  // Define addons per product type
  const addons = [];

  if (product.tourType === 'private') {
    // Private tour includes transport, but could offer photo package as addon
    addons.push({
      addonType: 'OTHERS',
      addonDescription: 'Professional astrophotography portrait session',
      retailPrice: 2500, // 25 EUR
      currency: 'EUR'
    });
  } else {
    // Regular tour could offer transport pickup as addon
    addons.push({
      addonType: 'TRANSPORT',
      addonDescription: 'Hotel pickup and drop-off service',
      retailPrice: 1000, // 10 EUR
      currency: 'EUR'
    });
    addons.push({
      addonType: 'OTHERS',
      addonDescription: 'Professional astrophotography portrait session',
      retailPrice: 2500, // 25 EUR
      currency: 'EUR'
    });
  }

  return res.status(200).json({
    data: {
      addons: addons
    }
  });
}

// ============ PUSH AVAILABILITY TO GYG ============
// This function calls GYG's API to notify availability changes
async function pushAvailabilityToGYG(productId, availabilities, includePrice = false) {
  const product = PRODUCTS[productId] || PRODUCTS_TIME_PERIOD[productId];
  if (!product) {
    throw new Error(`Invalid product: ${productId}`);
  }

  const payload = {
    data: {
      productId: productId,
      availabilities: availabilities.map(avail => {
        const item = {
          dateTime: avail.dateTime,
          vacancies: avail.vacancies
        };

        // PUSH_AVAILABILITY_WITH_PRICE feature
        if (includePrice) {
          item.currency = product.currency;
          if (product.pricingType === 'group') {
            item.pricesByCategory = {
              retailPrices: [{ category: 'GROUP', price: product.pricePerGroup }]
            };
          } else {
            item.pricesByCategory = {
              retailPrices: [{ category: 'ADULT', price: product.pricePerPerson }]
            };
          }
        }

        return item;
      })
    }
  };

  const auth = Buffer.from(`${GYG_OUTBOUND_USERNAME}:${GYG_OUTBOUND_PASSWORD}`).toString('base64');

  try {
    const response = await fetch(`${GYG_API_URL}/1/notify-availability-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`[GYG] Push availability for ${productId}: ${response.status}`, result);

    return {
      success: response.status === 202,
      status: response.status,
      data: result
    };
  } catch (error) {
    console.error(`[GYG] Push availability error:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handler for internal push availability endpoint
async function handlePushAvailability(req, res) {
  const data = req.body.data || req.body;
  const { productId, availabilities, includePrice } = data;

  if (!productId || !availabilities || !Array.isArray(availabilities)) {
    return res.status(400).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required fields: productId, availabilities[]'
    });
  }

  const result = await pushAvailabilityToGYG(productId, availabilities, includePrice);

  if (result.success) {
    return res.status(200).json({
      data: {
        message: 'Availability pushed to GYG successfully',
        gygResponse: result.data
      }
    });
  } else {
    return res.status(200).json({
      errorCode: 'GYG_PUSH_FAILED',
      errorMessage: result.error || 'Failed to push availability to GYG',
      gygStatus: result.status,
      gygResponse: result.data
    });
  }
}

// ============ GYG LIVE TESTING - NOTIFY AVAILABILITY TEST ============
// This endpoint runs 5 test calls to GYG's notify-availability-update
// and generates a report for submission to supplier-api@getyourguide.com
async function handleGygLiveTest(req, res) {
  const testResults = [];
  const productIds = Object.keys(PRODUCTS);

  // Generate test dates (next 5 days)
  const testDates = [];
  for (let i = 1; i <= 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    testDates.push(date.toISOString().split('T')[0]);
  }

  console.log('[GYG-TEST] Starting Live Testing for Notify Availability');
  console.log('[GYG-TEST] Products:', productIds);
  console.log('[GYG-TEST] Test dates:', testDates);

  // Run 5 test calls - alternate between products
  for (let i = 0; i < 5; i++) {
    const productId = productIds[i % productIds.length];
    const product = PRODUCTS[productId];
    const testDate = testDates[i];
    const timestamp = new Date().toISOString();

    // Build availability for this test
    const availabilities = product.availableTimes.map(time => ({
      dateTime: `${testDate}T${time}:00${getChileTimezoneOffset(testDate)}`,
      vacancies: product.maxCapacity
    }));

    // Build request payload
    const requestBody = {
      data: {
        productId: productId,
        availabilities: availabilities.map(avail => ({
          dateTime: avail.dateTime,
          vacancies: avail.vacancies,
          currency: product.currency,
          pricesByCategory: {
            retailPrices: [{
              category: 'ADULT',
              price: product.pricePerPerson
            }]
          }
        }))
      }
    };

    const auth = Buffer.from(`${GYG_OUTBOUND_USERNAME}:${GYG_OUTBOUND_PASSWORD}`).toString('base64');

    let response, responseBody, responseStatus;
    try {
      response = await fetch(`${GYG_API_URL}/1/notify-availability-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(requestBody)
      });

      responseStatus = response.status;
      responseBody = await response.json();
    } catch (error) {
      responseStatus = 'ERROR';
      responseBody = { error: error.message };
    }

    const testResult = {
      testNumber: i + 1,
      timestamp: timestamp,
      productId: productId,
      gygOptionId: product.optionId || 'PENDING - Need from GYG Portal',
      request: requestBody,
      response: {
        status: responseStatus,
        body: responseBody
      },
      success: responseStatus === 200 || responseStatus === 202
    };

    testResults.push(testResult);
    console.log(`[GYG-TEST] Test ${i + 1}: Product ${productId} - Status ${responseStatus}`);

    // Small delay between calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate report summary
  const successCount = testResults.filter(r => r.success).length;
  const report = {
    reportGenerated: new Date().toISOString(),
    summary: {
      totalTests: 5,
      successful: successCount,
      failed: 5 - successCount,
      allPassed: successCount === 5
    },
    products: productIds.map(id => ({
      productId: id,
      optionId: PRODUCTS[id].optionId,
      productName: PRODUCTS[id].name
    })),
    testResults: testResults,
    emailTemplate: {
      to: 'supplier-api@getyourguide.com',
      subject: 'Notify Availability Endpoint Test - Atacama Dark Sky',
      body: `Hello GYG Team,

We have completed testing of the Notify Availability Endpoint. Please find the test details below:

Supplier: Atacama Dark Sky
Test Date: ${new Date().toISOString().split('T')[0]}
Tests Executed: 5
Successful: ${successCount}

Product IDs tested:
${productIds.map(id => `- ${id}: ${PRODUCTS[id].name}`).join('\n')}

Please verify the test was successful.

Best regards,
Atacama Dark Sky Team`
    }
  };

  return res.status(200).json(report);
}

// ============ SYNC AVAILABILITY TO GYG ============
// This function calculates current availability and pushes it to GYG
// Called when bookings are created, cancelled, or modified

/**
 * Calculate current availability for a specific date and product
 */
async function calculateAvailabilityForDate(productId, date) {
  const product = PRODUCTS[productId];
  if (!product) {
    console.error(`[GYG-SYNC] Invalid product: ${productId}`);
    return null;
  }

  const tzOffset = getChileTimezoneOffset(date);
  const availabilities = [];

  // Check if date is blocked
  const blockedResult = await query(
    `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
    [date]
  );

  const blockInfo = blockedResult.rows[0];
  let isFullyBlocked = false;

  if (blockInfo) {
    if (blockInfo.block_type === 'full') {
      isFullyBlocked = true;
    } else if (blockInfo.block_type === 'private_only' && product.tourType === 'regular') {
      isFullyBlocked = true;
    }
  }

  // For each available time slot
  for (const time of product.availableTimes) {
    let vacancies = product.maxCapacity;

    if (isFullyBlocked) {
      vacancies = 0;
    } else {
      // Count current bookings for this time slot
      const bookingsResult = await query(
        `SELECT COALESCE(SUM(persons), 0) as total_persons
         FROM bookings
         WHERE date = $1 AND time = $2 AND tour_type = $3
         AND status NOT IN ('cancelled', 'rejected')`,
        [date, time, product.tourType]
      );

      const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
      vacancies = Math.max(0, product.maxCapacity - bookedPersons);
    }

    availabilities.push({
      dateTime: `${date}T${time}:00${tzOffset}`,
      vacancies: vacancies
    });
  }

  return availabilities;
}

/**
 * Sync availability for a specific date to GYG
 * Called after booking changes
 */
async function syncDateAvailabilityToGYG(date) {
  console.log(`[GYG-SYNC] Syncing availability for date: ${date}`);

  const results = [];

  // Sync both products (regular and private)
  for (const productId of Object.keys(PRODUCTS)) {
    try {
      const availabilities = await calculateAvailabilityForDate(productId, date);

      if (!availabilities || availabilities.length === 0) {
        console.log(`[GYG-SYNC] No availabilities calculated for ${productId} on ${date}`);
        continue;
      }

      console.log(`[GYG-SYNC] Pushing ${productId}: ${availabilities.map(a => `${a.dateTime.split('T')[1].slice(0,5)}=${a.vacancies}`).join(', ')}`);

      const result = await pushAvailabilityToGYG(productId, availabilities, true);
      results.push({
        productId,
        date,
        success: result.success,
        availabilities: availabilities.map(a => ({ time: a.dateTime.split('T')[1].slice(0, 5), vacancies: a.vacancies }))
      });

      if (result.success) {
        console.log(`[GYG-SYNC] ✓ ${productId} synced successfully`);
      } else {
        console.error(`[GYG-SYNC] ✗ ${productId} sync failed:`, result.error || result.data);
      }
    } catch (error) {
      console.error(`[GYG-SYNC] Error syncing ${productId}:`, error.message);
      results.push({
        productId,
        date,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Sync availability for multiple dates to GYG
 * Useful for bulk updates
 */
async function syncMultipleDatesAvailabilityToGYG(dates) {
  console.log(`[GYG-SYNC] Syncing ${dates.length} dates to GYG`);
  const allResults = [];

  for (const date of dates) {
    const results = await syncDateAvailabilityToGYG(date);
    allResults.push(...results);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allResults;
}

/**
 * Sync availability for a date range to GYG
 */
async function syncDateRangeAvailabilityToGYG(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return await syncMultipleDatesAvailabilityToGYG(dates);
}

/**
 * Handler for manual sync endpoint
 * POST /api/gyg/sync-availability
 */
async function handleSyncAvailability(req, res) {
  const { date, startDate, endDate, dates } = req.body || req.query;

  try {
    let results;

    if (date) {
      // Sync single date
      results = await syncDateAvailabilityToGYG(date);
    } else if (startDate && endDate) {
      // Sync date range
      results = await syncDateRangeAvailabilityToGYG(startDate, endDate);
    } else if (dates && Array.isArray(dates)) {
      // Sync specific dates
      results = await syncMultipleDatesAvailabilityToGYG(dates);
    } else {
      // Default: sync next 30 days
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = thirtyDaysLater.toISOString().split('T')[0];

      results = await syncDateRangeAvailabilityToGYG(startDateStr, endDateStr);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Synced ${successCount} successfully, ${failCount} failed`,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount
      },
      results
    });
  } catch (error) {
    console.error('[GYG-SYNC] Sync failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============ GYG NOTIFICATION WEBHOOK ============
// Handles THEMIS deactivation notifications from GYG
async function handleNotification(req, res) {
  const data = req.body?.data || req.body;

  console.log(`[GYG-NOTIFY] ========== NOTIFICATION RECEIVED ==========`);
  console.log(`[GYG-NOTIFY] Payload:`, JSON.stringify(data));

  const productId = data?.productId || data?.product_id || 'unknown';
  const optionId = data?.optionId || data?.option_id || '';
  const reason = data?.reason || data?.message || 'No reason provided';
  const eventType = data?.eventType || data?.event_type || data?.type || 'unknown';

  console.log(`[GYG-NOTIFY] Event: ${eventType} | Product: ${productId} | Option: ${optionId} | Reason: ${reason}`);

  // Send admin email alert
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (resendApiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
          to: [adminEmail],
          subject: `⚠️ GYG Notification: ${eventType} - Product ${productId}`,
          html: `
            <h2>GYG Notification Received</h2>
            <p><strong>Event Type:</strong> ${eventType}</p>
            <p><strong>Product ID:</strong> ${productId}</p>
            <p><strong>Option ID:</strong> ${optionId || 'N/A'}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <hr>
            <h3>Full Payload</h3>
            <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">${JSON.stringify(data, null, 2)}</pre>
            <hr>
            <p style="color: #666; font-size: 12px;">This notification was received from GetYourGuide's THEMIS system.</p>
          `
        })
      });
      console.log(`[GYG-NOTIFY] Admin alert email sent`);
    } catch (emailErr) {
      console.error(`[GYG-NOTIFY] Failed to send admin email:`, emailErr.message);
    }
  }

  // Auto-reactivation: if this is a deactivation event, attempt to reactivate
  if (eventType.toLowerCase().includes('deactivat') || reason.toLowerCase().includes('deactivat')) {
    console.log(`[GYG-NOTIFY] Deactivation detected - scheduling auto-reactivation for product ${productId}`);
    // Delay reactivation by 5 seconds to let GYG process the event
    setTimeout(async () => {
      try {
        const result = await reactivateProductOnGYG(productId, optionId);
        console.log(`[GYG-NOTIFY] Auto-reactivation result for ${productId}:`, result);
      } catch (err) {
        console.error(`[GYG-NOTIFY] Auto-reactivation failed for ${productId}:`, err.message);
      }
    }, 5000);
  }

  return res.status(200).json({
    data: { message: 'Notification received' }
  });
}

// ============ REACTIVATE PRODUCT ON GYG ============
// Calls GYG's reactivation API to re-enable a deactivated product
async function reactivateProductOnGYG(productId, optionId) {
  const auth = Buffer.from(`${GYG_OUTBOUND_USERNAME}:${GYG_OUTBOUND_PASSWORD}`).toString('base64');

  const payload = {
    data: {
      productId: String(productId)
    }
  };
  if (optionId) {
    payload.data.optionId = String(optionId);
  }

  console.log(`[GYG-REACTIVATE] Calling GYG reactivate for product ${productId}`, payload);

  const response = await fetch(`${GYG_API_URL}/1/reactivate-product`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = { raw: responseText };
  }

  console.log(`[GYG-REACTIVATE] Response: ${response.status}`, responseData);

  return {
    success: response.status >= 200 && response.status < 300,
    status: response.status,
    data: responseData
  };
}

// Handler for manual reactivation endpoint
// POST /api/gyg/1/reactivate
async function handleReactivateProduct(req, res) {
  const data = req.body?.data || req.body;
  const productId = data?.productId || data?.product_id;
  const optionId = data?.optionId || data?.option_id;

  if (!productId) {
    return res.status(400).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required field: productId'
    });
  }

  try {
    const result = await reactivateProductOnGYG(productId, optionId);

    // Send admin email about the reactivation attempt
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
            to: [adminEmail],
            subject: `${result.success ? '✅' : '❌'} GYG Reactivation: Product ${productId}`,
            html: `
              <h2>Product Reactivation ${result.success ? 'Successful' : 'Failed'}</h2>
              <p><strong>Product ID:</strong> ${productId}</p>
              <p><strong>Option ID:</strong> ${optionId || 'N/A'}</p>
              <p><strong>HTTP Status:</strong> ${result.status}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <h3>GYG Response</h3>
              <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">${JSON.stringify(result.data, null, 2)}</pre>
            `
          })
        });
      } catch (emailErr) {
        console.error('[GYG-REACTIVATE] Email notification failed:', emailErr.message);
      }
    }

    return res.status(200).json({
      success: result.success,
      message: result.success ? 'Product reactivated on GYG' : 'Reactivation failed',
      gygStatus: result.status,
      gygResponse: result.data
    });
  } catch (error) {
    console.error('[GYG-REACTIVATE] Error:', error);
    return res.status(500).json({
      errorCode: 'REACTIVATION_FAILED',
      errorMessage: error.message
    });
  }
}

// Export the push function for use in other modules
export { pushAvailabilityToGYG, syncDateAvailabilityToGYG, syncMultipleDatesAvailabilityToGYG, syncDateRangeAvailabilityToGYG, reactivateProductOnGYG };
