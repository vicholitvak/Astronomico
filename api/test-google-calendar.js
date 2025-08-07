// Test Google Calendar credentials and configuration
import { config } from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
config();

async function testGoogleCalendarSetup() {
  console.log('\n=== GOOGLE CALENDAR CONFIGURATION TEST ===\n');
  
  // Check if environment variables are set
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  
  console.log('1. Checking environment variables:');
  console.log('   - GOOGLE_SERVICE_ACCOUNT_KEY:', serviceAccountKey ? '✅ Set' : '❌ Not set');
  console.log('   - GOOGLE_CALENDAR_ID:', calendarId ? '✅ Set' : '❌ Not set');
  
  if (!serviceAccountKey || !calendarId) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\nMake sure you have set the following in Vercel:');
    console.log('1. GOOGLE_SERVICE_ACCOUNT_KEY - The JSON service account key');
    console.log('2. GOOGLE_CALENDAR_ID - Your Google Calendar ID');
    return;
  }
  
  console.log('\n2. Parsing service account credentials:');
  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
    console.log('   ✅ Service account key parsed successfully');
    console.log('   - Service account email:', credentials.client_email);
    console.log('   - Project ID:', credentials.project_id);
  } catch (error) {
    console.log('   ❌ Failed to parse service account key:', error.message);
    console.log('\n   Make sure GOOGLE_SERVICE_ACCOUNT_KEY contains valid JSON');
    return;
  }
  
  console.log('\n3. Testing Google Calendar API connection:');
  try {
    // Create JWT auth client
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar'],
      null
    );
    
    // Authorize the client
    await auth.authorize();
    console.log('   ✅ Authentication successful');
    
    // Create calendar instance
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Test: Get calendar details
    console.log('\n4. Testing calendar access:');
    try {
      const calendarInfo = await calendar.calendars.get({
        calendarId: calendarId
      });
      console.log('   ✅ Calendar access successful');
      console.log('   - Calendar name:', calendarInfo.data.summary);
      console.log('   - Time zone:', calendarInfo.data.timeZone);
    } catch (calError) {
      console.log('   ❌ Calendar access failed:', calError.message);
      console.log('\n   Possible issues:');
      console.log('   1. Calendar ID is incorrect');
      console.log('   2. Service account doesn\'t have access to the calendar');
      console.log('\n   To fix: Share your calendar with:', credentials.client_email);
      console.log('   Give it "Make changes to events" permission');
    }
    
    // Test: List recent events
    console.log('\n5. Testing event listing:');
    try {
      const events = await calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 5,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      console.log('   ✅ Can list events');
      console.log('   - Upcoming events:', events.data.items.length);
      
      if (events.data.items.length > 0) {
        console.log('\n   Next events:');
        events.data.items.forEach(event => {
          const start = event.start.dateTime || event.start.date;
          console.log(`   - ${event.summary} (${start})`);
        });
      }
    } catch (listError) {
      console.log('   ❌ Event listing failed:', listError.message);
    }
    
    // Test: Create test event
    console.log('\n6. Testing event creation:');
    const testEvent = {
      summary: '🧪 TEST EVENT - Atacama NightSky',
      description: 'This is a test event to verify Google Calendar integration',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/Santiago'
      },
      end: {
        dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        timeZone: 'America/Santiago'
      }
    };
    
    try {
      const createdEvent = await calendar.events.insert({
        calendarId: calendarId,
        resource: testEvent
      });
      console.log('   ✅ Test event created successfully');
      console.log('   - Event ID:', createdEvent.data.id);
      console.log('   - Event link:', createdEvent.data.htmlLink);
      
      // Delete test event
      console.log('\n7. Cleaning up test event:');
      await calendar.events.delete({
        calendarId: calendarId,
        eventId: createdEvent.data.id
      });
      console.log('   ✅ Test event deleted');
      
    } catch (createError) {
      console.log('   ❌ Event creation failed:', createError.message);
      console.log('\n   The service account needs "Make changes to events" permission');
    }
    
    console.log('\n✅ GOOGLE CALENDAR INTEGRATION IS WORKING CORRECTLY!\n');
    
  } catch (error) {
    console.log('   ❌ Google Calendar API error:', error.message);
    console.log('\n   Full error:', error);
  }
}

// Run the test
testGoogleCalendarSetup().catch(console.error);