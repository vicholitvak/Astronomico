# Configuración Viator Supplier API

## Estado Actual
- ❌ `VIATOR_WEBHOOK_API_KEY` no configurada
- ❌ Producto `5624520P1` no está conectado al Supplier API
- ✅ Código del API listo en `/api/viator.js`

## Paso 1: Obtener credenciales de Viator

### 1.1 Acceder al Portal de Proveedores de Viator
1. Ve a: https://supplier.viator.com/
2. Inicia sesión con tu cuenta de proveedor

### 1.2 Obtener API Key
1. En el menú, busca **Settings** → **API Settings** o **Integrations**
2. Busca la sección "Supplier API" o "Booking API"
3. Genera o copia tu **API Key** (esto es el `VIATOR_WEBHOOK_API_KEY`)

> **Nota**: Si no ves esta opción, contacta a tu Viator Account Manager para habilitar la integración API.

## Paso 2: Configurar Variables de Entorno

Agrega estas variables a tu `.env.production` en Vercel:

```env
# Viator Supplier API
VIATOR_WEBHOOK_API_KEY=tu_api_key_de_viator_aqui
VIATOR_SUPPLIER_ID=ATACAMA_DARKSKY
```

### En Vercel:
1. Ve a tu proyecto en https://vercel.com/
2. Settings → Environment Variables
3. Agrega:
   - `VIATOR_WEBHOOK_API_KEY` = (el API key que obtuviste)
   - `VIATOR_SUPPLIER_ID` = `ATACAMA_DARKSKY`

## Paso 3: Configurar Endpoints en Viator

En el portal de Viator, configura tu API endpoint:

### URL Base
```
https://atacamadarksky.cl/api/viator
```

### Endpoints que Viator llamará:

| Endpoint | URL Completa | Descripción |
|----------|--------------|-------------|
| Availability | `POST https://atacamadarksky.cl/api/viator/availability` | Verifica disponibilidad en tiempo real |
| Booking | `POST https://atacamadarksky.cl/api/viator/booking` | Crea una reserva |
| Cancel | `POST https://atacamadarksky.cl/api/viator/cancel` | Cancela una reserva |
| Tour List | `POST https://atacamadarksky.cl/api/viator/tour-list` | Lista de productos disponibles |

## Paso 4: Mapear Productos

### Producto Actual en Viator
- **Código**: `5624520P1`
- **Nombre**: "Atacama: Semi-Private Stargazing Tour to Secret Spot"

### Productos en tu API
Tu API tiene estos productos configurados:

| Tu Código | Nombre | Capacidad | Precio |
|-----------|--------|-----------|--------|
| `ADS-PRIVATE` | Atacama: Private Stargazing Expedition | 4 personas | $133 USD/persona |
| `ADS-REGULAR` | San Pedro: Stargazing Tour with Telescope | 16 personas | $50 USD/persona |

### Opciones para mapear:

#### Opción A: Actualizar el producto existente en Viator
En el portal de Viator, edita el producto `5624520P1`:
1. Ve a **Products** → busca tu tour
2. En la configuración del producto, busca **API Settings** o **Supplier Code**
3. Configura:
   - **Supplier Product Code**: `ADS-PRIVATE`
   - **Supplier Option Code**: `DEFAULT`

#### Opción B: Agregar el código de Viator a tu API
Actualiza el archivo `api/viator.js` para reconocer el código de Viator:

```javascript
const PRODUCTS = {
  // Mapeo del código de Viator al privado
  '5624520P1': {
    supplierProductCode: '5624520P1',
    supplierOptionCode: 'TG1~21:00',
    name: 'Atacama: Semi-Private Stargazing Tour to Secret Spot',
    maxCapacity: 4,
    tourType: 'private',
    currency: 'USD',
    pricePerPerson: 117.00,
    netPricePerPerson: 82.00,
    cutoffHours: 4,
    duration: 180,
    availableTimes: ['21:00'],
    ageRange: { min: 0, max: 99 },
    city: 'San Pedro de Atacama',
    country: 'CL'
  },
  // ... mantener los otros productos
};
```

## Paso 5: Probar la Integración

### Test de disponibilidad
```bash
curl -X POST https://atacamadarksky.cl/api/viator/availability \
  -H "Content-Type: application/json" \
  -d '{
    "ApiKey": "TU_API_KEY",
    "SupplierProductCode": "ADS-PRIVATE",
    "StartDate": "2026-03-15",
    "TravellerMix": { "Adult": 2 }
  }'
```

### Respuesta esperada
```json
{
  "Success": true,
  "Available": true,
  "AvailableSpots": 4,
  "AvailableTimes": ["20:00", "20:30", "21:00"],
  "Currency": "USD",
  "RetailPrice": 133.00
}
```

## Paso 6: Contactar a Viator

Si no encuentras las opciones de API en el portal, envía este email a tu Account Manager:

---

**Asunto**: Activación de Supplier API Integration - Atacama Dark Sky

Hola,

Solicito la activación de la integración Supplier API para mi cuenta de proveedor.

**Datos del proveedor:**
- Nombre: Atacama Dark Sky
- Producto: 5624520P1 (Atacama: Semi-Private Stargazing Tour)

**Configuración técnica:**
- API Endpoint: `https://atacamadarksky.cl/api/viator`
- Supplier ID: `ATACAMA_DARKSKY`

**Endpoints implementados:**
- POST /api/viator/availability (disponibilidad en tiempo real)
- POST /api/viator/booking (crear reservas)
- POST /api/viator/cancel (cancelar reservas)
- POST /api/viator/tour-list (lista de productos)

Por favor, proporcionarme:
1. El API Key para autenticación de webhooks
2. Instrucciones para mapear mi producto existente (5624520P1) a mi Supplier API

Gracias.

---

## Verificación Final

Una vez configurado, las reservas de Viator deberían:
1. ✅ Llegar automáticamente a tu base de datos
2. ✅ Sincronizarse con Google Calendar
3. ✅ Actualizar disponibilidad en GYG
4. ✅ Enviar notificaciones por email

## Troubleshooting

### "Invalid API Key"
- Verifica que `VIATOR_WEBHOOK_API_KEY` esté configurada en Vercel
- Redeploy después de agregar variables de entorno

### "Product not found"
- El código de producto en Viator no coincide con tu API
- Usa la Opción B para agregar el mapeo

### Las reservas no llegan
- Verifica que el producto en Viator esté configurado para usar tu API
- Revisa los logs en Vercel: `vercel logs --follow`
