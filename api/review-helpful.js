/**
 * Mark Review as Helpful
 * Allows users to vote a review as helpful (one vote per IP)
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { review_id } = req.body;

    if (!review_id) {
      return res.status(400).json({ error: 'review_id is required' });
    }

    // Get voter IP
    const voterIp = req.headers['x-forwarded-for'] ||
                    req.headers['x-real-ip'] ||
                    req.socket.remoteAddress ||
                    'unknown';

    // Call database function to mark as helpful
    const result = await pool.query(
      'SELECT mark_review_helpful($1, $2) as success',
      [review_id, voterIp]
    );

    const success = result.rows[0].success;

    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Review marked as helpful'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

  } catch (error) {
    console.error('Review helpful error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
