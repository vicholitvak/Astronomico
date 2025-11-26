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
    status,
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
      r.reviewer_email,
      r.reviewer_country,
      r.language,
      r.tour_type,
      r.tour_date,
      r.photos,
      r.helpful_count,
      r.is_featured,
      r.status,
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
    tour_type,
    tour_date,
    photos
  } = req.body;

  // Validaciones
  if (!overall_rating || !reviewer_name || !reviewer_email) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['overall_rating', 'reviewer_name', 'reviewer_email']
    });
  }

  if (overall_rating < 1 || overall_rating > 5) {
    return res.status(400).json({
      error: 'Rating must be between 1 and 5'
    });
  }

  // Buscar booking por nombre y/o email (más reciente primero)
  const bookingCheck = await pool.query(
    `SELECT booking_id, tour_type, date, status, name, email
     FROM bookings
     WHERE LOWER(name) = LOWER($1) OR LOWER(email) = LOWER($2)
     ORDER BY created_at DESC
     LIMIT 1`,
    [reviewer_name, reviewer_email]
  );

  if (bookingCheck.rows.length === 0) {
    return res.status(404).json({
      error: 'No booking found for this name or email'
    });
  }

  const booking = bookingCheck.rows[0];

  // Verificar que no existe ya un review para este booking
  const existingReview = await pool.query(
    'SELECT review_id FROM reviews WHERE booking_id = $1',
    [booking.booking_id]
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
      booking.booking_id,
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

  // Enviar notificación por email al admin
  await sendNewReviewNotification({
    review_id,
    reviewer_name,
    reviewer_email,
    overall_rating,
    title,
    comment,
    tour_type: booking.tour_type,
    tour_date: booking.date
  });

  return res.status(201).json({
    success: true,
    review: result.rows[0],
    message: 'Review submitted successfully and is pending approval'
  });
}

/**
 * Enviar notificación de nueva reseña al admin
 */
async function sendNewReviewNotification(review) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'vicente.litvak@gmail.com';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  const tourTypes = {
    'regular': 'Tour Astronómico Regular',
    'private': 'Tour Privado Exclusivo',
    'astrophoto': 'Tour Astrofotográfico'
  };

  const stars = '⭐'.repeat(review.overall_rating);
  const tourDate = review.tour_date ? new Date(review.tour_date).toLocaleDateString('es-CL') : 'N/A';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Atacama Dark Sky <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `${stars} Nueva Reseña de ${review.reviewer_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">🌟 Nueva Reseña Recibida</h2>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Calificación:</strong> ${stars} (${review.overall_rating}/5)</p>
              <p><strong>Cliente:</strong> ${review.reviewer_name}</p>
              <p><strong>Email:</strong> ${review.reviewer_email}</p>
              <p><strong>Tour:</strong> ${tourTypes[review.tour_type] || review.tour_type}</p>
              <p><strong>Fecha del tour:</strong> ${tourDate}</p>
            </div>

            ${review.title ? `<p><strong>Título:</strong> ${review.title}</p>` : ''}
            ${review.comment ? `
              <div style="background: #fff; border-left: 4px solid #00D4FF; padding: 15px; margin: 20px 0;">
                <p style="font-style: italic; margin: 0;">"${review.comment}"</p>
              </div>
            ` : ''}

            <div style="margin-top: 30px; padding: 15px; background: #1a1a2e; color: white; border-radius: 10px;">
              <p style="margin: 0;">📋 <strong>Acción requerida:</strong> Revisar y aprobar en el panel de admin</p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">ID de reseña: ${review.review_id}</p>
            </div>
          </div>
        `
      })
    });
    console.log('Admin notification email sent for review:', review.review_id);
  } catch (error) {
    console.error('Error sending review notification email:', error);
  }
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
