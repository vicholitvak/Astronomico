// Test WhatsApp Business API Configuration
import fetch from 'node-fetch';

const WHATSAPP_TOKEN = 'EAAKX7ymFNroBPBtBlRM4ZAroG5ZBUTpca5JtBE9igBeRnZAMEimWicUzqOl0lPSX4JuQcrTZCZBcZBZAqFxuPgfMqk2VZBTFRKmRbcqu4AePXPuEXevqGvqEMYVqB0WxczgkVxhQWV8OigZBTkzvWNwCIebZCC42rG04cZCeHvcQZA9ZA2ZC1ZBGTZAYZCE6y8uWafZBWDy6anLvZBo11G5ZAlj5SGBFPcZCvJA66LiHZBSgQwZBk8xTcQnjtPqa5kZD';

async function testWhatsAppSetup() {
  console.log('\n=== WHATSAPP BUSINESS API TEST ===\n');
  
  try {
    // 1. Get Business Account
    console.log('1. Getting Business Account information...');
    const businessResponse = await fetch(
      'https://graph.facebook.com/v18.0/730003402995386', // Your app ID from token debug
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        }
      }
    );
    
    if (businessResponse.ok) {
      const businessData = await businessResponse.json();
      console.log('✅ Business data:', JSON.stringify(businessData, null, 2));
    }
    
    // 2. Get WhatsApp Business Accounts
    console.log('\n2. Fetching WhatsApp Business Accounts...');
    const wbaResponse = await fetch(
      'https://graph.facebook.com/v18.0/730003402995386/whatsapp_business_accounts',
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        }
      }
    );
    
    if (!wbaResponse.ok) {
      console.log('❌ Error fetching WBA:', await wbaResponse.text());
      
      // Try alternative approach - get phone numbers directly
      console.log('\n3. Trying alternative approach...');
      const phoneResponse = await fetch(
        'https://graph.facebook.com/v18.0/me/phone_numbers',
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`
          }
        }
      );
      
      if (!phoneResponse.ok) {
        console.log('❌ Alternative approach failed:', await phoneResponse.text());
        return;
      }
    }
    
    if (!phoneResponse.ok) {
      const error = await phoneResponse.text();
      console.log('❌ Error fetching phone numbers:', error);
      
      // Try getting debug token info
      console.log('\n2. Checking token information...');
      const debugResponse = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${WHATSAPP_TOKEN}&access_token=${WHATSAPP_TOKEN}`
      );
      
      if (debugResponse.ok) {
        const debugInfo = await debugResponse.json();
        console.log('Token debug info:', JSON.stringify(debugInfo, null, 2));
      }
      return;
    }
    
    const phoneData = await phoneResponse.json();
    console.log('✅ Phone numbers found:', JSON.stringify(phoneData, null, 2));
    
    if (phoneData.data && phoneData.data.length > 0) {
      const phoneNumberId = phoneData.data[0].id;
      const displayNumber = phoneData.data[0].display_phone_number;
      
      console.log('\n📱 Your WhatsApp Business Configuration:');
      console.log('   Phone Number ID:', phoneNumberId);
      console.log('   Display Number:', displayNumber);
      console.log('   Verified Name:', phoneData.data[0].verified_name);
      
      // 2. Test sending a message to yourself
      console.log('\n3. Testing message sending capability...');
      console.log('   Note: You need to start a conversation first by sending "Hello" to your WhatsApp Business number');
      
      // Get message templates
      console.log('\n4. Fetching message templates...');
      const templatesResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`
          }
        }
      );
      
      if (templatesResponse.ok) {
        const templates = await templatesResponse.json();
        console.log('✅ Available templates:', templates.data ? templates.data.length : 0);
        if (templates.data && templates.data.length > 0) {
          console.log('   Templates:');
          templates.data.forEach(template => {
            console.log(`   - ${template.name} (${template.status})`);
          });
        }
      }
      
      console.log('\n=== CONFIGURATION SUMMARY ===');
      console.log('\nAdd these to your Vercel environment variables:');
      console.log(`WHATSAPP_TOKEN=${WHATSAPP_TOKEN}`);
      console.log(`WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId}`);
      console.log(`YOUR_PHONE_NUMBER=+56935134669`);
      
      console.log('\n✅ WhatsApp Business API is configured correctly!');
      console.log('\n⚠️ Important: To receive notifications:');
      console.log('1. The recipient must have initiated a conversation in the last 24 hours');
      console.log('2. OR you need to use an approved message template');
      console.log('3. Make sure to add your personal number (+56935134669) as a test number in Meta Business');
      
    } else {
      console.log('❌ No phone numbers found. Please configure WhatsApp Business in Meta Business Suite.');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\nPossible issues:');
    console.log('1. Token might be expired - regenerate it in Meta Business');
    console.log('2. WhatsApp product not added to your app');
    console.log('3. Phone number not configured in WhatsApp Business');
  }
}

// Test if we can get app information
async function getAppInfo() {
  console.log('\n=== CHECKING APP INFORMATION ===\n');
  
  try {
    const response = await fetch(
      'https://graph.facebook.com/v18.0/me',
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('App/User info:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Run tests
async function runTests() {
  await getAppInfo();
  await testWhatsAppSetup();
}

runTests().catch(console.error);