/**
 * Reviews API Endpoint
 * Handles CRUD operations for customer reviews
 */

import { Pool } from 'pg';

// Initialize PostgreSQL connection to Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Generate unique review ID
 */
function generateReviewId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `REV-${timestamp}-${random}`.toUpperCase();
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getReviews(req, res);
      case 'POST':
        return await createReview(req, res);
      case 'PUT':
        return await updateReview(req, res);
      case 'DELETE':
        return await deleteReview(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Reviews API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * GET - Obtener reviews
 * Query params:
 * - tour_type: 'regular', 'private', 'astrophoto'
 * - status: 'pending', 'approved', 'rejected'
 * - limit: número de resultados (default: 20)
 * - offset: paginación (default: 0)
 * - featured: true/false
 */
async function getReviews(req, res) {
  const {
    tour_type,
    status = 'approved',
    limit = 20,
    offset = 0,
    featured,
    stats
  } = req.query;

  // Si se pide stats, retornar estadísticas
  if (stats === 'true') {
    const result = await pool.query(
      'SELECT * FROM get_review_stats($1)',
      [tour_type || null]
    );
    return res.status(200).json(result.rows[0]);
  }

  // Query builder
  let query = `
    SELECT
      r.review_id,
      r.overall_rating,
      r.guide_rating,
      r.equipment_rating,
      r.location_rating,
      r.value_rating,
      r.title,
      r.comment,
      r.reviewer_name,
      r.reviewer_country,
      r.language,
      r.tour_type,
      r.tour_date,
      r.photos,
      r.helpful_count,
      r.is_featured,
      r.created_at,
      rr.response_text as owner_response,
      rr.created_at as response_date
    FROM reviews r
    LEFT JOIN review_responses rr ON r.review_id = rr.review_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND r.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (tour_type) {
    query += ` AND r.tour_type = $${paramIndex}`;
    params.push(tour_type);
    paramIndex++;
  }

  if (featured === 'true') {
    query += ` AND r.is_featured = true`;
  }

  query += `
    ORDER BY
      r.is_featured DESC,
      r.helpful_count DESC,
      r.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(parseInt(limit), parseInt(offset));

  const result = await pool.query(query, params);

  return res.status(200).json({
    reviews: result.rows,
    count: result.rows.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}

/**
 * POST - Crear nuevo review
 */
async function createReview(req, res) {
  const {
    booking_id,
    overall_rating,
    guide_rating,
    equipment_rating,
    location_rating,
    value_rating,
    title,
    comment,
    reviewer_name,
    reviewer_email,
    reviewer_country,
    language = 'es',
    photos
  } = req.body;

  // Validaciones
  if (!booking_id || !overall_rating || !reviewer_name || !reviewer_email) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['booking_id', 'overall_rating', 'reviewer_name', 'reviewer_email']
    });
  }

  if (overall_rating < 1 || overall_rating > 5) {
    return res.status(400).json({
      error: 'Rating must be between 1 and 5'
    });
  }

  // Verificar que el booking existe y está completado
  const bookingCheck = await pool.query(
    `SELECT booking_id, tour_type, date, status
     FROM bookings
     WHERE booking_id = $1`,
    [booking_id]
  );

  if (bookingCheck.rows.length === 0) {
    return res.status(404).json({
      error: 'Booking not found'
    });
  }

  const booking = bookingCheck.rows[0];

  // Verificar que no existe ya un review para este booking
  const existingReview = await pool.query(
    'SELECT review_id FROM reviews WHERE booking_id = $1',
    [booking_id]
  );

  if (existingReview.rows.length > 0) {
    return res.status(400).json({
      error: 'Review already exists for this booking'
    });
  }

  // Generar review ID
  const review_id = generateReviewId();

  // Insertar review
  const result = await pool.query(
    `INSERT INTO reviews (
      review_id,
      booking_id,
      overall_rating,
      guide_rating,
      equipment_rating,
      location_rating,
      value_rating,
      title,
      comment,
      reviewer_name,
      reviewer_email,
      reviewer_country,
      language,
      tour_type,
      tour_date,
      photos,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
    RETURNING *`,
    [
      review_id,
      booking_id,
      overall_rating,
      guide_rating || null,
      equipment_rating || null,
      location_rating || null,
      value_rating || null,
      title || null,
      comment || null,
      reviewer_name,
      reviewer_email,
      reviewer_country || null,
      language,
      booking.tour_type,
      booking.date,
      photos || null
    ]
  );

  console.log('Review created:', {
    review_id,
    booking_id,
    overall_rating,
    reviewer_name
  });

  return res.status(201).json({
    success: true,
    review: result.rows[0],
    message: 'Review submitted successfully and is pending approval'
  });
}

/**
 * PUT - Actualizar review (aprobar, rechazar, destacar)
 */
async function updateReview(req, res) {
  const { review_id } = req.query;
  const {
    status,
    is_featured,
    moderation_notes,
    owner_response
  } = req.body;

  if (!review_id) {
    return res.status(400).json({
      error: 'review_id is required'
    });
  }

  // Verificar que el review existe
  const reviewCheck = await pool.query(
    'SELECT * FROM reviews WHERE review_id = $1',
    [review_id]
  );

  if (reviewCheck.rows.length === 0) {
    return res.status(404).json({
      error: 'Review not found'
    });
  }

  // Construir query de actualización
  const updates = [];
  const params = [review_id];
  let paramIndex = 2;

  if (status) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;

    if (status === 'approved') {
      updates.push(`approved_at = CURRENT_TIMESTAMP`);
    }
  }

  if (is_featured !== undefined) {
    updates.push(`is_featured = $${paramIndex}`);
    params.push(is_featured);
    paramIndex++;
  }

  if (moderation_notes) {
    updates.push(`moderation_notes = $${paramIndex}`);
    params.push(moderation_notes);
    paramIndex++;
  }

  if (updates.length === 0) {
    return res.status(400).json({
      error: 'No fields to update'
    });
  }

  // Actualizar review
  const query = `
    UPDATE reviews
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE review_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, params);

  // Si hay respuesta del owner, agregarla
  if (owner_response) {
    await pool.query(
      `INSERT INTO review_responses (review_id, response_text)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [review_id, owner_response]
    );
  }

  return res.status(200).json({
    success: true,
    review: result.rows[0]
  });
}

/**
 * DELETE - Eliminar review (solo admin)
 */
async function deleteReview(req, res) {
  const { review_id } = req.query;

  if (!review_id) {
    return res.status(400).json({
      error: 'review_id is required'
    });
  }

  const result = await pool.query(
    'DELETE FROM reviews WHERE review_id = $1 RETURNING review_id',
    [review_id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Review not found'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
    review_id: result.rows[0].review_id
  });
}
