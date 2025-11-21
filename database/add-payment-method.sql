-- ============================================================================
-- ADD PAYMENT_METHOD FIELD TO BOOKINGS TABLE
-- ============================================================================
-- Agrega campo para rastrear el método de pago de cada reserva
-- Valores: pending, cash, transfer, mercadopago
-- ============================================================================

-- Agregar columna payment_method a la tabla bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'pending' CHECK (payment_method IN ('pending', 'cash', 'transfer', 'mercadopago'));

-- Actualizar reservas existentes con source='mercadopago' para que tengan payment_method='mercadopago'
UPDATE bookings
SET payment_method = 'mercadopago'
WHERE source = 'mercadopago' AND payment_method = 'pending';

-- Agregar comentario para documentación
COMMENT ON COLUMN bookings.payment_method IS 'Método de pago: pending (pendiente), cash (efectivo), transfer (transferencia), mercadopago (pago online)';

-- Crear índice para búsquedas por método de pago
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);

-- Verificar que se agregó correctamente
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'payment_method';
