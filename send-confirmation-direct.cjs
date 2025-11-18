require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { Resend } = require('resend');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendConfirmationDirect() {
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
        console.log(`ID: ${booking.booking_id}`);
        console.log(`Name: ${booking.name}`);
        console.log(`Email: ${booking.email}`);
        console.log(`Date: ${booking.date}`);
        console.log(`Tour: ${booking.tour_type}`);
        console.log(`Persons: ${booking.persons}`);

        // Get tour type name
        const tourNames = {
            'regular': 'Tour Astronómico Regular',
            'private': 'Tour Astronómico Privado VIP',
            'astrophoto': 'Tour de Astrofotografía'
        };

        const tourName = tourNames[booking.tour_type] || 'Tour Astronómico';

        // Calculate price
        const prices = {
            'regular': 30000,
            'private': 120000,
            'astrophoto': 40000
        };
        const pricePerPerson = prices[booking.tour_type] || 30000;
        const totalAmount = pricePerPerson * booking.persons;

        console.log(`\n💰 Amount: $${totalAmount.toLocaleString('es-CL')} CLP`);

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
        <p>Atacama Dark Sky</p>
    </div>

    <div class="content">
        <p>Hola <strong>${booking.name}</strong>,</p>

        <p>¡Excelente noticia! Tu pago ha sido procesado exitosamente y tu reserva está confirmada.</p>

        <div class="reference-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Número de Reserva</p>
            <div class="ref-number">${booking.booking_id}</div>
        </div>

        <div class="booking-box">
            <h2>📋 Detalles de tu Tour</h2>
            <div class="detail-row">
                <span class="detail-label">Tour:</span>
                <span class="detail-value">${tourName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${new Date(booking.date + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Personas:</span>
                <span class="detail-value">${booking.persons} ${booking.persons === 1 ? 'persona' : 'personas'}</span>
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
            </ul>
        </div>

        <div class="info-section" style="background: #fff3e0; border-left-color: #FF6F00;">
            <h3 style="color: #E65100;">ℹ️ Información Importante</h3>
            <ul>
                <li>Los tours comienzan aproximadamente a las 20:00 hrs</li>
                <li>Duración: ${booking.tour_type === 'private' ? '3 horas' : booking.tour_type === 'astrophoto' ? '3 horas' : '2.5 horas'}</li>
                <li>Abrígate bien - las noches en el desierto son frías</li>
                <li>El transporte desde/hacia tu alojamiento está incluido</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <p><strong>¿Preguntas o cambios en tu reserva?</strong></p>
            <a href="https://wa.me/56935134669?text=Hola!%20Tengo%20una%20consulta%20sobre%20mi%20reserva%20${booking.booking_id}" class="whatsapp-button">
                💬 Contactar por WhatsApp
            </a>
            <p style="font-size: 14px; color: #666;">+56 9 3513 4669</p>
        </div>

        <p style="margin-top: 30px;">¡Nos vemos bajo las estrellas!</p>
        <p><strong>Vicente Litvak</strong><br>
        Atacama Dark Sky<br>
        <a href="https://atacamadarksky.cl">www.atacamadarksky.cl</a></p>
    </div>

    <div class="footer">
        <p>Este email confirma tu reserva y pago para un tour astronómico en San Pedro de Atacama.</p>
        <p>Si no realizaste esta reserva, por favor contáctanos inmediatamente.</p>
        <p>© 2024 Atacama Dark Sky. Todos los derechos reservados.</p>
    </div>
</body>
</html>
        `;

        console.log('\n📧 Sending confirmation email to customer...');

        // Send email using Resend
        const data = await resend.emails.send({
            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
            to: [booking.email],
            subject: `✅ Reserva Confirmada - ${tourName} - ${new Date(booking.date + 'T00:00:00').toLocaleDateString('es-CL')}`,
            html: emailHTML
        });

        console.log('\n✅ Email sent successfully!');
        console.log('Email ID:', data.id);
        console.log('Sent to:', booking.email);

        await pool.end();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        await pool.end();
        process.exit(1);
    }
}

sendConfirmationDirect();
