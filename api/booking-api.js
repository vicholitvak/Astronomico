/**
 * Booking API - Combined create (POST) and list (GET)
 */

import { insert, query } from './lib/db.js';
import { addToGoogleCalendar } from './google-calendar.js';
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

  return res.status(200).json({ success: true, data: result.rows[0] });
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

  // Auto-assign time based on tour type and season
  let assignedTime = time || '21:00';
  if (!time) {
    const currentMonth = new Date().getMonth() + 1;
    // Summer (Sept-March): months 9-12 and 1-3, Winter (April-Aug): months 4-8
    const isSummer = currentMonth < 4 || currentMonth > 8;

    switch(tourType) {
      case 'regular':
        assignedTime = isSummer ? '21:00' : '20:00';
        break;
      case 'private':
        assignedTime = 'flexible';
        break;
      case 'astrophoto':
        assignedTime = isSummer ? '21:00' : '20:00';
        break;
    }
  }

  const bookingId = `ATK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

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

  if (shouldSendEmail) {
    try {
      await sendConfirmationEmail({ bookingId, name, email: finalEmail, date, persons, tourType, time: assignedTime });
    } catch (e) { console.error('Confirmation email failed:', e); }
  }

  try {
    await addToGoogleCalendar({ bookingId, date, time: assignedTime, persons, tourType, name, email, phone, message });
  } catch (e) { console.error('Google Calendar failed:', e); }

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
    conditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR booking_id ILIKE $${paramCount})`);
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
    SELECT id, booking_id, date, persons, tour_type, time, name, email, phone, message, accommodation, status, source, payment_method, reminder_sent, reminder_sent_at, created_at, updated_at, participant_names
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

// ============ EMAIL FUNCTIONS ============
async function sendAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
  if (!resendApiKey) return;

  const dateObj = new Date(booking.date);
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

  const dateObj = new Date(booking.date);
  const formattedDate = dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const tourTypes = { 'regular': 'Tour Astronómico Regular', 'private': 'Tour Privado Exclusivo', 'astrophoto': 'Tour Astrofotográfico' };
  const tourPrices = { 'regular': 30000, 'private': 200000, 'astrophoto': 120000 };

  // Get price and calculate total
  const basePrice = tourPrices[booking.tourType] || 30000;
  const personsCount = parseInt(booking.persons);
  let totalPrice;
  let priceDisplay;

  if (booking.tourType === 'private') {
    totalPrice = basePrice;
    priceDisplay = `$${basePrice.toLocaleString('es-CL')} CLP (grupo completo)`;
  } else {
    totalPrice = basePrice * personsCount;
    priceDisplay = `$${basePrice.toLocaleString('es-CL')} CLP × ${personsCount} persona(s) = $${totalPrice.toLocaleString('es-CL')} CLP`;
  }

  // Create payment link
  const paymentUrl = `https://atacamadarksky.cl/?tour=${booking.tourType}&date=${booking.date}&persons=${booking.persons}&email=${encodeURIComponent(booking.email)}&name=${encodeURIComponent(booking.name)}#reservas`;

  const paymentButtonHtml = `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">
        💳 Pagar Ahora - $${totalPrice.toLocaleString('es-CL')} CLP
      </a>
      <p style="margin-top: 15px; color: #666; font-size: 14px;">Paga con seguridad usando MercadoPago</p>
    </div>
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
        .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #000; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #666; }
        .whatsapp { display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">✨ ¡Reserva Confirmada!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Atacama Dark Sky - Tours Astronómicos</p>
        </div>

        <div class="content">
          <p style="font-size: 18px;">Hola <strong>${booking.name}</strong>,</p>
          <p>Tu reserva ha sido recibida exitosamente. ¡Nos emociona compartir el universo contigo!</p>

          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Código de Reserva:</span>
              <span class="detail-value"><strong>${booking.bookingId}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha:</span>
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
            <div class="detail-row" style="border-bottom: none; font-size: 18px;">
              <span class="detail-label">Precio Total:</span>
              <span class="detail-value" style="color: #FFD700; font-weight: bold;">${priceDisplay}</span>
            </div>
          </div>

          ${paymentButtonHtml}

          <div style="background: #fff3cd; border-left: 4px solid #FFD700; padding: 15px; margin: 20px 0;">
            <strong>📍 Punto de Encuentro:</strong><br>
            ${booking.tourType === 'private'
              ? 'Te recogeremos en tu hotel'
              : 'Plaza Apacheta (extremo este de calle Caracoles)'}
          </div>

          <p><strong>¿Necesitas ayuda o tienes preguntas?</strong><br>
          Contáctanos por WhatsApp y te responderemos inmediatamente:</p>

          <div style="text-align: center;">
            <a href="https://wa.me/56935134669?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20reserva%20${booking.bookingId}" class="whatsapp">
              💬 Contactar por WhatsApp
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Importante:</strong> Te contactaremos pronto para confirmar todos los detalles finales del tour.
            Por favor revisa también tu carpeta de spam.
          </p>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;"><strong>Atacama Dark Sky Tours</strong></p>
          <p style="margin: 5px 0;">WhatsApp: +56 9 3513 4669</p>
          <p style="margin: 5px 0;">Email: reservas@atacamadarksky.cl</p>
          <p style="margin: 15px 0 5px 0; font-size: 12px;">¡Gracias por elegirnos para explorar el universo! 🌌⭐</p>
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
      subject: `✨ Reserva Confirmada - ${formattedDate} - Código: ${booking.bookingId}`,
      html: emailHtml
    })
  });
}
