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

        if (!dateToBlock) {
          return res.status(400).json({ success: false, error: 'blocked_date is required' });
        }

        const result = await pool.query(`
          INSERT INTO blocked_dates (blocked_date, reason, block_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason, block_type = EXCLUDED.block_type
          RETURNING *
        `, [dateToBlock, reason || null, block_type || 'full']);

        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (req.method === 'DELETE') {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, error: 'date is required' });

        await pool.query('DELETE FROM blocked_dates WHERE blocked_date = $1', [date]);
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
        const TOUR_PRICES = { regular: 30000, private: 200000, astrophoto: 150000 };
        // Tour privado es precio fijo, no por persona

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
        const { addToGoogleCalendar } = await import('./google-calendar.js');

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

        const { addToGoogleCalendar } = await import('./google-calendar.js');
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

    return res.status(400).json({ success: false, error: 'Invalid type. Use ?type=photos, ?type=blocked, ?type=income, ?type=conversion, or ?type=calendar' });

  } catch (error) {
    console.error('Admin data API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
