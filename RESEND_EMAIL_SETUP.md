# 📧 Configurar Sistema de Emails con Resend

## 🎯 Qué hace este sistema

Cuando un cliente paga con Mercado Pago:

1. ✅ **Mercado Pago** envía email: "Tu pago se acreditó" (ID: 133343697409)
2. ✅ **Atacama NightSky** envía email: "Reserva Confirmada" (MISMO ID: 133343697409)
3. ✅ **Ambos emails tienen el mismo número de referencia**
4. ✅ **Base de datos** guarda la reserva con ese ID

---

## 📋 Paso 1: Crear cuenta en Resend

1. Ir a: **https://resend.com/signup**
2. Crear cuenta (es GRATIS hasta 3,000 emails/mes)
3. Verificar email

---

## 🔑 Paso 2: Obtener API Key

1. En Resend Dashboard, ir a: **Settings → API Keys**
2. Click en **Create API Key**
3. Nombre: `Atacama NightSky Production`
4. Permisos: **Sending access**
5. Click **Add**
6. **COPIAR** la API key (empieza con `re_...`)
   - ⚠️ IMPORTANTE: Solo la verás UNA vez

---

## 📮 Paso 3: Configurar Dominio (IMPORTANTE)

Para que los emails NO vayan a SPAM, debes configurar el dominio:

### Opción A: Usar dominio propio (atacamadarksky.cl)

1. En Resend, ir a: **Domains → Add Domain**
2. Ingresar: `atacamadarksky.cl`
3. Resend te dará 3 registros DNS:
   ```
   SPF:  TXT  @  "v=spf1 include:resend.com ~all"
   DKIM: TXT  resend._domainkey  "v=DKIM1; k=rsa; p=..."
   DMARC: TXT _dmarc  "v=DMARC1; p=none; ..."
   ```
4. Agregar estos registros en tu proveedor de DNS (donde compraste el dominio)
5. Esperar ~10 minutos y click **Verify** en Resend
6. Cuando aparezca ✅ verificado, ¡listo!

### Opción B: Usar subdominio de Resend (temporal)

Si NO quieres configurar DNS ahora:
- Usa el dominio de Resend: `onboarding@resend.dev`
- Funciona inmediatamente
- Los emails pueden ir a spam
- **Recomendado solo para testing**

---

## ⚙️ Paso 4: Configurar en Vercel

1. Ir a: **https://vercel.com/dashboard**
2. Seleccionar proyecto: `astronomico`
3. Ir a: **Settings → Environment Variables**
4. Click **Add New**

### Agregar variable:

```
Name: RESEND_API_KEY
Value: re_xxxxxxxxxxxxxxxxxxxxxxxxxx (tu API key de Resend)
Environments: ✅ Production ✅ Preview ✅ Development
```

5. Click **Save**
6. Vercel preguntará si quieres re-deployar
7. Click **Redeploy**

---

## 🚀 Paso 5: Deploy

```bash
cd D:\dev\projects\astro-page
vercel --prod
```

Esperar ~1 minuto a que termine el deployment.

---

## ✅ Paso 6: Probar el Sistema

### Test 1: Hacer un pago de prueba

1. Ir a tu sitio: https://atacamadarksky.cl
2. Click en **Pagar** en cualquier tour
3. Completar datos y pagar (puedes usar tarjeta de prueba de Mercado Pago)
4. Esperar confirmación

### Qué debería pasar:

1. ✅ Mercado Pago te redirige a página de éxito
2. ✅ Recibes email de Mercado Pago: "Tu pago se acreditó" con ID
3. ✅ **5-10 segundos después** recibes email de Atacama NightSky:
   ```
   Subject: ✅ Reserva Confirmada - Tour X - Fecha Y

   Número de Reserva: ATK-133343697409
   ID de Pago: 133343697409  <-- MISMO número

   Detalles de tu Tour:
   - Tour: Tour Astronómico Regular
   - Fecha: Viernes, 20 de diciembre de 2024
   - Personas: 2 personas
   - Total Pagado: $60.000 CLP

   Próximos Pasos:
   - Te contactaremos por WhatsApp 24 horas antes
   - Confirmaremos hora exacta de recogida
   ...
   ```

---

## 🔍 Verificar que funciona

### Ver logs en Vercel:

1. Ir a: https://vercel.com/vicholitvaks-projects/astronomico
2. Click en el último deployment
3. Click en **Functions**
4. Click en `/api/mercadopago-webhook`
5. Ver logs:
   ```
   [WEBHOOK] Notification received
   [WEBHOOK] Processing payment: 133343697409
   [WEBHOOK] Payment approved, processing...
   [WEBHOOK] Booking saved to database: ATK-133343697409
   [WEBHOOK] Confirmation email sent successfully ✅
   ```

### Ver reserva en base de datos:

En Neon SQL Editor:
```sql
SELECT booking_id, name, email, status, created_at
FROM bookings
WHERE booking_id LIKE 'ATK-%'
ORDER BY created_at DESC
LIMIT 5;
```

Deberías ver tu reserva con `booking_id` = `ATK-133343697409`

---

## ❌ Troubleshooting

### Email no llega:

1. **Verificar API key en Vercel:**
   - Settings → Environment Variables
   - `RESEND_API_KEY` debe existir en Production

2. **Verificar dominio en Resend:**
   - Domains debe mostrar ✅ verificado
   - Si no, verificar registros DNS

3. **Ver logs del webhook:**
   - Vercel → Functions → `/api/mercadopago-webhook`
   - Buscar `[WEBHOOK] Confirmation email sent`
   - Si dice `Failed to send email`, ver error

4. **Revisar spam:**
   - Si usas `onboarding@resend.dev`, puede ir a spam
   - Marcar como "No es spam"

### Email va a spam:

- Configura el dominio propio (Paso 3 Opción A)
- No uses `onboarding@resend.dev` en producción
- Asegúrate de tener SPF, DKIM y DMARC configurados

### Webhook no se ejecuta:

1. Verificar en Mercado Pago:
   - Panel → Integraciones → Webhooks
   - URL debe ser: `https://atacamadarksky.cl/api/mercadopago-webhook`
   - Estado: Activo ✅

2. Hacer test de webhook:
   - En MP Dashboard, probar webhook
   - Ver respuesta (debe ser `200 OK`)

---

## 📊 Monitoreo

### Dashboard de Resend

Ver todos los emails enviados:
- https://resend.com/emails
- Filtrar por: delivered, bounced, complained

### Estadísticas

En Resend Analytics verás:
- ✅ Emails enviados
- ✅ Emails entregados
- ✅ Tasa de apertura (si habilitas tracking)
- ❌ Bounces (rebotados)
- ⚠️ Complaints (marcados como spam)

---

## 💰 Límites y Costos

### Plan Gratuito (actual)
- ✅ 3,000 emails/mes
- ✅ 100 emails/día
- ✅ 1 dominio verificado
- ✅ Soporte por email

**Para Atacama NightSky:**
- ~10 tours/día = ~10 emails/día
- ~300 emails/mes
- ✅ Suficiente con plan gratuito

### Si necesitas más:

Plan Pro: $20/mes
- 50,000 emails/mes
- 10 dominios
- Soporte prioritario

---

## 🎯 Resumen

Después de configurar:

1. ✅ Cliente paga → Mercado Pago confirma
2. ✅ Webhook captura pago
3. ✅ Sistema guarda reserva en BD
4. ✅ Sistema envía email bonito al cliente
5. ✅ Número de reserva coincide entre ambos emails
6. ✅ Cliente recibe confirmación profesional

**Todo automático. Cero intervención manual.** 🎉

---

## 📞 Soporte

- Resend Docs: https://resend.com/docs
- Resend Status: https://status.resend.com
- Issues: revisar logs en Vercel

---

¡El sistema está listo! Solo falta configurar la API key de Resend en Vercel. 🚀
