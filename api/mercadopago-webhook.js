// Mercado Pago Webhook Handler
import { Pool } from 'pg';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type, data, action } = req.body;

        console.log('[WEBHOOK] Notification received:', { type, action, data });

        // Mercado Pago sends different notification types
        if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            const paymentId = data?.id || req.body.id;

            if (!paymentId) {
                console.error('[WEBHOOK] No payment ID found');
                return res.status(400).json({ error: 'Payment ID missing' });
            }

            console.log('[WEBHOOK] Processing payment:', paymentId);

            // Initialize Mercado Pago client
            const client = new MercadoPagoConfig({
                accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
            });

            const payment = new Payment(client);

            // Get payment details from Mercado Pago
            const paymentInfo = await payment.get({ id: paymentId });

            console.log('[WEBHOOK] Payment info:', {
                id: paymentInfo.id,
                status: paymentInfo.status,
                status_detail: paymentInfo.status_detail,
                external_reference: paymentInfo.external_reference,
                payer_email: paymentInfo.payer?.email
            });

            // Only process approved payments
            if (paymentInfo.status === 'approved') {
                console.log('[WEBHOOK] Payment approved, processing...');

                // Extract metadata from preference
                const metadata = paymentInfo.metadata || {};
                const externalRef = paymentInfo.external_reference;

                // Save booking to database
                const bookingId = externalRef || `ATK-${paymentInfo.id}`;

                try {
                    await pool.query(`
                        INSERT INTO bookings (
                            booking_id, date, persons, tour_type, time, name, email, phone,
                            message, status, source, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                        ON CONFLICT (booking_id) DO UPDATE
                        SET status = 'confirmed', updated_at = NOW()
                    `, [
                        bookingId,
                        metadata.tour_date || new Date().toISOString().split('T')[0],
                        parseInt(metadata.persons) || 1,
                        metadata.tour_type || 'regular',
                        '20:00', // Default tour time
                        metadata.customer_name || paymentInfo.payer?.name || 'Cliente',
                        metadata.customer_email || paymentInfo.payer?.email,
                        metadata.customer_phone || paymentInfo.payer?.phone?.number || '',
                        metadata.customer_message || '',
                        'confirmed',
                        'mercadopago'
                    ]);

                    console.log('[WEBHOOK] Booking saved to database:', bookingId);

                    // Send confirmation email
                    try {
                        const emailResponse = await fetch(`${process.env.VERCEL_URL || 'https://atacamadarksky.cl'}/api/send-confirmation-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                customerEmail: metadata.customer_email || paymentInfo.payer?.email,
                                customerName: metadata.customer_name || paymentInfo.payer?.name || 'Cliente',
                                tourName: paymentInfo.description || metadata.tour_name || 'Tour Astronómico',
                                tourDate: metadata.tour_date || new Date().toISOString().split('T')[0],
                                persons: parseInt(metadata.persons) || 1,
                                totalAmount: paymentInfo.transaction_amount,
                                paymentId: paymentInfo.id.toString(),
                                bookingId: bookingId
                            })
                        });

                        if (emailResponse.ok) {
                            console.log('[WEBHOOK] Confirmation email sent successfully');
                        } else {
                            console.error('[WEBHOOK] Failed to send email:', await emailResponse.text());
                        }
                    } catch (emailError) {
                        console.error('[WEBHOOK] Email sending error:', emailError);
                        // Don't fail the whole webhook if email fails
                    }

                } catch (dbError) {
                    console.error('[WEBHOOK] Database error:', dbError);
                    // Still acknowledge webhook to prevent retries
                }
            } else {
                console.log('[WEBHOOK] Payment not approved, status:', paymentInfo.status);
            }

            return res.status(200).json({ success: true });
        }

        // Acknowledge other notification types
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('[WEBHOOK] Error:', error);
        // Always return 200 to prevent Mercado Pago from retrying
        return res.status(200).json({ success: false, error: error.message });
    }
}
