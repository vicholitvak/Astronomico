/**
 * Endpoint temporal para corregir fechas desfasadas de GYG
 * Llamar con: POST /api/fix-dates?secret=atacama2025
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Reservas a corregir
const corrections = [
  { gyg_reference: 'GYGVN3KM73QL', correct_date: '2025-12-18' },
  { gyg_reference: 'GYGBLHYG8H6A', correct_date: '2025-12-19' },
];

export default async function handler(req, res) {
  // Verificar secret
  if (req.query.secret !== 'atacama2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];

  try {
    for (const fix of corrections) {
      const result = await pool.query(
        'SELECT id, booking_id, date, name FROM bookings WHERE gyg_reference = $1',
        [fix.gyg_reference]
      );

      if (result.rows.length === 0) {
        results.push({ gyg_reference: fix.gyg_reference, status: 'not_found' });
        continue;
      }

      const booking = result.rows[0];
      const currentDate = booking.date instanceof Date
        ? booking.date.toISOString().split('T')[0]
        : String(booking.date).split('T')[0];

      if (currentDate === fix.correct_date) {
        results.push({
          gyg_reference: fix.gyg_reference,
          booking_id: booking.booking_id,
          status: 'already_correct',
          date: currentDate
        });
        continue;
      }

      // Actualizar la fecha
      await pool.query(
        'UPDATE bookings SET date = $1, updated_at = NOW() WHERE id = $2',
        [fix.correct_date, booking.id]
      );

      results.push({
        gyg_reference: fix.gyg_reference,
        booking_id: booking.booking_id,
        name: booking.name,
        status: 'CORRECTED',
        old_date: currentDate,
        new_date: fix.correct_date
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Date corrections completed',
      results
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
