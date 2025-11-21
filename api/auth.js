/**
 * Auth API - Combined signin and signout
 * Routes: ?action=signin or ?action=signout
 */

import { OAuth2Client } from 'google-auth-library';

export default async function handler(req, res) {
  const { action } = req.query;

  // ============ SIGN IN ============
  if (action === 'signin') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const redirectUri = 'https://atacamadarksky.cl/api/auth-callback';

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
  if (action === 'signout') {
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

  return res.status(400).json({ error: 'Invalid action. Use ?action=signin or ?action=signout' });
}
