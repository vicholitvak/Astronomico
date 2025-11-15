-- ============================================================================
-- SISTEMA DE REVIEWS PARA ATACAMA DARK SKY
-- ============================================================================
-- Sistema completo de reseñas de clientes para tours completados
-- ============================================================================

-- ============================================================================
-- 1. TABLA: REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) UNIQUE NOT NULL,
  booking_id VARCHAR(50) NOT NULL,

  -- Calificaciones (1-5 estrellas)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
  equipment_rating INTEGER CHECK (equipment_rating >= 1 AND equipment_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

  -- Contenido del review
  title VARCHAR(200),
  comment TEXT,

  -- Información del reviewer
  reviewer_name VARCHAR(100) NOT NULL,
  reviewer_email VARCHAR(100) NOT NULL,
  reviewer_country VARCHAR(100),

  -- Metadata
  language VARCHAR(5) DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt', 'fr', 'de')),
  tour_type VARCHAR(20) NOT NULL CHECK (tour_type IN ('regular', 'private', 'astrophoto')),
  tour_date DATE NOT NULL,

  -- Moderación
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  is_featured BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT,

  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT TRUE,

  -- Photos (URLs separadas por comas o JSON)
  photos TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,

  -- Foreign key a bookings
  CONSTRAINT fk_review_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
    ON DELETE CASCADE
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_tour_type ON reviews(tour_type);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(status, approved_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_reviews_language ON reviews(language);

-- Comentarios para documentación
COMMENT ON TABLE reviews IS 'Reseñas y calificaciones de clientes para tours completados';
COMMENT ON COLUMN reviews.verified_purchase IS 'Indica si el review es de una reserva verificada';
COMMENT ON COLUMN reviews.is_featured IS 'Reviews destacados para mostrar en homepage';
COMMENT ON COLUMN reviews.helpful_count IS 'Contador de "útil" para ordenar reviews';

-- ============================================================================
-- 2. TABLA: REVIEW_RESPONSES (Respuestas del dueño)
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_responses (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) NOT NULL,
  response_text TEXT NOT NULL,
  responder_name VARCHAR(100) DEFAULT 'Atacama DarkSky Team',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key
  CONSTRAINT fk_response_review
    FOREIGN KEY (review_id)
    REFERENCES reviews(review_id)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_responses_review ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_responses_created ON review_responses(created_at DESC);

COMMENT ON TABLE review_responses IS 'Respuestas del equipo a las reseñas de clientes';

-- ============================================================================
-- 3. TABLA: REVIEW_HELPFUL_VOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) NOT NULL,
  voter_ip VARCHAR(50) NOT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: una persona solo puede votar una vez por review
  UNIQUE(review_id, voter_ip),

  -- Foreign key
  CONSTRAINT fk_vote_review
    FOREIGN KEY (review_id)
    REFERENCES reviews(review_id)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_votes_review ON review_helpful_votes(review_id);

COMMENT ON TABLE review_helpful_votes IS 'Votos de "útil" para reviews (previene duplicados por IP)';

-- ============================================================================
-- 4. FUNCIONES ÚTILES
-- ============================================================================

-- Función para obtener estadísticas de reviews
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

-- Función para obtener reviews aprobados (para mostrar en el sitio)
CREATE OR REPLACE FUNCTION get_public_reviews(
  p_tour_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  review_id VARCHAR,
  overall_rating INTEGER,
  title VARCHAR,
  comment TEXT,
  reviewer_name VARCHAR,
  reviewer_country VARCHAR,
  language VARCHAR,
  tour_type VARCHAR,
  tour_date DATE,
  photos TEXT,
  helpful_count INTEGER,
  created_at TIMESTAMP,
  response_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.review_id,
    r.overall_rating,
    r.title,
    r.comment,
    r.reviewer_name,
    r.reviewer_country,
    r.language,
    r.tour_type,
    r.tour_date,
    r.photos,
    r.helpful_count,
    r.created_at,
    rr.response_text
  FROM reviews r
  LEFT JOIN review_responses rr ON r.review_id = rr.review_id
  WHERE r.status = 'approved'
    AND (p_tour_type IS NULL OR r.tour_type = p_tour_type)
  ORDER BY
    r.is_featured DESC,
    r.helpful_count DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar contador de "útil"
CREATE OR REPLACE FUNCTION mark_review_helpful(
  p_review_id VARCHAR,
  p_voter_ip VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := FALSE;
BEGIN
  -- Intentar insertar voto (fallará si ya votó)
  BEGIN
    INSERT INTO review_helpful_votes (review_id, voter_ip)
    VALUES (p_review_id, p_voter_ip);

    -- Si se insertó, incrementar contador
    UPDATE reviews
    SET helpful_count = helpful_count + 1
    WHERE review_id = p_review_id;

    v_success := TRUE;
  EXCEPTION WHEN unique_violation THEN
    -- Ya votó antes, no hacer nada
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

-- Función para enviar review request (después del tour)
CREATE OR REPLACE FUNCTION get_bookings_ready_for_review()
RETURNS TABLE (
  booking_id VARCHAR,
  tour_date DATE,
  customer_name VARCHAR,
  customer_email VARCHAR,
  tour_type VARCHAR,
  has_review BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.booking_id,
    b.date as tour_date,
    b.name as customer_name,
    b.email as customer_email,
    b.tour_type,
    EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.booking_id) as has_review
  FROM bookings b
  WHERE b.status = 'completed'
    AND b.date <= CURRENT_DATE - INTERVAL '1 day'
    AND b.date >= CURRENT_DATE - INTERVAL '30 days'
    AND NOT EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.booking_id)
  ORDER BY b.date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en review_responses
CREATE TRIGGER update_review_responses_updated_at
  BEFORE UPDATE ON review_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. VIEWS ÚTILES
-- ============================================================================

-- Vista de reviews con información completa
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
  r.reviewer_email,
  r.reviewer_country,
  r.language,
  r.tour_type,
  r.tour_date,
  r.status,
  r.is_featured,
  r.helpful_count,
  r.verified_purchase,
  r.photos,
  r.created_at,
  r.approved_at,
  b.name as booking_name,
  b.email as booking_email,
  b.persons as booking_persons,
  rr.response_text as owner_response,
  rr.created_at as response_date
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.booking_id
LEFT JOIN review_responses rr ON r.review_id = rr.review_id
ORDER BY r.created_at DESC;

-- Vista de resumen de ratings por tour
CREATE OR REPLACE VIEW tour_ratings_summary AS
SELECT
  tour_type,
  COUNT(*) as total_reviews,
  ROUND(AVG(overall_rating), 2) as avg_overall,
  ROUND(AVG(guide_rating), 2) as avg_guide,
  ROUND(AVG(equipment_rating), 2) as avg_equipment,
  ROUND(AVG(location_rating), 2) as avg_location,
  ROUND(AVG(value_rating), 2) as avg_value,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_reviews,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_reviews
FROM reviews
GROUP BY tour_type;

-- ============================================================================
-- 7. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- ============================================================================

/*
-- Review de ejemplo (requiere que exista un booking primero)
INSERT INTO reviews (
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
  status
)
VALUES (
  'REV-DEMO-001',
  'ATK-DEMO-001',
  5,
  5,
  5,
  5,
  5,
  'Experiencia inolvidable bajo las estrellas',
  'El tour fue increíble. El guía muy conocedor, el equipo de primera calidad. La ubicación perfecta para ver las estrellas. 100% recomendado!',
  'Juan Pérez',
  'juan@example.com',
  'Chile',
  'es',
  'regular',
  CURRENT_DATE - INTERVAL '5 days',
  'approved'
);

-- Respuesta de ejemplo
INSERT INTO review_responses (review_id, response_text)
VALUES (
  'REV-DEMO-001',
  '¡Muchas gracias Juan! Nos alegra mucho que hayas disfrutado la experiencia. Esperamos verte pronto nuevamente bajo nuestros cielos estrellados. ¡Saludos!'
);
*/

-- ============================================================================
-- 8. VERIFICACIÓN
-- ============================================================================

-- Verificar tablas creadas
SELECT 'Reviews system tables created successfully! ⭐' as message;

-- Mostrar estructura
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE columns.table_name = tables.table_name
     AND columns.table_schema = 'public') as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'review%'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
