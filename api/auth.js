// Simple Google OAuth Authentication
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth?action=callback`
);

export default async function handler(req, res) {
  const { action } = req.query;

  switch (action) {
    case 'signin':
      return handleSignIn(req, res);
    case 'callback':
      return handleCallback(req, res);
    case 'session':
      return handleSession(req, res);
    case 'signout':
      return handleSignOut(req, res);
    default:
      return res.status(404).json({ error: 'Not found' });
  }
}

// Initiate Google OAuth
async function handleSignIn(req, res) {
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    prompt: 'consent'
  });

  res.redirect(authorizeUrl);
}

// Handle Google OAuth callback
async function handleCallback(req, res) {
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

// Get current session
async function handleSession(req, res) {
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('admin_session='));

  if (!sessionCookie) {
    return res.status(200).json({ user: null });
  }

  try {
    const sessionToken = sessionCookie.split('=')[1];
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));

    // Check if expired
    if (sessionData.exp < Date.now()) {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: {
        email: sessionData.email,
        name: sessionData.name,
        picture: sessionData.picture
      }
    });

  } catch (error) {
    return res.status(200).json({ user: null });
  }
}

// Sign out
async function handleSignOut(req, res) {
  // Clear cookie
  res.setHeader('Set-Cookie', [
    'admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  ]);

  if (req.method === 'GET') {
    return res.redirect('/admin-login.html');
  }

  return res.status(200).json({ success: true });
}
