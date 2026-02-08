/**
 * Admin Data API - Combined endpoint for photo-links, blocked-dates, and calendar status
 * Routes: ?type=photos, ?type=blocked, ?type=income, ?type=conversion, ?type=calendar
 */

import { Pool } from 'pg';
import { google } from 'googleapis';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============ GYG NOTIFICATION HELPERS ============
const GYG_API_URL = 'https://supplier-api.getyourguide.com';
const GYG_OUTBOUND_USERNAME = process.env.GYG_OUTBOUND_USERNAME || 'AtacamaDarkSky';
const GYG_OUTBOUND_PASSWORD = process.env.GYG_OUTBOUND_PASSWORD;

// ============ VIATOR NOTIFICATION HELPERS ============
const VIATOR_PRODUCTS = {
  'ADS-REGULAR': { tourType: 'regular', name: 'Tour Regular' },
  'ADS-PRIVATE': { tourType: 'private', name: 'Tour Privado' },
  '5624520P1': { tourType: 'private', name: 'Tour Semi-Privado (Viator portal)' }
};

// GYG Products configuration
const GYG_PRODUCTS = {
  regular: {
    productId: '1152147',
    availableTimes: ['21:00'],
    maxCapacity: 16
  },
  private: {
    productId: '1163787',
    availableTimes: ['20:00', '20:30', '21:00'],
    maxCapacity: 4
  }
};

// Chile timezone helper
function getChileTimezoneOffset(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const firstSundayApril = new Date(year, 3, 1);
  while (firstSundayApril.getDay() !== 0) firstSundayApril.setDate(firstSundayApril.getDate() + 1);

  const firstSundaySept = new Date(year, 8, 1);
  while (firstSundaySept.getDay() !== 0) firstSundaySept.setDate(firstSundaySept.getDate() + 1);

  const isWinterTime = (
    (month > 3 || (month === 3 && day >= firstSundayApril.getDate())) &&
    (month < 8 || (month === 8 && day < firstSundaySept.getDate()))
  );

  return isWinterTime ? '-04:00' : '-03:00';
}

// Notify GYG of availability change for a date
async function notifyGygDateBlocked(date, blockType) {
  if (!GYG_OUTBOUND_PASSWORD) {
    console.log('[Admin] Skipping GYG notification - credentials not configured');
    return;
  }

  const auth = Buffer.from(`${GYG_OUTBOUND_USERNAME}:${GYG_OUTBOUND_PASSWORD}`).toString('base64');
  const tzOffset = getChileTimezoneOffset(date);

  try {
    // Determine which products to block based on block_type
    const productsToNotify = [];

    if (blockType === 'full') {
      // Block both regular and private tours
      productsToNotify.push(GYG_PRODUCTS.regular, GYG_PRODUCTS.private);
    } else if (blockType === 'private_only') {
      // Only block regular tours (private still available)
      productsToNotify.push(GYG_PRODUCTS.regular);
    }

    for (const product of productsToNotify) {
      const availabilities = product.availableTimes.map(time => ({
        dateTime: `${date}T${time}:00${tzOffset}`,
        vacancies: 0
      }));

      const payload = {
        data: {
          productId: product.productId,
          availabilities: availabilities
        }
      };

      const response = await fetch(`${GYG_API_URL}/1/notify-availability-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log(`[Admin] GYG notified for ${product.productId} on ${date}: ${response.status}`, result);
    }
  } catch (error) {
    console.error(`[Admin] Failed to notify GYG: ${error.message}`);
  }
}

// Notify GYG to restore availability for a date
async function notifyGygDateUnblocked(date) {
  if (!GYG_OUTBOUND_PASSWORD) {
    console.log('[Admin] Skipping GYG notification - credentials not configured');
    return;
  }

  const auth = Buffer.from(`${GYG_OUTBOUND_USERNAME}:${GYG_OUTBOUND_PASSWORD}`).toString('base64');
  const tzOffset = getChileTimezoneOffset(date);

  try {
    // Get current bookings for this date to calculate actual availability
    const bookingsResult = await pool.query(`
      SELECT tour_type, time, COALESCE(SUM(persons), 0) as total_persons, COUNT(*) as booking_count
      FROM bookings
      WHERE date = $1 AND status NOT IN ('cancelled', 'rejected')
      GROUP BY tour_type, time
    `, [date]);

    const bookingsByTypeTime = {};
    for (const row of bookingsResult.rows) {
      const key = `${row.tour_type}-${row.time}`;
      bookingsByTypeTime[key] = {
        totalPersons: parseInt(row.total_persons),
        bookingCount: parseInt(row.booking_count)
      };
    }

    // Notify for both products
    for (const [tourType, product] of Object.entries(GYG_PRODUCTS)) {
      const availabilities = product.availableTimes.map(time => {
        const key = `${tourType}-${time}`;
        const booking = bookingsByTypeTime[key];

        let vacancies;
        // Both tour types: capacity minus booked persons
        const bookedPersons = booking?.totalPersons || 0;
        vacancies = Math.max(0, product.maxCapacity - bookedPersons);

        return {
          dateTime: `${date}T${time}:00${tzOffset}`,
          vacancies: vacancies
        };
      });

      const payload = {
        data: {
          productId: product.productId,
          availabilities: availabilities
        }
      };

      const response = await fetch(`${GYG_API_URL}/1/notify-availability-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log(`[Admin] GYG availability restored for ${product.productId} on ${date}: ${response.status}`, result);
    }
  } catch (error) {
    console.error(`[Admin] Failed to notify GYG of unblock: ${error.message}`);
  }
}

// Notify Viator of blocked date via admin email reminder
// Viator Supplier API is pull-only (no push endpoint like GYG).
// When the Supplier API is connected, Viator will check our /availability
// endpoint and blocked dates will be enforced at booking time automatically.
// This function sends an admin email reminder to also block in Viator's portal.
async function notifyViatorDateBlocked(date, blockType) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

  console.log(`[Admin] Viator notification: date ${date} blocked (${blockType})`);

  if (!resendApiKey) {
    console.log('[Admin] Skipping Viator notification - RESEND_API_KEY not configured');
    return;
  }

  try {
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const blockLabel = blockType === 'full'
      ? 'Bloqueo total (todos los tours)'
      : 'Solo tours regulares bloqueados (privados disponibles)';

    const affectedProducts = Object.entries(VIATOR_PRODUCTS)
      .filter(([, p]) => blockType === 'full' || p.tourType === 'regular')
      .map(([code, p]) => `${code}: ${p.name}`)
      .join(', ');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
        to: [adminEmail],
        subject: `Viator: Bloquear fecha ${date} en portal`,
        html: `
          <h2>Accion requerida: Bloquear fecha en Viator</h2>
          <p>Se bloqueo la fecha <strong>${formattedDate}</strong> en el sistema.</p>
          <p><strong>Tipo de bloqueo:</strong> ${blockLabel}</p>
          <p><strong>Productos afectados:</strong> ${affectedProducts}</p>
          <hr>
          <p><strong>Viator no tiene API push</strong>, por lo que debes bloquear esta fecha manualmente en el portal de proveedor de Viator.</p>
          <p>Si el Supplier API esta conectado, las reservas nuevas seran rechazadas automaticamente, pero el calendario de Viator puede mostrar disponibilidad hasta que lo actualices manualmente.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">GYG ya fue notificado automaticamente.</p>
        `
      })
    });
    console.log(`[Admin] Viator block reminder email sent for ${date}`);
  } catch (error) {
    console.error(`[Admin] Failed to send Viator notification: ${error.message}`);
  }
}

// Notify admin to unblock date on Viator portal
async function notifyViatorDateUnblocked(date) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

  console.log(`[Admin] Viator notification: date ${date} unblocked`);

  if (!resendApiKey) {
    console.log('[Admin] Skipping Viator unblock notification - RESEND_API_KEY not configured');
    return;
  }

  try {
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
        to: [adminEmail],
        subject: `Viator: Desbloquear fecha ${date} en portal`,
        html: `
          <h2>Accion requerida: Desbloquear fecha en Viator</h2>
          <p>Se desbloqueo la fecha <strong>${formattedDate}</strong> en el sistema.</p>
          <p>Recuerda desbloquear esta fecha tambien en el portal de proveedor de Viator.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">GYG ya fue notificado automaticamente.</p>
        `
      })
    });
    console.log(`[Admin] Viator unblock reminder email sent for ${date}`);
  } catch (error) {
    console.error(`[Admin] Failed to send Viator unblock notification: ${error.message}`);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type } = req.query;

  try {
    // ============ PHOTO LINKS ============
    if (type === 'photos') {
      if (req.method === 'GET') {
        const { date } = req.query;

        if (date) {
          const result = await pool.query(
            'SELECT * FROM photo_links WHERE tour_date = $1',
            [date]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No photo link for this date' });
          }
          return res.status(200).json({ success: true, data: result.rows[0] });
        } else {
          const result = await pool.query(
            'SELECT * FROM photo_links ORDER BY tour_date DESC LIMIT 100'
          );
          return res.status(200).json({ success: true, data: result.rows });
        }
      }

      if (req.method === 'POST') {
        const { tour_date, photo_url, description } = req.body;

        if (!tour_date || !photo_url) {
          return res.status(400).json({ success: false, error: 'tour_date and photo_url are required' });
        }

        const result = await pool.query(`
          INSERT INTO photo_links (tour_date, photo_url, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (tour_date)
          DO UPDATE SET photo_url = EXCLUDED.photo_url, description = EXCLUDED.description, updated_at = TIMEZONE('utc', NOW())
          RETURNING *
        `, [tour_date, photo_url, description || null]);

        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (req.method === 'DELETE') {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, error: 'date is required' });

        await pool.query('DELETE FROM photo_links WHERE tour_date = $1', [date]);
        return res.status(200).json({ success: true, message: 'Deleted' });
      }
    }

    // ============ BLOCKED DATES ============
    if (type === 'blocked') {
      if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM blocked_dates ORDER BY blocked_date ASC');
        return res.status(200).json({ success: true, data: result.rows });
      }

      if (req.method === 'POST') {
        const { blocked_date, tour_date, reason, block_type } = req.body;
        const dateToBlock = blocked_date || tour_date;
        const finalBlockType = block_type || 'full';

        if (!dateToBlock) {
          return res.status(400).json({ success: false, error: 'blocked_date is required' });
        }

        const result = await pool.query(`
          INSERT INTO blocked_dates (blocked_date, reason, block_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason, block_type = EXCLUDED.block_type
          RETURNING *
        `, [dateToBlock, reason || null, finalBlockType]);

        // Notify GYG of the blocked date (async, don't wait)
        notifyGygDateBlocked(dateToBlock, finalBlockType);

        // Notify admin to also block on Viator portal (async, don't wait)
        notifyViatorDateBlocked(dateToBlock, finalBlockType);

        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (req.method === 'DELETE') {
        const { date, tour_date } = req.query;
        const dateToUnblock = date || tour_date;
        if (!dateToUnblock) return res.status(400).json({ success: false, error: 'date is required' });

        await pool.query('DELETE FROM blocked_dates WHERE blocked_date = $1', [dateToUnblock]);

        // Notify GYG to restore availability (async, don't wait)
        notifyGygDateUnblocked(dateToUnblock);

        // Notify admin to also unblock on Viator portal (async, don't wait)
        notifyViatorDateUnblocked(dateToUnblock);

        return res.status(200).json({ success: true, message: 'Deleted' });
      }
    }

    // ============ INCOME DATA ============
    if (type === 'income') {
      if (req.method === 'GET') {
        const { start_date, end_date, payment_method } = req.query;

        const endDate = end_date || new Date().toISOString().split('T')[0];
        const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Precios por persona según tipo de tour (para cuando no hay payment_amount)
        const TOUR_PRICES = { regular: 42000, private: 150000, astrophoto: 120000 };
        // All tours are now per-person pricing (private tour matches GYG at 145k/person)

        // Construir query con filtro opcional de método de pago
        let query = `
          SELECT id, booking_id, date AS tour_date, name AS customer_name, persons AS num_people, tour_type,
            payment_method, payment_amount, status, created_at
          FROM bookings
          WHERE date >= $1 AND date <= $2 AND status IN ('confirmed', 'completed')
        `;
        const params = [startDate, endDate];

        if (payment_method) {
          query += ` AND payment_method = $3`;
          params.push(payment_method);
        }

        query += ` ORDER BY date DESC`;

        const bookingsResult = await pool.query(query, params);

        // Usar payment_amount real si existe, sino calcular estimado
        const bookings = bookingsResult.rows.map(b => {
          let total;
          if (b.payment_amount) {
            total = parseFloat(b.payment_amount);
          } else if (b.tour_type === 'private') {
            total = TOUR_PRICES.private; // Precio fijo para privado
          } else {
            total = b.num_people * (TOUR_PRICES[b.tour_type] || TOUR_PRICES.regular);
          }
          return {
            ...b,
            total_paid: total
          };
        });

        // Agrupar por método de pago
        const byPaymentMethod = {};
        bookings.forEach(b => {
          const method = b.payment_method || 'pending';
          if (!byPaymentMethod[method]) {
            byPaymentMethod[method] = { payment_method: method, count: 0, total: 0 };
          }
          byPaymentMethod[method].count++;
          byPaymentMethod[method].total += b.total_paid;
        });

        // Agrupar por tipo de tour
        const byTourType = {};
        bookings.forEach(b => {
          const type = b.tour_type || 'regular';
          if (!byTourType[type]) {
            byTourType[type] = { tour_type: type, count: 0, total: 0 };
          }
          byTourType[type].count++;
          byTourType[type].total += b.total_paid;
        });

        return res.status(200).json({
          success: true,
          bookings,
          totals: Object.values(byPaymentMethod),
          byTourType: Object.values(byTourType),
          dateRange: { start: startDate, end: endDate }
        });
      }
    }

    // ============ CONVERSION STATS ============
    if (type === 'conversion') {
      if (req.method === 'GET') {
        const { days = 30 } = req.query;

        // Estadísticas de conversión de los últimos X días
        const stats = await pool.query(`
          WITH booking_stats AS (
            SELECT
              COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
              COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
              COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
              COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
              COUNT(*) as total_count,
              COUNT(*) FILTER (WHERE status = 'confirmed' AND payment_method = 'mercadopago') as paid_online,
              COUNT(*) FILTER (WHERE status = 'confirmed' AND payment_method IN ('cash', 'transfer')) as paid_offline,
              SUM(CASE WHEN status = 'confirmed' THEN COALESCE(payment_amount, 0) ELSE 0 END) as total_revenue,
              AVG(CASE WHEN status = 'confirmed' THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 ELSE NULL END) as avg_hours_to_convert
            FROM bookings
            WHERE created_at > NOW() - INTERVAL '${parseInt(days)} days'
          ),
          daily_stats AS (
            SELECT
              DATE(created_at) as day,
              COUNT(*) as created,
              COUNT(*) FILTER (WHERE status = 'confirmed') as converted
            FROM bookings
            WHERE created_at > NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(created_at)
            ORDER BY day DESC
          ),
          pending_old AS (
            SELECT
              COUNT(*) as count,
              ARRAY_AGG(json_build_object(
                'booking_id', booking_id,
                'name', name,
                'email', email,
                'date', date,
                'created_at', created_at,
                'hours_pending', EXTRACT(EPOCH FROM (NOW() - created_at))/3600
              ) ORDER BY created_at ASC) as bookings
            FROM bookings
            WHERE status = 'pending'
            AND payment_method = 'pending'
            AND date >= CURRENT_DATE
          )
          SELECT
            bs.*,
            ROUND((bs.confirmed_count::numeric / NULLIF(bs.total_count, 0) * 100), 1) as conversion_rate,
            (SELECT json_agg(row_to_json(d)) FROM daily_stats d) as daily,
            (SELECT count FROM pending_old) as pending_awaiting_payment,
            (SELECT bookings FROM pending_old) as pending_bookings_detail
          FROM booking_stats bs
        `);

        return res.status(200).json({
          success: true,
          data: stats.rows[0]
        });
      }
    }

    // ============ GOOGLE CALENDAR STATUS ============
    if (type === 'calendar') {
      const { action = 'status' } = req.query;

      if (action === 'status') {
        const status = {
          timestamp: new Date().toISOString(),
          configuration: {
            serviceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
            calendarId: !!process.env.GOOGLE_CALENDAR_ID,
            calendarIdValue: process.env.GOOGLE_CALENDAR_ID ?
              process.env.GOOGLE_CALENDAR_ID.substring(0, 30) + '...' : null
          },
          connection: null,
          error: null
        };

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
          status.error = 'GOOGLE_SERVICE_ACCOUNT_KEY not configured';
          return res.status(200).json(status);
        }

        if (!process.env.GOOGLE_CALENDAR_ID) {
          status.error = 'GOOGLE_CALENDAR_ID not configured';
          return res.status(200).json(status);
        }

        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
          status.configuration.serviceAccountEmail = credentials.client_email;
          status.configuration.projectId = credentials.project_id;

          // Fix private key formatting
          if (credentials.private_key) {
            credentials.private_key = credentials.private_key
              .replace(/-----BEGIN PRIVATE KEY-----\s+/g, '-----BEGIN PRIVATE KEY-----\n')
              .replace(/\s+-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');

            if (!credentials.private_key.includes('\n') && credentials.private_key.includes('\\n')) {
              credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
          }

          const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar']
          });

          await auth.authorize();
          status.connection = { authenticated: true };

          const calendar = google.calendar({ version: 'v3', auth });
          let calendarId = process.env.GOOGLE_CALENDAR_ID;

          if (calendarId === 'vicente.litvak@gmail.com' || !calendarId) {
            calendarId = '9a3ed2b295897e3fe68d2b719d3a1049a24c83dde50983b0625aed37407158b3@group.calendar.google.com';
          }

          const calendarInfo = await calendar.calendars.get({ calendarId });
          status.connection.calendarAccess = true;
          status.connection.calendarName = calendarInfo.data.summary;
          status.connection.calendarTimeZone = calendarInfo.data.timeZone;

          // Get upcoming events count
          const now = new Date();
          const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          const events = await calendar.events.list({
            calendarId,
            timeMin: now.toISOString(),
            timeMax: nextMonth.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });

          status.connection.upcomingEventsCount = events.data.items?.length || 0;
          status.status = 'OK';

        } catch (error) {
          status.error = error.message;
          status.errorType = error.constructor.name;
          if (error.code) status.errorCode = error.code;
          status.status = 'ERROR';
        }

        return res.status(200).json(status);
      }

      if (action === 'list-events') {
        const { days = 30 } = req.query;

        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

          if (credentials.private_key && !credentials.private_key.includes('\n')) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
          }

          const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar']
          });

          await auth.authorize();
          const calendar = google.calendar({ version: 'v3', auth });

          let calendarId = process.env.GOOGLE_CALENDAR_ID;
          if (calendarId === 'vicente.litvak@gmail.com' || !calendarId) {
            calendarId = '9a3ed2b295897e3fe68d2b719d3a1049a24c83dde50983b0625aed37407158b3@group.calendar.google.com';
          }

          const now = new Date();
          const endDate = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

          const events = await calendar.events.list({
            calendarId,
            timeMin: now.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50
          });

          return res.status(200).json({
            calendarId,
            period: `Next ${days} days`,
            eventsCount: events.data.items?.length || 0,
            events: events.data.items?.map(e => ({
              id: e.id,
              summary: e.summary,
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              status: e.status,
              description: e.description?.substring(0, 200)
            }))
          });

        } catch (error) {
          return res.status(500).json({ error: error.message });
        }
      }

      if (action === 'sync-booking') {
        const { bookingId } = req.query;

        if (!bookingId) {
          return res.status(400).json({ error: 'bookingId required' });
        }

        const bookingResult = await pool.query(
          'SELECT * FROM bookings WHERE booking_id = $1',
          [bookingId]
        );

        if (bookingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingResult.rows[0];
        const { addToGoogleCalendar } = await import('../lib/google-calendar.js');

        // Normalize date to string format YYYY-MM-DD
        let dateStr = booking.date;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toISOString().split('T')[0];
        } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }

        try {
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

          // Check if result is an error object
          if (result && result.error) {
            return res.status(200).json({
              success: false,
              booking: {
                id: booking.booking_id,
                date: dateStr,
                name: booking.name,
                tourType: booking.tour_type
              },
              calendarEvent: null,
              error: result.error,
              errorCode: result.code
            });
          }

          return res.status(200).json({
            success: !!result && !!result.id,
            booking: {
              id: booking.booking_id,
              date: dateStr,
              name: booking.name,
              tourType: booking.tour_type
            },
            calendarEvent: result && result.id ? { id: result.id, link: result.htmlLink } : null
          });
        } catch (calendarError) {
          return res.status(200).json({
            success: false,
            booking: {
              id: booking.booking_id,
              date: dateStr,
              name: booking.name,
              tourType: booking.tour_type
            },
            calendarEvent: null,
            error: calendarError.message
          });
        }
      }

      if (action === 'sync-all') {
        const { fromDate, status: bookingStatus = 'all' } = req.query;

        const today = new Date().toISOString().split('T')[0];
        const startDate = fromDate || today;

        let query = `
          SELECT * FROM bookings
          WHERE date >= $1 AND status != 'cancelled'
          ORDER BY date ASC
        `;
        const params = [startDate];

        if (bookingStatus && bookingStatus !== 'all') {
          query = `
            SELECT * FROM bookings
            WHERE date >= $1 AND status = $2 AND status != 'cancelled'
            ORDER BY date ASC
          `;
          params.push(bookingStatus);
        }

        const bookingsResult = await pool.query(query, params);
        const bookings = bookingsResult.rows;

        const { addToGoogleCalendar } = await import('../lib/google-calendar.js');
        const results = [];

        // Helper to normalize date
        const normalizeDate = (date) => {
          if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          } else if (typeof date === 'string' && date.includes('T')) {
            return date.split('T')[0];
          }
          return date;
        };

        for (const booking of bookings) {
          const dateStr = normalizeDate(booking.date);
          try {
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

            // Check if result is an error object
            if (result && result.error) {
              results.push({
                bookingId: booking.booking_id,
                date: dateStr,
                success: false,
                error: result.error
              });
            } else {
              results.push({
                bookingId: booking.booking_id,
                date: dateStr,
                success: !!result && !!result.id,
                eventLink: result?.htmlLink
              });
            }
          } catch (error) {
            results.push({
              bookingId: booking.booking_id,
              date: dateStr,
              success: false,
              error: error.message
            });
          }
        }

        return res.status(200).json({
          summary: {
            total: bookings.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          },
          results
        });
      }

      return res.status(400).json({ error: 'Invalid action. Use: status, list-events, sync-booking, sync-all' });
    }

    // ============ SYNC PAYMENTS ============
    if (type === 'sync-payments') {
      if (req.method === 'GET') {
        try {
          // Buscar reservas de mercadopago sin payment_amount
          const bookingsResult = await pool.query(`
            SELECT booking_id, name, email, date, persons, tour_type
            FROM bookings
            WHERE payment_method = 'mercadopago'
            AND (payment_amount IS NULL OR payment_amount = 0)
            ORDER BY created_at DESC
          `);

          const results = [];

          for (const booking of bookingsResult.rows) {
            try {
              const searchResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/search?external_reference=${booking.booking_id}&status=approved`,
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                  }
                }
              );

              const searchData = await searchResponse.json();

              if (searchData.results && searchData.results.length > 0) {
                const paymentInfo = searchData.results[0];

                await pool.query(`
                  UPDATE bookings
                  SET payment_amount = $1,
                      payment_id = $2,
                      updated_at = NOW()
                  WHERE booking_id = $3
                `, [paymentInfo.transaction_amount, paymentInfo.id, booking.booking_id]);

                results.push({
                  booking_id: booking.booking_id,
                  name: booking.name,
                  status: 'updated',
                  amount: paymentInfo.transaction_amount
                });
              } else {
                results.push({
                  booking_id: booking.booking_id,
                  name: booking.name,
                  status: 'not_found'
                });
              }
            } catch (err) {
              results.push({
                booking_id: booking.booking_id,
                status: 'error',
                error: err.message
              });
            }
          }

          return res.status(200).json({
            success: true,
            message: `Processed ${results.length} bookings`,
            results
          });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ============ GOOGLE ANALYTICS ============
    if (type === 'ga-analytics') {
      if (req.method === 'GET') {
        const { start_date, end_date } = req.query;

        // Default: último mes
        const endDate = end_date || new Date().toISOString().split('T')[0];
        const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const propertyId = process.env.GA4_PROPERTY_ID;

        if (!propertyId) {
          return res.status(200).json({
            success: false,
            error: 'GA4_PROPERTY_ID not configured',
            message: 'Add GA4_PROPERTY_ID to your environment variables'
          });
        }

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
          return res.status(200).json({
            success: false,
            error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured'
          });
        }

        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

          // Fix private key formatting
          if (credentials.private_key && !credentials.private_key.includes('\n')) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
          }

          const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/analytics.readonly']
          });

          await auth.authorize();

          const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

          // Ejecutar queries en paralelo
          const [sessionsReport, trafficSourcesReport, pagesReport, geoReport] = await Promise.all([
            // 1. Sessions y usuarios
            analyticsData.properties.runReport({
              property: `properties/${propertyId}`,
              requestBody: {
                dateRanges: [{ startDate, endDate }],
                metrics: [
                  { name: 'sessions' },
                  { name: 'totalUsers' },
                  { name: 'newUsers' },
                  { name: 'bounceRate' },
                  { name: 'averageSessionDuration' },
                  { name: 'screenPageViews' }
                ],
                dimensions: []
              }
            }),

            // 2. Fuentes de tráfico
            analyticsData.properties.runReport({
              property: `properties/${propertyId}`,
              requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
                metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
                limit: 10,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
              }
            }),

            // 3. Páginas más vistas
            analyticsData.properties.runReport({
              property: `properties/${propertyId}`,
              requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'averageSessionDuration' }],
                limit: 15,
                orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
              }
            }),

            // 4. Geografía
            analyticsData.properties.runReport({
              property: `properties/${propertyId}`,
              requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'country' }],
                metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
                limit: 15,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
              }
            })
          ]);

          // Procesar resultados
          const parseMetrics = (row) => {
            return row.metricValues.map(m => parseFloat(m.value) || 0);
          };

          const parseDimensionRow = (row) => {
            return {
              dimensions: row.dimensionValues.map(d => d.value),
              metrics: parseMetrics(row)
            };
          };

          // Sessions overview
          const sessionsData = sessionsReport.data.rows?.[0];
          const overview = sessionsData ? {
            sessions: parseFloat(sessionsData.metricValues[0]?.value) || 0,
            totalUsers: parseFloat(sessionsData.metricValues[1]?.value) || 0,
            newUsers: parseFloat(sessionsData.metricValues[2]?.value) || 0,
            bounceRate: (parseFloat(sessionsData.metricValues[3]?.value) * 100).toFixed(1) || 0,
            avgSessionDuration: parseFloat(sessionsData.metricValues[4]?.value) || 0,
            pageViews: parseFloat(sessionsData.metricValues[5]?.value) || 0
          } : { sessions: 0, totalUsers: 0, newUsers: 0, bounceRate: 0, avgSessionDuration: 0, pageViews: 0 };

          // Traffic sources
          const trafficSources = (trafficSourcesReport.data.rows || []).map(row => ({
            source: row.dimensionValues[0]?.value || 'direct',
            medium: row.dimensionValues[1]?.value || 'none',
            sessions: parseFloat(row.metricValues[0]?.value) || 0,
            users: parseFloat(row.metricValues[1]?.value) || 0
          }));

          // Top pages
          const topPages = (pagesReport.data.rows || []).map(row => ({
            path: row.dimensionValues[0]?.value || '/',
            pageViews: parseFloat(row.metricValues[0]?.value) || 0,
            users: parseFloat(row.metricValues[1]?.value) || 0,
            avgDuration: parseFloat(row.metricValues[2]?.value) || 0
          }));

          // Geography
          const geography = (geoReport.data.rows || []).map(row => ({
            country: row.dimensionValues[0]?.value || 'Unknown',
            sessions: parseFloat(row.metricValues[0]?.value) || 0,
            users: parseFloat(row.metricValues[1]?.value) || 0
          }));

          // Calcular tasa de conversión comparando con reservas de la BD
          const bookingsInPeriod = await pool.query(`
            SELECT COUNT(*) as total_bookings
            FROM bookings
            WHERE created_at >= $1 AND created_at <= $2
            AND status IN ('confirmed', 'completed')
          `, [startDate, endDate]);

          const totalBookings = parseInt(bookingsInPeriod.rows[0]?.total_bookings) || 0;
          const conversionRate = overview.sessions > 0
            ? ((totalBookings / overview.sessions) * 100).toFixed(2)
            : 0;

          return res.status(200).json({
            success: true,
            dateRange: { start: startDate, end: endDate },
            overview: {
              ...overview,
              conversionRate,
              totalBookings
            },
            trafficSources,
            topPages,
            geography
          });

        } catch (error) {
          console.error('GA Analytics error:', error);
          return res.status(200).json({
            success: false,
            error: error.message,
            code: error.code
          });
        }
      }
    }

    // ============ GYG ANALYTICS ============
    if (type === 'gyg-analytics') {
      if (req.method === 'GET') {
        const { start_date, end_date } = req.query;

        // Default: último trimestre
        const endDate = end_date || new Date().toISOString().split('T')[0];
        const startDate = start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Ejecutar todas las queries en paralelo
        const [channelResult, nationalitiesResult, hotelsResult, groupSizeResult, advanceResult, timesResult, weeklyResult, financialResult, trendResult] = await Promise.all([
          // 1. Comparativa de canales - Separamos por fuente (GYG, Viator, Klook, Direct) y tipo de tour
          pool.query(`
            SELECT
              CASE
                WHEN b.source = 'gyg' AND b.tour_type = 'private' THEN 'gyg_private'
                WHEN b.source = 'gyg' THEN 'gyg_regular'
                WHEN b.source = 'viator' AND b.tour_type = 'private' THEN 'viator_private'
                WHEN b.source = 'viator' THEN 'viator_regular'
                WHEN b.source = 'klook' AND b.tour_type = 'private' THEN 'klook_private'
                WHEN b.source = 'klook' THEN 'klook_regular'
                WHEN b.tour_type = 'private' THEN 'direct_private'
                ELSE 'direct_regular'
              END as source,
              COUNT(*) as total_bookings,
              COALESCE(SUM(b.persons), 0) as total_persons,
              SUM(CASE
                  WHEN b.source = 'gyg' AND b.payment_amount IS NULL THEN
                    CASE WHEN b.tour_type = 'private' THEN b.persons * 142855 ELSE b.persons * 53600 END
                  WHEN b.source IN ('viator', 'klook') AND b.payment_amount IS NULL THEN
                    CASE WHEN b.tour_type = 'private' THEN b.persons * 105300 ELSE b.persons * 45000 END
                  WHEN b.payment_amount IS NULL THEN
                    CASE WHEN b.tour_type = 'private' THEN b.persons * 150000 ELSE b.persons * 42000 END
                  ELSE COALESCE(b.payment_amount, 0)
                END) as total_revenue,
              ROUND(AVG(b.persons)::numeric, 2) as avg_group_size,
              COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed,
              COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY CASE
                WHEN b.source = 'gyg' AND b.tour_type = 'private' THEN 'gyg_private'
                WHEN b.source = 'gyg' THEN 'gyg_regular'
                WHEN b.source = 'viator' AND b.tour_type = 'private' THEN 'viator_private'
                WHEN b.source = 'viator' THEN 'viator_regular'
                WHEN b.source = 'klook' AND b.tour_type = 'private' THEN 'klook_private'
                WHEN b.source = 'klook' THEN 'klook_regular'
                WHEN b.tour_type = 'private' THEN 'direct_private'
                ELSE 'direct_regular'
              END
            ORDER BY source
          `, [startDate, endDate]),

          // 2. Nacionalidades (del prefijo telefónico)
          pool.query(`
            SELECT country, COUNT(*) as bookings, COALESCE(SUM(persons), 0) as total_persons
            FROM (
              SELECT
                persons,
                CASE
                  WHEN phone LIKE '+33%' OR phone LIKE '0033%' THEN 'Francia'
                  WHEN phone LIKE '+49%' OR phone LIKE '0049%' THEN 'Alemania'
                  WHEN phone LIKE '+44%' OR phone LIKE '0044%' THEN 'Reino Unido'
                  WHEN phone LIKE '+1%' THEN 'USA/Canadá'
                  WHEN phone LIKE '+34%' OR phone LIKE '0034%' THEN 'España'
                  WHEN phone LIKE '+39%' OR phone LIKE '0039%' THEN 'Italia'
                  WHEN phone LIKE '+31%' OR phone LIKE '0031%' THEN 'Países Bajos'
                  WHEN phone LIKE '+32%' OR phone LIKE '0032%' THEN 'Bélgica'
                  WHEN phone LIKE '+41%' OR phone LIKE '0041%' THEN 'Suiza'
                  WHEN phone LIKE '+61%' OR phone LIKE '0061%' THEN 'Australia'
                  WHEN phone LIKE '+56%' OR phone LIKE '56%' THEN 'Chile'
                  WHEN phone LIKE '+55%' OR phone LIKE '0055%' THEN 'Brasil'
                  WHEN phone LIKE '+54%' OR phone LIKE '0054%' THEN 'Argentina'
                  WHEN phone LIKE '+52%' OR phone LIKE '0052%' THEN 'México'
                  WHEN phone LIKE '+57%' OR phone LIKE '0057%' THEN 'Colombia'
                  WHEN phone LIKE '+81%' OR phone LIKE '0081%' THEN 'Japón'
                  WHEN phone LIKE '+82%' OR phone LIKE '0082%' THEN 'Corea del Sur'
                  WHEN phone LIKE '+86%' OR phone LIKE '0086%' THEN 'China'
                  WHEN phone LIKE '+91%' OR phone LIKE '0091%' THEN 'India'
                  WHEN phone LIKE '+972%' THEN 'Israel'
                  WHEN phone LIKE '+48%' THEN 'Polonia'
                  WHEN phone LIKE '+420%' THEN 'República Checa'
                  WHEN phone LIKE '+351%' THEN 'Portugal'
                  WHEN phone LIKE '+46%' THEN 'Suecia'
                  WHEN phone LIKE '+47%' THEN 'Noruega'
                  WHEN phone LIKE '+45%' THEN 'Dinamarca'
                  WHEN phone LIKE '+358%' THEN 'Finlandia'
                  WHEN phone LIKE '+43%' THEN 'Austria'
                  ELSE 'Otro'
                END as country
              FROM bookings
              WHERE date >= $1 AND date <= $2
                AND status IN ('confirmed', 'completed')
            ) sub
            GROUP BY country
            ORDER BY bookings DESC
            LIMIT 15
          `, [startDate, endDate]),

          // 3. Hoteles frecuentes
          pool.query(`
            SELECT
              COALESCE(NULLIF(TRIM(accommodation), ''), 'No especificado') as hotel,
              COUNT(*) as bookings,
              COALESCE(SUM(persons), 0) as guests
            FROM bookings
            WHERE date >= $1 AND date <= $2
              AND status IN ('confirmed', 'completed')
            GROUP BY COALESCE(NULLIF(TRIM(accommodation), ''), 'No especificado')
            ORDER BY bookings DESC
            LIMIT 20
          `, [startDate, endDate]),

          // 4. Tamaño promedio de grupos - Consolidado
          pool.query(`
            SELECT
              CASE
                WHEN b.source = 'gyg' THEN 'gyg'
                WHEN b.source = 'viator' THEN 'viator'
                WHEN b.source = 'klook' THEN 'klook'
                ELSE 'direct'
              END as source,
              ROUND(AVG(b.persons)::numeric, 2) as avg_group_size,
              MIN(b.persons) as min_group,
              MAX(b.persons) as max_group,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.persons) as median_group
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY CASE WHEN b.source = 'gyg' THEN 'gyg' WHEN b.source = 'viator' THEN 'viator' WHEN b.source = 'klook' THEN 'klook' ELSE 'direct' END
          `, [startDate, endDate]),

          // 5. Días de anticipación - Consolidado
          pool.query(`
            SELECT
              CASE
                WHEN b.source = 'gyg' THEN 'gyg'
                WHEN b.source = 'viator' THEN 'viator'
                WHEN b.source = 'klook' THEN 'klook'
                ELSE 'direct'
              END as source,
              ROUND(AVG(b.date - b.created_at::date)::numeric, 1) as avg_days_advance,
              MIN(b.date - b.created_at::date) as min_days,
              MAX(b.date - b.created_at::date) as max_days,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.date - b.created_at::date) as median_days
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY CASE WHEN b.source = 'gyg' THEN 'gyg' WHEN b.source = 'viator' THEN 'viator' WHEN b.source = 'klook' THEN 'klook' ELSE 'direct' END
          `, [startDate, endDate]),

          // 6. Horarios populares - Consolidado
          pool.query(`
            SELECT
              b.time,
              CASE
                WHEN b.source = 'gyg' THEN 'gyg'
                WHEN b.source = 'viator' THEN 'viator'
                WHEN b.source = 'klook' THEN 'klook'
                ELSE 'direct'
              END as source,
              COUNT(*) as bookings,
              COALESCE(SUM(b.persons), 0) as total_persons
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY b.time, CASE WHEN b.source = 'gyg' THEN 'gyg' WHEN b.source = 'viator' THEN 'viator' WHEN b.source = 'klook' THEN 'klook' ELSE 'direct' END
            ORDER BY bookings DESC
          `, [startDate, endDate]),

          // 7. Distribución semanal - Consolidado
          pool.query(`
            SELECT
              TO_CHAR(b.date, 'Day') as day_name,
              EXTRACT(DOW FROM b.date) as day_number,
              CASE
                WHEN b.source = 'gyg' THEN 'gyg'
                WHEN b.source = 'viator' THEN 'viator'
                WHEN b.source = 'klook' THEN 'klook'
                ELSE 'direct'
              END as source,
              COUNT(*) as bookings,
              COALESCE(SUM(b.persons), 0) as persons
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY TO_CHAR(b.date, 'Day'), EXTRACT(DOW FROM b.date), CASE WHEN b.source = 'gyg' THEN 'gyg' WHEN b.source = 'viator' THEN 'viator' WHEN b.source = 'klook' THEN 'klook' ELSE 'direct' END
            ORDER BY day_number
          `, [startDate, endDate]),

          // 8. Análisis financiero - Separado por tipo de tour y canal
          pool.query(`
            SELECT
              channel as source,
              COUNT(*) as total_bookings,
              COALESCE(SUM(persons), 0) as total_persons,
              SUM(gross) as gross_revenue,
              CASE WHEN channel LIKE 'gyg%' OR channel LIKE 'viator%' OR channel LIKE 'klook%' THEN SUM(gross) * 0.70 ELSE SUM(gross) END as net_revenue,
              CASE WHEN channel LIKE 'gyg%' OR channel LIKE 'viator%' OR channel LIKE 'klook%' THEN SUM(gross) * 0.30 ELSE 0 END as commission_paid,
              ROUND(AVG(gross)::numeric, 0) as avg_ticket
            FROM (
              SELECT
                CASE
                  WHEN source = 'gyg' AND tour_type = 'private' THEN 'gyg_private'
                  WHEN source = 'gyg' THEN 'gyg_regular'
                  WHEN source = 'viator' AND tour_type = 'private' THEN 'viator_private'
                  WHEN source = 'viator' THEN 'viator_regular'
                  WHEN source = 'klook' AND tour_type = 'private' THEN 'klook_private'
                  WHEN source = 'klook' THEN 'klook_regular'
                  WHEN tour_type = 'private' THEN 'direct_private'
                  ELSE 'direct_regular'
                END as channel,
                persons,
                CASE
                  WHEN source = 'gyg' AND payment_amount IS NULL THEN
                    CASE WHEN tour_type = 'private' THEN persons * 142855 ELSE persons * 53600 END
                  WHEN source IN ('viator', 'klook') AND payment_amount IS NULL THEN
                    CASE WHEN tour_type = 'private' THEN persons * 105300 ELSE persons * 45000 END
                  WHEN payment_amount IS NULL THEN
                    CASE WHEN tour_type = 'private' THEN persons * 150000 ELSE persons * 42000 END
                  ELSE COALESCE(payment_amount, 0)
                END as gross
              FROM bookings
              WHERE date >= $1 AND date <= $2
                AND status IN ('confirmed', 'completed')
            ) sub
            GROUP BY channel
          `, [startDate, endDate]),

          // 9. Tendencia semanal - Consolidado para gráfico
          pool.query(`
            SELECT
              DATE_TRUNC('week', b.date)::date as week_start,
              CASE
                WHEN b.source = 'gyg' THEN 'gyg'
                WHEN b.source = 'viator' THEN 'viator'
                WHEN b.source = 'klook' THEN 'klook'
                ELSE 'direct'
              END as source,
              COUNT(*) as bookings,
              COALESCE(SUM(b.persons), 0) as persons,
              SUM(CASE
                  WHEN b.source = 'gyg' AND b.payment_amount IS NULL THEN
                    CASE WHEN b.tour_type = 'private' THEN b.persons * 142855 ELSE b.persons * 53600 END
                  WHEN b.source IN ('viator', 'klook') AND b.payment_amount IS NULL THEN
                    CASE WHEN b.tour_type = 'private' THEN b.persons * 105300 ELSE b.persons * 45000 END
                  ELSE COALESCE(b.payment_amount, 0)
                END) as revenue
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY DATE_TRUNC('week', b.date), CASE WHEN b.source = 'gyg' THEN 'gyg' WHEN b.source = 'viator' THEN 'viator' WHEN b.source = 'klook' THEN 'klook' ELSE 'direct' END
            ORDER BY week_start
          `, [startDate, endDate])
        ]);

        // Tendencia mensual para el gráfico financiero - Consolidado
        const monthlyTrendResult = await pool.query(`
          SELECT
            month,
            source,
            bookings,
            gross_revenue,
            CASE
              WHEN source IN ('gyg', 'viator', 'klook') THEN gross_revenue * 0.70
              ELSE gross_revenue
            END as net_revenue
          FROM (
            SELECT
              DATE_TRUNC('month', b.date)::date as month,
              CASE
                WHEN b.source = 'gyg' THEN 'gyg'
                WHEN b.source = 'viator' THEN 'viator'
                WHEN b.source = 'klook' THEN 'klook'
                ELSE 'direct'
              END as source,
              COUNT(*) as bookings,
              SUM(CASE
                    WHEN b.source = 'gyg' AND b.payment_amount IS NULL THEN
                      CASE WHEN b.tour_type = 'private' THEN b.persons * 142855 ELSE b.persons * 53600 END
                    WHEN b.source IN ('viator', 'klook') AND b.payment_amount IS NULL THEN
                      CASE WHEN b.tour_type = 'private' THEN b.persons * 105300 ELSE b.persons * 45000 END
                    WHEN b.payment_amount IS NULL THEN
                      CASE WHEN b.tour_type = 'private' THEN b.persons * 150000 ELSE b.persons * 42000 END
                    ELSE COALESCE(b.payment_amount, 0)
                  END) as gross_revenue
            FROM bookings b
            WHERE b.date >= $1 AND b.date <= $2
              AND b.status IN ('confirmed', 'completed')
            GROUP BY DATE_TRUNC('month', b.date), CASE WHEN b.source = 'gyg' THEN 'gyg' WHEN b.source = 'viator' THEN 'viator' WHEN b.source = 'klook' THEN 'klook' ELSE 'direct' END
          ) sub
          ORDER BY month
        `, [startDate, endDate]);

        return res.status(200).json({
          success: true,
          dateRange: { start: startDate, end: endDate },
          channelComparison: {
            summary: channelResult.rows,
            trend: trendResult.rows
          },
          customerAnalysis: {
            nationalities: nationalitiesResult.rows,
            topHotels: hotelsResult.rows,
            groupSizes: groupSizeResult.rows
          },
          temporalAnalysis: {
            advanceBooking: advanceResult.rows,
            popularTimes: timesResult.rows,
            weeklyDistribution: weeklyResult.rows
          },
          financialAnalysis: {
            summary: financialResult.rows,
            monthlyTrend: monthlyTrendResult.rows
          }
        });
      }
    }

    // ============ AI MIGRATION ============
    if (type === 'migrate-ai') {
      // Create AI tables if they don't exist
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ai_memory (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            key VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_memory_category ON ai_memory(category)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_memory_key ON ai_memory(key)`);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS whatsapp_messages (
            id SERIAL PRIMARY KEY,
            booking_id VARCHAR(50),
            phone VARCHAR(30) NOT NULL,
            message TEXT NOT NULL,
            direction VARCHAR(10) DEFAULT 'outbound',
            status VARCHAR(20) DEFAULT 'sent',
            whatsapp_message_id VARCHAR(100),
            sent_by VARCHAR(50) DEFAULT 'ai_assistant',
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_wa_phone ON whatsapp_messages(phone)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_wa_booking ON whatsapp_messages(booking_id)`);

        return res.status(200).json({
          success: true,
          message: 'AI tables created successfully',
          tables: ['ai_memory', 'whatsapp_messages']
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    return res.status(400).json({ success: false, error: 'Invalid type' });

  } catch (error) {
    console.error('Admin data API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
