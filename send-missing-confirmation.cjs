require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function sendMissingConfirmation() {
    try {
        // Get the booking details
        const result = await pool.query(`
            SELECT * FROM bookings
            WHERE booking_id = $1
        `, ['ATK-1763481800260']);

        if (result.rows.length === 0) {
            console.error('❌ Booking not found');
            await pool.end();
            return;
        }

        const booking = result.rows[0];
        console.log('\n📋 Booking Details:');
        console.log(JSON.stringify(booking, null, 2));

        // Get tour type name
        const tourNames = {
            'regular': 'Tour Astronómico Regular',
            'private': 'Tour Astronómico Privado VIP',
            'astrophoto': 'Tour de Astrofotografía'
        };

        const tourName = tourNames[booking.tour_type] || 'Tour Astronómico';

        // Get price (need to estimate based on tour type and persons)
        const prices = {
            'regular': 30000,
            'private': 120000,
            'astrophoto': 40000
        };
        const pricePerPerson = prices[booking.tour_type] || 30000;
        const totalAmount = pricePerPerson * booking.persons;

        console.log('\n📧 Preparing to send confirmation email...');
        console.log('To:', booking.email);
        console.log('Name:', booking.name);
        console.log('Tour:', tourName);
        console.log('Date:', booking.date);
        console.log('Persons:', booking.persons);
        console.log('Amount:', totalAmount);

        // Send the confirmation email
        const emailData = {
            customerEmail: booking.email,
            customerName: booking.name,
            tourName: tourName,
            tourDate: booking.date,
            persons: booking.persons,
            totalAmount: totalAmount,
            paymentId: booking.booking_id,
            bookingId: booking.booking_id
        };

        console.log('\n🚀 Sending email...');

        const response = await fetch('http://localhost:3000/api/send-confirmation-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('\n✅ Email sent successfully!');
            console.log('Email ID:', responseData.emailId);
        } else {
            console.error('\n❌ Failed to send email:');
            console.error(responseData);
        }

        await pool.end();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

sendMissingConfirmation();
