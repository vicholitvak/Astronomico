/**
 * GetYourGuide Supplier API
 *
 * Implements GYG Supplier API specification:
 * - GET /api/gyg/1/get-availabilities/
 * - POST /api/gyg/1/reserve/
 * - POST /api/gyg/1/book/
 * - POST /api/gyg/1/cancel/
 */

import { insert, query } from './lib/db.js';

// ============ CONFIGURATION ============
const TOUR_CONFIG = {
  productId: '1152147',
  name: 'Stargazing Tour',
  maxCapacity: 16,
  tourType: 'regular',
  currency: 'EUR',
  pricePerPerson: 5000, // 50.00 EUR in cents
  cutoffSeconds: 7200,  // 2 hours before tour
  availableTimes: ['21:00']
};

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

  // Validate authentication
  const auth = validateGygAuth(req);
  if (!auth.valid) {
    return res.status(401).json({
      errorCode: 'AUTHORIZATION_FAILURE',
      errorMessage: auth.error
    });
  }

  // Parse the path to determine which endpoint is being called
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/gyg', '');

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
    if (path.includes('/reserve') || req.query.action === 'reservation') {
      return await handleReserve(req, res);
    }
    if (path.includes('/book') || req.query.action === 'booking') {
      return await handleBook(req, res);
    }
    if (path.includes('/cancel') || req.query.action === 'cancellation') {
      return await handleCancel(req, res);
    }

    // Default: return API info
    return res.status(200).json({
      api: 'GetYourGuide Supplier API',
      version: '1.0',
      endpoints: [
        'GET /api/gyg/1/get-availabilities/',
        'POST /api/gyg/1/reserve/',
        'POST /api/gyg/1/book/',
        'POST /api/gyg/1/cancel/'
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
      errorCode: 'INVALID_REQUEST',
      errorMessage: 'Missing required parameters: fromDateTime and toDateTime (or dateTime)'
    });
  }

  const availabilities = [];

  // Generate availabilities for each day in the range
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const time of TOUR_CONFIG.availableTimes) {
      const dateTimeStr = `${dateStr}T${time}:00-03:00`; // Chile timezone

      // Check if date is blocked
      const blockedResult = await query(
        `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
        [dateStr]
      );

      let vacancies = TOUR_CONFIG.maxCapacity;

      if (blockedResult.rows.length > 0) {
        const blockInfo = blockedResult.rows[0];
        if (blockInfo.block_type === 'full') {
          vacancies = 0;
        } else if (blockInfo.block_type === 'late_private_only' && time === '21:00') {
          vacancies = 0;
        }
      }

      // Count current bookings if not fully blocked
      if (vacancies > 0) {
        const bookingsResult = await query(
          `SELECT COALESCE(SUM(persons), 0) as total_persons
           FROM bookings
           WHERE date = $1 AND time = $2 AND status NOT IN ('cancelled', 'rejected')`,
          [dateStr, time]
        );

        const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
        vacancies = Math.max(0, TOUR_CONFIG.maxCapacity - bookedPersons);
      }

      availabilities.push({
        dateTime: dateTimeStr,
        productId: productId || TOUR_CONFIG.productId,
        vacancies: vacancies,
        cutoffSeconds: TOUR_CONFIG.cutoffSeconds,
        currency: TOUR_CONFIG.currency,
        pricesByCategory: {
          retailPrices: [
            {
              category: 'ADULT',
              price: TOUR_CONFIG.pricePerPerson
            }
          ]
        }
      });
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
  const {
    gygBookingReference,
    productId,
    dateTime,
    tickets,
    bookingItems
  } = req.body;

  if (!gygBookingReference || !dateTime) {
    return res.status(400).json({
      errorCode: 'INVALID_REQUEST',
      errorMessage: 'Missing required fields: gygBookingReference, dateTime'
    });
  }

  const dateObj = new Date(dateTime);
  const date = dateObj.toISOString().split('T')[0];
  const time = dateObj.toTimeString().slice(0, 5);

  // Calculate total persons from tickets or bookingItems
  let totalPersons = 0;
  if (tickets && Array.isArray(tickets)) {
    totalPersons = tickets.reduce((sum, t) => sum + (t.count || 1), 0);
  } else if (bookingItems && Array.isArray(bookingItems)) {
    totalPersons = bookingItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }

  // Check if reservation already exists (idempotency)
  const existingReservation = await query(
    `SELECT * FROM bookings WHERE gyg_reference = $1`,
    [gygBookingReference]
  );

  if (existingReservation.rows.length > 0) {
    const existing = existingReservation.rows[0];
    return res.status(200).json({
      data: {
        reservationReference: existing.id.toString(),
        status: 'RESERVED'
      }
    });
  }

  // Create reservation
  const result = await insert('bookings', {
    booking_id: generateGygBookingId(),
    date,
    time,
    name: 'GYG Reservation (Pending)',
    email: 'pending@getyourguide.com',
    phone: '',
    persons: totalPersons || 1,
    tour_type: TOUR_CONFIG.tourType,
    status: 'pending',
    source: 'getyourguide',
    payment_method: 'getyourguide',
    payment_status: 'pending',
    message: `GYG Reservation: ${gygBookingReference}`,
    gyg_reference: gygBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] Reservation created: ${result.id} for ${gygBookingReference}`);

  return res.status(200).json({
    data: {
      reservationReference: result.id.toString(),
      status: 'RESERVED'
    }
  });
}

// ============ BOOK ============
async function handleBook(req, res) {
  const {
    gygBookingReference,
    productId,
    dateTime,
    tickets,
    bookingItems,
    traveler,
    travelerDetails,
    comment
  } = req.body;

  if (!gygBookingReference || !dateTime) {
    return res.status(400).json({
      errorCode: 'INVALID_REQUEST',
      errorMessage: 'Missing required fields: gygBookingReference, dateTime'
    });
  }

  // Check if booking already exists (idempotency)
  const existingBooking = await query(
    `SELECT * FROM bookings WHERE gyg_reference = $1`,
    [gygBookingReference]
  );

  if (existingBooking.rows.length > 0) {
    const existing = existingBooking.rows[0];
    // Update if it was a pending reservation
    if (existing.status === 'pending') {
      await query(
        `UPDATE bookings SET status = 'confirmed', payment_status = 'paid', updated_at = NOW() WHERE id = $1`,
        [existing.id]
      );
    }
    return res.status(200).json({
      data: {
        bookingReference: existing.id.toString(),
        status: 'CONFIRMED',
        tickets: [{
          ticketCode: `GYG-${existing.id}`,
          category: 'ADULT'
        }]
      }
    });
  }

  const dateObj = new Date(dateTime);
  const date = dateObj.toISOString().split('T')[0];
  const time = dateObj.toTimeString().slice(0, 5);

  // Calculate total persons
  let totalPersons = 0;
  if (tickets && Array.isArray(tickets)) {
    totalPersons = tickets.reduce((sum, t) => sum + (t.count || 1), 0);
  } else if (bookingItems && Array.isArray(bookingItems)) {
    totalPersons = bookingItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }

  // Get traveler info (support both formats)
  const travelerInfo = traveler || travelerDetails || {};
  const name = `${travelerInfo.firstName || ''} ${travelerInfo.lastName || ''}`.trim() || 'GetYourGuide Guest';
  const email = travelerInfo.email || 'getyourguide@booking.com';
  const phone = travelerInfo.phoneNumber || travelerInfo.phone || '';
  const country = travelerInfo.country || '';

  const notes = [
    `GYG Booking: ${gygBookingReference}`,
    comment ? `Comment: ${comment}` : null
  ].filter(Boolean).join('\n');

  const result = await insert('bookings', {
    booking_id: generateGygBookingId(),
    date,
    time,
    name,
    email,
    phone,
    country,
    persons: totalPersons || 1,
    tour_type: TOUR_CONFIG.tourType,
    status: 'confirmed',
    source: 'getyourguide',
    payment_method: 'getyourguide',
    payment_status: 'paid',
    message: notes,
    gyg_reference: gygBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] Booking confirmed: ${result.id} for ${gygBookingReference}`);

  // Generate ticket codes
  const ticketCodes = [];
  for (let i = 0; i < (totalPersons || 1); i++) {
    ticketCodes.push({
      ticketCode: `GYG-${result.id}-${i + 1}`,
      category: 'ADULT'
    });
  }

  return res.status(200).json({
    data: {
      bookingReference: result.id.toString(),
      status: 'CONFIRMED',
      tickets: ticketCodes
    }
  });
}

// ============ CANCEL ============
async function handleCancel(req, res) {
  const { gygBookingReference, bookingReference, reason } = req.body;

  if (!gygBookingReference && !bookingReference) {
    return res.status(400).json({
      errorCode: 'INVALID_REQUEST',
      errorMessage: 'Missing required field: gygBookingReference or bookingReference'
    });
  }

  let booking;
  if (gygBookingReference) {
    const result = await query(`SELECT * FROM bookings WHERE gyg_reference = $1`, [gygBookingReference]);
    booking = result.rows[0];
  } else {
    const result = await query(`SELECT * FROM bookings WHERE id = $1`, [bookingReference]);
    booking = result.rows[0];
  }

  if (!booking) {
    return res.status(404).json({
      errorCode: 'BOOKING_NOT_FOUND',
      errorMessage: 'Booking not found'
    });
  }

  if (booking.status === 'cancelled') {
    return res.status(200).json({
      data: {
        bookingReference: booking.id.toString(),
        status: 'CANCELLED'
      }
    });
  }

  const cancelNote = reason ? `\n[GYG Cancelled] ${reason}` : '\n[GYG Cancelled]';

  await query(
    `UPDATE bookings SET status = 'cancelled', message = COALESCE(message, '') || $1, updated_at = NOW() WHERE id = $2`,
    [cancelNote, booking.id]
  );

  console.log(`[GYG] Booking cancelled: ${booking.id}`);

  return res.status(200).json({
    data: {
      bookingReference: booking.id.toString(),
      status: 'CANCELLED'
    }
  });
}
