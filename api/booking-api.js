/**
 * Booking API - Combined create (POST) and list (GET)
 */

import { insert, query } from '../lib/db.js';
import { addToGoogleCalendar, refreshCalendarAfterCancellation } from '../lib/google-calendar.js';
import { syncDateAvailabilityToGYG, pushAvailabilityNotificationToViator } from './suppliers.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      return await createBooking(req, res);
    }

    if (req.method === 'GET') {
      // Check if requesting availability info
      if (req.query.action === 'availability') {
        return await getDateAvailability(req, res);
      }
      return await listBookings(req, res);
    }

    if (req.method === 'PATCH') {
      return await updateBooking(req, res);
    }

    if (req.method === 'DELETE') {
      return await deleteBooking(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Booking API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// ============ UPDATE BOOKING (PATCH) ============
async function updateBooking(req, res) {
  const { id } = req.query;
  const { status, tour_type, persons, time, date } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Booking ID is required' });
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (status) { updates.push(`status = $${paramCount++}`); values.push(status); }
  if (tour_type) { updates.push(`tour_type = $${paramCount++}`); values.push(tour_type); }
  if (persons) { updates.push(`persons = $${paramCount++}`); values.push(parseInt(persons)); }
  if (time) { updates.push(`time = $${paramCount++}`); values.push(time); }
  if (date) { updates.push(`date = $${paramCount++}`); values.push(date); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' });
  }

  updates.push(`updated_at = $${paramCount++}`);
  values.push(new Date().toISOString());
  values.push(id);

  const result = await query(
    `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  const updatedBooking = result.rows[0];

  // Sync to Google Calendar when status changes to confirmed or booking details change
  if (status === 'confirmed' || date || time || persons) {
    try {
      let dateStr = updatedBooking.date;
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0];
      } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }

      await addToGoogleCalendar({
        bookingId: updatedBooking.booking_id,
        date: dateStr,
        time: updatedBooking.time,
        persons: updatedBooking.persons,
        tourType: updatedBooking.tour_type,
        name: updatedBooking.name,
        email: updatedBooking.email,
        phone: updatedBooking.phone,
        message: updatedBooking.message
      });
      console.log(`[BOOKING] Calendar synced for: ${updatedBooking.booking_id}`);

      // Sync availability to GYG when booking changes affect availability
      syncDateAvailabilityToGYG(dateStr).catch(err => {
        console.error(`[BOOKING] GYG sync failed:`, err.message);
      });
      pushAvailabilityNotificationToViator(dateStr).catch(err => {
        console.error(`[BOOKING] Viator push failed:`, err.message);
      });
    } catch (calendarError) {
      console.error(`[BOOKING] Calendar sync failed:`, calendarError.message);
    }
  }

  // If status changed to cancelled, sync GYG availability and refresh calendar
  if (status === 'cancelled') {
    let dateStr = updatedBooking.date;
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString().split('T')[0];
    } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const tourType = updatedBooking.tour_type;

    // Sync availability to GYG
    syncDateAvailabilityToGYG(dateStr).catch(err => {
      console.error(`[BOOKING] GYG sync failed on cancellation:`, err.message);
    });
    pushAvailabilityNotificationToViator(dateStr).catch(err => {
      console.error(`[BOOKING] Viator push failed on cancellation:`, err.message);
    });

    // Refresh Google Calendar (remove or recalculate event)
    refreshCalendarAfterCancellation(dateStr, tourType).catch(err => {
      console.error(`[BOOKING] Calendar refresh failed on cancellation:`, err.message);
    });

    console.log(`[BOOKING] Cancellation synced - GYG, Viator and Calendar updated for ${dateStr}/${tourType}`);
  }

  return res.status(200).json({ success: true, data: updatedBooking });
}

// ============ DELETE BOOKING ============
async function deleteBooking(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Booking ID is required' });
  }

  const result = await query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  // Sync availability to GYG and calendar after deletion (non-blocking)
  const deletedBooking = result.rows[0];
  if (deletedBooking.date) {
    let dateStr = deletedBooking.date;
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString().split('T')[0];
    } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const tourType = deletedBooking.tour_type;

    syncDateAvailabilityToGYG(dateStr).catch(err => {
      console.error('[BOOKING] GYG sync failed on delete:', err.message);
    });
    pushAvailabilityNotificationToViator(dateStr).catch(err => {
      console.error('[BOOKING] Viator push failed on delete:', err.message);
    });

    refreshCalendarAfterCancellation(dateStr, tourType).catch(err => {
      console.error('[BOOKING] Calendar refresh failed on delete:', err.message);
    });

    console.log(`[BOOKING] Deletion synced - GYG, Viator and Calendar updated for ${dateStr}/${tourType}`);
  }

  return res.status(200).json({ success: true, message: 'Booking deleted' });
}

// ============ CREATE BOOKING (POST) ============
async function createBooking(req, res) {
  console.log('Received booking request:', req.body);

  const {
    date, persons, tourType, time, name, email, phone, message, source = 'web', accommodation, status = 'pending', payment_method = 'pending'
  } = req.body;

  if (!date || !persons || !tourType || !name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Email is optional, use placeholder if not provided
  const finalEmail = email && email.trim() !== '' ? email : 'pendiente@completar.com';

  // Auto-assign time - ALWAYS 21:00 for regular tours
  let assignedTime = time || '21:00';
  if (!time) {
    switch(tourType) {
      case 'regular':
        assignedTime = '21:00'; // Siempre a las 21:00
        break;
      case 'private':
        assignedTime = 'flexible'; // Horario acordado con cliente
        break;
      case 'astrophoto':
        assignedTime = '21:00'; // También a las 21:00
        break;
      default:
        assignedTime = '21:00';
    }
  }

  const bookingId = `ATK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Verificar si ya existe una reserva CONFIRMADA para este cliente en la misma fecha
  // para evitar enviar email de "pago pendiente" a quien ya pagó
  let hasConfirmedBooking = false;
  try {
    const existingConfirmed = await query(`
      SELECT booking_id FROM bookings
      WHERE date = $1
      AND (email = $2 OR phone = $3)
      AND tour_type = $4
      AND status = 'confirmed'
      LIMIT 1
    `, [date, finalEmail, phone, tourType]);
    hasConfirmedBooking = existingConfirmed.rows.length > 0;
    if (hasConfirmedBooking) {
      console.log(`[BOOKING] Cliente ya tiene reserva confirmada para ${date}, no se enviará email de pago pendiente`);
    }
  } catch (e) {
    console.error('Error checking existing bookings:', e);
  }

  const booking = await insert('bookings', {
    booking_id: bookingId,
    date,
    persons: parseInt(persons),
    tour_type: tourType,
    time: assignedTime,
    name,
    email: finalEmail,
    phone,
    message: message || null,
    accommodation: accommodation || null,
    status: status || 'pending',
    source,
    payment_method: payment_method || 'pending',
    created_at: new Date().toISOString()
  });

  // Send emails (non-blocking) - skip if email is placeholder
  const shouldSendEmail = finalEmail !== 'pendiente@completar.com';

  try {
    await sendAdminNotificationEmail({ bookingId, date, persons, tourType, time: assignedTime, name, email: finalEmail, phone, message });
  } catch (e) { console.error('Admin email failed:', e); }

  // Solo enviar email de pago pendiente si NO tiene ya una reserva confirmada
  if (shouldSendEmail && !hasConfirmedBooking) {
    try {
      await sendConfirmationEmail({ bookingId, name, email: finalEmail, date, persons, tourType, time: assignedTime });
    } catch (e) { console.error('Confirmation email failed:', e); }
  }

  try {
    await addToGoogleCalendar({ bookingId, date, time: assignedTime, persons, tourType, name, email, phone, message });
  } catch (e) { console.error('Google Calendar failed:', e); }

  // Sync availability to GYG + Viator (non-blocking)
  syncDateAvailabilityToGYG(date).catch(err => {
    console.error('[BOOKING] GYG sync failed:', err.message);
  });
  pushAvailabilityNotificationToViator(date).catch(err => {
    console.error('[BOOKING] Viator push failed:', err.message);
  });

  return res.status(200).json({ success: true, bookingId, message: 'Booking created successfully' });
}

// ============ LIST BOOKINGS (GET) ============
async function listBookings(req, res) {
  const {
    status, tour_type, date_from, date_to, search,
    page = '1', limit = '50', sort = 'date_asc'
  } = req.query;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (status) { conditions.push(`status = $${paramCount++}`); values.push(status); }
  if (tour_type) { conditions.push(`tour_type = $${paramCount++}`); values.push(tour_type); }
  if (date_from) { conditions.push(`date >= $${paramCount++}`); values.push(date_from); }
  if (date_to) { conditions.push(`date <= $${paramCount++}`); values.push(date_to); }
  if (search) {
    conditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR booking_id ILIKE $${paramCount} OR gyg_reference ILIKE $${paramCount})`);
    values.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'created_at DESC';
  switch (sort) {
    case 'date_asc': orderBy = 'date ASC, time ASC'; break;
    case 'date_desc': orderBy = 'date DESC, time DESC'; break;
    case 'created_asc': orderBy = 'created_at ASC'; break;
    case 'created_desc': orderBy = 'created_at DESC'; break;
    case 'name_asc': orderBy = 'name ASC'; break;
    case 'name_desc': orderBy = 'name DESC'; break;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const countResult = await query(`SELECT COUNT(*) as total FROM bookings ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const bookingsResult = await query(`
    SELECT id, booking_id, date, persons, tour_type, time, name, email, phone, message, accommodation, status, source, payment_method, reminder_sent, reminder_sent_at, created_at, updated_at, participant_names, gyg_reference
    FROM bookings ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `, [...values, limitNum, offset]);

  const formattedBookings = bookingsResult.rows.map(booking => {
    let formattedDate = null;
    if (booking.date) {
      if (booking.date instanceof Date) {
        const year = booking.date.getFullYear();
        const month = String(booking.date.getMonth() + 1).padStart(2, '0');
        const day = String(booking.date.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = String(booking.date).split('T')[0];
      }
    }
    return { ...booking, date: formattedDate };
  });

  const statsResult = await query(`
    SELECT
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      SUM(persons) as total_persons
    FROM bookings ${whereClause}
  `, values);

  return res.status(200).json({
    success: true,
    data: {
      bookings: formattedBookings,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      stats: statsResult.rows[0]
    }
  });
}

// ============ DATE AVAILABILITY ============
async function getDateAvailability(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required' });
  }

  // Get all bookings for this date (not cancelled)
  const bookingsResult = await query(`
    SELECT id, booking_id, name, tour_type, persons, status, time, source, payment_method
    FROM bookings
    WHERE date = $1 AND status NOT IN ('cancelled', 'rejected')
    ORDER BY tour_type, time
  `, [date]);

  // Calculate occupancy by tour type
  const bookings = bookingsResult.rows;
  const regularBookings = bookings.filter(b => b.tour_type === 'regular');
  const privateBookings = bookings.filter(b => b.tour_type === 'private');

  const regularPersons = regularBookings.reduce((sum, b) => sum + b.persons, 0);
  const privatePersons = privateBookings.reduce((sum, b) => sum + b.persons, 0);

  // Capacities
  const REGULAR_CAPACITY = 16;
  const PRIVATE_CAPACITY = 4;

  // Check if date is blocked
  const blockedResult = await query('SELECT * FROM blocked_dates WHERE blocked_date = $1', [date]);
  const blockInfo = blockedResult.rows[0] || null;

  // Calculate what GYG should show
  const gygAvailability = {
    regular: {
      time: '21:00',
      capacity: REGULAR_CAPACITY,
      booked: regularPersons,
      available: Math.max(0, REGULAR_CAPACITY - regularPersons),
      blocked: blockInfo?.block_type === 'full'
    },
    private: {
      productId: '1163787',
      times: ['20:00', '20:30', '21:00'],
      capacity: PRIVATE_CAPACITY,
      booked: privatePersons,
      available: Math.max(0, PRIVATE_CAPACITY - privatePersons),
      blocked: blockInfo?.block_type === 'full'
    }
  };

  // Viator availability (same logic)
  const viatorAvailability = {
    private: {
      productCode: '5624520P1',
      time: '21:00',
      capacity: PRIVATE_CAPACITY,
      booked: privatePersons,
      available: Math.max(0, PRIVATE_CAPACITY - privatePersons),
      blocked: blockInfo?.block_type === 'full'
    }
  };

  // Breakdown by source
  const bySource = {
    gyg: bookings.filter(b => b.source === 'gyg'),
    viator: bookings.filter(b => b.source === 'viator'),
    web: bookings.filter(b => b.source === 'web' || !b.source)
  };

  return res.status(200).json({
    success: true,
    date,
    summary: {
      totalBookings: bookings.length,
      totalPersons: regularPersons + privatePersons,
      regular: { bookings: regularBookings.length, persons: regularPersons, available: REGULAR_CAPACITY - regularPersons },
      private: { bookings: privateBookings.length, persons: privatePersons, available: PRIVATE_CAPACITY - privatePersons }
    },
    blockInfo,
    platforms: {
      gyg: gygAvailability,
      viator: viatorAvailability
    },
    bySource: {
      gyg: { count: bySource.gyg.length, persons: bySource.gyg.reduce((s, b) => s + b.persons, 0) },
      viator: { count: bySource.viator.length, persons: bySource.viator.reduce((s, b) => s + b.persons, 0) },
      web: { count: bySource.web.length, persons: bySource.web.reduce((s, b) => s + b.persons, 0) }
    },
    bookings: bookings.map(b => ({
      id: b.id,
      bookingId: b.booking_id,
      name: b.name,
      tourType: b.tour_type,
      persons: b.persons,
      status: b.status,
      time: b.time,
      source: b.source || 'web',
      paymentMethod: b.payment_method
    }))
  });
}

// ============ EMAIL FUNCTIONS ============
async function sendAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (!resendApiKey) return;

  // Agregar T00:00:00 para evitar problemas de timezone (fecha un día antes)
  const dateObj = new Date(booking.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const tourTypes = { 'regular': 'Tour Astronómico Regular', 'private': 'Tour Privado Exclusivo', 'astrophoto': 'Tour Astrofotográfico' };

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Atacama Dark Sky <onboarding@resend.dev>',
      to: [adminEmail],
      subject: `🌟 Nueva Reserva: ${booking.name} - ${formattedDate}`,
      html: `<h2>Nueva Reserva</h2><p><strong>ID:</strong> ${booking.bookingId}</p><p><strong>Fecha:</strong> ${formattedDate}</p><p><strong>Tour:</strong> ${tourTypes[booking.tourType]}</p><p><strong>Personas:</strong> ${booking.persons}</p><p><strong>Cliente:</strong> ${booking.name}</p><p><strong>Email:</strong> ${booking.email}</p><p><strong>Teléfono:</strong> ${booking.phone}</p>`,
      reply_to: booking.email
    })
  });
}

async function sendConfirmationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;

  // Agregar T00:00:00 para evitar problemas de timezone (fecha un día antes)
  const dateObj = new Date(booking.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedDateEn = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo',
    'astrophoto': 'Tour Astrofotográfico'
  };

  const tourTypesEn = {
    'regular': 'Regular Astronomy Tour',
    'private': 'Private Exclusive Tour',
    'astrophoto': 'Astrophotography Tour'
  };

  const tourPrices = { 'regular': 42000, 'private': 150000, 'astrophoto': 120000 };

  // Get price and calculate total (all tours now use per-person pricing)
  const basePrice = tourPrices[booking.tourType] || 42000;
  const personsCount = parseInt(booking.persons);
  const totalPrice = basePrice * personsCount;
  const priceDisplayEs = `$${basePrice.toLocaleString('es-CL')} CLP × ${personsCount} persona(s) = $${totalPrice.toLocaleString('es-CL')} CLP`;
  const priceDisplayEn = `$${basePrice.toLocaleString('es-CL')} CLP × ${personsCount} person(s) = $${totalPrice.toLocaleString('es-CL')} CLP`;

  // URL de pago directo (nueva página)
  const paymentUrl = `https://atacamadarksky.cl/pago?tour=${booking.tourType}&date=${booking.date}&persons=${booking.persons}&email=${encodeURIComponent(booking.email)}&name=${encodeURIComponent(booking.name)}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .warning-header { background: linear-gradient(135deg, #FF6B6B 0%, #FF8787 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #000; }
        .urgent-box { background: #FFF3CD; border: 2px solid #FFD700; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
        .payment-button { display: inline-block; background: linear-gradient(135deg, #00C851 0%, #00A846 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px; box-shadow: 0 4px 15px rgba(0, 200, 81, 0.3); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #666; }
        .whatsapp { display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .lang-separator { border-top: 3px dotted #ccc; margin: 40px 0; padding-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- SPANISH VERSION -->
        <div class="warning-header">
          <h1 style="margin: 0; font-size: 26px;">⚠️ RESERVA PENDIENTE DE PAGO</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Tu cupo NO está confirmado hasta completar el pago</p>
        </div>

        <div class="content">
          <p style="font-size: 18px;">Hola <strong>${booking.name}</strong>,</p>

          <div class="urgent-box">
            <h3 style="margin: 0 0 10px 0; color: #FF6B6B;">⏰ IMPORTANTE: Completa tu pago en las próximas 24 horas</h3>
            <p style="margin: 10px 0;">Los cupos son limitados y se asignan por orden de pago.</p>
            <p style="margin: 0; font-weight: bold;">Sin el pago, tu reserva será cancelada automáticamente.</p>
          </div>

          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Código de Reserva:</span>
              <span class="detail-value"><strong>${booking.bookingId}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha del Tour:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Hora:</span>
              <span class="detail-value">${booking.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tour:</span>
              <span class="detail-value">${tourTypes[booking.tourType]}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Personas:</span>
              <span class="detail-value">${booking.persons}</span>
            </div>
            <div class="detail-row" style="border-bottom: none; font-size: 20px;">
              <span class="detail-label">TOTAL A PAGAR:</span>
              <span class="detail-value" style="color: #00C851; font-weight: bold;">${priceDisplayEs}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <p style="margin-bottom: 20px; font-size: 18px; font-weight: bold;">👇 Completa tu reserva ahora:</p>
            <a href="${paymentUrl}" class="payment-button">
              💳 PAGAR AHORA - $${totalPrice.toLocaleString('es-CL')} CLP
            </a>
            <p style="margin-top: 15px; color: #666;">
              Pago 100% seguro con MercadoPago<br>
              <small>Aceptamos tarjetas de crédito, débito y transferencias</small>
            </p>
          </div>

          <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <strong>✅ ¿Qué pasa después del pago?</strong><br>
            1. Recibirás confirmación inmediata por email<br>
            2. Te contactaremos 24h antes del tour por WhatsApp<br>
            3. Te recogeremos en tu hotel (tour privado) o nos vemos en Plaza Apacheta
          </div>

          <!-- ENGLISH VERSION -->
          <div class="lang-separator"></div>

          <div style="background: #F0F8FF; padding: 20px; border-radius: 8px;">
            <h2 style="color: #FF6B6B; text-align: center;">🌍 English Version</h2>

            <p><strong>Hello ${booking.name},</strong></p>

            <div style="background: #FFF3CD; border: 2px solid #FFD700; padding: 15px; margin: 20px 0; text-align: center;">
              <strong>⚠️ YOUR BOOKING IS NOT CONFIRMED YET</strong><br>
              Please complete payment within 24 hours to secure your spot.<br>
              <span style="color: red;">Without payment, your reservation will be automatically cancelled.</span>
            </div>

            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <strong>Tour Details:</strong><br>
              • Date: ${formattedDateEn}<br>
              • Tour: ${tourTypesEn[booking.tourType]}<br>
              • People: ${booking.persons}<br>
              • Total to pay: <span style="color: #00C851; font-weight: bold;">${priceDisplayEn}</span>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${paymentUrl}" style="display: inline-block; background: #00C851; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                💳 PAY NOW - $${totalPrice.toLocaleString('es-CL')} CLP
              </a>
              <p style="margin-top: 10px; color: #666; font-size: 14px;">
                Secure payment with MercadoPago<br>
                We accept all international cards
              </p>
            </div>

            <p><strong>After payment:</strong> You'll receive immediate confirmation and we'll contact you 24h before the tour.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p><strong>¿Preguntas? / Questions?</strong></p>
            <a href="https://wa.me/56935134669?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20reserva%20${booking.bookingId}" class="whatsapp">
              💬 WhatsApp: +56 9 3513 4669
            </a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;"><strong>Atacama Dark Sky</strong></p>
          <p style="margin: 5px 0;">San Pedro de Atacama, Chile</p>
          <p style="margin: 15px 0 5px 0; font-size: 12px;">
            🌟 Los cielos más oscuros del mundo te esperan / The darkest skies in the world await you
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
      to: [booking.email],
      subject: `⚠️ PAGO PENDIENTE - Reserva ${booking.bookingId} - ${formattedDate} / PAYMENT REQUIRED`,
      html: emailHtml
    })
  });
}
