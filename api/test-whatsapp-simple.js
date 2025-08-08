// Simple WhatsApp Business API Test
const WHATSAPP_TOKEN = 'EAAKX7ymFNroBPBtBlRM4ZAroG5ZBUTpca5JtBE9igBeRnZAMEimWicUzqOl0lPSX4JuQcrTZCZBcZBZAqFxuPgfMqk2VZBTFRKmRbcqu4AePXPuEXevqGvqEMYVqB0WxczgkVxhQWV8OigZBTkzvWNwCIebZCC42rG04cZCeHvcQZA9ZA2ZC1ZBGTZAYZCE6y8uWafZBWDy6anLvZBo11G5ZAlj5SGBFPcZCvJA66LiHZBSgQwZBk8xTcQnjtPqa5kZD';
const APP_ID = '730003402995386';

async function findWhatsAppAssets() {
  console.log('\n=== SEARCHING FOR WHATSAPP ASSETS ===\n');
  
  try {
    // Method 1: Try to get WhatsApp Business Accounts from app
    console.log('1. Checking WhatsApp Business Accounts...');
    const response1 = await fetch(
      `https://graph.facebook.com/v18.0/${APP_ID}?fields=whatsapp_business_accounts{phone_numbers}`,
      {
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
      }
    );
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Method 1 result:', JSON.stringify(data1, null, 2));
      
      if (data1.whatsapp_business_accounts && data1.whatsapp_business_accounts.data.length > 0) {
        const wbaId = data1.whatsapp_business_accounts.data[0].id;
        console.log('\nFound WhatsApp Business Account ID:', wbaId);
        
        // Get phone numbers for this WBA
        const phoneResponse = await fetch(
          `https://graph.facebook.com/v18.0/${wbaId}/phone_numbers`,
          {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
          }
        );
        
        if (phoneResponse.ok) {
          const phoneData = await phoneResponse.json();
          console.log('✅ Phone numbers:', JSON.stringify(phoneData, null, 2));
          
          if (phoneData.data && phoneData.data.length > 0) {
            const phoneNumberId = phoneData.data[0].id;
            const displayNumber = phoneData.data[0].display_phone_number;
            
            console.log('\n🎉 CONFIGURATION FOUND!');
            console.log('=========================');
            console.log(`WHATSAPP_TOKEN=${WHATSAPP_TOKEN}`);
            console.log(`WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId}`);
            console.log(`YOUR_PHONE_NUMBER=+56935134669`);
            console.log(`Display Number: ${displayNumber}`);
            
            return { phoneNumberId, displayNumber, wbaId };
          }
        }
      }
    } else {
      console.log('❌ Method 1 failed:', await response1.text());
    }
    
    // Method 2: Try direct account access
    console.log('\n2. Trying direct account access...');
    const response2 = await fetch(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
      }
    );
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Accounts:', JSON.stringify(data2, null, 2));
    } else {
      console.log('❌ Method 2 failed:', await response2.text());
    }
    
    // Method 3: Manual configuration hint
    console.log('\n3. Manual configuration needed');
    console.log('\nTo find your Phone Number ID:');
    console.log('1. Go to https://developers.facebook.com/apps/730003402995386/whatsapp-business/wa-dev-console/');
    console.log('2. Look for your phone number');
    console.log('3. Copy the "Phone number ID" value');
    console.log('4. Use these environment variables in Vercel:');
    console.log(`   WHATSAPP_TOKEN=${WHATSAPP_TOKEN}`);
    console.log('   WHATSAPP_PHONE_NUMBER_ID=[your_phone_number_id]');
    console.log('   YOUR_PHONE_NUMBER=+56935134669');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test sending a simple message
async function testMessage(phoneNumberId) {
  console.log('\n=== TESTING MESSAGE SEND ===\n');
  
  const message = {
    messaging_product: 'whatsapp',
    to: '+56935134669', // Your number
    type: 'text',
    text: {
      body: '🧪 TEST: WhatsApp API is working! This is a test message from your booking system.'
    }
  };
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Message sent successfully!', result);
    } else {
      const error = await response.text();
      console.log('❌ Message failed:', error);
      console.log('\nPossible reasons:');
      console.log('1. Phone number (+56935134669) needs to start a conversation first');
      console.log('2. Phone number not registered as test number in Meta Business');
      console.log('3. 24-hour window expired (send "Hi" to your WhatsApp Business number first)');
    }
  } catch (error) {
    console.log('❌ Error sending message:', error.message);
  }
}

// Run the test
findWhatsAppAssets().then(() => {
  console.log('\n👆 Copy the configuration above and add it to Vercel environment variables');
  console.log('\nTo test messaging, first send "Hello" to your WhatsApp Business number');
  console.log('Then run this script again to test message sending.');
}).catch(console.error);