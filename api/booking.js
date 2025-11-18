/**
 * Vercel Serverless Function for handling bookings
 * Updated to use Neon PostgreSQL instead of Supabase
 */

import { insert, query } from './lib/db.js';
import { addToGoogleCalendar } from './google-calendar.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received booking request:', req.body);

    const {
      date,
      persons,
      tourType,
      time,
      name,
      email,
      phone,
      message,
      source = 'web'
    } = req.body;

    // Validate required fields
    if (!date || !persons || !tourType || !name || !email || !phone) {
      console.log('Validation failed - missing fields:', { date, persons, tourType, name, email, phone });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Validation passed, proceeding with booking creation');

    // Auto-assign time based on tour type and season
    let assignedTime = time || '21:00'; // Use provided time or default
    if (!time) {
      const currentMonth = new Date().getMonth() + 1;
      const isSummer = currentMonth < 4 || currentMonth > 8; // Sep-Mar

      switch(tourType) {
        case 'regular':
          assignedTime = isSummer ? '21:30' : '20:30';
          break;
        case 'private':
          assignedTime = 'flexible';
          break;
        case 'astrophoto':
          assignedTime = isSummer ? '21:00' : '20:00';
          break;
      }
    }

    // Generate booking ID
    const bookingId = `ATK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Save to database using Neon
    console.log('Attempting to save booking to Neon database:', {
      bookingId,
      date,
      persons,
      tourType,
      assignedTime,
      name,
      email,
      phone
    });

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
      status: 'pending',
      source,
      created_at: new Date().toISOString()
    });

    console.log('Database save successful:', booking);

    // Send email notification to admin (non-blocking)
    try {
      console.log('Sending admin notification email...');
      await sendAdminNotificationEmail({
        bookingId,
        date,
        persons,
        tourType,
        time: assignedTime,
        name,
        email,
        phone,
        message
      });
      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Admin notification failed:', error);
      // Continue processing - don't fail the entire booking
    }

    // Send confirmation email to customer (non-blocking)
    try {
      console.log('Sending confirmation email...');
      await sendConfirmationEmail({
        bookingId,
        name,
        email,
        date,
        persons,
        tourType,
        time: assignedTime
      });
      console.log('Confirmation email sent successfully');
    } catch (error) {
      console.error('Email sending failed:', error);
      // Continue processing - don't fail the entire booking
    }

    // Add to Google Calendar (non-blocking)
    try {
      console.log('Adding to Google Calendar...');
      await addToGoogleCalendar({
        bookingId,
        date,
        time: assignedTime,
        persons,
        tourType,
        name,
        email,
        phone,
        message
      });
      console.log('Google Calendar event created successfully');
    } catch (error) {
      console.error('Google Calendar integration failed:', error);
      console.error('Error details:', error.stack);
      // Continue processing - don't fail the entire booking
    }

    return res.status(200).json({
      success: true,
      bookingId,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Booking error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Email notification to admin
async function sendAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

  if (!resendApiKey) {
    console.log('❌ Resend API key not configured');
    return;
  }

  // Format date in Spanish
  const dateObj = new Date(booking.date);
  const formattedDate = dateObj.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo',
    'astrophoto': 'Tour Astrofotográfico Especializado'
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Nueva Reserva Recibida</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Atacama Dark Sky Tours</p>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Detalles de la Reserva</h2>

          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>ID Reserva:</strong></td>
              <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 14px;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Fecha:</strong></td>
              <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Horario:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Tipo de Tour:</strong></td>
              <td style="padding: 8px 0; color: #333;">${tourTypes[booking.tourType] || booking.tourType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Personas:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.persons} ${booking.persons == 1 ? 'persona' : 'personas'}</td>
            </tr>
          </table>

          <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">👤 Información del Cliente</h3>

          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Nombre:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${booking.email}" style="color: #667eea;">${booking.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Teléfono:</strong></td>
              <td style="padding: 8px 0;"><a href="tel:${booking.phone}" style="color: #667eea;">${booking.phone}</a></td>
            </tr>
            ${booking.message ? `
            <tr>
              <td style="padding: 8px 0; color: #666; vertical-align: top;"><strong>Mensaje:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.message}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background: #667eea; color: white; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h4 style="margin: 0 0 10px 0;">⚡ Acciones Requeridas:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Verificar disponibilidad en el calendario</li>
              <li>Contactar al cliente dentro de 24 horas</li>
              <li>Confirmar detalles del tour y punto de encuentro</li>
              <li>Solicitar anticipo del 50% si corresponde</li>
            </ol>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Nota:</strong> El cliente también recibió un email de confirmación automático.
              ${booking.tourType === 'private' ? 'Este es un tour privado - coordinar horario flexible con el cliente.' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🌟 Nueva Reserva: ${booking.name} - ${formattedDate}`,
        html: emailHtml,
        reply_to: booking.email
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Admin notification email sent:', result);
      return result;
    } else {
      const error = await response.text();
      console.log('❌ Email sending error:', error);
      throw new Error(`Email error: ${error}`);
    }
  } catch (error) {
    console.error('Admin email error:', error);
    throw error;
  }
}

// Email confirmation to customer
async function sendConfirmationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log('❌ Resend API key not configured');
    return;
  }

  const dateObj = new Date(booking.date);
  const formattedDate = dateObj.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo',
    'astrophoto': 'Tour Astrofotográfico Especializado'
  };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✨ ¡Reserva Confirmada!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Atacama Dark Sky Tours</p>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Hola ${booking.name},</p>
        <p style="color: #333;">¡Gracias por reservar tu tour astronómico con nosotros! Estamos emocionados de compartir contigo la magia del universo de Atacama.</p>

        <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">📋 Detalles de tu Reserva</h2>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Código de Reserva:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #667eea; font-weight: bold;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Fecha:</strong></td>
              <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Horario:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Tour:</strong></td>
              <td style="padding: 8px 0; color: #333;">${tourTypes[booking.tourType]}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Personas:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.persons}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong> Tu reserva está pendiente de confirmación. Te contactaremos dentro de las próximas 24 horas para confirmar disponibilidad y coordinar los detalles finales.</p>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">📞 Contacto</h3>
          <p style="color: #666; margin: 10px 0;">Si tienes alguna pregunta, no dudes en contactarnos:</p>
          <p style="margin: 5px 0;"><strong>WhatsApp:</strong> <a href="https://wa.me/56950558761" style="color: #667eea;">+56 9 5055 8761</a></p>
          <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:vicente.litvak@gmail.com" style="color: #667eea;">vicente.litvak@gmail.com</a></p>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
          ¡Nos vemos bajo las estrellas! 🌟<br>
          Vicente Litvak - Guía Astronómico
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <onboarding@resend.dev>',
        to: [booking.email],
        subject: `✨ Reserva Confirmada - ${formattedDate} - Código: ${booking.bookingId}`,
        html: emailHtml
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Confirmation email sent:', result);
      return result;
    } else {
      const error = await response.text();
      console.log('❌ Confirmation email error:', error);
      throw new Error(`Email error: ${error}`);
    }
  } catch (error) {
    console.error('Confirmation email error:', error);
    throw error;
  }
}
