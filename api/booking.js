// Vercel Serverless Function for handling bookings
import { createClient } from '@supabase/supabase-js';
import { addToGoogleCalendar } from './google-calendar.js';

// Use service key for backend operations (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
console.log('Using Supabase key type:', process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON_KEY');

const supabase = createClient(
  process.env.SUPABASE_URL,
  supabaseKey
);

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
      message
    } = req.body;

    // Validate required fields (time is now auto-assigned)
    if (!date || !persons || !tourType || !name || !email || !phone) {
      console.log('Validation failed - missing fields:', { date, persons, tourType, name, email, phone });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('Validation passed, proceeding with booking creation');
    
    // Auto-assign time based on tour type and season
    let assignedTime = '21:00'; // Default time
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

    // Generate booking ID
    const bookingId = `ATK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Save to database
    console.log('Attempting to save booking to database:', { bookingId, date, persons, tourType, assignedTime, name, email, phone });
    
    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert([
        {
          booking_id: bookingId,
          date,
          persons: parseInt(persons),
          tour_type: tourType,
          time: assignedTime,
          name,
          email,
          phone,
          message,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }
    
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
        email,  // Add email to the calendar event
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Email notification to admin
async function sendAdminNotificationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com'; // Tu email
  
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
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Atacama NightSky Tours</p>
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
        from: 'Atacama NightSky <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🌟 Nueva Reserva: ${booking.name} - ${formattedDate}`,
        html: emailHtml,
        reply_to: booking.email // Para que puedas responder directamente al cliente
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
  }
}

// Email confirmation to customer
async function sendConfirmationEmail(booking) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
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
      <h2 style="color: #00D4FF;">¡Gracias por tu reserva!</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <h3>Detalles de tu reserva:</h3>
        <p><strong>ID de Reserva:</strong> ${booking.bookingId}</p>
        <p><strong>Fecha:</strong> ${formattedDate}</p>
        <p><strong>Horario:</strong> ${booking.time}</p>
        <p><strong>Personas:</strong> ${booking.persons}</p>
        <p><strong>Tipo de Tour:</strong> ${tourTypes[booking.tourType] || booking.tourType}</p>
      </div>
      
      <div style="margin: 20px 0;">
        <h3>Próximos pasos:</h3>
        <ol>
          <li>Te contactaremos dentro de 24 horas para confirmar disponibilidad</li>
          <li>Coordinaremos punto de encuentro y detalles de pago</li>
          <li>Recibirás recordatorio 24 horas antes del tour</li>
        </ol>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
        <h4>¿Qué llevar al tour?</h4>
        <ul>
          <li>Ropa abrigada (temperaturas nocturnas bajas)</li>
          <li>Zapatos cómodos</li>
          <li>Cámara (opcional)</li>
        </ul>
      </div>
      
      <p style="margin-top: 20px;">
        <strong>¿Preguntas?</strong> Contáctanos por WhatsApp: +56 9 5055 8761
      </p>
      
      <p style="color: #666; font-size: 12px;">
        Atacama NightSky - Tours Astronómicos en San Pedro de Atacama
      </p>
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
        from: 'Atacama NightSky <onboarding@resend.dev>', // Cambiar a reservas@atacamadarksky.cl cuando verifiques el dominio
        to: [booking.email],
        subject: `Confirmación de Reserva - ${booking.bookingId}`,
        html: emailHtml,
        reply_to: 'info@atacamadarksky.cl'
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Email error:', error);
  }
}

// Google Calendar integration is now imported from google-calendar.js module
// The old implementation below has been removed in favor of the improved module

/* OLD IMPLEMENTATION - REMOVED
async function addToGoogleCalendar(booking) {
  const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
  
  if (!googleServiceAccountKey || !googleCalendarId) {
    console.log('Google Calendar credentials not configured');
    return;
  }
  
  try {
    // Parse service account credentials
    const credentials = JSON.parse(googleServiceAccountKey);
    
    // Get access token using service account
    const jwt = await getGoogleAccessToken(credentials);
    
    // Create calendar event
    const event = createCalendarEvent(booking);
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      console.log('Calendar event created:', result.id);
      return result;
    } else {
      const error = await response.text();
      console.error('Google Calendar API error:', error);
    }
  } catch (error) {
    console.error('Google Calendar integration error:', error);
  }
}

// Generate JWT token for Google Service Account
async function getGoogleAccessToken(credentials) {
  const { GoogleAuth } = await import('google-auth-library');
  
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

// Create calendar event object
function createCalendarEvent(booking) {
  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo', 
    'astrophoto': 'Tour Astrofotográfico Especializado'
  };
  
  // Parse date and time
  const eventDate = new Date(booking.date);
  const [hours, minutes] = booking.time.split(':');
  eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // End time (2 hours after start)
  const endDate = new Date(eventDate);
  endDate.setHours(endDate.getHours() + 2);
  
  // Get moon phase info (simplified)
  const moonPhase = getMoonPhase(eventDate);
  
  const tourType = tourTypes[booking.tourType] || booking.tourType;
  
  return {
    summary: `${tourType} - ${booking.persons} personas`,
    description: `📊 DETALLES DE LA RESERVA:
👥 Pasajeros: ${booking.persons}
📧 Contacto: ${booking.name} (${booking.email})
📱 Teléfono: ${booking.phone}
💬 Comentarios: ${booking.message || 'Sin comentarios'}

🌙 CONDICIONES LUNARES:
${moonPhase}

🔗 SITIO WEB: https://atacamadarksky.cl
📞 CONTACTO EMERGENCIA: +56 9 5055 8761
🆔 ID RESERVA: ${booking.bookingId}`,
    start: {
      dateTime: eventDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    end: {
      dateTime: endDate.toISOString(), 
      timeZone: 'America/Santiago'
    },
    attendees: [
      {
        email: booking.email,
        displayName: booking.name
      }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }       // 1 hour before
      ]
    },
    location: 'San Pedro de Atacama, Chile',
    colorId: '9' // Blue color for astronomy tours
  };
}

// Simple moon phase calculation
function getMoonPhase(date) {
  const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const names = ['Luna Nueva', 'Cuarto Creciente', 'Cuarto Creciente', 'Casi Llena', 'Luna Llena', 'Menguante', 'Cuarto Menguante', 'Cuarto Menguante'];
  
  // Simplified calculation based on lunar cycle (29.53 days)
  const knownNewMoon = new Date('2024-01-11'); // Known new moon date
  const daysDiff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phaseIndex = Math.floor(((daysDiff % 29.53) / 29.53) * 8);
  
  const illumination = Math.abs(50 - (phaseIndex * 12.5)) + Math.random() * 10;
  
  return `${names[phaseIndex]} ${phases[phaseIndex]} - ${illumination.toFixed(1)}% iluminación`;
}
*/