# Solución para el Error de Base de Datos

## El Problema
El formulario de reservas está fallando con el error:
```
new row violates row-level security policy for table "bookings"
```

## Solución Rápida (Opción 1 - Recomendada)

### Paso 1: Obtener la Service Key de Supabase
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a Settings → API
3. Copia la clave "service_role" (NO la anon key)
4. Agrégala a tu archivo `.env.local`:
```
SUPABASE_SERVICE_KEY=tu_clave_service_role_aqui
```

### Paso 2: Desplegar en Vercel
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a Settings → Environment Variables
3. Agrega:
   - `SUPABASE_SERVICE_KEY` = tu clave service_role

### Paso 3: Redeploy
```bash
vercel --prod
```

## Solución Alternativa (Opción 2 - Temporal)

Si no puedes obtener la service key ahora, puedes deshabilitar RLS temporalmente:

### En Supabase SQL Editor, ejecuta:
```sql
-- ADVERTENCIA: Esto deshabilitará la seguridad. Solo para pruebas!
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
```

### Para volver a habilitar RLS después:
```sql
-- Habilitar RLS nuevamente
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Crear políticas correctas
DROP POLICY IF EXISTS "Allow public inserts" ON bookings;
CREATE POLICY "Allow public inserts" ON bookings
    FOR INSERT 
    WITH CHECK (true);
```

## Verificación
Para verificar que funciona:
1. Abre la página en el navegador
2. Llena el formulario de reservas
3. Revisa la consola del navegador (F12)
4. Debería mostrar "Booking successful" sin errores

## Notas de Seguridad
- La `service_role` key NUNCA debe exponerse en el frontend
- Solo úsala en funciones serverless (backend)
- La `anon` key es para el frontend
- Siempre mantén RLS habilitado en producción con políticas adecuadas