// Google Calendar Integration Module
import { google } from 'googleapis';

export async function addToGoogleCalendar(booking) {
  console.log('Starting Google Calendar integration for booking:', booking.bookingId);
  
  const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
  
  if (!googleServiceAccountKey || !googleCalendarId) {
    console.log('Google Calendar credentials not configured');
    console.log('Has service account key:', !!googleServiceAccountKey);
    console.log('Has calendar ID:', !!googleCalendarId);
    return;
  }
  
  try {
    // Parse service account credentials
    const credentials = JSON.parse(googleServiceAccountKey);
    console.log('Service account email:', credentials.client_email);
    
    // Create JWT client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar'],
      null
    );
    
    // Authorize the client
    await auth.authorize();
    console.log('Google Auth successful');
    
    // Create calendar instance
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Create event object
    const event = createCalendarEvent(booking);
    console.log('Creating calendar event:', event.summary);
    
    // Insert event
    const response = await calendar.events.insert({
      calendarId: googleCalendarId,
      resource: event,
      sendNotifications: true,
      sendUpdates: 'all'
    });
    
    console.log('Calendar event created successfully:', response.data.htmlLink);
    return response.data;
    
  } catch (error) {
    console.error('Google Calendar integration error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
}

function createCalendarEvent(booking) {
  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado VIP', 
    'astrophoto': 'Tour Astrofotografía'
  };
  
  // Parse date and handle time
  const eventDate = new Date(booking.date + 'T00:00:00');
  
  // Handle flexible time for private tours
  let startTime = booking.time;
  if (booking.time === 'flexible') {
    startTime = '21:00'; // Default for flexible times
  }
  
  // Set the time
  const [hours, minutes] = startTime.split(':');
  eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Calculate end time based on tour type
  const duration = {
    'regular': 2.5,
    'private': 3,
    'astrophoto': 5
  };
  
  const endDate = new Date(eventDate);
  const tourDuration = duration[booking.tourType] || 2.5;
  endDate.setHours(endDate.getHours() + Math.floor(tourDuration));
  endDate.setMinutes(endDate.getMinutes() + (tourDuration % 1) * 60);
  
  const tourType = tourTypes[booking.tourType] || booking.tourType;
  
  // Get moon phase for the date
  const moonInfo = getMoonPhaseInfo(eventDate);
  
  return {
    summary: `🌟 ${tourType} - ${booking.persons} pax - ${booking.name}`,
    description: `━━━━━━━━━━━━━━━━━━━━━━
🎯 TOUR ASTRONÓMICO ATACAMA
━━━━━━━━━━━━━━━━━━━━━━

📊 DETALLES DE LA RESERVA:
• Tipo: ${tourType}
• Pasajeros: ${booking.persons} personas
• Hora: ${booking.time}
• Duración: ${tourDuration} horas

👤 INFORMACIÓN DEL CLIENTE:
• Nombre: ${booking.name}
• Email: ${booking.email || 'No especificado'}
• Teléfono: ${booking.phone}
• Mensaje: ${booking.message || 'Sin comentarios adicionales'}

🌙 CONDICIONES ASTRONÓMICAS:
${moonInfo}

📍 PUNTO DE ENCUENTRO:
• Recogida en hotel de San Pedro de Atacama
• Confirmación 24h antes vía WhatsApp

💰 ESTADO DE PAGO:
• Pendiente de confirmación
• 50% anticipo requerido

🔗 LINKS IMPORTANTES:
• Web: https://atacamadarksky.cl
• WhatsApp: https://wa.me/56950558761

🆔 ID RESERVA: ${booking.bookingId}
━━━━━━━━━━━━━━━━━━━━━━`,
    location: 'San Pedro de Atacama, Chile',
    start: {
      dateTime: eventDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    attendees: booking.email ? [
      {
        email: booking.email,
        displayName: booking.name,
        responseStatus: 'needsAction'
      }
    ] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 2 * 60 },  // 2 hours before
      ]
    },
    colorId: getEventColor(booking.tourType),
    status: 'tentative' // Will change to confirmed after payment
  };
}

function getEventColor(tourType) {
  // Google Calendar color IDs
  const colors = {
    'regular': '9',     // Blue
    'private': '5',     // Yellow/Gold
    'astrophoto': '10'  // Green
  };
  return colors[tourType] || '9';
}

function getMoonPhaseInfo(date) {
  // Simple moon phase calculation
  const lunarCycle = 29.53058867; // days
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  
  const daysSinceNew = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const currentCycle = daysSinceNew / lunarCycle;
  const moonAge = (currentCycle - Math.floor(currentCycle)) * lunarCycle;
  
  let phase = '';
  let emoji = '';
  let visibility = '';
  
  if (moonAge < 1.85) {
    phase = 'Luna Nueva';
    emoji = '🌑';
    visibility = 'Excelente para observación';
  } else if (moonAge < 5.54) {
    phase = 'Luna Creciente';
    emoji = '🌒';
    visibility = 'Muy buena para observación';
  } else if (moonAge < 9.23) {
    phase = 'Cuarto Creciente';
    emoji = '🌓';
    visibility = 'Buena para observación';
  } else if (moonAge < 12.91) {
    phase = 'Luna Gibosa Creciente';
    emoji = '🌔';
    visibility = 'Regular para observación';
  } else if (moonAge < 16.61) {
    phase = 'Luna Llena';
    emoji = '🌕';
    visibility = 'No recomendado - mucha luz lunar';
  } else if (moonAge < 20.30) {
    phase = 'Luna Gibosa Menguante';
    emoji = '🌖';
    visibility = 'Regular para observación';
  } else if (moonAge < 23.99) {
    phase = 'Cuarto Menguante';
    emoji = '🌗';
    visibility = 'Buena para observación';
  } else if (moonAge < 27.68) {
    phase = 'Luna Menguante';
    emoji = '🌘';
    visibility = 'Muy buena para observación';
  } else {
    phase = 'Luna Nueva';
    emoji = '🌑';
    visibility = 'Excelente para observación';
  }
  
  return `• Fase: ${emoji} ${phase}
• Edad lunar: ${Math.round(moonAge)} días
• Visibilidad: ${visibility}`;
}

export { createCalendarEvent, getMoonPhaseInfo };