/**
 * Auth API - Unified authentication endpoint
 * Routes: ?action=signin, signout, callback, session
 */

import { OAuth2Client } from 'google-auth-library';

// Helper function to build dynamic redirect URI based on request
function getRedirectUri(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/api/auth?action=callback`;
}

export default async function handler(req, res) {
  const { action } = req.query;

  switch (action) {
    case 'signin':
      return handleSignIn(req, res);
    case 'signout':
      return handleSignOut(req, res);
    case 'callback':
      return handleCallback(req, res);
    case 'session':
      return handleSession(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action. Use: signin, signout, callback, session' });
  }
}

// ============ SIGN IN ============
function handleSignIn(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redirectUri = getRedirectUri(req);

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    prompt: 'consent',
    redirect_uri: redirectUri
  });

  return res.redirect(authorizeUrl);
}

// ============ SIGN OUT ============
function handleSignOut(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', [
    'admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  ]);

  if (req.method === 'GET') {
    return res.redirect('/admin-login.html');
  }

  return res.status(200).json({ success: true });
}

// ============ CALLBACK ============
async function handleCallback(req, res) {
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
    const redirectUri = getRedirectUri(req);

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userEmail = payload.email;

    const allowedEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

    if (userEmail !== allowedEmail) {
      console.log('Access denied for:', userEmail);
      return res.redirect('/admin-login.html?error=AccessDenied');
    }

    const sessionData = {
      email: userEmail,
      name: payload.name,
      picture: payload.picture,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    res.setHeader('Set-Cookie', [
      `admin_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    ]);

    res.redirect('/admin');

  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect('/admin-login.html?error=auth_failed');
  }
}

// ============ SESSION ============
function handleSession(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('admin_session='));

  if (!sessionCookie) {
    return res.status(200).json({ user: null });
  }

  try {
    const sessionToken = sessionCookie.split('=')[1];
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));

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
