-- ============================================================================
-- ATACAMA DARK SKY - CONFIGURACIÓN DE NEON PostgreSQL
-- ============================================================================
-- Este script crea todas las tablas necesarias para el sistema completo:
-- - Reservas de tours
-- - Conversaciones de WhatsApp
-- - Logs de monitoreo
-- - Métricas y analíticas
-- ============================================================================

-- Eliminar tablas existentes si es necesario (¡CUIDADO EN PRODUCCIÓN!)
-- Descomenta estas líneas solo si quieres empezar de cero:
-- DROP TABLE IF EXISTS booking_audit_log CASCADE;
-- DROP TABLE IF EXISTS whatsapp_conversations CASCADE;
-- DROP TABLE IF EXISTS monitoring_logs CASCADE;
-- DROP TABLE IF EXISTS analytics_metrics CASCADE;
-- DROP TABLE IF EXISTS bookings CASCADE;

-- ============================================================================
-- 1. TABLA PRINCIPAL: BOOKINGS
-- ============================================================================

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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  source VARCHAR(50) DEFAULT 'web',
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_reminders ON bookings(date, status, reminder_sent)
  WHERE status = 'confirmed' AND reminder_sent = false;

-- Comentarios para documentación
COMMENT ON TABLE bookings IS 'Tabla principal de reservas de tours astronómicos';
COMMENT ON COLUMN bookings.tour_type IS 'Tipo de tour: regular, private, astrophoto';
COMMENT ON COLUMN bookings.status IS 'Estado: pending, confirmed, cancelled, completed';
COMMENT ON COLUMN bookings.source IS 'Origen de la reserva: web, whatsapp_bot, phone, etc.';

-- ============================================================================
-- 2. TABLA: WHATSAPP_CONVERSATIONS
-- ============================================================================

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

  -- Foreign key a bookings
  CONSTRAINT fk_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
    ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_created ON whatsapp_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_booking ON whatsapp_conversations(booking_id)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_language ON whatsapp_conversations(language);

COMMENT ON TABLE whatsapp_conversations IS 'Historial de conversaciones del bot de WhatsApp';

-- ============================================================================
-- 3. TABLA: MONITORING_LOGS
-- ============================================================================

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_monitoring_created ON monitoring_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_unresolved ON monitoring_logs(resolved)
  WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_monitoring_severity ON monitoring_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_type ON monitoring_logs(alert_type);

COMMENT ON TABLE monitoring_logs IS 'Logs de monitoreo y alertas del sistema';

-- ============================================================================
-- 4. TABLA: ANALYTICS_METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON analytics_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_recorded ON analytics_metrics(recorded_at DESC);

COMMENT ON TABLE analytics_metrics IS 'Métricas y estadísticas del sistema';

-- ============================================================================
-- 5. TABLA: BOOKING_AUDIT_LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_audit_log (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_booking ON booking_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed ON booking_audit_log(changed_at DESC);

COMMENT ON TABLE booking_audit_log IS 'Auditoría de cambios en reservas';

-- ============================================================================
-- 6. FUNCIONES ÚTILES
-- ============================================================================

-- Función para obtener estadísticas de WhatsApp
CREATE OR REPLACE FUNCTION get_whatsapp_stats(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_conversations BIGINT,
  unique_customers BIGINT,
  bookings_created BIGINT,
  avg_response_time NUMERIC,
  language_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_conversations,
    COUNT(DISTINCT customer_phone)::BIGINT as unique_customers,
    COUNT(booking_id)::BIGINT as bookings_created,
    0::NUMERIC as avg_response_time,
    jsonb_build_object(
      'es', COUNT(*) FILTER (WHERE language = 'es'),
      'en', COUNT(*) FILTER (WHERE language = 'en'),
      'pt', COUNT(*) FILTER (WHERE language = 'pt')
    ) as language_breakdown
  FROM whatsapp_conversations
  WHERE created_at >= CURRENT_TIMESTAMP - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener alertas activas
CREATE OR REPLACE FUNCTION get_active_alerts()
RETURNS TABLE (
  alert_type VARCHAR,
  severity VARCHAR,
  message TEXT,
  created_at TIMESTAMP,
  age_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.alert_type,
    m.severity,
    m.message,
    m.created_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - m.created_at)) / 3600 as age_hours
  FROM monitoring_logs m
  WHERE m.resolved = false
  ORDER BY
    CASE m.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar alertas como resueltas
CREATE OR REPLACE FUNCTION resolve_alert(alert_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE monitoring_logs
  SET resolved = true, resolved_at = CURRENT_TIMESTAMP
  WHERE id = alert_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamp de updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auditoría de cambios en bookings
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

CREATE TRIGGER booking_changes_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_changes();

-- ============================================================================
-- 8. VIEWS ÚTILES PARA REPORTES
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
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE source = 'whatsapp_bot') as from_whatsapp,
  COUNT(*) FILTER (WHERE source = 'web') as from_web
FROM bookings
GROUP BY date, tour_type
ORDER BY date DESC;

-- Vista de conversaciones recientes con contexto
CREATE OR REPLACE VIEW recent_conversations AS
SELECT
  wc.id,
  wc.customer_phone,
  wc.customer_name,
  wc.message_in,
  wc.message_out,
  wc.language,
  wc.intent,
  wc.sentiment,
  wc.created_at,
  b.booking_id,
  b.date as booking_date,
  b.time as booking_time,
  b.status as booking_status
FROM whatsapp_conversations wc
LEFT JOIN bookings b ON wc.booking_id = b.booking_id
ORDER BY wc.created_at DESC
LIMIT 100;

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
  status,
  reminder_sent,
  (date - CURRENT_DATE) as days_until
FROM bookings
WHERE date >= CURRENT_DATE
  AND status IN ('confirmed', 'pending')
ORDER BY date, time;

-- ============================================================================
-- 9. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- ============================================================================

-- Descomenta para insertar datos de prueba:

/*
-- Reserva de ejemplo
INSERT INTO bookings (booking_id, date, persons, tour_type, time, name, email, phone, status, source)
VALUES
  ('ATK-DEMO-001', CURRENT_DATE + INTERVAL '2 days', 2, 'regular', '21:30', 'Juan Pérez', 'juan@example.com', '+56912345678', 'confirmed', 'web'),
  ('ATK-DEMO-002', CURRENT_DATE + INTERVAL '3 days', 4, 'private', '20:00', 'María González', 'maria@example.com', '+56987654321', 'confirmed', 'whatsapp_bot');

-- Conversación de ejemplo
INSERT INTO whatsapp_conversations (customer_phone, customer_name, message_in, message_out, language, intent)
VALUES
  ('+56912345678', 'Juan Pérez', 'Hola, quiero información sobre tours', '¡Hola Juan! Te cuento sobre nuestros tours...', 'es', 'greeting');

-- Métrica de ejemplo
INSERT INTO analytics_metrics (metric_type, metric_value, metadata)
VALUES
  ('website_uptime', 99.9, '{"check_time": "2025-11-11T00:00:00Z"}'::jsonb);
*/

-- ============================================================================
-- 10. VERIFICACIÓN
-- ============================================================================

-- Para verificar que todo se creó correctamente:
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE columns.table_name = tables.table_name
     AND columns.table_schema = 'public') as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar funciones creadas:
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Verificar views creadas:
SELECT
  table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Notas:
-- - Este script es idempotente (puedes ejecutarlo múltiples veces)
-- - Usa CREATE ... IF NOT EXISTS para evitar errores
-- - Los datos existentes NO se eliminan
-- - Para empezar de cero, descomenta los DROP TABLE del inicio

-- ✅ Script completado exitosamente
SELECT 'Neon database setup completed successfully! 🚀' as message;
