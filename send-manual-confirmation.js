// Script para enviar confirmación manual
import { Resend } from 'resend';

// Configurar con tu API Key de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendManualConfirmation() {
    const customerEmail = 'email-de-las-francesas@example.com'; // ACTUALIZAR CON EL EMAIL REAL
    const customerName = 'Cliente'; // ACTUALIZAR CON EL NOMBRE REAL
    const tourDate = '2024-11-24'; // HOY
    const persons = 3; // ACTUALIZAR CON EL NÚMERO REAL
    const bookingId = 'MANUAL-' + Date.now();
    const totalAmount = 90000; // 3 personas x 30000
    const participantNames = ['Nombre1', 'Nombre2', 'Nombre3']; // ACTUALIZAR CON LOS NOMBRES REALES

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
        .urgent-section { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
        .info-section h3, .urgent-section h3 { margin-top: 0; color: #2e7d32; }
        .urgent-section h3 { color: #f57c00; }
        .info-section ul, .urgent-section ul { margin: 10px 0; padding-left: 20px; }
        .whatsapp-button { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 Tour Confirmed for Tonight!</h1>
        <p>Atacama Dark Sky</p>
    </div>
    <div class="content">
        <p>Hello <strong>${customerName}</strong>,</p>
        <p>Your payment has been successfully processed and your tour is confirmed for <strong>TONIGHT</strong>!</p>

        <div class="urgent-section">
            <h3>⏰ IMPORTANT - TONIGHT'S TOUR</h3>
            <ul>
                <li><strong>Meeting Point:</strong> Plaza Apacheta</li>
                <li><strong>Meeting Time:</strong> 20:50 (8:50 PM) - PLEASE BE ON TIME</li>
                <li><strong>Date:</strong> Tonight, November 24, 2024</li>
                <li><strong>Transport:</strong> We will pick you up from Plaza Apacheta</li>
            </ul>
        </div>

        <div class="reference-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Booking Number</p>
            <div class="ref-number">${bookingId}</div>
        </div>

        <div class="booking-box">
            <h2>📋 Tour Details / Détails du Tour</h2>
            <div class="detail-row"><span class="detail-label">Tour:</span><span>Astronomical Tour Regular</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span>Tonight - November 24, 2024</span></div>
            <div class="detail-row"><span class="detail-label">Time:</span><span>20:50 at Plaza Apacheta</span></div>
            <div class="detail-row"><span class="detail-label">People:</span><span>${persons} persons</span></div>
            <div class="detail-row"><span class="detail-label">Total Paid:</span><span><strong>$${totalAmount.toLocaleString('es-CL')} CLP</strong></span></div>
        </div>

        <div class="info-section">
            <h3>✅ What to Bring / À Apporter</h3>
            <ul>
                <li><strong>WARM CLOTHES</strong> - Desert nights are very cold (can reach 0°C)</li>
                <li>Jacket, gloves, hat, scarf</li>
                <li>Comfortable shoes</li>
                <li>Camera if you want photos</li>
                <li>Water bottle</li>
            </ul>
        </div>

        <div class="info-section" style="background: #fff3e0; border-left-color: #FF6F00;">
            <h3 style="color: #E65100;">📍 Meeting Location / Lieu de Rencontre</h3>
            <p><strong>Plaza Apacheta</strong> - It's the main plaza in San Pedro de Atacama center</p>
            <p>Address: Tocopilla esquina Domingo Atienza, San Pedro de Atacama</p>
            <p>Google Maps: <a href="https://maps.google.com/?q=-22.909722,-68.199722" style="color: #FF6F00;">Click here for directions</a></p>
        </div>

        <div style="text-align: center;">
            <p><strong>Questions? Contact me now!</strong></p>
            <a href="https://wa.me/56935134669?text=Hello!%20I%20have%20a%20question%20about%20tonight's%20tour" class="whatsapp-button">💬 WhatsApp: +56 9 3513 4669</a>
        </div>

        <p style="margin-top: 30px;">See you tonight under the stars!</p>
        <p><strong>Vicente Litvak</strong><br>Atacama Dark Sky<br><a href="https://atacamadarksky.cl">www.atacamadarksky.cl</a></p>
    </div>
    <div class="footer">
        <p>This email confirms your booking and payment for tonight's astronomical tour in San Pedro de Atacama.</p>
        <p>© 2024 Atacama Dark Sky. All rights reserved.</p>
    </div>
</body>
</html>`;

    try {
        // Enviar email
        const result = await resend.emails.send({
            from: 'Atacama Dark Sky <reservas@atacamadarksky.cl>',
            to: [customerEmail],
            subject: `✅ TONIGHT'S TOUR CONFIRMED - Meet at Plaza Apacheta 20:50`,
            html: emailHTML
        });

        console.log('Email sent successfully:', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Ejecutar
sendManualConfirmation();