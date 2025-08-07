// Debug endpoint to check environment variables
export default async function handler(req, res) {
  const hasSupabase = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasPhone = !!process.env.YOUR_PHONE_NUMBER;
  
  // Get first 4 chars of API keys for verification (safe to show)
  const resendPreview = process.env.RESEND_API_KEY ? 
    process.env.RESEND_API_KEY.substring(0, 7) + '...' : 'NOT SET';
  
  return res.status(200).json({
    status: 'Debug endpoint working',
    environment: {
      supabase_url: hasSupabase ? '✅ Set' : '❌ Missing',
      supabase_key: hasSupabaseKey ? '✅ Set' : '❌ Missing',
      resend_api_key: hasResend ? `✅ Set (${resendPreview})` : '❌ Missing',
      your_phone: hasPhone ? '✅ Set' : '❌ Missing'
    },
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
}