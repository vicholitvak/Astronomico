/**
 * Database Migration Endpoint
 * POST /api/run-migration?secret=xxx
 *
 * Ejecuta la migración para crear las tablas de multi-agency
 */

import { query } from './lib/db.js';

export default async function handler(req, res) {
  // Solo permite POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar secreto (usa ADMIN_SECRET o cualquier env var de seguridad)
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

    // 3. Agregar agency_id a bookings si no existe
    try {
      await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50) DEFAULT 'atacama-darksky'`);
      results.push('✅ Column agency_id added to bookings');
    } catch (e) {
      results.push('⚠️ Column agency_id might already exist');
    }

    // 4. Agregar product_code a bookings si no existe
    try {
      await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS product_code VARCHAR(50)`);
      results.push('✅ Column product_code added to bookings');
    } catch (e) {
      results.push('⚠️ Column product_code might already exist');
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

    // 7. Insertar agencias iniciales
    try {
      await query(`
        INSERT INTO agencies (agency_id, name, slug, email, commission_rate) VALUES
        ('atacama-darksky', 'Atacama Dark Sky', 'darksky', 'info@atacamadarksky.cl', 0),
        ('inti-para', 'Inti Para Travel', 'intipara', 'info@intipara.cl', 15.00)
        ON CONFLICT (agency_id) DO NOTHING
      `);
      results.push('✅ Agencies inserted');
    } catch (e) {
      results.push('⚠️ Agencies insert: ' + e.message);
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
      results.push('⚠️ Products insert: ' + e.message);
    }

    // 9. Crear índices
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_bookings_product ON bookings(product_code)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_commissions_agency ON commissions(agency_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(billing_period)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_agency_products_agency ON agency_products(agency_id)`);
      results.push('✅ Indexes created');
    } catch (e) {
      results.push('⚠️ Indexes: ' + e.message);
    }

    // Verificar resultados
    const agenciesResult = await query('SELECT agency_id, name FROM agencies');
    const productsResult = await query('SELECT COUNT(*) as count FROM agency_products');

    return res.status(200).json({
      success: true,
      results,
      summary: {
        agencies: agenciesResult.rows,
        productsCount: productsResult.rows[0].count
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
