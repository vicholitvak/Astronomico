// Mercado Pago Webhook Handler
import { Pool } from 'pg';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { Resend } from 'resend';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const resend = new Resend(process.env.RESEND_API_KEY);

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

                    // Send confirmation email directly using Resend
                    try {
                        const customerEmail = metadata.customer_email || paymentInfo.payer?.email;
                        const customerName = metadata.customer_name || paymentInfo.payer?.name || 'Cliente';
                        const tourDate = metadata.tour_date || new Date().toISOString().split('T')[0];
                        const persons = parseInt(metadata.persons) || 1;
                        const totalAmount = paymentInfo.transaction_amount;

                        // Get tour type name
                        const tourNames = {
                            'regular': 'Tour Astronómico Regular',
                            'private': 'Tour Astronómico Privado VIP',
                            'astrophoto': 'Tour de Astrofotografía'
                        };
                        const tourName = tourNames[metadata.tour_type] || 'Tour Astronómico';

                        // Create email HTML
                        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-box { background: white; border: 2px solid #00D4FF; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .booking-box h2 { color: #00D4FF; margin-top: 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .reference-box { background: #fffbf0; border: 2px solid #FFD700; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
        .reference-box .ref-number { font-size: 20px; font-weight: bold; color: #FF8C00; margin: 10px 0; }
        .info-section { background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
        .info-section h3 { margin-top: 0; color: #2e7d32; }
        .info-section ul { margin: 10px 0; padding-left: 20px; }
        .whatsapp-button { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 ¡Reserva Confirmada!</h1>
        <p>Atacama Dark Sky</p>
    </div>
    <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>
        <p>¡Excelente noticia! Tu pago ha sido procesado exitosamente y tu reserva está confirmada.</p>
        <div class="reference-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Número de Reserva</p>
            <div class="ref-number">${bookingId}</div>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">ID de Pago: ${paymentInfo.id}</p>
        </div>
        <div class="booking-box">
            <h2>📋 Detalles de tu Tour</h2>
            <div class="detail-row"><span class="detail-label">Tour:</span><span>${tourName}</span></div>
            <div class="detail-row"><span class="detail-label">Fecha:</span><span>${new Date(tourDate + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div class="detail-row"><span class="detail-label">Personas:</span><span>${persons} ${persons === 1 ? 'persona' : 'personas'}</span></div>
            <div class="detail-row"><span class="detail-label">Total Pagado:</span><span><strong>$${totalAmount.toLocaleString('es-CL')} CLP</strong></span></div>
        </div>
        <div class="info-section">
            <h3>✅ Próximos Pasos</h3>
            <ul>
                <li>Te contactaremos por WhatsApp <strong>24 horas antes</strong> del tour</li>
                <li>Confirmaremos la <strong>hora exacta de recogida</strong> en tu hotel/alojamiento</li>
                <li>Recibirás instrucciones de qué llevar al tour</li>
            </ul>
        </div>
        <div class="info-section" style="background: #fff3e0; border-left-color: #FF6F00;">
            <h3 style="color: #E65100;">ℹ️ Información Importante</h3>
            <ul>
                <li>Los tours comienzan aproximadamente a las 20:00 hrs</li>
                <li>Duración según el tipo de tour seleccionado</li>
                <li>Abrígate bien - las noches en el desierto son frías</li>
                <li>El transporte desde/hacia tu alojamiento está incluido</li>
            </ul>
        </div>
        <div style="text-align: center;">
            <p><strong>¿Preguntas o cambios en tu reserva?</strong></p>
            <a href="https://wa.me/56935134669?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20reserva%20${bookingId}" class="whatsapp-button">💬 Contactar por WhatsApp</a>
            <p style="font-size: 14px; color: #666;">+56 9 3513 4669</p>
        </div>
        <p style="margin-top: 30px;">¡Nos vemos bajo las estrellas!</p>
        <p><strong>Vicente Litvak</strong><br>Atacama Dark Sky<br><a href="https://atacamadarksky.cl">www.atacamadarksky.cl</a></p>
    </div>
    <div class="footer">
        <p>Este email confirma tu reserva y pago para un tour astronómico en San Pedro de Atacama.</p>
        <p>Si no realizaste esta reserva, por favor contáctanos inmediatamente.</p>
        <p>© 2024 Atacama Dark Sky. Todos los derechos reservados.</p>
    </div>
</body>
</html>`;

                        // Format date for subject
                        const formattedDateSubject = tourDate; // Use YYYY-MM-DD format

                        // Send email to customer
                        await resend.emails.send({
                            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
                            to: [customerEmail],
                            subject: `✅ Reserva Confirmada - ${tourName} - ${formattedDateSubject}`,
                            html: emailHTML
                        });

                        console.log('[WEBHOOK] Confirmation email sent successfully to:', customerEmail);

                        // Send notification email to admin
                        const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';
                        const adminEmailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
        .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
        .box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .box h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 0; }
        table { width: 100%; margin: 20px 0; }
        td { padding: 8px 0; }
        .label { color: #666; font-weight: bold; }
        .value { color: #333; }
        .paid-badge { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-weight: bold; }
        .action-box { background: #667eea; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .action-box h4 { margin: 0 0 10px 0; }
        .action-box ol { margin: 10px 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Pago Confirmado - Nueva Reserva</h1>
        <p>Mercado Pago - Atacama Dark Sky</p>
    </div>
    <div class="content">
        <div class="box">
            <p style="text-align: center; margin-top: 0;">
                <span class="paid-badge">✅ PAGO APROBADO</span>
            </p>
            <h2>💳 Detalles del Pago</h2>
            <table>
                <tr><td class="label">ID de Pago:</td><td class="value">${paymentInfo.id}</td></tr>
                <tr><td class="label">ID de Reserva:</td><td class="value" style="font-family: monospace;">${bookingId}</td></tr>
                <tr><td class="label">Monto Pagado:</td><td class="value"><strong>$${totalAmount.toLocaleString('es-CL')} CLP</strong></td></tr>
                <tr><td class="label">Método de Pago:</td><td class="value">${paymentInfo.payment_method_id || 'N/A'}</td></tr>
            </table>
        </div>
        <div class="box">
            <h2>📋 Detalles de la Reserva</h2>
            <table>
                <tr><td class="label">Tour:</td><td class="value">${tourName}</td></tr>
                <tr><td class="label">Fecha:</td><td class="value">${new Date(tourDate + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                <tr><td class="label">Personas:</td><td class="value">${persons} ${persons === 1 ? 'persona' : 'personas'}</td></tr>
                <tr><td class="label">Estado:</td><td class="value" style="color: #4CAF50; font-weight: bold;">CONFIRMADO</td></tr>
            </table>
        </div>
        <div class="box">
            <h2>👤 Información del Cliente</h2>
            <table>
                <tr><td class="label">Nombre:</td><td class="value">${customerName}</td></tr>
                <tr><td class="label">Email:</td><td class="value"><a href="mailto:${customerEmail}" style="color: #667eea;">${customerEmail}</a></td></tr>
                <tr><td class="label">Teléfono:</td><td class="value">${metadata.customer_phone || 'N/A'}</td></tr>
                ${metadata.customer_accommodation ? `<tr><td class="label">Alojamiento:</td><td class="value">${metadata.customer_accommodation}</td></tr>` : ''}
                ${metadata.customer_message ? `<tr><td class="label">Mensaje:</td><td class="value">${metadata.customer_message}</td></tr>` : ''}
            </table>
        </div>
        <div class="action-box">
            <h4>⚡ Próximas Acciones:</h4>
            <ol>
                <li>El cliente ya recibió su email de confirmación automáticamente</li>
                <li>La reserva fue guardada en la base de datos como CONFIRMADA</li>
                <li>Contactar al cliente 24 horas antes del tour por WhatsApp</li>
                <li>Confirmar punto de recogida y detalles finales</li>
            </ol>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
            Este pago fue procesado automáticamente por Mercado Pago<br>
            Atacama Dark Sky © 2024
        </p>
    </div>
</body>
</html>`;

                        await resend.emails.send({
                            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
                            to: [adminEmail],
                            subject: `💰 Pago Confirmado - ${customerName} - ${tourName} - ${formattedDateSubject}`,
                            html: adminEmailHTML,
                            reply_to: customerEmail
                        });

                        console.log('[WEBHOOK] Admin notification sent successfully to:', adminEmail);

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
