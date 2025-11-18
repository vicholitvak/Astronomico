// Get current session
export default async function handler(req, res) {
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
