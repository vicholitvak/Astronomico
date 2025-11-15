-- ============================================================================
-- MIGRACIÓN INCREMENTAL (SOLO LO NUEVO)
-- ============================================================================
-- Este script SOLO agrega lo que falta, sin tocar lo existente
-- Seguro para ejecutar sobre base de datos existente
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR CAMPO ACCOMMODATION SI NO EXISTE
-- ============================================================================

-- Verificar si accommodation existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'accommodation'
  ) THEN
    ALTER TABLE bookings ADD COLUMN accommodation VARCHAR(200);
    COMMENT ON COLUMN bookings.accommodation IS 'Hostal, hotel o dirección de alojamiento del cliente';
    RAISE NOTICE '✓ Campo accommodation agregado a bookings';
  ELSE
    RAISE NOTICE '⊙ Campo accommodation ya existe en bookings';
  END IF;
END $$;

-- ============================================================================
-- 2. CREAR TABLAS DE REVIEWS (SI NO EXISTEN)
-- ============================================================================

-- Tabla: REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) UNIQUE NOT NULL,
  booking_id VARCHAR(50) NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
  equipment_rating INTEGER CHECK (equipment_rating >= 1 AND equipment_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  reviewer_name VARCHAR(100) NOT NULL,
  reviewer_email VARCHAR(100) NOT NULL,
  reviewer_country VARCHAR(100),
  language VARCHAR(5) DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt', 'fr', 'de')),
  tour_type VARCHAR(20) NOT NULL CHECK (tour_type IN ('regular', 'private', 'astrophoto')),
  tour_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  is_featured BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT,
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT TRUE,
  photos TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  CONSTRAINT fk_review_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
    ON DELETE CASCADE
);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_tour_type ON reviews(tour_type);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(status, approved_at DESC) WHERE status = 'approved';

-- Tabla: REVIEW_RESPONSES
CREATE TABLE IF NOT EXISTS review_responses (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) NOT NULL,
  response_text TEXT NOT NULL,
  responder_name VARCHAR(100) DEFAULT 'Atacama DarkSky Team',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_response_review
    FOREIGN KEY (review_id)
    REFERENCES reviews(review_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_responses_review ON review_responses(review_id);

-- Tabla: REVIEW_HELPFUL_VOTES
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) NOT NULL,
  voter_ip VARCHAR(50) NOT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, voter_ip),
  CONSTRAINT fk_vote_review
    FOREIGN KEY (review_id)
    REFERENCES reviews(review_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_votes_review ON review_helpful_votes(review_id);

-- ============================================================================
-- 3. CREAR FUNCIONES (SI NO EXISTEN)
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para estadísticas de reviews
CREATE OR REPLACE FUNCTION get_review_stats(p_tour_type VARCHAR DEFAULT NULL)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  rating_distribution JSONB,
  total_approved BIGINT,
  total_pending BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_reviews,
    ROUND(AVG(overall_rating), 2) as average_rating,
    jsonb_build_object(
      '5_stars', COUNT(*) FILTER (WHERE overall_rating = 5),
      '4_stars', COUNT(*) FILTER (WHERE overall_rating = 4),
      '3_stars', COUNT(*) FILTER (WHERE overall_rating = 3),
      '2_stars', COUNT(*) FILTER (WHERE overall_rating = 2),
      '1_star', COUNT(*) FILTER (WHERE overall_rating = 1)
    ) as rating_distribution,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as total_approved,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as total_pending
  FROM reviews
  WHERE (p_tour_type IS NULL OR tour_type = p_tour_type);
END;
$$ LANGUAGE plpgsql;

-- Función para marcar review como útil
CREATE OR REPLACE FUNCTION mark_review_helpful(
  p_review_id VARCHAR,
  p_voter_ip VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO review_helpful_votes (review_id, voter_ip)
    VALUES (p_review_id, p_voter_ip);

    UPDATE reviews
    SET helpful_count = helpful_count + 1
    WHERE review_id = p_review_id;

    v_success := TRUE;
  EXCEPTION WHEN unique_violation THEN
    v_success := FALSE;
  END;

  RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- Función para aprobar review
CREATE OR REPLACE FUNCTION approve_review(p_review_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE reviews
  SET
    status = 'approved',
    approved_at = CURRENT_TIMESTAMP
  WHERE review_id = p_review_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREAR TRIGGERS (SI NO EXISTEN)
-- ============================================================================

-- Trigger para reviews updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. CREAR/ACTUALIZAR VIEWS
-- ============================================================================

-- Vista de reviews detalladas
CREATE OR REPLACE VIEW reviews_detailed AS
SELECT
  r.review_id,
  r.booking_id,
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
  r.status,
  r.is_featured,
  r.helpful_count,
  r.created_at,
  r.approved_at,
  b.name as booking_name,
  b.email as booking_email,
  rr.response_text as owner_response,
  rr.created_at as response_date
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.booking_id
LEFT JOIN review_responses rr ON r.review_id = rr.review_id
ORDER BY r.created_at DESC;

-- ============================================================================
-- 6. VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar tablas creadas
SELECT '✓ Verificación de tablas:' as mensaje;

SELECT
  CASE
    WHEN table_name = 'bookings' THEN '✓ bookings (existente)'
    WHEN table_name = 'reviews' THEN '✓ reviews (nueva)'
    WHEN table_name = 'review_responses' THEN '✓ review_responses (nueva)'
    WHEN table_name = 'review_helpful_votes' THEN '✓ review_helpful_votes (nueva)'
    ELSE '✓ ' || table_name
  END as tabla,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE columns.table_name = tables.table_name) as columnas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar que accommodation existe
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✓ Campo accommodation existe en bookings'
    ELSE '✗ Campo accommodation NO existe'
  END as resultado
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'accommodation';

-- Mensaje final
SELECT '
============================================================================
✅ MIGRACIÓN INCREMENTAL COMPLETADA
============================================================================

Lo que se agregó:
  ✓ Campo accommodation en tabla bookings
  ✓ Tabla reviews (sistema completo)
  ✓ Tabla review_responses
  ✓ Tabla review_helpful_votes
  ✓ Funciones: get_review_stats, mark_review_helpful, approve_review
  ✓ Triggers para updated_at
  ✓ View: reviews_detailed

Tus datos existentes están intactos. ✓

Próximo paso: Configurar DATABASE_URL en Vercel
============================================================================
' as "RESULTADO";
