// Vercel Serverless Function for handling bookings
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Validate required fields
    if (!date || !persons || !tourType || !time || !name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate booking ID
    const bookingId = `ATK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Save to database
    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert([
        {
          booking_id: bookingId,
          date,
          persons: parseInt(persons),
          tour_type: tourType,
          time,
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
      return res.status(500).json({ error: 'Database error' });
    }

    // Send WhatsApp notification to you
    await sendWhatsAppNotification({
      bookingId,
      date,
      persons,
      tourType,
      time,
      name,
      phone
    });

    // Send confirmation email to customer
    await sendConfirmationEmail({
      bookingId,
      name,
      email,
      date,
      persons,
      tourType,
      time
    });

    // Add to Google Calendar (optional)
    await addToGoogleCalendar({
      bookingId,
      date,
      time,
      persons,
      tourType,
      name,
      phone
    });

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

// WhatsApp Business API notification
async function sendWhatsAppNotification(booking) {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const yourPhoneNumber = process.env.YOUR_PHONE_NUMBER; // +56950558761
  
  const message = `🌟 *NUEVA RESERVA - Atacama NightSky* 🌟

📅 *Fecha:* ${booking.date}
⏰ *Horario:* ${booking.time}
👥 *Personas:* ${booking.persons}
🎯 *Tour:* ${booking.tourType}
👤 *Cliente:* ${booking.name}
📱 *Teléfono:* ${booking.phone}

🆔 *ID Reserva:* ${booking.bookingId}

¡Confirma disponibilidad y contacta al cliente!`;

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: yourPhoneNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    return await response.json();
  } catch (error) {
    console.error('WhatsApp error:', error);
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

// Google Calendar integration (placeholder)
async function addToGoogleCalendar(booking) {
  // TODO: Implement Google Calendar API
  console.log('Adding to calendar:', booking.bookingId);
}