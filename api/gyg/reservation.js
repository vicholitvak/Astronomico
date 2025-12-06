/**
 * GetYourGuide Reservation Endpoint
 *
 * GYG calls this to temporarily hold availability before payment
 * Creates a pending reservation that expires if not confirmed
 *
 * POST /api/gyg/reservation
 */

import { insert, query } from '../lib/db.js';
import { validateGygAuth, gygErrorResponse, GYG_ERRORS, GYG_PRODUCTS } from './auth.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json(gygErrorResponse('METHOD_NOT_ALLOWED', 'Only POST allowed'));
  }

  // Validate authentication
  const auth = validateGygAuth(req);
  if (!auth.valid) {
    return res.status(401).json(gygErrorResponse(GYG_ERRORS.AUTHORIZATION_FAILURE, auth.error));
  }

  try {
    const {
      gygBookingReference,
      productId,
      dateTime,
      bookingItems
    } = req.body;

    if (!gygBookingReference || !dateTime) {
      return res.status(400).json(
        gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'gygBookingReference and dateTime are required')
      );
    }

    // Parse dateTime
    const dateObj = new Date(dateTime);
    const date = dateTime.split('T')[0];
    const time = dateObj.toTimeString().slice(0, 5);

    // Get product config
    const product = GYG_PRODUCTS[productId] || GYG_PRODUCTS['stargazing-regular'];
    const maxCapacity = product.maxCapacity;

    // Calculate total persons
    let totalPersons = 0;
    if (bookingItems && Array.isArray(bookingItems)) {
      totalPersons = bookingItems.reduce((sum, item) => sum + (item.count || 0), 0);
    }

    // Check availability
    const bookingsResult = await query(
      `SELECT COALESCE(SUM(persons), 0) as total_persons
       FROM bookings
       WHERE date = $1
       AND time = $2
       AND status NOT IN ('cancelled', 'rejected')
       AND tour_type = $3`,
      [date, time, product.tourType]
    );

    const bookedPersons = parseInt(bookingsResult.rows[0]?.total_persons || 0);
    const availableCapacity = maxCapacity - bookedPersons;

    if (totalPersons > availableCapacity) {
      return res.status(409).json(
        gygErrorResponse(GYG_ERRORS.NO_AVAILABILITY, `Only ${availableCapacity} spots available`)
      );
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
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      });
    }

    // Create temporary reservation (pending status)
    const result = await insert('bookings', {
      date,
      time,
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

    const reservationId = result.rows[0].id;

    console.log(`[GYG] Reservation created: ${reservationId} for ${gygBookingReference}`);

    return res.status(200).json({
      reservationReference: reservationId.toString(),
      gygBookingReference,
      status: 'RESERVED',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour hold
    });

  } catch (error) {
    console.error('GYG Reservation error:', error);
    return res.status(500).json(
      gygErrorResponse(GYG_ERRORS.INTERNAL_SYSTEM_FAILURE, error.message)
    );
  }
}
