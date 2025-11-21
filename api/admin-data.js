/**
 * Admin Data API - Combined endpoint for photo-links and blocked-dates
 * Routes: ?type=photos or ?type=blocked
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

  const { type } = req.query;

  try {
    // ============ PHOTO LINKS ============
    if (type === 'photos') {
      if (req.method === 'GET') {
        const { date } = req.query;

        if (date) {
          const result = await pool.query(
            'SELECT * FROM photo_links WHERE tour_date = $1',
            [date]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No photo link for this date' });
          }
          return res.status(200).json({ success: true, data: result.rows[0] });
        } else {
          const result = await pool.query(
            'SELECT * FROM photo_links ORDER BY tour_date DESC LIMIT 100'
          );
          return res.status(200).json({ success: true, data: result.rows });
        }
      }

      if (req.method === 'POST') {
        const { tour_date, photo_url, description } = req.body;

        if (!tour_date || !photo_url) {
          return res.status(400).json({ success: false, error: 'tour_date and photo_url are required' });
        }

        const result = await pool.query(`
          INSERT INTO photo_links (tour_date, photo_url, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (tour_date)
          DO UPDATE SET photo_url = EXCLUDED.photo_url, description = EXCLUDED.description, updated_at = TIMEZONE('utc', NOW())
          RETURNING *
        `, [tour_date, photo_url, description || null]);

        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (req.method === 'DELETE') {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, error: 'date is required' });

        await pool.query('DELETE FROM photo_links WHERE tour_date = $1', [date]);
        return res.status(200).json({ success: true, message: 'Deleted' });
      }
    }

    // ============ BLOCKED DATES ============
    if (type === 'blocked') {
      if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM blocked_dates ORDER BY blocked_date ASC');
        return res.status(200).json({ success: true, data: result.rows });
      }

      if (req.method === 'POST') {
        const { blocked_date, tour_date, reason, block_type } = req.body;
        const dateToBlock = blocked_date || tour_date;

        if (!dateToBlock) {
          return res.status(400).json({ success: false, error: 'blocked_date is required' });
        }

        const result = await pool.query(`
          INSERT INTO blocked_dates (blocked_date, reason, block_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason, block_type = EXCLUDED.block_type
          RETURNING *
        `, [dateToBlock, reason || null, block_type || 'full']);

        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (req.method === 'DELETE') {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, error: 'date is required' });

        await pool.query('DELETE FROM blocked_dates WHERE blocked_date = $1', [date]);
        return res.status(200).json({ success: true, message: 'Deleted' });
      }
    }

    return res.status(400).json({ success: false, error: 'Invalid type. Use ?type=photos or ?type=blocked' });

  } catch (error) {
    console.error('Admin data API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
