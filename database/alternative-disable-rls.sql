-- ALTERNATIVA: DESHABILITAR RLS TEMPORALMENTE
-- Solo si la solución anterior no funciona
-- ADVERTENCIA: Esto deshabilitará toda la seguridad de la tabla

-- Opción 1: Deshabilitar RLS completamente (menos seguro pero funcionará)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Probar inserción
INSERT INTO bookings (
    booking_id,
    date,
    time,
    tour_type,
    persons,
    name,
    email,
    phone,
    status
) VALUES (
    'TEST-NORLS-' || substr(md5(random()::text), 1, 8),
    CURRENT_DATE + INTERVAL '7 days',
    '21:00',
    'regular',
    2,
    'Test No RLS',
    'test-norls@example.com',
    '+56912345678',
    'pending'
);

-- Verificar
SELECT * FROM bookings WHERE name = 'Test No RLS' ORDER BY created_at DESC LIMIT 1;

-- Limpiar
DELETE FROM bookings WHERE name = 'Test No RLS';

-- Para volver a habilitar RLS más tarde:
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;