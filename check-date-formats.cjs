/**
 * Check date formats in database
 */

require('dotenv').config({ path: '.env.production.final' });
const { Client } = require('pg');

async function checkDates() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const result = await client.query(
            `SELECT booking_id, date, created_at FROM bookings ORDER BY created_at DESC LIMIT 10`
        );

        console.log('📋 Últimas 10 reservas con formatos de fecha:\n');
        result.rows.forEach(row => {
            console.log(`ID: ${row.booking_id}`);
            console.log(`  Date (raw): ${row.date}`);
            console.log(`  Date (type): ${typeof row.date}`);
            console.log(`  Date (toString): ${row.date.toString()}`);
            console.log(`  Created: ${row.created_at}`);
            console.log('');
        });

        await client.end();

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDates();
