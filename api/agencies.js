/**
 * Multi-Agency API
 * Gestiona agencias, productos, y bookings multi-tenant
 */

import { query, insert } from './lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/agencies', '');

  try {
    // GET /api/agencies - Listar todas las agencias
    if (req.method === 'GET' && !path) {
      return await listAgencies(req, res);
    }

    // GET /api/agencies/:id - Detalle de agencia
    if (req.method === 'GET' && path.match(/^\/[\w-]+$/)) {
      const agencyId = path.slice(1);
      return await getAgency(req, res, agencyId);
    }

    // GET /api/agencies/:id/products - Productos de una agencia
    if (req.method === 'GET' && path.match(/^\/[\w-]+\/products/)) {
      const agencyId = path.split('/')[1];
      return await getAgencyProducts(req, res, agencyId);
    }

    // GET /api/agencies/:id/bookings - Reservas de una agencia
    if (req.method === 'GET' && path.match(/^\/[\w-]+\/bookings/)) {
      const agencyId = path.split('/')[1];
      return await getAgencyBookings(req, res, agencyId);
    }

    // GET /api/agencies/:id/commissions - Comisiones de una agencia
    if (req.method === 'GET' && path.match(/^\/[\w-]+\/commissions/)) {
      const agencyId = path.split('/')[1];
      return await getAgencyCommissions(req, res, agencyId);
    }

    // POST /api/agencies/:id/book - Crear reserva para agencia
    if (req.method === 'POST' && path.match(/^\/[\w-]+\/book/)) {
      const agencyId = path.split('/')[1];
      return await createAgencyBooking(req, res, agencyId);
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('[AGENCIES] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============ LIST AGENCIES ============
async function listAgencies(req, res) {
  const result = await query(`
    SELECT
      agency_id, name, slug, city, logo_url,
      primary_color, commission_rate, status
    FROM agencies
    WHERE status = 'active'
    ORDER BY name
  `);

  return res.status(200).json({
    success: true,
    agencies: result.rows
  });
}

// ============ GET AGENCY DETAILS ============
async function getAgency(req, res, agencyId) {
  const result = await query(`
    SELECT * FROM agencies WHERE agency_id = $1
  `, [agencyId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  // Get product count
  const productsCount = await query(`
    SELECT COUNT(*) as count FROM agency_products
    WHERE agency_id = $1 AND status = 'active'
  `, [agencyId]);

  // Get booking stats
  const bookingStats = await query(`
    SELECT
      COUNT(*) as total_bookings,
      SUM(persons) as total_persons,
      SUM(payment_amount) as total_revenue
    FROM bookings
    WHERE agency_id = $1
    AND status = 'confirmed'
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
  `, [agencyId]);

  return res.status(200).json({
    success: true,
    agency: result.rows[0],
    stats: {
      products: parseInt(productsCount.rows[0].count),
      ...bookingStats.rows[0]
    }
  });
}

// ============ GET AGENCY PRODUCTS ============
async function getAgencyProducts(req, res, agencyId) {
  const { category, featured } = req.query;

  let sql = `
    SELECT * FROM agency_products
    WHERE agency_id = $1 AND status = 'active'
  `;
  const params = [agencyId];

  if (category) {
    sql += ` AND category = $2`;
    params.push(category);
  }

  if (featured === 'true') {
    sql += ` AND featured = true`;
  }

  sql += ` ORDER BY sort_order, name`;

  const result = await query(sql, params);

  return res.status(200).json({
    success: true,
    agency_id: agencyId,
    products: result.rows
  });
}

// ============ GET AGENCY BOOKINGS ============
async function getAgencyBookings(req, res, agencyId) {
  const { start_date, end_date, status, limit = 50 } = req.query;

  let sql = `
    SELECT * FROM bookings
    WHERE agency_id = $1
  `;
  const params = [agencyId];
  let paramCount = 2;

  if (start_date) {
    sql += ` AND date >= $${paramCount++}`;
    params.push(start_date);
  }

  if (end_date) {
    sql += ` AND date <= $${paramCount++}`;
    params.push(end_date);
  }

  if (status) {
    sql += ` AND status = $${paramCount++}`;
    params.push(status);
  }

  sql += ` ORDER BY date DESC, time DESC LIMIT $${paramCount}`;
  params.push(parseInt(limit));

  const result = await query(sql, params);

  return res.status(200).json({
    success: true,
    agency_id: agencyId,
    bookings: result.rows
  });
}

// ============ GET AGENCY COMMISSIONS ============
async function getAgencyCommissions(req, res, agencyId) {
  const { period } = req.query; // '2025-01' format

  // Get agency commission rate
  const agencyResult = await query(
    `SELECT commission_rate FROM agencies WHERE agency_id = $1`,
    [agencyId]
  );

  if (agencyResult.rows.length === 0) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  const commissionRate = parseFloat(agencyResult.rows[0].commission_rate);

  // Get monthly summary
  let sql = `
    SELECT
      TO_CHAR(date, 'YYYY-MM') as period,
      COUNT(*) as total_bookings,
      SUM(persons) as total_persons,
      SUM(payment_amount) as total_revenue,
      SUM(payment_amount * $2 / 100) as commission_amount,
      SUM(payment_amount * (1 - $2 / 100)) as agency_amount
    FROM bookings
    WHERE agency_id = $1
    AND status = 'confirmed'
    AND payment_status = 'paid'
  `;
  const params = [agencyId, commissionRate];

  if (period) {
    sql += ` AND TO_CHAR(date, 'YYYY-MM') = $3`;
    params.push(period);
  }

  sql += ` GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY period DESC`;

  const result = await query(sql, params);

  return res.status(200).json({
    success: true,
    agency_id: agencyId,
    commission_rate: commissionRate,
    periods: result.rows
  });
}

// ============ CREATE AGENCY BOOKING ============
async function createAgencyBooking(req, res, agencyId) {
  const {
    product_code,
    date,
    time,
    persons,
    name,
    email,
    phone,
    accommodation,
    message,
    payment_method = 'pending'
  } = req.body;

  // Validate agency exists
  const agencyResult = await query(
    `SELECT * FROM agencies WHERE agency_id = $1 AND status = 'active'`,
    [agencyId]
  );

  if (agencyResult.rows.length === 0) {
    return res.status(404).json({ error: 'Agency not found or inactive' });
  }

  const agency = agencyResult.rows[0];

  // Validate product exists
  const productResult = await query(
    `SELECT * FROM agency_products WHERE agency_id = $1 AND product_code = $2 AND status = 'active'`,
    [agencyId, product_code]
  );

  if (productResult.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = productResult.rows[0];

  // Calculate total
  const totalAmount = parseFloat(product.price_adult) * parseInt(persons);

  // Generate booking ID
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const prefix = agencyId.substring(0, 3).toUpperCase();
  const bookingId = `${prefix}-${timestamp}-${random}`;

  // Create booking
  const booking = await insert('bookings', {
    booking_id: bookingId,
    agency_id: agencyId,
    product_code: product_code,
    date,
    time,
    name,
    email,
    phone,
    accommodation,
    persons: parseInt(persons),
    tour_type: product.category || 'day-tour',
    status: 'pending',
    source: 'widget',
    payment_method,
    payment_status: 'pending',
    payment_amount: totalAmount,
    message: message || `${product.name} - via ${agency.name}`,
    created_at: new Date().toISOString()
  });

  // Create commission record
  const commissionAmount = totalAmount * (agency.commission_rate / 100);
  const agencyAmount = totalAmount - commissionAmount;

  await insert('commissions', {
    booking_id: bookingId,
    agency_id: agencyId,
    booking_total: totalAmount,
    commission_rate: agency.commission_rate,
    commission_amount: commissionAmount,
    agency_amount: agencyAmount,
    billing_period: new Date().toISOString().slice(0, 7) // '2025-01'
  });

  return res.status(201).json({
    success: true,
    booking_id: bookingId,
    agency: agency.name,
    product: product.name,
    total_amount: totalAmount,
    currency: product.currency || 'CLP',
    status: 'pending',
    message: 'Booking created. Proceed to payment.'
  });
}
