-- ============================================================
-- MULTI-AGENCY BOOKING PLATFORM SCHEMA
-- Permite gestionar múltiples agencias desde una plataforma
-- ============================================================

-- 1. TABLA DE AGENCIAS
CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    agency_id VARCHAR(50) UNIQUE NOT NULL,  -- ej: 'atacama-darksky', 'inti-para'
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,       -- para URLs: intipara.atacamadarksky.cl

    -- Contacto
    email VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100) DEFAULT 'San Pedro de Atacama',

    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#60a5fa',
    secondary_color VARCHAR(20) DEFAULT '#1e293b',

    -- Configuración de negocio
    commission_rate DECIMAL(5,2) DEFAULT 15.00,  -- % que te llevas tú
    payment_method VARCHAR(50) DEFAULT 'mercadopago',  -- mercadopago, stripe, etc
    currency VARCHAR(10) DEFAULT 'CLP',

    -- Integraciones
    google_calendar_id VARCHAR(200),           -- Calendario de la agencia
    mercadopago_access_token TEXT,             -- Token de la agencia (o tuyo)

    -- Estado
    status VARCHAR(20) DEFAULT 'active',       -- active, suspended, pending
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE PRODUCTOS POR AGENCIA
CREATE TABLE IF NOT EXISTS agency_products (
    id SERIAL PRIMARY KEY,
    agency_id VARCHAR(50) REFERENCES agencies(agency_id),
    product_code VARCHAR(50) NOT NULL,         -- ej: 'TOUR-GEISER', 'TOUR-VALLE-LUNA'

    -- Info del producto
    name VARCHAR(300) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),

    -- Tipo y categoría
    category VARCHAR(100),                      -- 'day-tour', 'adventure', 'cultural'
    duration_minutes INTEGER,
    max_capacity INTEGER DEFAULT 20,
    min_participants INTEGER DEFAULT 1,

    -- Precios
    price_adult DECIMAL(10,2) NOT NULL,
    price_child DECIMAL(10,2),
    price_group DECIMAL(10,2),                  -- precio por grupo (si aplica)
    currency VARCHAR(10) DEFAULT 'CLP',

    -- Horarios disponibles
    available_times TEXT[],                     -- ['06:00', '14:00', '16:00']
    available_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',  -- 0=domingo

    -- Pickup
    includes_pickup BOOLEAN DEFAULT true,
    pickup_time_offset INTEGER DEFAULT -30,     -- minutos antes del tour

    -- Imágenes
    main_image_url TEXT,
    gallery_urls TEXT[],

    -- SEO/Display
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    -- Estado
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(agency_id, product_code)
);

-- 3. AGREGAR COLUMNA agency_id A BOOKINGS EXISTENTE
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS agency_id VARCHAR(50) DEFAULT 'atacama-darksky';

-- 4. AGREGAR COLUMNA product_code A BOOKINGS
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS product_code VARCHAR(50);

-- 5. TABLA DE COMISIONES (para tracking)
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(50) REFERENCES bookings(booking_id),
    agency_id VARCHAR(50) REFERENCES agencies(agency_id),

    -- Montos
    booking_total DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    agency_amount DECIMAL(10,2) NOT NULL,       -- lo que recibe la agencia

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',       -- pending, paid, cancelled
    paid_at TIMESTAMP,

    -- Período de facturación
    billing_period VARCHAR(20),                 -- '2025-01' formato año-mes

    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. TABLA DE PAGOS/LIQUIDACIONES
CREATE TABLE IF NOT EXISTS agency_settlements (
    id SERIAL PRIMARY KEY,
    agency_id VARCHAR(50) REFERENCES agencies(agency_id),
    billing_period VARCHAR(20) NOT NULL,        -- '2025-01'

    -- Totales
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_commission DECIMAL(12,2) DEFAULT 0,
    amount_to_pay DECIMAL(12,2) DEFAULT 0,      -- a la agencia

    -- Estado
    status VARCHAR(20) DEFAULT 'pending',       -- pending, paid, disputed
    paid_at TIMESTAMP,
    payment_reference VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(agency_id, billing_period)
);

-- 7. INSERTAR AGENCIAS INICIALES
INSERT INTO agencies (agency_id, name, slug, email, commission_rate) VALUES
('atacama-darksky', 'Atacama Dark Sky', 'darksky', 'info@atacamadarksky.cl', 0),
('inti-para', 'Inti Para Travel', 'intipara', 'info@intipara.cl', 15.00)
ON CONFLICT (agency_id) DO NOTHING;

-- 8. INSERTAR PRODUCTOS DE EJEMPLO PARA INTI PARA
INSERT INTO agency_products (agency_id, product_code, name, description, category, duration_minutes, price_adult, available_times) VALUES
('inti-para', 'GEISERS-TATIO', 'Tour Géisers del Tatio', 'Visita los géisers más altos del mundo al amanecer. Incluye desayuno y baño en aguas termales.', 'adventure', 360, 45000, ARRAY['04:30']),
('inti-para', 'VALLE-LUNA', 'Tour Valle de la Luna', 'Recorre el paisaje más marciano de la Tierra. Atardecer incluido con snacks.', 'nature', 240, 25000, ARRAY['15:00', '16:00']),
('inti-para', 'SALAR-ATACAMA', 'Tour Salar de Atacama', 'Visita la Laguna Chaxa, toconao y el salar más grande de Chile.', 'nature', 300, 35000, ARRAY['08:00', '14:00']),
('inti-para', 'PIEDRAS-ROJAS', 'Tour Piedras Rojas', 'Lagunas altiplánicas, Piedras Rojas, Salar de Aguas Calientes. Tour de día completo.', 'adventure', 540, 55000, ARRAY['07:00']),
('inti-para', 'TERMAS-PURITAMA', 'Tour Termas de Puritama', 'Relájate en las pozones naturales de aguas termales en el cañón.', 'wellness', 240, 30000, ARRAY['09:00', '14:00'])
ON CONFLICT DO NOTHING;

-- 9. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_product ON bookings(product_code);
CREATE INDEX IF NOT EXISTS idx_commissions_agency ON commissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(billing_period);
CREATE INDEX IF NOT EXISTS idx_agency_products_agency ON agency_products(agency_id);

-- 10. VISTA PARA DASHBOARD DE COMISIONES
CREATE OR REPLACE VIEW v_agency_commission_summary AS
SELECT
    a.agency_id,
    a.name as agency_name,
    a.commission_rate,
    DATE_TRUNC('month', b.date) as month,
    COUNT(*) as total_bookings,
    SUM(b.persons) as total_persons,
    SUM(b.payment_amount) as total_revenue,
    SUM(b.payment_amount * a.commission_rate / 100) as commission_earned,
    SUM(b.payment_amount * (1 - a.commission_rate / 100)) as agency_earnings
FROM bookings b
JOIN agencies a ON b.agency_id = a.agency_id
WHERE b.status = 'confirmed'
AND b.payment_status = 'paid'
GROUP BY a.agency_id, a.name, a.commission_rate, DATE_TRUNC('month', b.date)
ORDER BY month DESC, agency_name;
