// Google Calendar Status & Sync Check API
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple auth check - require admin password in header or query
  const authKey = req.headers['x-admin-key'] || req.query.key;
  const expectedKey = process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD;

  if (!expectedKey || authKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized - admin key required' });
  }

  try {
    const action = req.query.action || 'status';

    if (action === 'status') {
      return await checkGoogleCalendarStatus(req, res);
    }

    if (action === 'list-events') {
      return await listCalendarEvents(req, res);
    }

    if (action === 'sync-booking') {
      return await syncSingleBooking(req, res);
    }

    if (action === 'sync-all') {
      return await syncAllBookings(req, res);
    }

    return res.status(400).json({ error: 'Invalid action. Use: status, list-events, sync-booking, sync-all' });

  } catch (error) {
    console.error('Google Calendar Status API error:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function checkGoogleCalendarStatus(req, res) {
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

  // Check if credentials exist
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    status.error = 'GOOGLE_SERVICE_ACCOUNT_KEY not configured';
    return res.status(200).json(status);
  }

  if (!process.env.GOOGLE_CALENDAR_ID) {
    status.error = 'GOOGLE_CALENDAR_ID not configured';
    return res.status(200).json(status);
  }

  try {
    // Parse credentials
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

    // Create auth client
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    // Try to authorize
    await auth.authorize();
    status.connection = { authenticated: true };

    // Try to access calendar
    const calendar = google.calendar({ version: 'v3', auth });
    let calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Fallback to hardcoded calendar ID if needed
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

async function listCalendarEvents(req, res) {
  const { days = 30 } = req.query;

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  // Fix private key
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
}

async function syncSingleBooking(req, res) {
  const { bookingId } = req.query;

  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId required' });
  }

  // Get booking from database
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

  const { data: booking, error: dbError } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (dbError || !booking) {
    return res.status(404).json({ error: 'Booking not found', details: dbError?.message });
  }

  // Import and use addToGoogleCalendar
  const { addToGoogleCalendar } = await import('./google-calendar.js');

  const result = await addToGoogleCalendar({
    bookingId: booking.booking_id,
    date: booking.date,
    time: booking.time,
    persons: booking.persons,
    tourType: booking.tour_type,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    message: booking.message
  });

  return res.status(200).json({
    success: !!result,
    booking: {
      id: booking.booking_id,
      date: booking.date,
      name: booking.name,
      tourType: booking.tour_type
    },
    calendarEvent: result ? {
      id: result.id,
      link: result.htmlLink
    } : null
  });
}

async function syncAllBookings(req, res) {
  const { fromDate, status = 'confirmed' } = req.query;

  // Get bookings from database
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

  let query = supabase
    .from('bookings')
    .select('*')
    .neq('status', 'cancelled')
    .order('date', { ascending: true });

  if (fromDate) {
    query = query.gte('date', fromDate);
  } else {
    // Default: from today
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('date', today);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: bookings, error: dbError } = await query;

  if (dbError) {
    return res.status(500).json({ error: 'Database error', details: dbError.message });
  }

  const { addToGoogleCalendar } = await import('./google-calendar.js');

  const results = [];

  for (const booking of bookings) {
    try {
      const result = await addToGoogleCalendar({
        bookingId: booking.booking_id,
        date: booking.date,
        time: booking.time,
        persons: booking.persons,
        tourType: booking.tour_type,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        message: booking.message
      });

      results.push({
        bookingId: booking.booking_id,
        date: booking.date,
        success: !!result,
        eventLink: result?.htmlLink
      });
    } catch (error) {
      results.push({
        bookingId: booking.booking_id,
        date: booking.date,
        success: false,
        error: error.message
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return res.status(200).json({
    summary: {
      total: bookings.length,
      successful,
      failed
    },
    results
  });
}
