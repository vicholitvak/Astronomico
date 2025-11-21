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
    date, persons, tourType, time, name, email, phone, message, source = 'web', accommodation, status = 'pending'
  } = req.body;

  if (!date || !persons || !tourType || !name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

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
    email,
    phone,
    message: message || null,
    accommodation: accommodation || null,
    status: status || 'pending',
    source,
    created_at: new Date().toISOString()
  });

  // Send emails (non-blocking)
  try {
    await sendAdminNotificationEmail({ bookingId, date, persons, tourType, time: assignedTime, name, email, phone, message });
  } catch (e) { console.error('Admin email failed:', e); }

  try {
    await sendConfirmationEmail({ bookingId, name, email, date, persons, tourType, time: assignedTime });
  } catch (e) { console.error('Confirmation email failed:', e); }

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
    SELECT id, booking_id, date, persons, tour_type, time, name, email, phone, message, accommodation, status, source, reminder_sent, reminder_sent_at, created_at, updated_at
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

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
      to: [booking.email],
      subject: `✨ Reserva Confirmada - ${formattedDate} - Código: ${booking.bookingId}`,
      html: `<h2>¡Reserva Confirmada!</h2><p>Hola ${booking.name},</p><p>Tu reserva ha sido recibida.</p><p><strong>Código:</strong> ${booking.bookingId}</p><p><strong>Fecha:</strong> ${formattedDate}</p><p><strong>Tour:</strong> ${tourTypes[booking.tourType]}</p><p><strong>Personas:</strong> ${booking.persons}</p><p>Te contactaremos pronto para confirmar los detalles.</p><p>WhatsApp: +56 9 5055 8761</p>`
    })
  });
}
