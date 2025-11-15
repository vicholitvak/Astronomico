-- ============================================================================
-- SCRIPT DE VERIFICACIÓN - ¿QUÉ TENGO EN MI BASE DE DATOS?
-- ============================================================================
-- Ejecuta SOLO este script primero para ver qué ya tienes
-- ============================================================================

-- Ver todas las tablas que ya existen
SELECT
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE columns.table_name = tables.table_name) as num_columnas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Ver cuántos registros hay en cada tabla
SELECT 'bookings' as tabla, COUNT(*) as registros FROM bookings
UNION ALL
SELECT 'whatsapp_conversations', COUNT(*) FROM whatsapp_conversations
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'review_responses', COUNT(*) FROM review_responses
ORDER BY tabla;

-- Ver si la columna 'accommodation' ya existe en bookings
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'accommodation';

-- Ver todas las funciones existentes
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
