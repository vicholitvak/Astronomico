// Check recent emails in Resend
require('dotenv').config({ path: '.env.local' });

async function checkResendEmails() {
    const apiKey = process.env.RESEND_API_KEY;

    console.log('🔍 Checking Resend emails...\n');
    console.log('API Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'NOT FOUND');

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        console.log('\n📧 Recent Emails:');
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkResendEmails();
