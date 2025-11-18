// Test the complete email system without needing a real payment
const fetch = require('node-fetch');

async function testEmailSystem() {
    console.log('🧪 Testing Email System...\n');

    // Simulate what Mercado Pago sends to our webhook
    const testWebhookPayload = {
        type: 'payment',
        action: 'payment.updated',
        data: {
            id: '999888777' // Fake payment ID for testing
        }
    };

    try {
        console.log('📤 Sending test webhook to production...');
        console.log('Payload:', JSON.stringify(testWebhookPayload, null, 2));

        const response = await fetch('https://atacamadarksky.cl/api/mercadopago-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testWebhookPayload)
        });

        const result = await response.json();

        console.log('\n📥 Webhook Response:');
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(result, null, 2));

        if (response.status === 200) {
            console.log('\n✅ Webhook processed successfully!');
            console.log('\n📧 Now check:');
            console.log('1. Resend Dashboard: https://resend.com/emails');
            console.log('2. Your email inbox (and spam folder)');
            console.log('3. Database for new booking');
        } else {
            console.log('\n❌ Webhook failed with status:', response.status);
        }

    } catch (error) {
        console.error('\n❌ Error testing webhook:', error.message);
    }
}

testEmailSystem();
