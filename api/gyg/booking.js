/**
 * GetYourGuide Booking Endpoint
 *
 * GYG calls this when a booking is confirmed (after payment)
 * We create the booking in our system
 *
 * POST /api/gyg/booking
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
      travelerDetails,
      bookingItems,
      pickupLocation,
      comment
    } = req.body;

    // Validate required fields
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
      // Return existing booking (idempotent response)
      return res.status(200).json({
        bookingReference: existingBooking.rows[0].id.toString(),
        gygBookingReference,
        status: 'CONFIRMED'
      });
    }

    // Parse dateTime
    const dateObj = new Date(dateTime);
    const date = dateTime.split('T')[0];
    const time = dateObj.toTimeString().slice(0, 5);

    // Get product config
    const product = GYG_PRODUCTS[productId] || GYG_PRODUCTS['stargazing-regular'];

    // Calculate total persons from bookingItems
    let totalPersons = 0;
    if (bookingItems && Array.isArray(bookingItems)) {
      totalPersons = bookingItems.reduce((sum, item) => sum + (item.count || 0), 0);
    }

    // Extract traveler info
    const traveler = travelerDetails || {};
    const name = `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() || 'GetYourGuide Guest';
    const email = traveler.email || 'getyourguide@booking.com';
    const phone = traveler.phoneNumber || '';
    const country = traveler.country || '';

    // Build notes with GYG info
    const notes = [
      `GYG Booking: ${gygBookingReference}`,
      pickupLocation ? `Pickup: ${pickupLocation}` : null,
      comment ? `Comment: ${comment}` : null
    ].filter(Boolean).join('\n');

    // Create booking in our system
    const result = await insert('bookings', {
      date,
      time,
      name,
      email,
      phone,
      country,
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

    const bookingId = result.rows[0].id;

    console.log(`[GYG] Booking created: ${bookingId} for ${gygBookingReference}`);

    return res.status(200).json({
      bookingReference: bookingId.toString(),
      gygBookingReference,
      status: 'CONFIRMED',
      message: 'Booking confirmed successfully'
    });

  } catch (error) {
    console.error('GYG Booking error:', error);
    return res.status(500).json(
      gygErrorResponse(GYG_ERRORS.INTERNAL_SYSTEM_FAILURE, error.message)
    );
  }
}
