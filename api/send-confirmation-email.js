// Send Booking Confirmation Email
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            customerEmail,
            customerName,
            tourName,
            tourDate,
            persons,
            totalAmount,
            paymentId,
            bookingId
        } = req.body;

        // Validate required fields
        if (!customerEmail || !customerName || !tourName || !tourDate || !persons || !totalAmount || !paymentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create email HTML
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .booking-box {
            background: white;
            border: 2px solid #00D4FF;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .booking-box h2 {
            color: #00D4FF;
            margin-top: 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        .detail-value {
            color: #333;
        }
        .reference-box {
            background: #fffbf0;
            border: 2px solid #FFD700;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .reference-box .ref-number {
            font-size: 20px;
            font-weight: bold;
            color: #FF8C00;
            margin: 10px 0;
        }
        .info-section {
            background: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 15px;
            margin: 20px 0;
        }
        .info-section h3 {
            margin-top: 0;
            color: #2e7d32;
        }
        .info-section ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .whatsapp-button {
            display: inline-block;
            background: #25D366;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 ¡Reserva Confirmada!</h1>
        <p>Atacama NightSky</p>
    </div>

    <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>

        <p>¡Excelente noticia! Tu pago ha sido procesado exitosamente y tu reserva está confirmada.</p>

        <div class="reference-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Número de Reserva</p>
            <div class="ref-number">${bookingId || paymentId}</div>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">ID de Pago: ${paymentId}</p>
        </div>

        <div class="booking-box">
            <h2>📋 Detalles de tu Tour</h2>
            <div class="detail-row">
                <span class="detail-label">Tour:</span>
                <span class="detail-value">${tourName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${new Date(tourDate).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Personas:</span>
                <span class="detail-value">${persons} ${persons === 1 ? 'persona' : 'personas'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Pagado:</span>
                <span class="detail-value"><strong>$${totalAmount.toLocaleString('es-CL')} CLP</strong></span>
            </div>
        </div>

        <div class="info-section">
            <h3>✅ Próximos Pasos</h3>
            <ul>
                <li>Te contactaremos por WhatsApp <strong>24 horas antes</strong> del tour</li>
                <li>Confirmaremos la <strong>hora exacta de recogida</strong> en tu hotel/alojamiento</li>
                <li>Recibirás instrucciones de qué llevar al tour</li>
                <li>Prepara tu cámara para capturar las estrellas ⭐</li>
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
            <a href="https://wa.me/56935134669?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20reserva%20${paymentId}" class="whatsapp-button">
                💬 Contactar por WhatsApp
            </a>
            <p style="font-size: 14px; color: #666;">+56 9 3513 4669</p>
        </div>

        <p style="margin-top: 30px;">¡Nos vemos bajo las estrellas!</p>
        <p><strong>Vicente Litvak</strong><br>
        Atacama NightSky<br>
        <a href="https://atacamadarksky.cl">www.atacamadarksky.cl</a></p>
    </div>

    <div class="footer">
        <p>Este email confirma tu reserva y pago para un tour astronómico en San Pedro de Atacama.</p>
        <p>Si no realizaste esta reserva, por favor contáctanos inmediatamente.</p>
        <p>© 2024 Atacama NightSky. Todos los derechos reservados.</p>
    </div>
</body>
</html>
        `;

        // Send email using Resend
        const data = await resend.emails.send({
            from: 'Atacama NightSky <reservas@atacamadarksky.cl>',
            to: [customerEmail],
            subject: `✅ Reserva Confirmada - ${tourName} - ${new Date(tourDate).toLocaleDateString('es-CL')}`,
            html: emailHTML
        });

        console.log('Confirmation email sent:', data);

        return res.status(200).json({
            success: true,
            emailId: data.id,
            message: 'Confirmation email sent successfully'
        });

    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return res.status(500).json({
            error: 'Failed to send confirmation email',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
