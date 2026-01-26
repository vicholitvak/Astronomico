/**
 * Script to manually add a Viator booking that didn't come through the API
 * Run with: node scripts/add-viator-booking-manual.js
 *
 * Requires DATABASE_URL environment variable
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============ BOOKING DATA ============
const BOOKING = {
  viator_reference: 'BR-1356568921',
  viator_product_code: '5624520P1',
  date: '2026-03-13',
  time: '21:00',
  tour_type: 'private', // Semi-Private = Private tour
  persons: 3,
  name: 'Kristine deVaux',
  email: 'viator-BR-1356568921@viator.com', // Placeholder - contact via phone
  phone: '+1 (248) 765-3242',
  accommodation: 'Hotel not yet booked',
  payment_amount_usd: 351.00,
  travelers: ['Kristine deVaux', 'Guest 2', 'Guest 3'],
  special_requirements: 'No',
  language: 'English'
};

// USD to CLP exchange rate
const USD_TO_CLP = 980;

async function addBookingManually() {
  console.log('='.repeat(60));
  console.log('Adding Viator booking manually');
  console.log('='.repeat(60));

  try {
    // Check if booking already exists
    const existingResult = await pool.query(
      `SELECT * FROM bookings WHERE viator_reference = $1`,
      [BOOKING.viator_reference]
    );

    if (existingResult.rows.length > 0) {
      console.log('\n❌ Booking already exists in database:');
      console.log(existingResult.rows[0]);
      return existingResult.rows[0];
    }

    // Generate booking ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingId = `VTR-${timestamp}-${random}`;

    // Calculate payment in CLP
    const paymentAmountCLP = Math.round(BOOKING.payment_amount_usd * USD_TO_CLP);

    // Insert booking
    const insertResult = await pool.query(`
      INSERT INTO bookings (
        booking_id,
        viator_reference,
        date,
        time,
        tour_type,
        persons,
        name,
        email,
        phone,
        accommodation,
        status,
        source,
        payment_method,
        payment_status,
        payment_amount,
        message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *
    `, [
      bookingId,
      BOOKING.viator_reference,
      BOOKING.date,
      BOOKING.time,
      BOOKING.tour_type,
      BOOKING.persons,
      BOOKING.name,
      BOOKING.email,
      BOOKING.phone,
      BOOKING.accommodation,
      'confirmed',
      'viator',
      'viator',
      'paid',
      paymentAmountCLP,
      `Viator Product: ${BOOKING.viator_product_code}\nTravelers: ${BOOKING.travelers.join(', ')}\nLanguage: ${BOOKING.language}\nSpecial Requirements: ${BOOKING.special_requirements}\n\n⚠️ MANUALLY ADDED - API integration issue`
    ]);

    const newBooking = insertResult.rows[0];

    console.log('\n✅ Booking added successfully!');
    console.log('─'.repeat(40));
    console.log(`Booking ID: ${newBooking.booking_id}`);
    console.log(`Viator Ref: ${newBooking.viator_reference}`);
    console.log(`Date: ${newBooking.date}`);
    console.log(`Time: ${newBooking.time}`);
    console.log(`Tour Type: ${newBooking.tour_type}`);
    console.log(`Persons: ${newBooking.persons}`);
    console.log(`Name: ${newBooking.name}`);
    console.log(`Phone: ${newBooking.phone}`);
    console.log(`Payment: $${BOOKING.payment_amount_usd} USD = $${paymentAmountCLP.toLocaleString('es-CL')} CLP`);
    console.log('─'.repeat(40));

    return newBooking;

  } catch (error) {
    console.error('\n❌ Error adding booking:', error.message);
    throw error;
  }
}

async function blockDateForPrivateTour(date) {
  console.log('\n📅 Checking if date needs to be blocked...');

  // For private tours, we need to block other private bookings for this date
  // Check how many persons are booked for private tours on this date
  const result = await pool.query(`
    SELECT COALESCE(SUM(persons), 0) as total_persons, COUNT(*) as booking_count
    FROM bookings
    WHERE date = $1 AND tour_type = 'private'
    AND status NOT IN ('cancelled', 'rejected')
  `, [date]);

  const totalPersons = parseInt(result.rows[0].total_persons);
  const bookingCount = parseInt(result.rows[0].booking_count);

  console.log(`Private tour bookings on ${date}: ${bookingCount} bookings, ${totalPersons} persons`);

  // Private tour max is 4 persons
  if (totalPersons >= 4) {
    // Check if date is already blocked
    const blockedResult = await pool.query(
      `SELECT * FROM blocked_dates WHERE blocked_date = $1`,
      [date]
    );

    if (blockedResult.rows.length === 0) {
      // Block the date for private tours (but regular can still be available)
      await pool.query(`
        INSERT INTO blocked_dates (blocked_date, reason, block_type)
        VALUES ($1, $2, 'late_private_only')
        ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason, block_type = EXCLUDED.block_type
      `, [date, `Private tour fully booked (${totalPersons} persons)`]);

      console.log('✅ Date blocked for private tours');
    } else {
      console.log('ℹ️ Date already blocked:', blockedResult.rows[0].block_type);
    }
  } else {
    console.log(`ℹ️ Date not blocked yet (${4 - totalPersons} spots remaining for private)`);
  }
}

async function main() {
  try {
    // 1. Add the booking
    const booking = await addBookingManually();

    // 2. Block the date if needed
    await blockDateForPrivateTour(BOOKING.date);

    // 3. Instructions for calendar sync
    console.log('\n📆 To sync to Google Calendar, run:');
    console.log(`curl "https://atacamadarksky.cl/api/admin-data?type=calendar&action=sync-booking&bookingId=${booking.booking_id}"`);

    // 4. Instructions for GYG sync
    console.log('\n🔄 To notify GYG of availability change, the blocked_dates update should auto-trigger.');
    console.log('If not, manually call the GYG notify endpoint.');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Done! Remember to:');
    console.log('1. Sync the booking to Google Calendar');
    console.log('2. Contact the client about hotel pickup details');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
