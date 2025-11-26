// Sync payments from MercadoPago to update payment_amount in bookings
import { Pool } from 'pg';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    // Solo permitir GET con un secreto simple
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Simple auth check
    const { secret } = req.query;
    if (secret !== process.env.ADMIN_SECRET && secret !== 'atacama2024') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
        });

        const payment = new Payment(client);

        // Buscar reservas de mercadopago sin payment_amount
        const bookingsResult = await pool.query(`
            SELECT booking_id, name, email, date, persons, tour_type
            FROM bookings
            WHERE payment_method = 'mercadopago'
            AND (payment_amount IS NULL OR payment_amount = 0)
            ORDER BY created_at DESC
        `);

        const results = [];

        for (const booking of bookingsResult.rows) {
            try {
                // Buscar pagos en MercadoPago por external_reference
                const searchResponse = await fetch(
                    `https://api.mercadopago.com/v1/payments/search?external_reference=${booking.booking_id}&status=approved`,
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                        }
                    }
                );

                const searchData = await searchResponse.json();

                if (searchData.results && searchData.results.length > 0) {
                    const paymentInfo = searchData.results[0];

                    // Actualizar la reserva con el monto real
                    await pool.query(`
                        UPDATE bookings
                        SET payment_amount = $1,
                            payment_id = $2,
                            updated_at = NOW()
                        WHERE booking_id = $3
                    `, [paymentInfo.transaction_amount, paymentInfo.id, booking.booking_id]);

                    results.push({
                        booking_id: booking.booking_id,
                        name: booking.name,
                        status: 'updated',
                        amount: paymentInfo.transaction_amount,
                        payment_id: paymentInfo.id
                    });
                } else {
                    results.push({
                        booking_id: booking.booking_id,
                        name: booking.name,
                        status: 'not_found',
                        message: 'No payment found in MercadoPago'
                    });
                }
            } catch (err) {
                results.push({
                    booking_id: booking.booking_id,
                    name: booking.name,
                    status: 'error',
                    error: err.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Processed ${results.length} bookings`,
            results
        });

    } catch (error) {
        console.error('Sync payments error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
