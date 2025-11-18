require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAdminNotification() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

        // Marc's booking details
        const booking = {
            bookingId: 'ATK-1763481800260',
            customerName: 'Marc Kreutzmann',
            customerEmail: 'marc_kreutzmann@hotmail.com',
            customerPhone: '+56935134669',
            tourType: 'private',
            tourName: 'Tour Astronómico Privado VIP',
            tourDate: '2025-12-07',
            persons: 1,
            totalAmount: 120000,
            paymentId: '1763481800260'
        };

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
                <tr><td class="label">ID de Pago:</td><td class="value">${booking.paymentId}</td></tr>
                <tr><td class="label">ID de Reserva:</td><td class="value" style="font-family: monospace;">${booking.bookingId}</td></tr>
                <tr><td class="label">Monto Pagado:</td><td class="value"><strong>$${booking.totalAmount.toLocaleString('es-CL')} CLP</strong></td></tr>
                <tr><td class="label">Método de Pago:</td><td class="value">Mercado Pago</td></tr>
            </table>
        </div>
        <div class="box">
            <h2>📋 Detalles de la Reserva</h2>
            <table>
                <tr><td class="label">Tour:</td><td class="value">${booking.tourName}</td></tr>
                <tr><td class="label">Fecha:</td><td class="value">${new Date(booking.tourDate + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                <tr><td class="label">Personas:</td><td class="value">${booking.persons} persona</td></tr>
                <tr><td class="label">Estado:</td><td class="value" style="color: #4CAF50; font-weight: bold;">CONFIRMADO</td></tr>
            </table>
        </div>
        <div class="box">
            <h2>👤 Información del Cliente</h2>
            <table>
                <tr><td class="label">Nombre:</td><td class="value">${booking.customerName}</td></tr>
                <tr><td class="label">Email:</td><td class="value"><a href="mailto:${booking.customerEmail}" style="color: #667eea;">${booking.customerEmail}</a></td></tr>
                <tr><td class="label">Teléfono:</td><td class="value"><a href="tel:${booking.customerPhone}" style="color: #667eea;">${booking.customerPhone}</a></td></tr>
            </table>
        </div>
        <div class="action-box">
            <h4>⚡ Próximas Acciones:</h4>
            <ol>
                <li>El cliente ya recibió su email de confirmación</li>
                <li>La reserva está guardada en la base de datos como CONFIRMADA</li>
                <li>Contactar al cliente 24 horas antes del tour por WhatsApp</li>
                <li>Confirmar punto de recogida y detalles finales</li>
                <li><strong>TOUR PRIVADO:</strong> Coordinar horario flexible según preferencia del cliente</li>
            </ol>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
            Este pago fue procesado por Mercado Pago el 18 de noviembre de 2025<br>
            Atacama Dark Sky © 2024
        </p>
    </div>
</body>
</html>`;

        console.log('\n📧 Enviando email de notificación al admin...');
        console.log('To:', adminEmail);

        const data = await resend.emails.send({
            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
            to: [adminEmail],
            subject: `💰 Pago Confirmado - ${booking.customerName} - ${booking.tourName} - ${new Date(booking.tourDate + 'T00:00:00').toLocaleDateString('es-CL')}`,
            html: adminEmailHTML,
            reply_to: booking.customerEmail
        });

        console.log('\n✅ Email de notificación enviado exitosamente!');
        console.log('Email ID:', data.id);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

sendAdminNotification();
