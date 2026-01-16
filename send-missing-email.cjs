// Send the missing confirmation email for booking ATK-1763218687878
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');
const { Pool } = require('pg');

const resend = new Resend(process.env.RESEND_API_KEY);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function sendMissingEmail() {
    try {
        console.log('📧 Fetching booking details...\n');

        const result = await pool.query(`
            SELECT * FROM bookings
            WHERE booking_id = 'ATK-1763218687878'
        `);

        if (result.rows.length === 0) {
            console.error('❌ Booking not found');
            return;
        }

        const booking = result.rows[0];
        console.log('✅ Booking found:', JSON.stringify(booking, null, 2));

        console.log('\n📤 Sending confirmation email...');

        const paymentId = booking.booking_id.replace('ATK-', '');

        const emailResponse = await fetch('https://atacamadarksky.cl/api/send-confirmation-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerEmail: booking.email,
                customerName: booking.name,
                tourName: `Tour Astronómico ${booking.tour_type}`,
                tourDate: booking.date,
                persons: booking.persons,
                totalAmount: 42000, // Assuming regular tour
                paymentId: paymentId,
                bookingId: booking.booking_id
            })
        });

        const emailResult = await emailResponse.json();

        if (emailResponse.ok) {
            console.log('\n✅ Email sent successfully!');
            console.log('Email ID:', emailResult.emailId);
            console.log('\n📧 Email sent to:', booking.email);
        } else {
            console.error('\n❌ Failed to send email');
            console.error('Error:', JSON.stringify(emailResult, null, 2));
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

sendMissingEmail();
