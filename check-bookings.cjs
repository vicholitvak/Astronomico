require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkBookings() {
    try {
        const result = await pool.query(`
            SELECT booking_id, name, email, status, created_at
            FROM bookings
            WHERE booking_id LIKE 'ATK-%'
            ORDER BY created_at DESC
            LIMIT 5
        `);

        console.log('\n📋 Recent Bookings:\n');
        console.log(JSON.stringify(result.rows, null, 2));

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkBookings();
