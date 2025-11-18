// Google OAuth Sign In
import { OAuth2Client } from 'google-auth-library';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Hardcode the domain to avoid env var issues
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

  res.redirect(authorizeUrl);
}
