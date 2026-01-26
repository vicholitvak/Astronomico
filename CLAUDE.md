# Atacama Dark Sky - Documentación del Sistema

## Descripción General
Sitio web para tours astronómicos en San Pedro de Atacama. Integrado con GetYourGuide (GYG), Viator, MercadoPago, Google Calendar y WhatsApp.

## Base de Datos

**PostgreSQL en Neon** (connection string en `.env.production`):
```
postgresql://neondb_owner:***@ep-calm-meadow-adiepjlh-pooler.c-2.us-east-1.aws.neon.tech/neondb
```

### Tabla Principal: `bookings`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | ID interno |
| `booking_id` | VARCHAR(50) | ID único (GYG-xxx, ATK-xxx, VTR-xxx) |
| `gyg_reference` | VARCHAR(100) | Referencia de GYG (ej: GYG48YZYYRHZ) |
| `viator_reference` | VARCHAR(100) | Referencia de Viator |
| `date` | DATE | Fecha del tour |
| `time` | VARCHAR(20) | Hora (21:00, 20:30, etc) |
| `tour_type` | VARCHAR(50) | regular, private, astrophoto |
| `persons` | INTEGER | Cantidad de personas |
| `name` | VARCHAR(255) | Nombre del cliente |
| `email` | VARCHAR(255) | Email |
| `phone` | VARCHAR(50) | Teléfono |
| `accommodation` | VARCHAR(200) | Hotel del cliente |
| `status` | VARCHAR(50) | pending, confirmed, cancelled, expired |
| `payment_status` | VARCHAR(50) | pending, paid, refunded |
| `payment_method` | VARCHAR(50) | getyourguide, mercadopago, viator, etc |
| `payment_amount` | DECIMAL | Monto en CLP |
| `source` | VARCHAR(50) | gyg, web, viator |

## APIs Principales

### 1. GetYourGuide API (`/api/gyg.js`)

**Productos configurados:**
- `1152147`: Tour Regular (grupal, max 16 personas, €50/persona)
- `1163787`: Tour Privado (max 4 personas, €133.26/persona)

**Endpoints GYG:**
- `GET /api/gyg/1/get-availabilities/` - Consulta disponibilidad
- `POST /api/gyg/1/reserve/` - Crea reserva pendiente
- `POST /api/gyg/1/book/` - Confirma y procesa pago
- `POST /api/gyg/1/cancel-booking/` - Cancela reserva

**Flujo de reserva GYG:**
1. GYG consulta disponibilidad → crea `bookings` con `status='pending'`
2. Cliente paga en GYG
3. GYG llama `/book/` → actualiza a `status='confirmed'`, `payment_status='paid'`
4. Sistema sincroniza a Google Calendar y envía notificaciones

### 2. Viator API (`/api/viator.js`)

Viator tiene **DOS APIs** diferentes implementadas en este archivo:

#### 2.1 Viator Supplier API (recibir reservas)

Cuando Viator vende nuestros tours, ellos llaman a nuestra API.

**⚠️ IMPORTANTE - Configuración pendiente:**
El producto actual en Viator (`5624520P1`) NO está conectado al Supplier API.
Ver `docs/VIATOR_SUPPLIER_SETUP.md` para instrucciones de configuración.

**Productos configurados:**
- `ADS-REGULAR`: Tour Regular (grupal, max 16, $50 USD/persona)
- `ADS-PRIVATE`: Tour Privado (max 4, $133 USD/persona)
- `5624520P1`: Mapeado a privado (producto actual en portal Viator, $117 USD/persona)

**Variables de entorno requeridas:**
```
VIATOR_WEBHOOK_API_KEY=xxx    # API key para autenticación (PENDIENTE)
VIATOR_SUPPLIER_ID=ATACAMA_DARKSKY
```

**Endpoints Supplier (POST):**
- `POST /api/viator/tour-list` - Lista de productos
- `POST /api/viator/availability` - Disponibilidad real-time
- `POST /api/viator/batch-availability` - Disponibilidad por rango de fechas
- `POST /api/viator/booking` - Crear reserva
- `POST /api/viator/cancel` - Cancelar reserva
- `POST /api/viator/amend` - Modificar reserva

**Autenticación Supplier:**
```javascript
// Viator envía ApiKey en el body del request
const auth = data.ApiKey === process.env.VIATOR_WEBHOOK_API_KEY;
```

**Flujo de reserva Viator Supplier (cuando esté configurado):**
1. Viator llama `/availability` → verifica disponibilidad
2. Viator llama `/booking` → crea `bookings` con `status='confirmed'`, `source='viator'`
3. Sistema sincroniza a Google Calendar y notifica a GYG

**Agregar reserva manual de Viator:**
```bash
node scripts/add-viator-booking-manual.js
# Editar el archivo primero con los datos de la reserva
```

#### 2.2 Viator Affiliate API (vender tours de otros)

Para mostrar y vender tours de otros proveedores en atacamadarksky.cl.
**Estado actual: Full + Booking Access aprobado (Enero 2026)**

**Variables de entorno:**
```
VIATOR_AFFILIATE_API_KEY=cd109c4f-1b0d-4810-976d-eef12ee178d0
VIATOR_AFFILIATE_ENV=sandbox  # o 'production'
VIATOR_AFFILIATE_CAMPAIGN_ID=xxx  # para tracking de comisiones
```

**Base URLs:**
- Sandbox: `https://api.sandbox.viator.com/partner`
- Production: `https://api.viator.com/partner`

**Endpoints Affiliate (GET con `?affiliate=true`):**

| Acción | Endpoint | Descripción |
|--------|----------|-------------|
| `search` | `?action=search&limit=20` | Buscar tours en San Pedro (dest 5499) |
| `product` | `?action=product&code=XXX` | Detalle de producto |
| `schedules` | `?action=schedules&code=XXX` | Horarios disponibles (cacheable 1h) |
| `availability` | `?action=availability&code=XXX&date=YYYY-MM-DD` | Disponibilidad real-time |
| `booking-questions` | `?action=booking-questions&code=XXX` | Preguntas requeridas para reserva |
| `cart-hold` | `?action=cart-hold` (POST body) | Reservar items en carrito |
| `cart-book` | `?action=cart-book` (POST body) | Completar reserva |
| `checkout-session` | `?action=checkout-session` (POST body) | Crear sesión para iframe de pago |
| `booking-status` | `?action=booking-status&ref=XXX` | Estado de reserva |
| `cancel-quote` | `?action=cancel-quote&ref=XXX` | Cotización de reembolso |

**Flujo de booking Affiliate (iframe payment):**
```
1. /availability/check → verificar disponibilidad
2. /bookings/cart/hold → reservar temporalmente (15 min)
3. Crear checkout session → obtener iframe URL
4. Cliente paga en iframe de Viator
5. /bookings/cart/book → confirmar booking
```

**Headers requeridos para Affiliate API:**
```javascript
{
  'Accept': 'application/json;version=2.0',
  'Accept-Language': 'es,en',
  'exp-api-key': VIATOR_AFFILIATE_API_KEY
}
```

**Destino San Pedro de Atacama:** ID `5499`

**Documentación oficial:**
- Technical: https://docs.viator.com/partner-api/technical/
- Certification: https://partnerresources.viator.com/travel-commerce/certification/

### 3. Admin API (`/api/admin-data.js`)

**Acciones útiles:**
- `?action=sync-booking&bookingId=XXX` - Sincroniza booking a Google Calendar
- `?action=sync-all&fromDate=YYYY-MM-DD` - Sincroniza todos los bookings desde fecha

### 3. Google Calendar (`/api/google-calendar.js`)

**Calendar ID:** `9a3ed2b295897e3fe68d2b719d3a1049a24c83dde50983b0625aed37407158b3@group.calendar.google.com`

**Función principal:** `addToGoogleCalendar(booking)` - Crea/actualiza evento en calendario

**Nota sobre credenciales:** El `GOOGLE_SERVICE_ACCOUNT_KEY` en `.env.local` tiene `\n` que dotenv convierte a newlines reales. Para parsear el JSON:
```javascript
const cleanedKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\n/g, '\\n');
const credentials = JSON.parse(cleanedKey);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
```

### 4. Cron Jobs (`/api/cron-bookings.js`)

Ejecuta diariamente:
- Verifica bookings GYG pendientes >2h → marca como `expired`
- Envía recordatorios de pago
- Sincroniza disponibilidad con GYG

## Operaciones Comunes

### Consultar un booking
```javascript
import pg from 'pg';
const pool = new pg.Pool({ connectionString: DATABASE_URL });
const result = await pool.query(
  "SELECT * FROM bookings WHERE booking_id = $1",
  ['GYG-XXXXXXXX-XXXX']
);
```

### Actualizar fecha de un booking
```javascript
await pool.query(
  `UPDATE bookings SET date = $1, updated_at = NOW() WHERE booking_id = $2`,
  ['2026-01-18', 'GYG-XXXXXXXX-XXXX']
);
```

### Buscar por referencia GYG
```javascript
await pool.query(
  "SELECT * FROM bookings WHERE gyg_reference = $1",
  ['GYG48YZYYRHZ']
);
```

## Variables de Entorno Importantes

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL (en `.env.production`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON de service account para Calendar |
| `GOOGLE_CALENDAR_ID` | ID del calendario (usar el hardcodeado en código) |
| `GYG_WEBHOOK_USERNAME/PASSWORD` | Credenciales para API de GYG |
| `VIATOR_WEBHOOK_API_KEY` | API key para Viator Supplier webhooks |
| `VIATOR_AFFILIATE_API_KEY` | API key para Viator Affiliate (Full+Booking) |
| `VIATOR_AFFILIATE_ENV` | `sandbox` o `production` |
| `VIATOR_AFFILIATE_CAMPAIGN_ID` | ID de campaña para tracking comisiones |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de MercadoPago |
| `WHATSAPP_TOKEN` | Token para WhatsApp Business API |
| `RESEND_API_KEY` | API key para envío de emails |

## Estructura del Proyecto

```
/api/
  gyg.js           - Integración GetYourGuide
  viator.js        - Integración Viator
  booking-api.js   - API general de bookings
  admin-data.js    - API para admin dashboard
  google-calendar.js - Sincronización calendario
  cron-bookings.js - Tareas programadas
  mercadopago-webhook.js - Webhooks de pago
```

## Tips

1. **Buscar booking por ID parcial:** El `booking_id` tiene formato `GYG-{timestamp}-{random}`. La `gyg_reference` es el ID que GYG usa internamente.

2. **Cambios de fecha:** Después de cambiar la fecha en DB, siempre sincronizar con Google Calendar.

3. **Estado de tours:**
   - `pending` = Reserva creada, esperando pago
   - `confirmed` = Pagado y confirmado
   - `cancelled` = Cancelado
   - `expired` = Pendiente que nunca se confirmó (>2h)

4. **Capacidades:**
   - Tour Regular: 16 personas máximo
   - Tour Privado: 4 personas máximo

5. **IDs de booking por fuente:**
   - GYG: `GYG-{timestamp}-{random}` (ej: GYG-MKHFDUS2-S6IO)
   - Viator: `VTR-{timestamp}-{random}` (ej: VTR-MKHFDUS2-S6IO)
   - Web directa: `ATK-{timestamp}-{random}`

6. **Viator Affiliate - Flujo completo:**
   ```
   search → product → availability → cart/hold → checkout-session → cart/book
   ```

7. **Viator vs GYG - Diferencias clave:**
   - GYG usa EUR, Viator usa USD
   - GYG tiene flujo reserve→book (2 pasos), Viator es directo
   - Viator Affiliate requiere iframe para pagos (PCI compliance)
