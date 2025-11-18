// Google OAuth Callback Handler
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth-callback`
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect('/admin-login.html?error=auth_failed');
  }

  if (!code) {
    return res.redirect('/admin-login.html?error=no_code');
  }

  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userEmail = payload.email;

    // Check if user is authorized
    const allowedEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

    if (userEmail !== allowedEmail) {
      return res.redirect('/admin-login.html?error=AccessDenied');
    }

    // Create session token
    const sessionData = {
      email: userEmail,
      name: payload.name,
      picture: payload.picture,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Set cookie
    res.setHeader('Set-Cookie', [
      `admin_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    ]);

    // Redirect to admin
    res.redirect('/admin');

  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect('/admin-login.html?error=auth_failed');
  }
}
