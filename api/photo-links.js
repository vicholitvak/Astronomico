/**
 * Photo Links API Endpoint
 * Manages photo links by tour date
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { date } = req.query;

      if (date) {
        // Get link for specific date
        const result = await pool.query(
          'SELECT * FROM photo_links WHERE tour_date = $1',
          [date]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'No photo link for this date' });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
      } else {
        // Get all links (for admin)
        const result = await pool.query(
          'SELECT * FROM photo_links ORDER BY tour_date DESC LIMIT 100'
        );
        return res.status(200).json({ success: true, data: result.rows });
      }
    }

    if (req.method === 'POST') {
      const { tour_date, photo_url, description } = req.body;

      if (!tour_date || !photo_url) {
        return res.status(400).json({
          success: false,
          error: 'tour_date and photo_url are required'
        });
      }

      // Upsert: insert or update if exists
      const result = await pool.query(`
        INSERT INTO photo_links (tour_date, photo_url, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (tour_date)
        DO UPDATE SET
          photo_url = EXCLUDED.photo_url,
          description = EXCLUDED.description,
          updated_at = TIMEZONE('utc', NOW())
        RETURNING *
      `, [tour_date, photo_url, description || null]);

      return res.status(200).json({ success: true, data: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ success: false, error: 'date is required' });
      }

      await pool.query('DELETE FROM photo_links WHERE tour_date = $1', [date]);
      return res.status(200).json({ success: true, message: 'Deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Photo links API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
