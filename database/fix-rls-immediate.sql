-- SOLUCIÓN INMEDIATA PARA ERROR RLS
-- Ejecuta este script en Supabase SQL Editor ahora mismo

-- Paso 1: Ver políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'bookings';

-- Paso 2: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Enable insert for anon" ON bookings;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON bookings;
DROP POLICY IF EXISTS "Allow public inserts" ON bookings;
DROP POLICY IF EXISTS "Allow public reads" ON bookings;
DROP POLICY IF EXISTS "Allow all for authenticated" ON bookings;

-- Paso 3: Crear nueva política permisiva para inserciones anónimas
CREATE POLICY "Anyone can insert bookings" ON bookings
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Paso 4: Crear política para lecturas (opcional pero útil)
CREATE POLICY "Anyone can read bookings" ON bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Paso 5: Verificar que RLS esté habilitado
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Paso 6: Probar con una inserción de prueba
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
    'TEST-' || substr(md5(random()::text), 1, 8),
    CURRENT_DATE + INTERVAL '7 days',
    '21:00',
    'regular',
    2,
    'Test User',
    'test@example.com',
    '+56912345678',
    'pending'
);

-- Paso 7: Verificar que se insertó
SELECT * FROM bookings WHERE name = 'Test User' ORDER BY created_at DESC LIMIT 1;

-- Paso 8: Limpiar registro de prueba (opcional)
DELETE FROM bookings WHERE name = 'Test User' AND email = 'test@example.com';

-- RESULTADO: Si todo funciona, tu formulario debería funcionar ahora