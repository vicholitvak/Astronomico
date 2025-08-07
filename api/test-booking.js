// Simple test booking endpoint to isolate issues
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Test booking endpoint called');
    console.log('Environment check:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    });

    const {
      date,
      persons,
      tourType,
      name,
      email,
      phone,
      message
    } = req.body;

    console.log('Received data:', { date, persons, tourType, name, email, phone });

    // Validate required fields
    if (!date || !persons || !tourType || !name || !email || !phone) {
      console.log('Validation failed');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate booking ID
    const bookingId = `TEST-${Date.now().toString(36).toUpperCase()}`;

    // Auto-assign time
    let assignedTime = '21:00';
    const currentMonth = new Date().getMonth() + 1;
    const isSummer = currentMonth < 4 || currentMonth > 8;
    
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

    console.log('Attempting database insert...');

    // Test database connection only
    try {
      const { data: testConnection } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);
      
      console.log('Database connection test successful');
    } catch (dbTestError) {
      console.error('Database connection test failed:', dbTestError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: dbTestError.message 
      });
    }

    // Try to insert the booking
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
          message: message || '',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        details: dbError.message,
        code: dbError.code 
      });
    }

    console.log('Database insert successful:', booking);

    // Skip external API calls for testing
    console.log('Skipping WhatsApp, Email, and Google Calendar for test');

    return res.status(200).json({
      success: true,
      bookingId,
      message: 'Test booking created successfully (no external APIs called)',
      assignedTime
    });

  } catch (error) {
    console.error('Test booking error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}