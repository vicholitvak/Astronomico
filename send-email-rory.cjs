/**
 * Send confirmation email to Rory Allan manually
 * Booking: ATK-MI4XRPFQ-934O
 */

require('dotenv').config({ path: '.env.production.final' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const booking = {
    bookingId: 'ATK-MI4XRPFQ-934O',
    name: 'Rory Allan',
    email: 'rory.allan@hotmail.co.uk',
    date: '2025-11-20',
    persons: 2,
    tourType: 'regular',
    time: '21:30'
};

const adminEmail = 'vicente.litvak@gmail.com';

async function sendEmails() {
    try {
        console.log('📧 Enviando emails para reserva:', booking.bookingId);

        // Format date
        const dateObj = new Date(booking.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tourTypes = {
            'regular': 'Tour Astronómico Regular',
            'private': 'Tour Privado Exclusivo',
            'astrophoto': 'Tour Astrofotográfico Especializado'
        };

        // Customer confirmation email
        const customerEmailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✨ ¡Reserva Confirmada!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Atacama Dark Sky Tours</p>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Hola ${booking.name},</p>
        <p style="color: #333;">¡Gracias por reservar tu tour astronómico con nosotros! Estamos emocionados de compartir contigo la magia del universo de Atacama.</p>

        <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">📋 Detalles de tu Reserva</h2>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Código de Reserva:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #667eea; font-weight: bold;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Fecha:</strong></td>
              <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Horario:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Tour:</strong></td>
              <td style="padding: 8px 0; color: #333;">${tourTypes[booking.tourType]}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Personas:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.persons}</td>
            </tr>
          </table>
        </div>

        <div style="background: #e8f4ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #333;"><strong>📍 Punto de Encuentro:</strong></p>
          <p style="margin: 5px 0 0 0; color: #666;">Te confirmaremos el punto de encuentro 24 horas antes del tour.</p>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #333;"><strong>⚠️ Importante:</strong></p>
          <p style="margin: 5px 0 0 0; color: #666;">Por favor trae ropa abrigada. Las temperaturas nocturnas en el desierto pueden descender significativamente.</p>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
          ¡Nos vemos bajo las estrellas! 🌟<br>
          Vicente Litvak - Guía Astronómico
        </p>
      </div>
    </div>
  `;

        // Admin notification email
        const adminEmailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📧 Email de Confirmación Enviado</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Atacama Dark Sky Tours</p>
      </div>

      <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📋 Detalles de la Reserva</h2>

          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold; width: 40%;">ID Reserva</td>
              <td style="padding: 10px; background: #ffffff;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Cliente</td>
              <td style="padding: 10px; background: #ffffff;">${booking.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Email</td>
              <td style="padding: 10px; background: #ffffff;">${booking.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Fecha</td>
              <td style="padding: 10px; background: #ffffff;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Horario</td>
              <td style="padding: 10px; background: #ffffff;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Tour</td>
              <td style="padding: 10px; background: #ffffff;">${tourTypes[booking.tourType]}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8f9fa; font-weight: bold;">Personas</td>
              <td style="padding: 10px; background: #ffffff;">${booking.persons}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 15px; background: #e8f4ff; border-radius: 8px;">
            <p style="margin: 0; color: #333; font-size: 14px;">
              ✅ Email de confirmación enviado manualmente a ${booking.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

        // Send customer email
        console.log('📨 Enviando email al cliente...');
        const customerResult = await resend.emails.send({
            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
            to: [booking.email],
            subject: `✨ Reserva Confirmada - ${formattedDate} - Código: ${booking.bookingId}`,
            html: customerEmailHTML
        });
        console.log('✅ Email enviado al cliente:', customerResult);

        // Send admin notification
        console.log('📨 Enviando notificación al admin...');
        const adminResult = await resend.emails.send({
            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
            to: [adminEmail],
            subject: `📧 Confirmación Enviada - ${booking.name} - ${formattedDate}`,
            html: adminEmailHTML,
            reply_to: booking.email
        });
        console.log('✅ Email enviado al admin:', adminResult);

        console.log('\n🎉 Ambos emails enviados exitosamente!');

    } catch (error) {
        console.error('❌ Error enviando emails:', error);
        process.exit(1);
    }
}

sendEmails();
