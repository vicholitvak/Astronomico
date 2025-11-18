require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkBookings() {
    try {
        const result = await pool.query(`
            SELECT booking_id, name, email, status, source, created_at
            FROM bookings
            ORDER BY created_at DESC
            LIMIT 10
        `);

        console.log('\n📋 All Recent Bookings:\n');
        console.log(JSON.stringify(result.rows, null, 2));

        // Check for payment ID 133343697409
        const paymentCheck = await pool.query(`
            SELECT * FROM bookings
            WHERE booking_id LIKE '%133343697409%'
        `);

        console.log('\n🔍 Searching for payment 133343697409:\n');
        console.log(JSON.stringify(paymentCheck.rows, null, 2));

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkBookings();
