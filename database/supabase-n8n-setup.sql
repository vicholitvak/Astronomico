-- ============================================================================
-- ATACAMA DARK SKY - CONFIGURACIÓN DE SUPABASE PARA N8N
-- ============================================================================
-- Este script crea las tablas y configuraciones necesarias para la
-- integración con n8n y el sistema de WhatsApp Bot
-- ============================================================================

-- 1. AGREGAR COLUMNAS A LA TABLA BOOKINGS EXISTENTE
-- ============================================================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'web';

-- Crear índice para búsquedas de recordatorios
CREATE INDEX IF NOT EXISTS idx_bookings_reminders
ON bookings(date, status, reminder_sent)
WHERE status = 'confirmed' AND reminder_sent = false;

-- ============================================================================
-- 2. TABLA PARA CONVERSACIONES DE WHATSAPP
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100),
  message_in TEXT NOT NULL,
  message_out TEXT,
  language VARCHAR(5) DEFAULT 'es',
  intent VARCHAR(50),
  sentiment VARCHAR(20),
  booking_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Relación con bookings si se creó una reserva
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone
ON whatsapp_conversations(customer_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_created
ON whatsapp_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_booking
ON whatsapp_conversations(booking_id)
WHERE booking_id IS NOT NULL;

-- ============================================================================
-- 3. TABLA PARA LOGS DE MONITOREO
-- ============================================================================

CREATE TABLE IF NOT EXISTS monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_monitoring_created
ON monitoring_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_unresolved
ON monitoring_logs(resolved)
WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_monitoring_severity
ON monitoring_logs(severity, created_at DESC);

-- ============================================================================
-- 4. TABLA PARA MÉTRICAS Y ESTADÍSTICAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Índice para consultas de métricas por tipo y fecha
CREATE INDEX IF NOT EXISTS idx_analytics_type_date
ON analytics_metrics(metric_type, recorded_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Policy para whatsapp_conversations
-- Solo el service role puede acceder (usado por n8n)
CREATE POLICY "Service role full access to whatsapp_conversations"
ON whatsapp_conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy para monitoring_logs
CREATE POLICY "Service role full access to monitoring_logs"
ON monitoring_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy para analytics_metrics
CREATE POLICY "Service role full access to analytics_metrics"
ON analytics_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. FUNCIONES ÚTILES
-- ============================================================================

-- Función para obtener estadísticas de conversaciones
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
    0::NUMERIC as avg_response_time, -- Calcular si se almacenan timestamps
    jsonb_build_object(
      'es', COUNT(*) FILTER (WHERE language = 'es'),
      'en', COUNT(*) FILTER (WHERE language = 'en'),
      'pt', COUNT(*) FILTER (WHERE language = 'pt')
    ) as language_breakdown
  FROM whatsapp_conversations
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL;
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
    EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 3600 as age_hours
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
CREATE OR REPLACE FUNCTION resolve_alert(alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE monitoring_logs
  SET resolved = true, resolved_at = NOW()
  WHERE id = alert_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VIEWS ÚTILES PARA REPORTES
-- ============================================================================

-- Vista de resumen de reservas por día
CREATE OR REPLACE VIEW daily_booking_summary AS
SELECT
  date,
  tour_type,
  COUNT(*) as total_bookings,
  SUM(persons) as total_persons,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE source = 'whatsapp_bot') as from_whatsapp
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
  wc.created_at,
  b.booking_id,
  b.date as booking_date,
  b.status as booking_status
FROM whatsapp_conversations wc
LEFT JOIN bookings b ON wc.booking_id = b.booking_id
ORDER BY wc.created_at DESC
LIMIT 100;

-- ============================================================================
-- 8. TRIGGERS PARA AUDITORÍA
-- ============================================================================

-- Trigger para registrar cambios en bookings
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);

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
-- 9. DATOS DE EJEMPLO (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ============================================================================

-- INSERT INTO analytics_metrics (metric_type, metric_value, metadata)
-- VALUES
--   ('website_uptime', 99.9, '{"check_time": "2025-11-11T00:00:00Z"}'),
--   ('backend_health', 1, '{"status": "healthy"}'),
--   ('ssl_grade', 100, '{"grade": "A+"}');

-- ============================================================================
-- 10. GRANTS Y PERMISOS
-- ============================================================================

-- Asegurar que el service_role tenga acceso completo
GRANT ALL ON whatsapp_conversations TO service_role;
GRANT ALL ON monitoring_logs TO service_role;
GRANT ALL ON analytics_metrics TO service_role;
GRANT ALL ON booking_audit_log TO service_role;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Para verificar la instalación, ejecutar:
-- SELECT * FROM get_whatsapp_stats(30);
-- SELECT * FROM get_active_alerts();
-- SELECT * FROM daily_booking_summary LIMIT 10;
