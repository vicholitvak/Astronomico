/**
 * Cron Job para sincronizar cancelaciones de GYG y Viator
 *
 * PROBLEMA: Cuando un pasajero cancela en GYG/Viator, no siempre nos notifican.
 * SOLUCIÓN: Polling periódico para detectar cancelaciones.
 *
 * - GYG: Verificar estado de reservas activas (no tienen endpoint de polling)
 * - Viator: Usar /bookings/modified-since (requiere Full+Booking Access)
 *
 * Configurar en Vercel: cada 5 minutos
 * cron: "*/5 * * * *"
 */

import { Pool } from 'pg';
import { syncDateAvailabilityToGYG } from './gyg.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Viator API config
const VIATOR_AFFILIATE_ENV = process.env.VIATOR_AFFILIATE_ENV || 'sandbox';
const VIATOR_AFFILIATE_API_BASE = VIATOR_AFFILIATE_ENV === 'production'
  ? 'https://api.viator.com/partner'
  : 'https://api.sandbox.viator.com/partner';
const VIATOR_AFFILIATE_API_KEY = process.env.VIATOR_AFFILIATE_API_KEY || '';

// Store last check timestamp (in production, use Redis or DB)
let lastViatorCheck = null;

export default async function handler(req, res) {
  // Verificar autorización
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const isAuthorized = isVercelCron || authHeader === `Bearer ${cronSecret}`;

  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {
    timestamp: new Date().toISOString(),
    viator: { checked: 0, cancelled: 0, errors: [] },
    gyg: { checked: 0, cancelled: 0, errors: [] },
    availability_synced: []
  };

  try {
    // 1. Sync Viator cancellations (if we have booking access)
    if (VIATOR_AFFILIATE_API_KEY) {
      results.viator = await syncViatorCancellations();
    }

    // 2. Verify GYG bookings are still valid
    // (GYG should call our cancel endpoint, but we double-check)
    results.gyg = await verifyGygBookings();

    // 3. Sync availability to both platforms for any cancelled dates
    const cancelledDates = new Set();

    // Collect dates that had cancellations
    if (results.viator.cancelledBookings) {
      results.viator.cancelledBookings.forEach(b => cancelledDates.add(b.date));
    }
    if (results.gyg.cancelledBookings) {
      results.gyg.cancelledBookings.forEach(b => cancelledDates.add(b.date));
    }

    // Sync availability for those dates
    for (const date of cancelledDates) {
      try {
        await syncDateAvailabilityToGYG(date);
        results.availability_synced.push(date);
      } catch (err) {
        console.error(`[SYNC] Failed to sync availability for ${date}:`, err.message);
      }
    }

  } catch (error) {
    console.error('[SYNC-CANCEL] Error:', error);
    results.error = error.message;
  }

  console.log('[SYNC-CANCEL] Results:', JSON.stringify(results, null, 2));
  return res.status(200).json(results);
}

/**
 * Sync cancellations from Viator using /bookings/modified-since
 * This endpoint returns bookings that have been modified (including cancellations)
 */
async function syncViatorCancellations() {
  const results = {
    checked: 0,
    cancelled: 0,
    acknowledged: 0,
    errors: [],
    cancelledBookings: []
  };

  try {
    // Get timestamp for last check (default: 10 minutes ago)
    const checkSince = lastViatorCheck || new Date(Date.now() - 10 * 60 * 1000).toISOString();
    lastViatorCheck = new Date().toISOString();

    console.log(`[VIATOR-SYNC] Checking modifications since: ${checkSince}`);

    // Call Viator API
    const response = await fetch(`${VIATOR_AFFILIATE_API_BASE}/bookings/modified-since`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json;version=2.0',
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
        'exp-api-key': VIATOR_AFFILIATE_API_KEY
      },
      body: JSON.stringify({ modifiedSince: checkSince })
    });

    if (!response.ok) {
      const error = await response.text();
      // If FORBIDDEN, we don't have booking access yet
      if (response.status === 403) {
        console.log('[VIATOR-SYNC] Booking access not available yet (FORBIDDEN)');
        results.errors.push('Booking access not available');
        return results;
      }
      throw new Error(`Viator API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const modifiedBookings = data.bookings || [];
    results.checked = modifiedBookings.length;

    console.log(`[VIATOR-SYNC] Found ${modifiedBookings.length} modified bookings`);

    // Process each modified booking
    for (const booking of modifiedBookings) {
      try {
        // Check if this is a cancellation
        if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
          // Find our local booking
          const localBooking = await pool.query(
            `SELECT * FROM bookings WHERE viator_reference = $1`,
            [booking.viatorReference || booking.bookingRef]
          );

          if (localBooking.rows.length > 0) {
            const local = localBooking.rows[0];

            // Only update if not already cancelled
            if (local.status !== 'cancelled') {
              await pool.query(`
                UPDATE bookings
                SET status = 'cancelled',
                    cancellation_reason = $2,
                    updated_at = NOW()
                WHERE id = $1
              `, [local.id, `Cancelled via Viator: ${booking.cancellationReason || 'No reason provided'}`]);

              results.cancelled++;
              results.cancelledBookings.push({
                bookingId: local.booking_id,
                viatorRef: booking.viatorReference,
                date: local.date instanceof Date ? local.date.toISOString().split('T')[0] : local.date,
                reason: booking.cancellationReason
              });

              console.log(`[VIATOR-SYNC] Cancelled booking ${local.booking_id} (Viator: ${booking.viatorReference})`);

              // Send notification email to admin
              await sendCancellationNotification(local, 'Viator', booking.cancellationReason);
            }
          }

          // Acknowledge the cancellation to Viator (within 5 min)
          if (booking.acknowledgeBy) {
            await acknowledgeViatorCancellation(booking.bookingRef);
            results.acknowledged++;
          }
        }
      } catch (err) {
        console.error(`[VIATOR-SYNC] Error processing booking:`, err.message);
        results.errors.push(err.message);
      }
    }

  } catch (error) {
    console.error('[VIATOR-SYNC] Error:', error.message);
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Acknowledge a Viator cancellation
 */
async function acknowledgeViatorCancellation(bookingRef) {
  try {
    const response = await fetch(`${VIATOR_AFFILIATE_API_BASE}/bookings/modified-since/acknowledge`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json;version=2.0',
        'Content-Type': 'application/json',
        'exp-api-key': VIATOR_AFFILIATE_API_KEY
      },
      body: JSON.stringify({ bookingRef })
    });

    if (response.ok) {
      console.log(`[VIATOR-SYNC] Acknowledged cancellation for ${bookingRef}`);
    }
  } catch (err) {
    console.error(`[VIATOR-SYNC] Failed to acknowledge ${bookingRef}:`, err.message);
  }
}

/**
 * Verify GYG bookings are still valid
 * GYG should call our cancel endpoint, but we verify periodically
 */
async function verifyGygBookings() {
  const results = {
    checked: 0,
    cancelled: 0,
    errors: [],
    cancelledBookings: []
  };

  try {
    // Get recent GYG bookings that are still confirmed
    const gygBookings = await pool.query(`
      SELECT * FROM bookings
      WHERE source = 'gyg'
      AND status = 'confirmed'
      AND date >= CURRENT_DATE
      ORDER BY date ASC
      LIMIT 50
    `);

    results.checked = gygBookings.rows.length;
    console.log(`[GYG-SYNC] Checking ${results.checked} active GYG bookings`);

    // GYG doesn't have a polling endpoint for cancellations
    // They should call our /cancel-booking endpoint
    // But we can check if there are any orphaned reservations

    // Check for any reservations that are still "pending" for too long
    // (GYG reserve → book flow should complete within minutes)
    const staleReservations = await pool.query(`
      SELECT * FROM bookings
      WHERE source = 'gyg'
      AND status = 'pending'
      AND created_at < NOW() - INTERVAL '2 hours'
      AND date >= CURRENT_DATE
    `);

    for (const reservation of staleReservations.rows) {
      // These are likely abandoned reservations - mark as expired
      await pool.query(`
        UPDATE bookings
        SET status = 'expired',
            cancellation_reason = 'GYG reservation expired - booking never completed',
            updated_at = NOW()
        WHERE id = $1
      `, [reservation.id]);

      results.cancelled++;
      const dateStr = reservation.date instanceof Date
        ? reservation.date.toISOString().split('T')[0]
        : reservation.date;
      results.cancelledBookings.push({
        bookingId: reservation.booking_id,
        gygRef: reservation.gyg_reference,
        date: dateStr,
        reason: 'Reservation expired'
      });

      console.log(`[GYG-SYNC] Expired stale reservation: ${reservation.booking_id}`);
    }

  } catch (error) {
    console.error('[GYG-SYNC] Error:', error.message);
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Send notification email when a booking is cancelled externally
 */
async function sendCancellationNotification(booking, source, reason) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

  if (!resendApiKey) return;

  try {
    const dateStr = booking.date instanceof Date
      ? booking.date.toISOString().split('T')[0]
      : String(booking.date).split('T')[0];

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
        to: [adminEmail],
        subject: `⚠️ Cancelación Externa: ${booking.booking_id} (${source})`,
        html: `
          <h2>Reserva Cancelada Externamente</h2>
          <p>Una reserva fue cancelada desde ${source}:</p>
          <ul>
            <li><strong>ID:</strong> ${booking.booking_id}</li>
            <li><strong>Referencia ${source}:</strong> ${booking.gyg_reference || booking.viator_reference}</li>
            <li><strong>Fecha:</strong> ${dateStr}</li>
            <li><strong>Cliente:</strong> ${booking.name}</li>
            <li><strong>Personas:</strong> ${booking.persons}</li>
            <li><strong>Motivo:</strong> ${reason || 'No especificado'}</li>
          </ul>
          <p>La disponibilidad ha sido actualizada automáticamente.</p>
        `
      })
    });

    console.log(`[SYNC] Admin notification sent for cancelled booking ${booking.booking_id}`);
  } catch (err) {
    console.error('[SYNC] Failed to send cancellation notification:', err.message);
  }
}

/**
 * Export for manual triggering
 */
export { syncViatorCancellations, verifyGygBookings };
