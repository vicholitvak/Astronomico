/**
 * Cron Job para gestión automática de reservas
 * - Cancelar reservas pendientes >48h
 * - Enviar recordatorio de pago a las 12h
 * - Limpiar reservas abandonadas muy antiguas
 * - Sincronizar reservas con Google Calendar
 *
 * Configurar en Vercel: diario a las 10:00 UTC
 */

import { Pool } from 'pg';
import { addToGoogleCalendar } from './google-calendar.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Verificar autorización (cron de Vercel o API key)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Vercel cron envía header especial, o podemos usar API key
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = isVercelCron || authHeader === `Bearer ${cronSecret}`;

  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {
    timestamp: new Date().toISOString(),
    reminders_sent: 0,
    bookings_cancelled: 0,
    old_bookings_cleaned: 0,
    calendar_synced: 0,
    errors: []
  };

  try {
    // 1. Enviar recordatorio de pago (12-14 horas después de crear)
    results.reminders_sent = await sendPaymentReminders();

    // 2. Cancelar reservas pendientes >48h
    results.bookings_cancelled = await cancelOldPendingBookings();

    // 3. Limpiar reservas muy antiguas (>30 días, pendientes)
    results.old_bookings_cleaned = await cleanupAbandonedBookings();

    // 4. Sincronizar reservas confirmadas con Google Calendar
    results.calendar_synced = await syncCalendar();

  } catch (error) {
    console.error('[CRON] Error:', error);
    results.errors.push(error.message);
  }

  console.log('[CRON] Results:', results);
  return res.status(200).json(results);
}

/**
 * Enviar recordatorio de pago a reservas pendientes >12h que no han recibido recordatorio
 * Como el cron corre 1 vez al día, usamos ventana amplia (12h - 36h)
 */
async function sendPaymentReminders() {
  let count = 0;

  try {
    // Buscar reservas pendientes >12h que NO han recibido recordatorio y aún no van a ser canceladas (>48h)
    const pendingBookings = await pool.query(`
      SELECT * FROM bookings
      WHERE status = 'pending'
      AND payment_method = 'pending'
      AND created_at < NOW() - INTERVAL '12 hours'
      AND created_at > NOW() - INTERVAL '36 hours'
      AND (payment_reminder_sent IS NULL OR payment_reminder_sent = false)
      AND email != 'pendiente@completar.com'
      AND date >= CURRENT_DATE
    `);

    for (const booking of pendingBookings.rows) {
      try {
        await sendPaymentReminderEmail(booking);

        // Marcar como recordatorio enviado
        await pool.query(`
          UPDATE bookings
          SET payment_reminder_sent = true,
              payment_reminder_sent_at = NOW()
          WHERE id = $1
        `, [booking.id]);

        count++;
        console.log(`[CRON] Recordatorio enviado a ${booking.email} para reserva ${booking.booking_id}`);
      } catch (err) {
        console.error(`[CRON] Error enviando recordatorio a ${booking.email}:`, err);
      }
    }
  } catch (error) {
    console.error('[CRON] Error en sendPaymentReminders:', error);
  }

  return count;
}

/**
 * Cancelar reservas pendientes con más de 48h
 */
async function cancelOldPendingBookings() {
  let count = 0;

  try {
    // Buscar reservas pendientes >48h cuya fecha de tour aún no pasó
    const oldPending = await pool.query(`
      SELECT * FROM bookings
      WHERE status = 'pending'
      AND payment_method = 'pending'
      AND created_at < NOW() - INTERVAL '48 hours'
      AND date >= CURRENT_DATE
    `);

    for (const booking of oldPending.rows) {
      try {
        // Cancelar la reserva
        await pool.query(`
          UPDATE bookings
          SET status = 'cancelled',
              cancellation_reason = 'auto_expired',
              updated_at = NOW()
          WHERE id = $1
        `, [booking.id]);

        // Enviar email de cancelación
        await sendCancellationEmail(booking);

        count++;
        console.log(`[CRON] Reserva ${booking.booking_id} cancelada por falta de pago`);
      } catch (err) {
        console.error(`[CRON] Error cancelando reserva ${booking.booking_id}:`, err);
      }
    }
  } catch (error) {
    console.error('[CRON] Error en cancelOldPendingBookings:', error);
  }

  return count;
}

/**
 * Limpiar reservas abandonadas muy antiguas (>30 días)
 */
async function cleanupAbandonedBookings() {
  let count = 0;

  try {
    // Marcar como 'expired' reservas pendientes muy antiguas cuya fecha ya pasó
    const result = await pool.query(`
      UPDATE bookings
      SET status = 'expired',
          updated_at = NOW()
      WHERE status = 'pending'
      AND date < CURRENT_DATE - INTERVAL '7 days'
      RETURNING id
    `);

    count = result.rowCount;

    if (count > 0) {
      console.log(`[CRON] ${count} reservas antiguas marcadas como expired`);
    }
  } catch (error) {
    console.error('[CRON] Error en cleanupAbandonedBookings:', error);
  }

  return count;
}

/**
 * Enviar email de recordatorio de pago
 */
async function sendPaymentReminderEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;

  const dateObj = new Date(booking.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo',
    'astrophoto': 'Tour Astrofotográfico'
  };

  const tourPrices = { 'regular': 42000, 'private': 200000, 'astrophoto': 120000 };
  const basePrice = tourPrices[booking.tour_type] || 42000;
  const totalPrice = booking.tour_type === 'private' ? basePrice : basePrice * booking.persons;

  // URL de pago directo (nueva página)
  const paymentUrl = `https://atacamadarksky.cl/pago?tour=${booking.tour_type}&date=${booking.date}&persons=${booking.persons}&email=${encodeURIComponent(booking.email)}&name=${encodeURIComponent(booking.name)}&phone=${encodeURIComponent(booking.phone || '')}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .urgent-header { background: linear-gradient(135deg, #FF4444 0%, #FF6B6B 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 2px solid #FF4444; border-top: none; border-radius: 0 0 10px 10px; }
    .countdown { background: #FFF3CD; border: 2px solid #FFD700; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .countdown h2 { color: #FF4444; margin: 0; }
    .payment-button { display: inline-block; background: #00C851; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px; }
    .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="urgent-header">
      <h1>⏰ ¡Últimas horas para confirmar tu reserva!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${booking.name}</strong>,</p>

      <div class="countdown">
        <h2>Tu reserva será cancelada en menos de 36 horas</h2>
        <p>Los cupos son limitados y otros clientes están esperando</p>
      </div>

      <div class="details">
        <p><strong>Reserva:</strong> ${booking.booking_id}</p>
        <p><strong>Tour:</strong> ${tourTypes[booking.tour_type]}</p>
        <p><strong>Fecha:</strong> ${formattedDate}</p>
        <p><strong>Personas:</strong> ${booking.persons}</p>
        <p><strong>Total:</strong> $${totalPrice.toLocaleString('es-CL')} CLP</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${paymentUrl}" class="payment-button">
          💳 PAGAR AHORA Y CONFIRMAR
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Si ya no deseas realizar el tour, no es necesario hacer nada - la reserva se cancelará automáticamente.
      </p>

      <hr style="margin: 30px 0;">

      <p style="color: #666; text-align: center;">
        <strong>English:</strong> Your booking will be cancelled in less than 36 hours if payment is not received.<br>
        <a href="${paymentUrl}">Click here to pay and confirm your spot</a>
      </p>

      <p style="text-align: center; margin-top: 20px;">
        ¿Preguntas? <a href="https://wa.me/56935134669">WhatsApp +56 9 3513 4669</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
      to: [booking.email],
      subject: `⏰ ÚLTIMO AVISO - Tu reserva ${booking.booking_id} será cancelada pronto`,
      html: emailHtml
    })
  });
}

/**
 * Enviar email de cancelación automática con opción de recuperar
 */
async function sendCancellationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;

  const dateObj = new Date(booking.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo',
    'astrophoto': 'Tour Astrofotográfico'
  };

  const tourPrices = { 'regular': 42000, 'private': 200000, 'astrophoto': 120000 };
  const basePrice = tourPrices[booking.tour_type] || 42000;
  const totalPrice = booking.tour_type === 'private' ? basePrice : basePrice * booking.persons;

  // URL de pago directo (nueva página)
  const paymentUrl = `https://atacamadarksky.cl/pago?tour=${booking.tour_type}&date=${booking.date}&persons=${booking.persons}&email=${encodeURIComponent(booking.email)}&name=${encodeURIComponent(booking.name)}&phone=${encodeURIComponent(booking.phone || '')}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6c757d; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .recover-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
    .pay-button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
    .new-booking { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reserva Cancelada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${booking.name}</strong>,</p>

      <p>Tu reserva <strong>${booking.booking_id}</strong> para el <strong>${formattedDate}</strong> ha sido cancelada automáticamente debido a que no recibimos el pago en el tiempo establecido.</p>

      <div class="recover-box">
        <h3 style="margin-top: 0; color: #856404;">🎟️ ¿Todavía quieres ir? ¡Aún hay cupos!</h3>
        <p style="margin: 10px 0;">Puedes reservar nuevamente con los mismos datos:</p>
        <p style="margin: 5px 0;"><strong>${tourTypes[booking.tour_type]}</strong></p>
        <p style="margin: 5px 0;">${formattedDate} - ${booking.persons} persona(s)</p>
        <p style="margin: 15px 0 20px 0; font-size: 20px; color: #28a745;"><strong>$${totalPrice.toLocaleString('es-CL')} CLP</strong></p>
        <a href="${paymentUrl}" class="pay-button">
          💳 Reservar y Pagar Ahora
        </a>
      </div>

      <p style="color: #666; text-align: center;">
        Si prefieres otra fecha, puedes elegir una nueva:
      </p>
      <div style="text-align: center;">
        <a href="https://atacamadarksky.cl/#tours" class="new-booking">
          Ver Otras Fechas Disponibles
        </a>
      </div>

      <p style="color: #666; margin-top: 25px;">
        ¿Preguntas? Escríbenos por WhatsApp al +56 9 3513 4669
      </p>

      <hr style="margin: 30px 0;">

      <p style="color: #666; text-align: center; font-size: 14px;">
        <strong>English:</strong> Your booking was cancelled due to non-payment.<br>
        Still want to go? <a href="${paymentUrl}">Click here to book and pay now</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
      to: [booking.email],
      subject: `Reserva ${booking.booking_id} Cancelada - Atacama Dark Sky`,
      html: emailHtml
    })
  });
}

/**
 * Sincronizar reservas confirmadas con Google Calendar
 */
async function syncCalendar() {
  let count = 0;

  try {
    // Buscar reservas confirmadas futuras
    const bookings = await pool.query(`
      SELECT * FROM bookings
      WHERE status IN ('confirmed', 'completed')
      AND date >= CURRENT_DATE
      ORDER BY date ASC
    `);

    for (const booking of bookings.rows) {
      try {
        // Normalizar fecha
        let dateStr = booking.date;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toISOString().split('T')[0];
        } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }

        const result = await addToGoogleCalendar({
          bookingId: booking.booking_id,
          date: dateStr,
          time: booking.time,
          persons: booking.persons,
          tourType: booking.tour_type,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          message: booking.message
        });

        if (result && result.id) {
          count++;
        }
      } catch (err) {
        console.error(`[CRON] Error syncing ${booking.booking_id} to calendar:`, err.message);
      }
    }

    console.log(`[CRON] Calendar sync: ${count} bookings synced`);
  } catch (error) {
    console.error('[CRON] Error en syncCalendar:', error);
  }

  return count;
}
