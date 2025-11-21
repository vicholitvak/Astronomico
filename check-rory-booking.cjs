/**
 * Check Rory Allan's booking details
 */

require('dotenv').config({ path: '.env.production.final' });
const { Client } = require('pg');

async function checkBooking() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const result = await client.query(
            `SELECT * FROM bookings WHERE booking_id = $1`,
            ['ATK-MI4XRPFQ-934O']
        );

        console.log('📋 Detalles de la reserva de Rory Allan:');
        console.log(JSON.stringify(result.rows[0], null, 2));

        await client.end();

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkBooking();
