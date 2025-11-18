// Test webhook locally
const fetch = require('node-fetch');

async function testWebhook() {
    console.log('🧪 Testing webhook with simulated Mercado Pago notification...\n');

    const testPayload = {
        type: 'payment',
        action: 'payment.updated',
        data: {
            id: '999999999' // Fake payment ID for testing
        }
    };

    try {
        const response = await fetch('https://atacamadarksky.cl/api/mercadopago-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        const result = await response.json();

        console.log('✅ Webhook Response:');
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(result, null, 2));

        if (response.status === 200) {
            console.log('\n✅ Webhook is working!\n');
        } else {
            console.log('\n❌ Webhook failed\n');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testWebhook();
