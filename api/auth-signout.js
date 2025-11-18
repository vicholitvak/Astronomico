// Sign out
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear cookie
  res.setHeader('Set-Cookie', [
    'admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  ]);

  if (req.method === 'GET') {
    return res.redirect('/admin-login.html');
  }

  return res.status(200).json({ success: true });
}
