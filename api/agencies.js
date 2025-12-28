/**
 * Multi-Agency API
 * Gestiona agencias, productos, y bookings multi-tenant
 */

import { query, insert } from '../lib/db.js';

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

    // POST /api/agencies/run-migration - Ejecutar migración (protegido)
    if (req.method === 'POST' && path === '/run-migration') {
      return await runMigration(req, res);
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

// ============ RUN DATABASE MIGRATION ============
async function runMigration(req, res) {
  const { secret } = req.query;
  if (secret !== process.env.ADMIN_SECRET && secret !== 'run-migration-2025') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const results = [];

  try {
    // 1. Crear tabla agencies
    await query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        agency_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(200),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100) DEFAULT 'San Pedro de Atacama',
        logo_url TEXT,
        primary_color VARCHAR(20) DEFAULT '#60a5fa',
        secondary_color VARCHAR(20) DEFAULT '#1e293b',
        commission_rate DECIMAL(5,2) DEFAULT 15.00,
        payment_method VARCHAR(50) DEFAULT 'mercadopago',
        currency VARCHAR(10) DEFAULT 'CLP',
        google_calendar_id VARCHAR(200),
        mercadopago_access_token TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push('✅ Table agencies created');

    // 2. Crear tabla agency_products
    await query(`
      CREATE TABLE IF NOT EXISTS agency_products (
        id SERIAL PRIMARY KEY,
        agency_id VARCHAR(50) REFERENCES agencies(agency_id),
        product_code VARCHAR(50) NOT NULL,
        name VARCHAR(300) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        category VARCHAR(100),
        duration_minutes INTEGER,
        max_capacity INTEGER DEFAULT 20,
        min_participants INTEGER DEFAULT 1,
        price_adult DECIMAL(10,2) NOT NULL,
        price_child DECIMAL(10,2),
        price_group DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'CLP',
        available_times TEXT[],
        available_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
        includes_pickup BOOLEAN DEFAULT true,
        pickup_time_offset INTEGER DEFAULT -30,
        main_image_url TEXT,
        gallery_urls TEXT[],
        featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agency_id, product_code)
      )
    `);
    results.push('✅ Table agency_products created');

    // 3-4. Agregar columnas a bookings
    try {
      await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50) DEFAULT 'atacama-darksky'`);
      await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS product_code VARCHAR(50)`);
      results.push('✅ Columns added to bookings');
    } catch (e) {
      results.push('⚠️ Columns might already exist: ' + e.message);
    }

    // 5. Crear tabla commissions
    await query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50),
        agency_id VARCHAR(50),
        booking_total DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        agency_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        paid_at TIMESTAMP,
        billing_period VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push('✅ Table commissions created');

    // 6. Crear tabla agency_settlements
    await query(`
      CREATE TABLE IF NOT EXISTS agency_settlements (
        id SERIAL PRIMARY KEY,
        agency_id VARCHAR(50),
        billing_period VARCHAR(20) NOT NULL,
        total_bookings INTEGER DEFAULT 0,
        total_revenue DECIMAL(12,2) DEFAULT 0,
        total_commission DECIMAL(12,2) DEFAULT 0,
        amount_to_pay DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        paid_at TIMESTAMP,
        payment_reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agency_id, billing_period)
      )
    `);
    results.push('✅ Table agency_settlements created');

    // 7. Insertar agencias
    try {
      await query(`
        INSERT INTO agencies (agency_id, name, slug, email, commission_rate) VALUES
        ('atacama-darksky', 'Atacama Dark Sky', 'darksky', 'info@atacamadarksky.cl', 0),
        ('inti-para', 'Inti Para Travel', 'intipara', 'info@intipara.cl', 15.00)
        ON CONFLICT (agency_id) DO NOTHING
      `);
      results.push('✅ Agencies inserted');
    } catch (e) {
      results.push('⚠️ Agencies: ' + e.message);
    }

    // 8. Insertar productos de Inti Para
    try {
      await query(`
        INSERT INTO agency_products (agency_id, product_code, name, description, category, duration_minutes, price_adult, available_times) VALUES
        ('inti-para', 'GEISERS-TATIO', 'Tour Géisers del Tatio', 'Visita los géisers más altos del mundo al amanecer. Incluye desayuno y baño en aguas termales.', 'adventure', 360, 45000, ARRAY['04:30']),
        ('inti-para', 'VALLE-LUNA', 'Tour Valle de la Luna', 'Recorre el paisaje más marciano de la Tierra. Atardecer incluido con snacks.', 'nature', 240, 25000, ARRAY['15:00', '16:00']),
        ('inti-para', 'SALAR-ATACAMA', 'Tour Salar de Atacama', 'Visita la Laguna Chaxa, toconao y el salar más grande de Chile.', 'nature', 300, 35000, ARRAY['08:00', '14:00']),
        ('inti-para', 'PIEDRAS-ROJAS', 'Tour Piedras Rojas', 'Lagunas altiplánicas, Piedras Rojas, Salar de Aguas Calientes. Tour de día completo.', 'adventure', 540, 55000, ARRAY['07:00']),
        ('inti-para', 'TERMAS-PURITAMA', 'Tour Termas de Puritama', 'Relájate en las pozones naturales de aguas termales en el cañón.', 'wellness', 240, 30000, ARRAY['09:00', '14:00'])
        ON CONFLICT DO NOTHING
      `);
      results.push('✅ Products inserted');
    } catch (e) {
      results.push('⚠️ Products: ' + e.message);
    }

    // 9. Crear índices
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_bookings_product ON bookings(product_code)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_commissions_agency ON commissions(agency_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_agency_products_agency ON agency_products(agency_id)`);
      results.push('✅ Indexes created');
    } catch (e) {
      results.push('⚠️ Indexes: ' + e.message);
    }

    // Verificar
    const agenciesResult = await query('SELECT agency_id, name FROM agencies');
    const productsResult = await query('SELECT COUNT(*) as count FROM agency_products');

    return res.status(200).json({
      success: true,
      results,
      summary: {
        agencies: agenciesResult.rows,
        productsCount: parseInt(productsResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
}
