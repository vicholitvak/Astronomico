// Test with Resend onboarding domain (works immediately but may go to spam)
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendOnboarding() {
    console.log('🧪 Testing with Resend onboarding domain...\n');

    try {
        const data = await resend.emails.send({
            from: 'Atacama NightSky <onboarding@resend.dev>',
            to: ['vicente.litvak@gmail.com'],
            subject: '🧪 Test - Sistema de Confirmación Atacama NightSky',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; padding: 30px; text-align: center;">
        <h1>🧪 Email de Prueba</h1>
        <p>Atacama NightSky</p>
    </div>
    <div style="background: #f9f9f9; padding: 30px;">
        <h2>✅ ¡El sistema de emails funciona!</h2>
        <p>Este email se envió usando el dominio temporal de Resend.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
        <hr>
        <p><small>Nota: Este email puede ir a spam porque usa onboarding@resend.dev</small></p>
    </div>
</body>
</html>
            `
        });

        console.log('✅ Email sent successfully!');
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('\n📧 Check your inbox (and SPAM folder): vicente.litvak@gmail.com');
        console.log('Resend Dashboard: https://resend.com/emails');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
    }
}

testResendOnboarding();
