-- Migración: Agregar columnas para recordatorio de pago y cancelación automática
-- Ejecutar en Neon Dashboard

-- Columna para tracking de recordatorio de pago
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN DEFAULT false;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ;

-- Columna para razón de cancelación
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(50);

-- Agregar 'expired' como status válido si no existe
-- (depende de cómo esté definido el constraint)

-- Índice para optimizar queries del cron job
CREATE INDEX IF NOT EXISTS idx_bookings_pending_payment
ON bookings (status, payment_method, created_at)
WHERE status = 'pending' AND payment_method = 'pending';

-- Comentarios
COMMENT ON COLUMN bookings.payment_reminder_sent IS 'Si se envió recordatorio de pago (12h)';
COMMENT ON COLUMN bookings.payment_reminder_sent_at IS 'Cuándo se envió el recordatorio';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Razón de cancelación: auto_expired, customer_request, weather, etc';
