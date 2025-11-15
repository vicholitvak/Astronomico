# 💳 Guía de Configuración de Stripe - Pagos Internacionales

## 📋 Resumen

Esta guía te ayudará a configurar Stripe para aceptar pagos internacionales en tu sitio web de Atacama NightSky.

---

## 🚀 Paso 1: Crear Cuenta en Stripe

### 1.1 Registro

1. Ve a: **https://stripe.com/cl**
2. Click en **"Empezar ahora"** o **"Start now"**
3. Completa el formulario:
   - Email
   - Nombre completo
   - País: **Chile**
   - Contraseña
4. Verifica tu email

### 1.2 Completar Información del Negocio

Stripe te pedirá información adicional:

- **Nombre del negocio:** Atacama NightSky Tours
- **Tipo de negocio:** Turismo / Tours & Activities
- **RUT:** Tu RUT chileno
- **Dirección:** San Pedro de Atacama
- **Sitio web:** https://www.atacamadarksky.cl
- **Descripción:** Tours astronómicos guiados en el Desierto de Atacama

### 1.3 Verificación de Identidad

Stripe requiere:
- Cédula de identidad o pasaporte
- Comprobante de dirección (factura de servicios)
- Información bancaria para recibir pagos

**Tiempo de aprobación:** 1-3 días hábiles

---

## 🔑 Paso 2: Obtener API Keys

### 2.1 Modo de Prueba (Test Mode)

Para desarrollo y pruebas:

1. Ve al Dashboard de Stripe: https://dashboard.stripe.com
2. En la esquina superior derecha, asegúrate de estar en **"Test mode"** (toggle activado)
3. Ve a: **Developers** → **API keys**

Verás dos keys:

```
Publishable key (test): pk_test_51...
Secret key (test): sk_test_51...
```

**⚠️ IMPORTANTE:**
- La **Publishable key** va en el frontend (HTML/JavaScript)
- La **Secret key** va en el backend (Vercel env variables) - NUNCA la expongas públicamente

### 2.2 Modo Producción (Live Mode)

Cuando estés listo para recibir pagos reales:

1. Cambia el toggle a **"Live mode"**
2. Obtén las keys de producción:

```
Publishable key (live): pk_live_51...
Secret key (live): sk_live_51...
```

---

## 🔧 Paso 3: Configurar Variables de Entorno en Vercel

### 3.1 Agregar STRIPE_SECRET_KEY

```bash
# Para modo de prueba
echo "sk_test_51..." | vercel env add STRIPE_SECRET_KEY production
echo "sk_test_51..." | vercel env add STRIPE_SECRET_KEY preview
echo "sk_test_51..." | vercel env add STRIPE_SECRET_KEY development
```

### 3.2 Agregar STRIPE_PUBLISHABLE_KEY

```bash
# Para modo de prueba
echo "pk_test_51..." | vercel env add STRIPE_PUBLISHABLE_KEY production
echo "pk_test_51..." | vercel env add STRIPE_PUBLISHABLE_KEY preview
echo "pk_test_51..." | vercel env add STRIPE_PUBLISHABLE_KEY development
```

### 3.3 Verificar Variables

```bash
vercel env ls
```

Deberías ver:
```
✓ STRIPE_SECRET_KEY (production, preview, development)
✓ STRIPE_PUBLISHABLE_KEY (production, preview, development)
```

---

## ✅ Paso 4: Verificar Integración

### 4.1 Test Cards (Tarjetas de Prueba)

En modo test, usa estas tarjetas para simular pagos:

| Tarjeta | Número | CVC | Fecha | Resultado |
|---------|--------|-----|-------|-----------|
| Visa | 4242 4242 4242 4242 | Cualquiera | Futura | ✅ Pago exitoso |
| Mastercard | 5555 5555 5555 4444 | Cualquiera | Futura | ✅ Pago exitoso |
| Amex | 3782 822463 10005 | Cualquiera | Futura | ✅ Pago exitoso |
| Declined | 4000 0000 0000 0002 | Cualquiera | Futura | ❌ Rechazado |
| Insufficient Funds | 4000 0000 0000 9995 | Cualquiera | Futura | ❌ Fondos insuficientes |

### 4.2 Probar Checkout

1. Ve a: https://www.atacamadarksky.cl
2. Selecciona un tour
3. Click en **"Pagar con Stripe"**
4. Completa con tarjeta de prueba
5. Verifica que llegue a la página de confirmación

### 4.3 Ver Pagos en Dashboard

1. Ve a: https://dashboard.stripe.com/test/payments
2. Deberías ver el pago de prueba
3. Click para ver detalles (monto, email, metadata)

---

## 💰 Paso 5: Comisiones y Costos

### Comisiones de Stripe en Chile

| Tipo de Pago | Comisión |
|--------------|----------|
| Tarjetas chilenas | 2.9% + $250 CLP |
| Tarjetas internacionales | 3.9% + $250 CLP |
| Conversión de moneda | +1% adicional |

### Ejemplo de Cálculo

**Tour Regular:** $30.000 CLP
- Comisión Stripe (chilena): $30.000 × 2.9% + $250 = **$1.120 CLP**
- **Recibes:** $28.880 CLP

**Tour Astrofotografía (internacional):** $120.000 CLP
- Comisión Stripe (internacional): $120.000 × 3.9% + $250 = **$4.930 CLP**
- **Recibes:** $115.070 CLP

---

## 🌍 Paso 6: Configurar Monedas y Países

### 6.1 Monedas Aceptadas

El sitio actualmente acepta **CLP (Peso Chileno)**.

Para agregar USD u otras monedas:

1. Modifica `api/create-checkout.js`
2. Agrega lógica de conversión o productos duplicados

**Ejemplo:**

```javascript
// Detectar país del usuario
const userCountry = req.headers['x-vercel-ip-country'] || 'CL';

const currency = userCountry === 'CL' ? 'clp' : 'usd';
const price = currency === 'clp' ? 30000 : 32; // $30k CLP ≈ $32 USD
```

### 6.2 Países Permitidos

Actualmente configurado para aceptar clientes de:

- 🇨🇱 Chile
- 🇦🇷 Argentina
- 🇧🇷 Brasil
- 🇺🇸 Estados Unidos
- 🇨🇦 Canadá
- 🇲🇽 México
- 🇵🇪 Perú
- 🇧🇴 Bolivia
- 🇪🇨 Ecuador
- 🇨🇴 Colombia
- 🇺🇾 Uruguay
- 🇵🇾 Paraguay
- 🇻🇪 Venezuela
- 🇬🇧 Reino Unido
- 🇫🇷 Francia
- 🇩🇪 Alemania
- 🇪🇸 España
- 🇮🇹 Italia

Para agregar más países, edita `shipping_address_collection.allowed_countries` en `api/create-checkout.js`.

---

## 📧 Paso 7: Configurar Webhooks

Los webhooks te notifican cuando un pago se completa.

### 7.1 Crear Webhook Endpoint

Ya creado en: `api/stripe-webhook.js` (próximo a implementar)

### 7.2 Configurar en Stripe Dashboard

1. Ve a: **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://www.atacamadarksky.cl/api/stripe-webhook`
4. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Click **"Add endpoint"**

### 7.3 Obtener Webhook Secret

Stripe generará un **Webhook signing secret** (whsec_...).

Agrégalo a Vercel:

```bash
echo "whsec_..." | vercel env add STRIPE_WEBHOOK_SECRET production
```

---

## 🎨 Paso 8: Personalizar Checkout

### 8.1 Logo en Checkout

1. Ve a: **Settings** → **Branding**
2. Sube tu logo (Nightskylogo.jpg)
3. Configura colores del brand

### 8.2 Email de Recibo

1. **Settings** → **Email**
2. Personaliza plantilla de recibo
3. Agrega información de contacto

---

## 🚀 Paso 9: Pasar a Producción

### Checklist antes de activar pagos reales:

- [ ] Cuenta de Stripe **completamente verificada**
- [ ] Información bancaria **confirmada** (para recibir pagos)
- [ ] Variables de entorno **actualizadas** con keys de producción
- [ ] Webhooks **configurados** y probados
- [ ] Checkout **probado** con tarjetas de prueba
- [ ] Logo y branding **configurado**
- [ ] Términos y condiciones **agregados** al checkout

### Cambiar a Modo Live:

1. En Stripe Dashboard, cambia a **"Live mode"**
2. Actualiza las variables de Vercel con las keys `pk_live_...` y `sk_live_...`
3. Redeploy:

```bash
vercel --prod
```

4. ¡Listo! Ya puedes recibir pagos reales 🎉

---

## 🛡️ Seguridad y Mejores Prácticas

### ✅ Hacer:
- Validar todos los pagos via webhook (no confiar solo en frontend)
- Usar HTTPS siempre (Vercel lo hace automáticamente)
- Rotar las API keys periódicamente
- Monitorear pagos sospechosos en Stripe Radar

### ❌ NO Hacer:
- Nunca exponer `STRIPE_SECRET_KEY` en el frontend
- No almacenar información de tarjetas (Stripe lo maneja)
- No procesar pagos sin webhook verification

---

## 📊 Monitoring y Reportes

### Dashboard de Stripe

- **Payments:** Ver todos los pagos
- **Customers:** Lista de clientes
- **Subscriptions:** (futuro: tours recurrentes)
- **Radar:** Detección de fraude
- **Reports:** Exportar datos contables

### Integración con Google Analytics

Agrega tracking de conversiones:

```javascript
// Cuando el pago es exitoso
gtag('event', 'purchase', {
  transaction_id: session.id,
  value: totalAmount,
  currency: 'CLP',
  items: [{
    item_name: tourName,
    quantity: persons,
    price: unitPrice
  }]
});
```

---

## 🆘 Troubleshooting

### Error: "Invalid API Key"
**Causa:** La key no es correcta o está en el ambiente equivocado
**Solución:** Verifica que estés usando `pk_test_` en test mode y `pk_live_` en live mode

### Error: "Webhook signature verification failed"
**Causa:** El webhook secret no coincide
**Solución:** Verifica que `STRIPE_WEBHOOK_SECRET` sea el correcto en Vercel

### Error: "Customer outside of allowed countries"
**Causa:** El país del cliente no está en la lista permitida
**Solución:** Agrega el país a `shipping_address_collection.allowed_countries`

### Pagos no aparecen en Dashboard
**Causa:** Estás mezclando test/live mode
**Solución:** Asegúrate de estar en el modo correcto en Dashboard y en el código

---

## 📚 Recursos Adicionales

- **Documentación Stripe:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Soporte Stripe Chile:** https://support.stripe.com

---

## ✅ Checklist de Configuración

### Configuración Inicial
- [ ] Cuenta de Stripe creada y verificada
- [ ] Información del negocio completada
- [ ] Información bancaria agregada
- [ ] API keys obtenidas (test y live)

### Configuración Técnica
- [ ] `STRIPE_SECRET_KEY` agregado a Vercel
- [ ] `STRIPE_PUBLISHABLE_KEY` agregado a Vercel
- [ ] Dependencia `stripe` instalada (`npm install stripe`)
- [ ] Endpoint `/api/create-checkout` funcionando
- [ ] Webhook configurado en Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` agregado a Vercel

### Testing
- [ ] Checkout probado con tarjeta de prueba
- [ ] Pago exitoso redirige a confirmación
- [ ] Pago rechazado muestra error apropiado
- [ ] Webhook recibe eventos correctamente
- [ ] Metadata aparece correctamente en Stripe Dashboard

### Producción
- [ ] Keys de producción configuradas
- [ ] Logo y branding personalizado
- [ ] Emails de recibo configurados
- [ ] Términos y condiciones agregados
- [ ] Deployment en producción

---

**Última actualización:** 2025-11-12
**Versión:** 1.0.0
**Estado:** Implementación en progreso - Esperando API keys de Stripe
