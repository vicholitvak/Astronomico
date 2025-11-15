# 🛒 Configuración de Mercado Pago - Atacama NightSky

Esta guía te ayudará a configurar Mercado Pago para aceptar pagos en tu sitio web.

---

## 📋 Requisitos Previos

1. **Cuenta de Mercado Pago** creada en https://www.mercadopago.cl
2. **Verificación de identidad** completada (RUT chileno)
3. **Credenciales de producción** obtenidas

---

## 🔑 Paso 1: Obtener tus Credenciales

### 1.1 Ingresar al Panel de Desarrolladores

1. Ve a: https://www.mercadopago.cl/developers
2. Inicia sesión con tu cuenta
3. En el menú lateral, click en **"Tus integraciones"**
4. Selecciona tu aplicación o crea una nueva

### 1.2 Obtener Access Token

1. En la sección **"Credenciales de producción"**:
   - Copia el **Access Token**
   - Este es tu `MERCADOPAGO_ACCESS_TOKEN`

⚠️ **IMPORTANTE:** Nunca compartas tu Access Token públicamente.

---

## 🌐 Paso 2: Configurar Variables de Entorno en Vercel

### 2.1 Acceder a Configuración de Vercel

1. Ve a: https://vercel.com/vicholitvaks-projects/astronomico
2. Click en **"Settings"**
3. Click en **"Environment Variables"**

### 2.2 Agregar Variable de Mercado Pago

Agrega la siguiente variable:

```
Name: MERCADOPAGO_ACCESS_TOKEN
Value: [TU ACCESS TOKEN DE MERCADO PAGO]
Environment: Production, Preview, Development
```

Click en **"Save"**

---

## ✅ Paso 3: Verificar la Instalación

### 3.1 Instalar Dependencias

En tu terminal local:

```bash
npm install
```

Esto instalará el paquete `mercadopago` necesario.

### 3.2 Hacer Deploy

```bash
git add .
git commit -m "Configure Mercado Pago"
git push
```

Vercel detectará los cambios y hará deploy automáticamente.

---

## 🧪 Paso 4: Probar el Checkout

### 4.1 Modo Sandbox (Pruebas)

Para probar sin dinero real:

1. Ve a https://www.mercadopago.cl/developers/panel/test-users
2. Crea un usuario de prueba
3. Usa las credenciales de prueba en lugar de las de producción
4. Usa tarjetas de prueba: https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards

**Tarjetas de Prueba:**

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|--------|-----|-------|-----------|
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | ✅ Aprobada |
| Visa | 4170 0688 1010 8020 | 123 | 11/25 | ✅ Aprobada |
| Visa | 4013 5406 8274 6260 | 123 | 11/25 | ❌ Rechazada |

### 4.2 Modo Producción

Una vez que todo funcione en pruebas:

1. Reemplaza las credenciales de prueba con las de producción
2. Haz deploy
3. Realiza una compra real de prueba
4. Verifica que el dinero llegue a tu cuenta

---

## 💳 Paso 5: Configurar Notificaciones (Webhooks)

### 5.1 Configurar URL de Notificación

1. Ve al panel de Mercado Pago → **Tus integraciones**
2. En **"Webhooks"**, agrega:
   ```
   https://atacamadarksky.cl/api/mercadopago-webhook
   ```
3. Selecciona los eventos:
   - ✅ `payment`
   - ✅ `merchant_order`

### 5.2 Verificar Webhooks

Los webhooks te notificarán cuando:
- Un pago se aprueba
- Un pago se rechaza
- Un pago está pendiente

---

## 🎯 Flujo Completo del Pago

```
1. Cliente hace click en "Pagar con Mercado Pago"
   ↓
2. Modal se abre pidiendo datos (fecha, personas, contacto)
   ↓
3. Cliente completa formulario
   ↓
4. Script llama a /api/create-preference
   ↓
5. API crea preferencia en Mercado Pago
   ↓
6. Cliente es redirigido a checkout de Mercado Pago
   ↓
7. Cliente ingresa datos de tarjeta
   ↓
8. Mercado Pago procesa el pago
   ↓
9. Cliente es redirigido de vuelta (success/failure/pending)
   ↓
10. Webhook notifica el resultado
   ↓
11. Sistema actualiza base de datos y envía confirmación
```

---

## 📊 Cómo Funciona el Sistema

### Archivos Clave:

1. **`api/create-preference.js`**
   - Crea la preferencia de pago en Mercado Pago
   - Recibe datos del formulario
   - Retorna URL de checkout

2. **`api/mercadopago-webhook.js`**
   - Recibe notificaciones de Mercado Pago
   - Actualiza estado de pagos
   - Envía confirmaciones

3. **`mercadopago-checkout.js`**
   - Modal de checkout frontend
   - Validación de formulario
   - Redirección a Mercado Pago

4. **`index.html`**
   - Botones "Pagar con Mercado Pago"
   - SDK de Mercado Pago cargado

---

## 💰 Comisiones de Mercado Pago

| Método de Pago | Comisión |
|----------------|----------|
| Tarjeta de Crédito | 3.49% + IVA |
| Tarjeta de Débito | 2.49% + IVA |
| MercadoPago (saldo) | 0% |

**Ejemplo:**
- Tour: $30,000 CLP
- Comisión (3.49%): $1,047 CLP
- IVA (19%): $199 CLP
- **Total comisión: ~$1,246 CLP**
- **Recibes: ~$28,754 CLP**

---

## 🔧 Solución de Problemas

### Error: "Payment system not configured"

**Solución:** Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté en Vercel:
```bash
vercel env ls
```

### Error: "Failed to create payment preference"

**Soluciones:**
1. Verifica que el Access Token sea de producción (no de prueba)
2. Verifica que la cuenta esté verificada
3. Revisa los logs en Vercel: https://vercel.com/vicholitvaks-projects/astronomico/logs

### No recibo notificaciones de webhook

**Soluciones:**
1. Verifica que la URL del webhook sea correcta
2. Verifica que esté usando HTTPS (no HTTP)
3. Revisa los logs del webhook en Mercado Pago

---

## 📈 Monitoreo de Pagos

### Ver Pagos Recibidos

1. Panel de Mercado Pago: https://www.mercadopago.cl/activities
2. Filtra por:
   - Fecha
   - Estado (Aprobados, Pendientes, Rechazados)
   - Monto

### Retirar Dinero

1. Ve a **"Dinero disponible"**
2. Click en **"Transferir"**
3. Selecciona tu cuenta bancaria
4. Confirma el monto
5. El dinero llega en 1-2 días hábiles

---

## 🎨 Personalización

### Cambiar Colores del Checkout

En `api/create-preference.js`, agrega:

```javascript
preferenceData.theme = {
    elements_color: '#667eea',  // Color de elementos
    header_color: '#0f0c29'     // Color del header
};
```

### Cambiar Texto del Botón

En `index.html`, edita:

```html
<button class="btn btn-mercadopago" ...>
    <i class="fas fa-credit-card"></i> [TU TEXTO AQUÍ]
</button>
```

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Mercado Pago creada y verificada
- [ ] Access Token obtenido
- [ ] Variable `MERCADOPAGO_ACCESS_TOKEN` en Vercel
- [ ] Dependencia `mercadopago` instalada
- [ ] Deploy realizado
- [ ] Prueba con tarjeta de prueba exitosa
- [ ] Webhook configurado
- [ ] Prueba de pago real realizada
- [ ] Dinero recibido en cuenta de Mercado Pago

---

## 📞 Soporte

- **Mercado Pago Developers:** https://www.mercadopago.cl/developers/es/support
- **Documentación:** https://www.mercadopago.cl/developers/es/docs
- **Soporte Técnico:** developers@mercadopago.com

---

## 🚀 Próximos Pasos

Una vez configurado Mercado Pago:

1. ✅ Eliminar referencias a Stripe
2. ✅ Probar flujo completo de pago
3. 📧 Configurar emails de confirmación automáticos
4. 📊 Integrar con base de datos para guardar reservas
5. 📱 Configurar notificaciones de WhatsApp

---

¡Tu sistema de pagos está listo! 🎉
