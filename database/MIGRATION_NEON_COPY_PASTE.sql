-- ============================================================================
-- MIGRACIÓN COMPLETA ATACAMA DARKSKY - NEON POSTGRESQL
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ir a: https://console.neon.tech
-- 2. Seleccionar tu proyecto "Atacama DarkSky" (o el que tengas)
-- 3. Click en "SQL Editor" en el menú izquierdo
-- 4. Copiar y pegar TODO este archivo
-- 5. Click en "Run" o presionar Ctrl+Enter
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABLAS BASE DEL SISTEMA
-- ============================================================================

-- Eliminar tablas existentes si es necesario (comentado por seguridad)
-- Descomenta solo si quieres empezar de cero:
-- DROP TABLE IF EXISTS booking_audit_log CASCADE;
-- DROP TABLE IF EXISTS review_helpful_votes CASCADE;
-- DROP TABLE IF EXISTS review_responses CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS whatsapp_conversations CASCADE;
-- DROP TABLE IF EXISTS monitoring_logs CASCADE;
-- DROP TABLE IF EXISTS analytics_metrics CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;

-- 1. TABLA PRINCIPAL: BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  persons INTEGER NOT NULL CHECK (persons > 0),
  tour_type VARCHAR(20) NOT NULL CHECK (tour_type IN ('regular', 'private', 'astrophoto')),
  time VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT,
  accommodation VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  source VARCHAR(50) DEFAULT 'web',
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para bookings
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_reminders ON bookings(date, status, reminder_sent)
  WHERE status = 'confirmed' AND reminder_sent = false;

COMMENT ON TABLE bookings IS 'Tabla principal de reservas de tours astronómicos';
COMMENT ON COLUMN bookings.accommodation IS 'Hostal, hotel o dirección de alojamiento del cliente';

-- 2. TABLA: WHATSAPP_CONVERSATIONS
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id SERIAL PRIMARY KEY,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100),
  message_in TEXT NOT NULL,
  message_out TEXT,
  language VARCHAR(5) DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
  intent VARCHAR(50),
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  booking_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_created ON whatsapp_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_booking ON whatsapp_conversations(booking_id)
  WHERE booking_id IS NOT NULL;

-- 3. TABLA: MONITORING_LOGS
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monitoring_created ON monitoring_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_unresolved ON monitoring_logs(resolved)
  WHERE resolved = false;

-- 4. TABLA: ANALYTICS_METRICS
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON analytics_metrics(metric_type, recorded_at DESC);

-- 5. TABLA: BOOKING_AUDIT_LOG
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_booking ON booking_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed ON booking_audit_log(changed_at DESC);

-- ============================================================================
-- PARTE 2: SISTEMA DE REVIEWS
-- ============================================================================

-- 1. TABLA: REVIEWS
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

CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_tour_type ON reviews(tour_type);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(status, approved_at DESC) WHERE status = 'approved';

-- 2. TABLA: REVIEW_RESPONSES
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

-- 3. TABLA: REVIEW_HELPFUL_VOTES
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
-- PARTE 3: FUNCIONES ÚTILES
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Función para marcar review como "útil"
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
-- PARTE 4: TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en reviews
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auditoría de bookings
CREATE OR REPLACE FUNCTION log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO booking_audit_log (booking_id, action, old_data, new_data)
    VALUES (
      NEW.booking_id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO booking_audit_log (booking_id, action, new_data)
    VALUES (
      NEW.booking_id,
      'INSERT',
      to_jsonb(NEW)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_changes_trigger ON bookings;
CREATE TRIGGER booking_changes_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_changes();

-- ============================================================================
-- PARTE 5: VIEWS ÚTILES
-- ============================================================================

-- Vista de resumen diario de reservas
CREATE OR REPLACE VIEW daily_booking_summary AS
SELECT
  date,
  tour_type,
  COUNT(*) as total_bookings,
  SUM(persons) as total_persons,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM bookings
GROUP BY date, tour_type
ORDER BY date DESC;

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

-- Vista de reservas próximas
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT
  booking_id,
  date,
  time,
  persons,
  tour_type,
  name,
  phone,
  email,
  accommodation,
  status,
  reminder_sent,
  (date - CURRENT_DATE) as days_until
FROM bookings
WHERE date >= CURRENT_DATE
  AND status IN ('confirmed', 'pending')
ORDER BY date, time;

-- ============================================================================
-- PARTE 6: DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Insertar 2 bookings de ejemplo (los que ya hiciste)
-- Comenta esto si no quieres datos de ejemplo
INSERT INTO bookings (booking_id, date, persons, tour_type, time, name, email, phone, status, source)
VALUES
  ('ATK-2025-001', CURRENT_DATE + INTERVAL '2 days', 2, 'regular', '21:00', 'Cliente Ejemplo 1', 'cliente1@example.com', '+56912345678', 'confirmed', 'chatgpt'),
  ('ATK-2025-002', CURRENT_DATE + INTERVAL '3 days', 3, 'regular', '21:00', 'Cliente Ejemplo 2', 'cliente2@example.com', '+56987654321', 'confirmed', 'web')
ON CONFLICT (booking_id) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Mostrar todas las tablas creadas
SELECT
  '✓ Tabla: ' || table_name as resultado,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE columns.table_name = tables.table_name
     AND columns.table_schema = 'public') as columnas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Mostrar funciones creadas
SELECT
  '✓ Función: ' || routine_name as resultado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Mostrar views creadas
SELECT
  '✓ View: ' || table_name as resultado
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Contar registros en bookings
SELECT
  '✓ Total bookings: ' || COUNT(*) as resultado
FROM bookings;

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================

SELECT '
============================================================================
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
============================================================================

📊 Resumen de lo creado:
  ✓ Tabla bookings (con campo accommodation)
  ✓ Tabla reviews
  ✓ Tabla review_responses
  ✓ Tabla review_helpful_votes
  ✓ Tabla whatsapp_conversations
  ✓ Tabla monitoring_logs
  ✓ Tabla analytics_metrics
  ✓ Tabla booking_audit_log
  ✓ Funciones: get_review_stats, mark_review_helpful, approve_review
  ✓ Triggers: audit, updated_at
  ✓ Views: daily_booking_summary, reviews_detailed, upcoming_bookings

🎯 Próximos pasos:
  1. Verificar que DATABASE_URL está en Vercel
  2. Deploy del sitio a producción
  3. Testear API de reviews
  4. Solicitar primeras reviews de clientes

¡Base de datos lista para producción! 🚀
============================================================================
' as "MIGRACIÓN COMPLETADA";
