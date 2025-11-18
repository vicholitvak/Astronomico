import { query } from './lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters for filtering
    const {
      status,
      tour_type,
      date_from,
      date_to,
      search,
      page = '1',
      limit = '50',
      sort = 'date_asc'
    } = req.query;

    // Build WHERE clause dynamically
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (tour_type) {
      conditions.push(`tour_type = $${paramCount++}`);
      values.push(tour_type);
    }

    if (date_from) {
      conditions.push(`date >= $${paramCount++}`);
      values.push(date_from);
    }

    if (date_to) {
      conditions.push(`date <= $${paramCount++}`);
      values.push(date_to);
    }

    if (search) {
      conditions.push(`(
        name ILIKE $${paramCount} OR
        email ILIKE $${paramCount} OR
        phone ILIKE $${paramCount} OR
        booking_id ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Determine sort order
    let orderBy = 'created_at DESC';
    switch (sort) {
      case 'date_asc':
        orderBy = 'date ASC, time ASC';
        break;
      case 'date_desc':
        orderBy = 'date DESC, time DESC';
        break;
      case 'created_asc':
        orderBy = 'created_at ASC';
        break;
      case 'created_desc':
        orderBy = 'created_at DESC';
        break;
      case 'name_asc':
        orderBy = 'name ASC';
        break;
      case 'name_desc':
        orderBy = 'name DESC';
        break;
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get bookings with pagination
    const bookingsQuery = `
      SELECT
        id,
        booking_id,
        date,
        persons,
        tour_type,
        time,
        name,
        email,
        phone,
        message,
        accommodation,
        status,
        source,
        reminder_sent,
        reminder_sent_at,
        created_at,
        updated_at
      FROM bookings
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const bookingsResult = await query(
      bookingsQuery,
      [...values, limitNum, offset]
    );

    // Get summary statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        SUM(persons) as total_persons,
        COUNT(*) FILTER (WHERE tour_type = 'regular') as regular_tours,
        COUNT(*) FILTER (WHERE tour_type = 'private') as private_tours,
        COUNT(*) FILTER (WHERE tour_type = 'astrophoto') as astrophoto_tours
      FROM bookings
      ${whereClause}
    `;
    const statsResult = await query(statsQuery, values);

    return res.status(200).json({
      success: true,
      data: {
        bookings: bookingsResult.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        stats: statsResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    });
  }
}
