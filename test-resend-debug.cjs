// Debug Resend API with full error details
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResendDebug() {
    console.log('🔍 Debugging Resend configuration...\n');

    console.log('API Key:', process.env.RESEND_API_KEY ? 'Found (' + process.env.RESEND_API_KEY.substring(0, 15) + '...)' : 'NOT FOUND');
    console.log('');

    try {
        const data = await resend.emails.send({
            from: 'Atacama NightSky <reservas@send.atacamadarksky.cl>',
            to: ['vicente.litvak@gmail.com'],
            subject: 'Test Email',
            html: '<h1>Test</h1>'
        });

        console.log('✅ Success!');
        console.log('Full response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ Error sending email:\n');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.response) {
            console.error('\nAPI Response:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.statusCode) {
            console.error('\nStatus Code:', error.statusCode);
        }

        console.error('\nFull error object:', JSON.stringify(error, null, 2));
    }
}

testResendDebug();
