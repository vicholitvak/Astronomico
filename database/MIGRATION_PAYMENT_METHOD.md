# Migración: Agregar campo payment_method

## Descripción
Esta migración agrega el campo `payment_method` a la tabla `bookings` para rastrear el método de pago de cada reserva.

## Valores permitidos
- `pending`: Pago pendiente (por defecto)
- `cash`: Pago en efectivo
- `transfer`: Transferencia bancaria
- `mercadopago`: Pago en línea vía MercadoPago

## Cómo ejecutar la migración

### Opción 1: Desde Neon Console (Recomendado)
1. Ve a https://console.neon.tech/
2. Selecciona tu proyecto "Atacama Dark Sky"
3. Ve a la sección "SQL Editor"
4. Copia y pega el contenido del archivo `add-payment-method.sql`
5. Ejecuta el script

### Opción 2: Desde terminal local
```bash
# Necesitas tener psql instalado
psql $DATABASE_URL -f database/add-payment-method.sql
```

### Opción 3: Usando el MCP de Neon
Ya que tienes el MCP de Neon configurado, puedes ejecutar:
```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'pending'
CHECK (payment_method IN ('pending', 'cash', 'transfer', 'mercadopago'));

UPDATE bookings
SET payment_method = 'mercadopago'
WHERE source = 'mercadopago' AND payment_method = 'pending';
```

## Verificación
Después de ejecutar la migración, verifica que el campo se agregó correctamente:

```sql
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'payment_method';
```

Deberías ver algo como:
```
column_name      | payment_method
data_type        | character varying
character_max... | 20
is_nullable      | YES
column_default   | 'pending'::character varying
```

## ¿Qué pasa si no ejecuto la migración?
- Las nuevas reservas manuales **fallarán** al crearse
- La interfaz mostrará errores al cargar reservas existentes
- El sistema intentará guardar `payment_method` pero la columna no existirá

## Rollback (si necesitas revertir)
```sql
ALTER TABLE bookings DROP COLUMN IF EXISTS payment_method;
DROP INDEX IF EXISTS idx_bookings_payment_method;
```

**⚠️ IMPORTANTE**: Esto eliminará todos los datos de método de pago guardados.

## Migración automática de datos existentes
El script automáticamente:
1. Agrega la columna con valor por defecto 'pending'
2. Actualiza todas las reservas con `source = 'mercadopago'` para que tengan `payment_method = 'mercadopago'`
3. Crea un índice para búsquedas rápidas por método de pago

## Uso en el sistema
Una vez ejecutada la migración:
- ✅ Podrás agregar reservas manualmente sin email
- ✅ Podrás seleccionar método de pago al crear reservas
- ✅ Verás el método de pago en las tarjetas de reservas
- ✅ Las reservas con `payment_method = 'mercadopago'` estarán bloqueadas (no se pueden modificar)
