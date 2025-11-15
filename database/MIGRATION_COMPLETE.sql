-- ============================================================================
-- MIGRACIÓN COMPLETA - ATACAMA DARK SKY
-- ============================================================================
-- Este script ejecuta TODAS las migraciones necesarias en orden
-- Ejecutar en Neon PostgreSQL Database
-- ============================================================================

\echo '🚀 Iniciando migración completa de Atacama DarkSky...'
\echo ''

-- ============================================================================
-- PASO 1: Crear tablas base (si no existen)
-- ============================================================================

\echo '📋 Paso 1/3: Creando tablas base del sistema...'

-- Ejecutar script principal de Neon
\i neon-setup.sql

\echo '✅ Tablas base creadas'
\echo ''

-- ============================================================================
-- PASO 2: Agregar campo de accommodation
-- ============================================================================

\echo '📋 Paso 2/3: Agregando campo de alojamiento a bookings...'

\i add-accommodation-field.sql

\echo '✅ Campo accommodation agregado'
\echo ''

-- ============================================================================
-- PASO 3: Crear sistema de reviews
-- ============================================================================

\echo '📋 Paso 3/3: Creando sistema de reviews...'

\i reviews-system.sql

\echo '✅ Sistema de reviews creado'
\echo ''

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

\echo '🔍 Verificación final de la migración...'
\echo ''

-- Verificar todas las tablas
SELECT
    '✓ ' || table_name as tabla_creada,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE columns.table_name = tables.table_name
       AND columns.table_schema = 'public') as num_columnas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''

-- Verificar funciones
SELECT
    '✓ Function: ' || routine_name as funcion_creada
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

\echo ''

-- Verificar views
SELECT
    '✓ View: ' || table_name as view_creada
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo '============================================================================'
\echo '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE'
\echo '============================================================================'
\echo ''
\echo '📊 Resumen:'
\echo '  - Tablas de bookings y sistema n8n: ✓'
\echo '  - Campo accommodation agregado: ✓'
\echo '  - Sistema de reviews completo: ✓'
\echo '  - Funciones helper: ✓'
\echo '  - Views para reportes: ✓'
\echo ''
\echo '🎯 Próximos pasos:'
\echo '  1. Verificar que DATABASE_URL esté configurada en Vercel'
\echo '  2. Deploy del sitio con nuevas funcionalidades'
\echo '  3. Probar sistema de reviews en staging'
\echo '  4. Solicitar primeras reviews de clientes'
\echo ''
\echo '🔗 Recursos:'
\echo '  - Documentación: README.md'
\echo '  - Guía LLM: LLM_OPTIMIZATION_GUIDE.md'
\echo '  - Resumen implementación: IMPLEMENTATION_SUMMARY.md'
\echo ''
\echo '============================================================================'
