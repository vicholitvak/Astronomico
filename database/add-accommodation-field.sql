-- ============================================================================
-- ADD ACCOMMODATION FIELD TO BOOKINGS TABLE
-- ============================================================================
-- Agrega campo para guardar información del hostal/alojamiento del cliente
-- ============================================================================

-- Agregar columna accommodation a la tabla bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS accommodation VARCHAR(200);

-- Agregar comentario para documentación
COMMENT ON COLUMN bookings.accommodation IS 'Hostal, hotel o dirección de alojamiento del cliente en San Pedro de Atacama';

-- Crear índice si planeas buscar por accommodation frecuentemente (opcional)
-- CREATE INDEX IF NOT EXISTS idx_bookings_accommodation ON bookings(accommodation)
--   WHERE accommodation IS NOT NULL;

-- Verificar que se agregó correctamente
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'accommodation';

-- Mensaje de confirmación
SELECT 'Accommodation field added successfully to bookings table! 🏨' as message;
