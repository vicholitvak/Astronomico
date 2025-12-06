/**
 * GetYourGuide API - Unified Endpoint
 *
 * Handles all GYG operations via query parameter:
 * /api/gyg?action=availability
 * /api/gyg?action=reservation
 * /api/gyg?action=booking
 * /api/gyg?action=cancellation
 */

import { insert, query } from './lib/db.js';

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

function gygErrorResponse(code, message) {
  return { error: { code, message } };
}

const GYG_ERRORS = {
  AUTHORIZATION_FAILURE: 'AUTHORIZATION_FAILURE',
  NO_AVAILABILITY: 'NO_AVAILABILITY',
  INVALID_RESERVATION: 'INVALID_RESERVATION',
  VALIDATION_FAILURE: 'VALIDATION_FAILURE',
  INTERNAL_SYSTEM_FAILURE: 'INTERNAL_SYSTEM_FAILURE'
};

const GYG_PRODUCTS = {
  'stargazing-regular': { name: 'Stargazing Tour', maxCapacity: 16, tourType: 'regular' },
  'stargazing-private': { name: 'Private Stargazing', maxCapacity: 10, tourType: 'private' },
  '1152147': { name: 'Stargazing Tour', maxCapacity: 16, tourType: 'regular' }
};

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
    return res.status(401).json(gygErrorResponse(GYG_ERRORS.AUTHORIZATION_FAILURE, auth.error));
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'availability':
        return await handleAvailability(req, res);
      case 'reservation':
        return await handleReservation(req, res);
      case 'booking':
        return await handleBooking(req, res);
      case 'cancellation':
        return await handleCancellation(req, res);
      default:
        return res.status(400).json(gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE,
          'Invalid action. Use: availability, reservation, booking, or cancellation'));
    }
  } catch (error) {
    console.error('GYG API error:', error);
    return res.status(500).json(gygErrorResponse(GYG_ERRORS.INTERNAL_SYSTEM_FAILURE, error.message));
  }
}

// ============ AVAILABILITY ============
async function handleAvailability(req, res) {
  const { productId, dateTime } = req.query;

  if (!productId || !dateTime) {
    return res.status(400).json(
      gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'productId and dateTime are required')
    );
  }

  const date = dateTime.split('T')[0];
  const dateObj = new Date(dateTime);
  const time = dateObj.toTimeString().slice(0, 5);

  const product = GYG_PRODUCTS[productId] || GYG_PRODUCTS['stargazing-regular'];
  const maxCapacity = product.maxCapacity;

  // Check if date is blocked
  const blockedResult = await query(
    `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
    [date]
  );

  if (blockedResult.rows.length > 0) {
    const blockInfo = blockedResult.rows[0];
    if (blockInfo.block_type === 'full') {
      return res.status(200).json({
        productId, dateTime, availableCapacity: 0, totalCapacity: maxCapacity
      });
    }
    if (blockInfo.block_type === 'late_private_only' && time === '21:00') {
      return res.status(200).json({
        productId, dateTime, availableCapacity: 0, totalCapacity: maxCapacity
      });
    }
  }

  // Count current bookings
  const bookingsResult = await query(
    `SELECT COALESCE(SUM(persons), 0) as total_persons
     FROM bookings
     WHERE date = $1 AND time = $2 AND status NOT IN ('cancelled', 'rejected')`,
    [date, time]
  );

  const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
  const availableCapacity = Math.max(0, maxCapacity - bookedPersons);

  return res.status(200).json({
    productId, dateTime, availableCapacity, totalCapacity: maxCapacity, bookedCapacity: bookedPersons
  });
}

// ============ RESERVATION ============
async function handleReservation(req, res) {
  const { gygBookingReference, productId, dateTime, bookingItems } = req.body;

  if (!gygBookingReference || !dateTime) {
    return res.status(400).json(
      gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'gygBookingReference and dateTime are required')
    );
  }

  const date = dateTime.split('T')[0];
  const dateObj = new Date(dateTime);
  const time = dateObj.toTimeString().slice(0, 5);

  const product = GYG_PRODUCTS[productId] || GYG_PRODUCTS['stargazing-regular'];

  let totalPersons = 0;
  if (bookingItems && Array.isArray(bookingItems)) {
    totalPersons = bookingItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }

  // Check if reservation already exists
  const existingReservation = await query(
    `SELECT * FROM bookings WHERE gyg_reference = $1`,
    [gygBookingReference]
  );

  if (existingReservation.rows.length > 0) {
    return res.status(200).json({
      reservationReference: existingReservation.rows[0].id.toString(),
      gygBookingReference,
      status: 'RESERVED',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  }

  // Create temporary reservation
  const result = await insert('bookings', {
    date, time,
    name: 'GYG Reservation (Pending)',
    email: 'pending@getyourguide.com',
    phone: '',
    persons: totalPersons || 1,
    tour_type: product.tourType,
    status: 'pending',
    source: 'getyourguide',
    payment_method: 'getyourguide',
    payment_status: 'pending',
    message: `GYG Reservation: ${gygBookingReference}`,
    gyg_reference: gygBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] Reservation created: ${result.rows[0].id}`);

  return res.status(200).json({
    reservationReference: result.rows[0].id.toString(),
    gygBookingReference,
    status: 'RESERVED',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  });
}

// ============ BOOKING ============
async function handleBooking(req, res) {
  const {
    gygBookingReference, productId, dateTime,
    travelerDetails, bookingItems, pickupLocation, comment
  } = req.body;

  if (!gygBookingReference || !dateTime) {
    return res.status(400).json(
      gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'gygBookingReference and dateTime are required')
    );
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
      bookingReference: existing.id.toString(),
      gygBookingReference,
      status: 'CONFIRMED'
    });
  }

  const date = dateTime.split('T')[0];
  const dateObj = new Date(dateTime);
  const time = dateObj.toTimeString().slice(0, 5);

  const product = GYG_PRODUCTS[productId] || GYG_PRODUCTS['stargazing-regular'];

  let totalPersons = 0;
  if (bookingItems && Array.isArray(bookingItems)) {
    totalPersons = bookingItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }

  const traveler = travelerDetails || {};
  const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || 'GetYourGuide Guest';
  const email = traveler.email || 'getyourguide@booking.com';
  const phone = traveler.phoneNumber || '';
  const country = traveler.country || '';

  const notes = [
    `GYG Booking: ${gygBookingReference}`,
    pickupLocation ? `Pickup: ${pickupLocation}` : null,
    comment ? `Comment: ${comment}` : null
  ].filter(Boolean).join('\n');

  const result = await insert('bookings', {
    date, time, name, email, phone, country,
    persons: totalPersons || 1,
    tour_type: product.tourType,
    status: 'confirmed',
    source: 'getyourguide',
    payment_method: 'getyourguide',
    payment_status: 'paid',
    message: notes,
    gyg_reference: gygBookingReference,
    created_at: new Date().toISOString()
  });

  console.log(`[GYG] Booking confirmed: ${result.rows[0].id}`);

  return res.status(200).json({
    bookingReference: result.rows[0].id.toString(),
    gygBookingReference,
    status: 'CONFIRMED'
  });
}

// ============ CANCELLATION ============
async function handleCancellation(req, res) {
  const { gygBookingReference, bookingReference, reason } = req.body;

  if (!gygBookingReference && !bookingReference) {
    return res.status(400).json(
      gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'gygBookingReference or bookingReference required')
    );
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
    return res.status(404).json(
      gygErrorResponse(GYG_ERRORS.INVALID_RESERVATION, 'Booking not found')
    );
  }

  if (booking.status === 'cancelled') {
    return res.status(200).json({
      bookingReference: booking.id.toString(),
      gygBookingReference: booking.gyg_reference,
      status: 'CANCELLED'
    });
  }

  const cancelNote = reason ? `\n[GYG Cancelled] ${reason}` : '\n[GYG Cancelled]';

  await query(
    `UPDATE bookings SET status = 'cancelled', message = COALESCE(message, '') || $1, updated_at = NOW() WHERE id = $2`,
    [cancelNote, booking.id]
  );

  console.log(`[GYG] Booking cancelled: ${booking.id}`);

  return res.status(200).json({
    bookingReference: booking.id.toString(),
    gygBookingReference: booking.gyg_reference,
    status: 'CANCELLED'
  });
}
