// Google Calendar Integration Module
import { google } from 'googleapis';

export async function addToGoogleCalendar(booking) {
  console.log('Starting Google Calendar integration for booking:', booking.bookingId);
  console.log('Booking data received:', JSON.stringify(booking, null, 2));
  
  // Get total passengers for the day
  const dayTotal = await getTotalPassengersForDay(booking.date);
  console.log('Total passengers for', booking.date, ':', dayTotal);
  
  // Get all bookings for the same tour type and date (for combining)
  const sameTourBookings = await getBookingsForTourAndDate(booking.date, booking.tourType);
  console.log('Same tour bookings for combining:', sameTourBookings.length);
  
  const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
  
  if (!googleServiceAccountKey || !googleCalendarId) {
    console.log('Google Calendar credentials not configured');
    console.log('Has service account key:', !!googleServiceAccountKey);
    console.log('Has calendar ID:', !!googleCalendarId);
    console.log('Calendar ID value:', googleCalendarId ? 'Set but not shown' : 'Not set');
    return;
  }
  
  try {
    // Parse service account credentials
    let credentials;
    try {
      // First, try to parse as-is
      credentials = JSON.parse(googleServiceAccountKey);
      console.log('Service account email:', credentials.client_email);
      console.log('Private key exists:', !!credentials.private_key);
      
      // Fix potential formatting issues with private key
      if (credentials.private_key) {
        // Fix various formatting issues that Vercel might introduce
        let fixedKey = credentials.private_key;
        
        // Remove extra spaces around BEGIN/END markers
        fixedKey = fixedKey
          .replace(/-----BEGIN PRIVATE KEY-----\s+/g, '-----BEGIN PRIVATE KEY-----\n')
          .replace(/\s+-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
          .replace(/-----BEGIN PRIVATE KEY----- /g, '-----BEGIN PRIVATE KEY-----\n')
          .replace(/ -----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');
        
        // Ensure proper line breaks (handle both literal \n and escaped \\n)
        if (!fixedKey.includes('\n') && fixedKey.includes('\\n')) {
          // If we have escaped newlines, convert them
          fixedKey = fixedKey.replace(/\\n/g, '\n');
        }
        
        // Ensure there's a newline after BEGIN and before END
        if (!fixedKey.includes('-----BEGIN PRIVATE KEY-----\n')) {
          fixedKey = fixedKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
        }
        if (!fixedKey.includes('\n-----END PRIVATE KEY-----')) {
          fixedKey = fixedKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
        }
        
        credentials.private_key = fixedKey;
        console.log('Private key formatted and cleaned');
        
        // Log first 100 chars of the key for debugging (safe portion)
        console.log('Key start:', credentials.private_key.substring(0, 100) + '...');
      }
    } catch (parseError) {
      console.error('Failed to parse service account key:', parseError.message);
      console.error('Raw key length:', googleServiceAccountKey ? googleServiceAccountKey.length : 0);
      throw new Error('Invalid service account key format');
    }
    
    // Create JWT client with cleaned private key
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    // Authorize the client
    await auth.authorize();
    console.log('Google Auth successful');
    
    // Create calendar instance
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Check if there's an existing event for the same tour type and date
    const existingEventId = await findExistingCalendarEvent(calendar, googleCalendarId, booking.date, booking.tourType);
    if (existingEventId) {
      console.log('Found existing event for same tour/date. Deleting:', existingEventId);
      try {
        await calendar.events.delete({
          calendarId: googleCalendarId,
          eventId: existingEventId
        });
        console.log('Successfully deleted existing event');
      } catch (deleteError) {
        console.error('Error deleting existing event:', deleteError.message);
      }
    }
    
    // Create event object with combined data
    const event = createCombinedCalendarEvent(booking, sameTourBookings, dayTotal);
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
    console.error('Error type:', error.constructor.name);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    // Don't throw, just log - let the booking succeed even if calendar fails
    return null;
  }
}

function createCalendarEvent(booking, dayTotal = null) {
  const tourTypes = {
    'regular': 'Regular',
    'private': 'Privado', 
    'astrophoto': 'Astrofoto'
  };
  
  // Parse date and set the actual tour time
  // Important: Create date in Santiago time zone to avoid UTC issues
  const [year, month, day] = booking.date.split('-');
  
  // Handle flexible time for private tours
  let startTime = booking.time;
  if (booking.time === 'flexible') {
    startTime = '21:00'; // Default for flexible times
  }
  
  // Create the date with the exact time in Santiago timezone
  const [hours, minutes] = startTime.split(':');
  
  // Create date string in Santiago time format for Google Calendar
  const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  const eventDate = new Date(dateStr);
  
  console.log('Event timing details:');
  console.log('- Original date:', booking.date);
  console.log('- Original time:', booking.time);
  console.log('- Parsed start time:', startTime);
  console.log('- Event date object:', eventDate);
  console.log('- Event date ISO:', eventDate.toISOString());
  
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
  
  // Create concise title with total pax count (will aggregate visually in calendar)
  const paxCount = parseInt(booking.persons);
  const paxEmoji = paxCount > 1 ? '👥' : '👤';
  
  // Include day total if available
  let title = `${paxEmoji} ${paxCount} | ${tourType} | ${booking.name}`;
  if (dayTotal && dayTotal > paxCount) {
    title = `${paxEmoji} ${paxCount} | ${tourType} | ${booking.name} (Día: ${dayTotal} pax)`;
  }
  
  return {
    summary: title,
    description: `🎯 ${tourType} - ${booking.persons} pax

👤 ${booking.name}
📞 ${booking.phone}  
📧 ${booking.email || 'Sin email'}
${booking.message ? `💬 ${booking.message}` : ''}

🆔 ${booking.bookingId}`,
    location: 'San Pedro de Atacama, Chile',
    start: {
      dateTime: eventDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    // Note: Service accounts cannot invite attendees without Domain-Wide Delegation
    // The client info is in the description instead
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
  // Google Calendar color IDs for easy visual identification
  const colors = {
    'regular': '9',     // Blue - Regular tours
    'private': '11',    // Red - Private tours (important)
    'astrophoto': '10'  // Green - Astrophoto tours
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

// Function to get total passengers for a specific date
async function getTotalPassengersForDay(date) {
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
    
    // Query all bookings for the specific date
    const { data, error } = await supabase
      .from('bookings')
      .select('persons')
      .eq('date', date)
      .neq('status', 'cancelled'); // Exclude cancelled bookings
    
    if (error) {
      console.error('Error getting day total:', error);
      return null;
    }
    
    // Sum up all passengers for the day
    const total = data.reduce((sum, booking) => sum + (booking.persons || 0), 0);
    console.log(`Total passengers for ${date}:`, total, '(from', data.length, 'bookings)');
    
    return total;
  } catch (error) {
    console.error('Error in getTotalPassengersForDay:', error);
    return null;
  }
}

// Function to get all bookings for same tour type and date
async function getBookingsForTourAndDate(date, tourType) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date)
      .eq('tour_type', tourType)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error getting bookings for tour/date:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getBookingsForTourAndDate:', error);
    return [];
  }
}

// Function to find existing calendar event for same tour and date
async function findExistingCalendarEvent(calendar, calendarId, date, tourType) {
  try {
    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay = new Date(date + 'T23:59:59');
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true
    });
    
    if (response.data.items) {
      // Look for event that contains the tour type
      const tourTypes = {
        'regular': 'Regular',
        'private': 'Privado',
        'astrophoto': 'Astrofoto'
      };
      
      const tourTypeName = tourTypes[tourType] || tourType;
      const existingEvent = response.data.items.find(event => 
        event.summary && event.summary.includes(tourTypeName)
      );
      
      return existingEvent ? existingEvent.id : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing calendar event:', error);
    return null;
  }
}

// Function to create combined calendar event
function createCombinedCalendarEvent(booking, allTourBookings, dayTotal = null) {
  const tourTypes = {
    'regular': 'Regular',
    'private': 'Privado', 
    'astrophoto': 'Astrofoto'
  };
  
  // Parse date and set the actual tour time
  const [year, month, day] = booking.date.split('-');
  
  // Handle flexible time for private tours
  let startTime = booking.time;
  if (booking.time === 'flexible') {
    startTime = '21:00'; // Default for flexible times
  }
  
  // Create the date with the exact time
  const [hours, minutes] = startTime.split(':');
  const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
  
  console.log('Event timing details:');
  console.log('- Original date:', booking.date);
  console.log('- Original time:', booking.time);
  console.log('- Parsed start time:', startTime);
  console.log('- Event date object:', eventDate);
  console.log('- Event date ISO:', eventDate.toISOString());
  
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
  
  // Calculate total passengers for this specific tour
  const totalTourPax = allTourBookings.reduce((sum, b) => sum + (b.persons || 0), 0);
  const paxEmoji = totalTourPax > 1 ? '👥' : '👤';
  
  // Create title with combined info
  let title = `${paxEmoji} ${totalTourPax} | ${tourType}`;
  if (dayTotal && dayTotal > totalTourPax) {
    title += ` (Día: ${dayTotal} pax)`;
  }
  
  // Create combined description with all clients
  let description = `🎯 ${tourType} - ${totalTourPax} pax total\n\n`;
  
  allTourBookings.forEach((b, index) => {
    description += `👤 ${b.name}\n📞 ${b.phone}\n📧 ${b.email || 'Sin email'}\n`;
    if (b.message) {
      description += `💬 ${b.message}\n`;
    }
    description += `🆔 ${b.booking_id}\n`;
    if (index < allTourBookings.length - 1) {
      description += '\n─────────────\n\n';
    }
  });
  
  return {
    summary: title,
    description: description,
    location: 'San Pedro de Atacama, Chile',
    start: {
      dateTime: eventDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Santiago'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 2 * 60 },
      ]
    },
    colorId: getEventColor(booking.tourType),
    status: 'tentative'
  };
}

export { createCalendarEvent, getMoonPhaseInfo, getTotalPassengersForDay };