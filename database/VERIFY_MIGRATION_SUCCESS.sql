-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================
-- Ejecuta esto para confirmar que todo se creó correctamente
-- ============================================================================

-- 1. Ver TODAS las tablas (deberías tener 8 ahora)
SELECT
  '📋 TABLAS:' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  table_name as nombre,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE columns.table_name = tables.table_name
     AND columns.table_schema = 'public') as columnas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar campo accommodation en bookings
SELECT
  '' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  '📍 CAMPO ACCOMMODATION:' as seccion,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'accommodation'
    ) THEN '✅ Campo accommodation EXISTE en bookings'
    ELSE '❌ Campo accommodation NO existe'
  END as nombre,
  NULL::integer as columnas;

-- 3. Ver todas las funciones
SELECT
  '' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  '⚙️ FUNCIONES:' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  '  ✓ ' || routine_name as nombre,
  NULL::integer as columnas
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. Ver views creadas
SELECT
  '' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  '👁️ VIEWS:' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  '  ✓ ' || table_name as nombre,
  NULL::integer as columnas
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. Contar registros
SELECT
  '' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  '📊 REGISTROS:' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  'bookings' as nombre,
  COUNT(*)::integer as columnas
FROM bookings
UNION ALL
SELECT NULL, 'reviews', COUNT(*)::integer FROM reviews
UNION ALL
SELECT NULL, 'review_responses', COUNT(*)::integer FROM review_responses
UNION ALL
SELECT NULL, 'review_helpful_votes', COUNT(*)::integer FROM review_helpful_votes;

-- 6. Mensaje final
SELECT
  '' as seccion,
  NULL as nombre,
  NULL::integer as columnas;

SELECT
  '✅ RESUMEN:' as seccion,
  CASE
    WHEN
      (SELECT COUNT(*) FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'reviews') > 0
      AND
      (SELECT COUNT(*) FROM information_schema.columns
       WHERE table_name = 'bookings' AND column_name = 'accommodation') > 0
      AND
      (SELECT COUNT(*) FROM information_schema.routines
       WHERE routine_name = 'get_review_stats') > 0
    THEN '🎉 Migración completada exitosamente!'
    ELSE '⚠️ Falta algo - revisar arriba'
  END as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  'Tablas esperadas: 8 (bookings, reviews, review_responses, review_helpful_votes, whatsapp_conversations, monitoring_logs, analytics_metrics, booking_audit_log)' as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  'Funciones esperadas: approve_review, get_review_stats, mark_review_helpful, update_updated_at_column, log_booking_changes' as nombre,
  NULL::integer as columnas;

SELECT
  NULL as seccion,
  'Views esperadas: reviews_detailed, daily_booking_summary, upcoming_bookings' as nombre,
  NULL::integer as columnas;
