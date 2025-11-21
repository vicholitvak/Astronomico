/**
 * Blocked Dates API Endpoint
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM blocked_dates ORDER BY blocked_date ASC'
      );
      return res.status(200).json({ success: true, data: result.rows });
    }

    if (req.method === 'POST') {
      const { blocked_date, reason } = req.body;

      if (!blocked_date) {
        return res.status(400).json({ success: false, error: 'blocked_date is required' });
      }

      const result = await pool.query(`
        INSERT INTO blocked_dates (blocked_date, reason)
        VALUES ($1, $2)
        ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason
        RETURNING *
      `, [blocked_date, reason || null]);

      return res.status(200).json({ success: true, data: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ success: false, error: 'date is required' });
      }

      await pool.query('DELETE FROM blocked_dates WHERE blocked_date = $1', [date]);
      return res.status(200).json({ success: true, message: 'Deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Blocked dates API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
