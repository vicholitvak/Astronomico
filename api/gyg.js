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
 */

import { insert, query } from './lib/db.js';

// ============ GYG API CREDENTIALS (for calling GYG endpoints) ============
const GYG_API_URL = 'https://supplier-api.getyourguide.com';
const GYG_OUTBOUND_USERNAME = process.env.GYG_OUTBOUND_USERNAME || 'AtacamaDarkSky';
const GYG_OUTBOUND_PASSWORD = process.env.GYG_OUTBOUND_PASSWORD || '15ea726795960ec399a05b1d76882ca3';

// ============ CONFIGURATION ============
const PRODUCTS = {
  // Tour Regular (grupo compartido)
  '1152147': {
    productId: '1152147',
    name: 'San Pedro de Atacama: Stargazing Tour with Telescope',
    description: 'Experience the clearest skies on Earth with our stargazing tour in the Atacama Desert.',
    maxCapacity: 16,
    tourType: 'regular',
    currency: 'EUR',
    pricePerPerson: 5000, // 50.00 EUR in cents
    cutoffSeconds: 7200,  // 2 hours before tour
    availableTimes: ['21:00'],
    pricingType: 'individual', // precio por persona
    categories: ['ADULT'],
    city: 'San Pedro de Atacama',
    country: 'CHL'
  },
  // Tour Semi-Privado (precio por persona, max 4)
  '1163787': {
    productId: '1163787',
    name: 'Atacama: Private Stargazing Tour to Secret Spot',
    description: 'Small group 4x4 expedition to a Bortle Class 1 location with zero light pollution. Maximum 4 guests. Includes smart telescope, wine, hot drinks, and photo session.',
    maxCapacity: 4, // máximo 4 personas por tour
    tourType: 'private',
    currency: 'EUR',
    pricePerPerson: 28600, // €286 en GYG → €200 neto después de 30% comisión
    cutoffSeconds: 14400, // 4 hours before tour
    availableTimes: ['20:00', '20:30', '21:00', '00:00'], // horarios flexibles
    pricingType: 'individual', // precio por persona
    categories: ['ADULT'],
    city: 'San Pedro de Atacama',
    country: 'CHL'
  }
};

// Time Period products (for GYG testing - opening hours format)
const PRODUCTS_TIME_PERIOD = {
  // Tour Regular - Time Period format
  '1152147-TP': {
    productId: '1152147-TP',
    name: 'San Pedro de Atacama: Stargazing Tour (Time Period)',
    maxCapacity: 16,
    tourType: 'regular',
    currency: 'EUR',
    pricePerPerson: 5000,
    cutoffSeconds: 7200,
    openingHours: { fromTime: '20:00', toTime: '23:59' },
    pricingType: 'individual',
    categories: ['ADULT'],
    timePeriod: true
  },
  // Tour Semi-Privado - Time Period format
  '1163787-TP': {
    productId: '1163787-TP',
    name: 'Atacama: Private Stargazing Tour to Secret Spot (Time Period)',
    maxCapacity: 4,
    tourType: 'private',
    currency: 'EUR',
    pricePerPerson: 28600, // €286 en GYG → €200 neto
    cutoffSeconds: 14400,
    openingHours: { fromTime: '20:00', toTime: '23:59' },
    pricingType: 'individual',
    categories: ['ADULT'],
    timePeriod: true
  }
};

// Default product for backwards compatibility
const DEFAULT_PRODUCT_ID = '1152147';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    // Push availability to GYG (internal endpoint)
    if (path.includes('/push-availability') || path.includes('/notify-availability-update')) {
      return await handlePushAvailability(req, res);
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

  // Get product config - check both Time Point and Time Period products
  const product = PRODUCTS[productId] || PRODUCTS_TIME_PERIOD[productId];
  if (!product) {
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: `Product ${productId} not found`
    });
  }

  // Support both GYG format (fromDateTime/toDateTime) and simple format (dateTime)
  let startDate, endDate;

  if (fromDateTime && toDateTime) {
    startDate = new Date(fromDateTime);
    endDate = new Date(toDateTime);
  } else if (dateTime) {
    startDate = new Date(dateTime);
    endDate = new Date(dateTime);
  } else {
    console.log(`[GYG] Missing date params - fromDateTime: ${fromDateTime}, toDateTime: ${toDateTime}, dateTime: ${dateTime}`);
    return res.status(400).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required parameters: fromDateTime and toDateTime (or dateTime)'
    });
  }

  const availabilities = [];

  // Generate availabilities for each day in the range
  let currentDate = new Date(startDate);
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

      if (blockedResult.rows.length > 0) {
        const blockInfo = blockedResult.rows[0];
        if (blockInfo.block_type === 'full') {
          vacancies = 0;
        }
      }

      const availability = {
        productId: product.productId,
        dateTime: `${dateStr}T00:00:00-03:00`,
        openingTimes: [product.openingHours],
        cutoffSeconds: product.cutoffSeconds,
        currency: product.currency
      };

      // Add vacancies and pricing - use vacanciesByCategory for individual, vacancies for group
      if (product.pricingType === 'group') {
        availability.vacancies = vacancies;
        availability.pricesByCategory = {
          retailPrices: [{ category: 'GROUP', price: product.pricePerGroup }]
        };
      } else {
        // AVAILABILITY_BY_TICKET_CATEGORY feature
        availability.vacanciesByCategory = [{
          category: 'ADULT',
          vacancies: vacancies
        }];
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
      const dateTimeStr = `${dateStr}T${time}:00-03:00`; // Chile timezone

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
          // Para tour regular: contar personas
          const bookingsResult = await query(
            `SELECT COALESCE(SUM(persons), 0) as total_persons
             FROM bookings
             WHERE date = $1 AND time = $2 AND tour_type = 'regular'
             AND status NOT IN ('cancelled', 'rejected')`,
            [dateStr, time]
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
        // AVAILABILITY_BY_TICKET_CATEGORY feature - return vacanciesByCategory for individual products
        availability.vacanciesByCategory = [{
          category: 'ADULT',
          vacancies: vacancies
        }];
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

  // Get product config - check both Time Point and Time Period products
  const product = PRODUCTS[productId] || PRODUCTS_TIME_PERIOD[productId];
  if (!product) {
    return res.status(200).json({
      errorCode: 'INVALID_PRODUCT',
      errorMessage: `Product ${productId} not found`
    });
  }

  const dateObj = new Date(dateTime);
  const date = dateObj.toISOString().split('T')[0];
  // Extract time from ISO string properly
  const timeMatch = dateTime.match(/T(\d{2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '21:00';

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

  // Get product config (check both regular and time period products)
  const product = PRODUCTS[productId] || PRODUCTS_TIME_PERIOD[productId] || PRODUCTS[DEFAULT_PRODUCT_ID];

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
    await query(
      `UPDATE bookings SET
        status = 'confirmed',
        payment_status = 'paid',
        name = $2,
        email = $3,
        phone = $4,
        accommodation = $5,
        persons = $6,
        message = COALESCE(message, '') || $7,
        updated_at = NOW()
      WHERE id = $1`,
      [existingReservation.id, name, email, phone, travelerHotel || null, totalPersons || existingReservation.persons, comment ? `\nComment: ${comment}` : '']
    );

    // Generate tickets using request bookingItems count
    const tickets = generateTickets(existingReservation.booking_id, totalPersons || existingReservation.persons, product);

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

      await query(
        `UPDATE bookings SET
          status = 'confirmed',
          payment_status = 'paid',
          name = $2,
          email = $3,
          phone = $4,
          accommodation = $5,
          persons = $6,
          message = COALESCE(message, '') || $7,
          updated_at = NOW()
        WHERE id = $1`,
        [existing.id, name, email, phone, travelerHotel || null, totalPersons || existing.persons, comment ? `\nComment: ${comment}` : '']
      );
    }

    // Generate tickets using request bookingItems count
    const tickets = generateTickets(existing.booking_id, totalPersons || existing.persons, product);

    return res.status(200).json({
      data: {
        bookingReference: existing.booking_id,
        tickets: tickets
      }
    });
  }

  // Extract date and time
  const timeMatch = dateTime.match(/T(\d{2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '21:00';
  const date = dateTime.split('T')[0];

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
    message: notes,
    gyg_reference: gygBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] Booking confirmed: ${bookingId} for ${gygBookingReference} (${product.tourType})`);

  // Generate tickets
  const tickets = generateTickets(bookingId, totalPersons || 1, product);

  return res.status(200).json({
    data: {
      bookingReference: bookingId,
      tickets: tickets
    }
  });
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
    return res.status(400).json({
      errorCode: 'VALIDATION_FAILURE',
      errorMessage: 'Missing required field: gygBookingReference or bookingReference'
    });
  }

  let booking;
  if (gygBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE gyg_reference = $1`, [gygBookingReference]);
    booking = result.rows[0];
  } else {
    const result = await query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingReference]);
    booking = result.rows[0];
  }

  if (!booking) {
    return res.status(200).json({
      errorCode: 'INVALID_BOOKING',
      errorMessage: 'Booking not found'
    });
  }

  if (booking.status === 'cancelled') {
    // Already cancelled - return success (idempotent)
    return res.status(200).json({
      data: {}
    });
  }

  // Check if booking is in the past
  const tourDate = new Date(booking.date);
  const now = new Date();
  if (tourDate < now) {
    return res.status(200).json({
      errorCode: 'BOOKING_IN_PAST',
      errorMessage: 'Cannot cancel a booking that is in the past'
    });
  }

  await query(
    `UPDATE bookings SET
      status = 'cancelled',
      cancellation_reason = 'Cancelled via GYG API',
      updated_at = NOW()
    WHERE id = $1`,
    [booking.id]
  );

  console.log(`[GYG] Booking cancelled: ${booking.booking_id}`);

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
      dateTime: `${testDate}T${time}:00-03:00`,
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
      gygOptionId: product.gygOptionId || 'PENDING - Need from GYG Portal',
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
      productName: PRODUCTS[id].name,
      gygOptionId: PRODUCTS[id].gygOptionId || 'PENDING'
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

// Export the push function for use in other modules
export { pushAvailabilityToGYG };
