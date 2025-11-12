# 🚀 Quick Start - Sistema n8n para Atacama Dark Sky

Guía rápida de 15 minutos para poner en marcha el sistema de automatización.

---

## ⏱️ Tiempo Total: ~15-30 minutos

---

## 1️⃣ Configurar Supabase (5 min)

```sql
-- 1. Ir a https://supabase.com/dashboard
-- 2. Abrir SQL Editor
-- 3. Copiar y ejecutar: database/supabase-n8n-setup.sql
-- 4. Verificar que se crearon las tablas
```

**Copiar credenciales:**
- Settings → API → copiar `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`

---

## 2️⃣ Obtener API Keys (10 min)

### WhatsApp Business API
1. Ir a https://developers.facebook.com
2. Seleccionar tu app (ID: 730003402995386)
3. WhatsApp → Getting Started
4. Copiar:
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`

### Anthropic (Claude AI)
1. Ir a https://console.anthropic.com
2. API Keys → Create Key
3. Copiar: `ANTHROPIC_API_KEY` (empieza con `sk-ant-`)
4. Billing → Agregar $5-10 USD de crédito

---

## 3️⃣ Configurar n8n Cloud (5 min)

1. Ir a https://n8n.io → Sign Up
2. Plan Starter ($20/mes)
3. Settings → Credentials:
   - **Anthropic API**: pegar tu key
   - **WhatsApp Business**: pegar access token y phone number ID
4. Settings → Variables: pegar todas las variables de entorno

```bash
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=EAA...
ADMIN_PHONE_NUMBER=+56950558761
ADMIN_EMAIL=vicente.litvak@gmail.com
```

---

## 4️⃣ Importar Workflows (3 min)

1. n8n → Workflows → Import from File
2. Importar en este orden:
   - `n8n-workflows/1-monitoring-workflow.json`
   - `n8n-workflows/2-whatsapp-bot-workflow.json`
   - `n8n-workflows/3-booking-reminders-workflow.json`
3. En cada workflow:
   - Verificar credenciales (deberían auto-asignarse)
   - Activar (toggle arriba a la derecha)

---

## 5️⃣ Configurar Variables en Vercel (3 min)

```bash
# 1. Ir a https://vercel.com/dashboard
# 2. Proyecto: atacama-nightsky → Settings → Environment Variables
# 3. Agregar:

WHATSAPP_VERIFY_TOKEN=atacama_darksky_2024
WHATSAPP_PHONE_NUMBER_ID=[tu-id]
WHATSAPP_ACCESS_TOKEN=[tu-token]
N8N_WHATSAPP_WEBHOOK_URL=https://[tu-n8n].n8n.cloud/webhook/whatsapp-messages

# 4. Guardar y re-desplegar
```

---

## 6️⃣ Desplegar Nuevos Endpoints (2 min)

```bash
# Desde terminal local:
cd D:\dev\projects\astro-page
vercel --prod

# Esperar deployment (~1 min)
# Verificar:
curl https://www.atacamadarksky.cl/api/health
```

---

## 7️⃣ Configurar Webhook de WhatsApp (2 min)

1. Meta Business → WhatsApp → Configuration → Webhook
2. Edit Callback URL:
   ```
   URL: https://www.atacamadarksky.cl/api/whatsapp-webhook
   Verify Token: atacama_darksky_2024
   ```
3. Subscribe to: `messages`
4. Click **Verify and Save**

---

## ✅ Verificación (5 min)

### Test 1: Health Check
```bash
curl https://www.atacamadarksky.cl/api/health | jq
# Debe retornar: "status": "healthy"
```

### Test 2: Workflow de Monitoreo
1. n8n → Workflow "Monitoreo y Seguridad"
2. Click **Execute Workflow** (botón play)
3. Ver que completa sin errores

### Test 3: WhatsApp Bot
1. Desde tu teléfono, enviar WhatsApp a `+56 9 5055 8761`:
   ```
   Hola, quiero información sobre los tours
   ```
2. Deberías recibir respuesta automática en ~3-5 segundos
3. Verificar en n8n → Executions que se ejecutó

### Test 4: Reserva por WhatsApp
1. Enviar mensaje:
   ```
   Quiero reservar un tour para 2 personas el 20 de diciembre
   ```
2. Bot debe responder pidiendo confirmación
3. Confirmar
4. Verificar en Supabase que se creó la reserva

---

## 🎉 ¡Listo!

Tu sistema está funcionando:
- ✅ Monitoreo cada 5 minutos
- ✅ WhatsApp bot respondiendo en tiempo real
- ✅ Recordatorios automáticos activados

---

## 📊 Dashboard de Monitoreo

### Ver actividad en n8n:
- https://app.n8n.cloud → Executions

### Ver datos en Supabase:
```sql
-- Últimas conversaciones
SELECT * FROM whatsapp_conversations ORDER BY created_at DESC LIMIT 10;

-- Estadísticas
SELECT * FROM get_whatsapp_stats(7);

-- Reservas de hoy
SELECT * FROM bookings WHERE date = CURRENT_DATE;
```

---

## 🆘 Si algo no funciona

### WhatsApp no responde
1. Ver n8n Executions → buscar errores
2. Verificar webhook en Meta Business
3. Ver logs: `vercel logs --follow`

### Claude no funciona
1. Verificar créditos en https://console.anthropic.com
2. Verificar API key en n8n Credentials
3. Ver límite de rate

### Reservas no se crean
1. Probar endpoint directamente:
   ```bash
   curl -X POST https://www.atacamadarksky.cl/api/booking \
     -H "Content-Type: application/json" \
     -d '{
       "date": "2025-12-20",
       "persons": 2,
       "tour_type": "regular",
       "name": "Test",
       "email": "test@test.com",
       "phone": "+56912345678"
     }'
   ```
2. Ver logs de n8n en el nodo "Crear Reserva"
3. Verificar permisos Supabase

---

## 📞 Soporte

**Documentación completa:** Ver `N8N_SETUP_GUIDE.md`

**Contacto:**
- Email: vicente.litvak@gmail.com
- WhatsApp: +56 9 5055 8761

---

**Última actualización:** 2025-11-11
