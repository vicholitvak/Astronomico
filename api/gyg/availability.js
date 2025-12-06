/**
 * GetYourGuide Availability Endpoint
 *
 * GYG calls this to check how many spots are available for a product/date/time
 *
 * GET /api/gyg/availability?productId=XXX&dateTime=2024-01-15T21:00:00
 */

import { query } from '../lib/db.js';
import { validateGygAuth, gygErrorResponse, GYG_ERRORS, GYG_PRODUCTS } from './auth.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json(gygErrorResponse('METHOD_NOT_ALLOWED', 'Only GET allowed'));
  }

  // Validate authentication
  const auth = validateGygAuth(req);
  if (!auth.valid) {
    return res.status(401).json(gygErrorResponse(GYG_ERRORS.AUTHORIZATION_FAILURE, auth.error));
  }

  try {
    const { productId, dateTime } = req.query;

    if (!productId || !dateTime) {
      return res.status(400).json(
        gygErrorResponse(GYG_ERRORS.VALIDATION_FAILURE, 'productId and dateTime are required')
      );
    }

    // Parse dateTime (format: 2024-01-15T21:00:00)
    const dateObj = new Date(dateTime);
    const date = dateTime.split('T')[0]; // YYYY-MM-DD
    const time = dateObj.toTimeString().slice(0, 5); // HH:MM

    // Get product config (or use default for unknown products)
    const product = GYG_PRODUCTS[productId] || GYG_PRODUCTS['stargazing-regular'];
    const maxCapacity = product.maxCapacity;

    // Check if date is blocked
    const blockedResult = await query(
      `SELECT * FROM blocked_dates WHERE tour_date = $1`,
      [date]
    );

    if (blockedResult.rows.length > 0) {
      const blockInfo = blockedResult.rows[0];
      // If fully blocked, no availability
      if (blockInfo.block_type === 'full') {
        return res.status(200).json({
          productId,
          dateTime,
          availableCapacity: 0,
          totalCapacity: maxCapacity
        });
      }
      // If late_private_only and time is 21:00, no availability for regular
      if (blockInfo.block_type === 'late_private_only' && time === '21:00' && product.tourType === 'regular') {
        return res.status(200).json({
          productId,
          dateTime,
          availableCapacity: 0,
          totalCapacity: maxCapacity
        });
      }
    }

    // Count current bookings for this date/time
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
    const availableCapacity = Math.max(0, maxCapacity - bookedPersons);

    return res.status(200).json({
      productId,
      dateTime,
      availableCapacity,
      totalCapacity: maxCapacity,
      bookedCapacity: bookedPersons
    });

  } catch (error) {
    console.error('GYG Availability error:', error);
    return res.status(500).json(
      gygErrorResponse(GYG_ERRORS.INTERNAL_SYSTEM_FAILURE, error.message)
    );
  }
}
