// Direct test of Resend API
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendDirect() {
    console.log('🧪 Testing Resend directly...\n');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not found in .env.local');
        return;
    }

    console.log('✅ API Key found:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

    try {
        console.log('\n📤 Sending test email...');

        const data = await resend.emails.send({
            from: 'Atacama NightSky <reservas@send.atacamadarksky.cl>',
            to: ['vicente.litvak@gmail.com'],
            subject: '🧪 Test Email - Sistema de Confirmación',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Email de Prueba</h1>
        <p>Atacama NightSky</p>
    </div>
    <div class="content">
        <h2>✅ ¡El sistema de emails funciona!</h2>
        <p>Este es un email de prueba para verificar que Resend está correctamente configurado.</p>
        <p><strong>Dominio:</strong> send.atacamadarksky.cl</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
    </div>
</body>
</html>
            `
        });

        console.log('\n✅ Email sent successfully!');
        console.log('Email ID:', data.id);
        console.log('\n📧 Check:');
        console.log('1. Your inbox: vicente.litvak@gmail.com');
        console.log('2. Spam folder');
        console.log('3. Resend Dashboard: https://resend.com/emails/' + data.id);

    } catch (error) {
        console.error('\n❌ Error sending email:');
        console.error('Message:', error.message);
        console.error('Details:', JSON.stringify(error, null, 2));
    }
}

testResendDirect();
