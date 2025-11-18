// Test with correct domain (atacamadarksky.cl without 'send' subdomain)
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendFixed() {
    console.log('🧪 Testing with correct domain: atacamadarksky.cl\n');

    try {
        const data = await resend.emails.send({
            from: 'Atacama NightSky <reservas@atacamadarksky.cl>',
            to: ['vicente.litvak@gmail.com'],
            subject: '✅ Test - Dominio Correcto',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; padding: 30px; text-align: center;">
        <h1>✅ Dominio Verificado!</h1>
        <p>Atacama NightSky</p>
    </div>
    <div style="background: #f9f9f9; padding: 30px;">
        <h2>🎉 ¡El sistema está funcionando!</h2>
        <p>Este email se envió desde: <strong>reservas@atacamadarksky.cl</strong></p>
        <p>El dominio está correctamente verificado en Resend.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
    </div>
</body>
</html>
            `
        });

        console.log('✅ Email sent successfully!\n');
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('\n📧 Check your inbox: vicente.litvak@gmail.com');
        console.log('📊 Resend Dashboard: https://resend.com/emails/' + data.data.id);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.error) {
            console.error('Details:', JSON.stringify(error.error, null, 2));
        }
    }
}

testResendFixed();
