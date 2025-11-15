// Mercado Pago Webhook Handler
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type, data } = req.body;

        console.log('Webhook received:', { type, data });

        // Mercado Pago sends different notification types
        if (type === 'payment') {
            const paymentId = data.id;

            // Here you would typically:
            // 1. Verify the payment with Mercado Pago API
            // 2. Update your database
            // 3. Send confirmation email

            console.log('Payment notification:', paymentId);

            // For now, just acknowledge receipt
            return res.status(200).json({ success: true });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}
