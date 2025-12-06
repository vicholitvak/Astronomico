/**
 * GetYourGuide Cancellation Endpoint
 *
 * GYG calls this when a booking is cancelled
 * We update the booking status in our system
 *
 * POST /api/gyg/cancellation
 */

import { query } from '../lib/db.js';
import { validateGygAuth, gygErrorResponse, GYG_ERRORS } from './auth.js';

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
      bookingReference,
      reason
    } = req.body;

    if (!gygBookingReference && !bookingReference) {
      return res.status(400).json(
        gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'gygBookingReference or bookingReference required')
      );
    }

    // Find the booking
    let booking;
    if (gygBookingReference) {
      const result = await query(
        `SELECT * FROM bookings WHERE gyg_reference = $1`,
        [gygBookingReference]
      );
      booking = result.rows[0];
    } else {
      const result = await query(
        `SELECT * FROM bookings WHERE id = $1`,
        [bookingReference]
      );
      booking = result.rows[0];
    }

    if (!booking) {
      return res.status(404).json(
        gygErrorResponse(GYG_ERRORS.INVALID_RESERVATION, 'Booking not found')
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return res.status(200).json({
        bookingReference: booking.id.toString(),
        gygBookingReference: booking.gyg_reference,
        status: 'CANCELLED',
        message: 'Booking was already cancelled'
      });
    }

    // Update booking status to cancelled
    const cancelNote = reason ? `\n[GYG Cancellation] ${reason}` : '\n[GYG Cancellation]';

    await query(
      `UPDATE bookings
       SET status = 'cancelled',
           message = COALESCE(message, '') || $1,
           updated_at = NOW()
       WHERE id = $2`,
      [cancelNote, booking.id]
    );

    console.log(`[GYG] Booking cancelled: ${booking.id} (${gygBookingReference})`);

    return res.status(200).json({
      bookingReference: booking.id.toString(),
      gygBookingReference: booking.gyg_reference,
      status: 'CANCELLED',
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('GYG Cancellation error:', error);
    return res.status(500).json(
      gygErrorResponse(GYG_ERRORS.INTERNAL_SYSTEM_FAILURE, error.message)
    );
  }
}
