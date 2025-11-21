# 🤖 Guía de Configuración n8n para Atacama NightSky
## Sistema de Automatización con WhatsApp Bot + Monitoreo + IA

---

## ⚠️ ESTADO ACTUAL (2025-11-12)

**✅ FUNCIONANDO:**
- Sitio web desplegado en Vercel
- Base de datos Neon PostgreSQL conectada
- API de reservas funcionando
- Health endpoint activo

**⏳ PENDIENTE:**
- Cuenta WhatsApp Business **RESTRINGIDA** por Meta
- Esperando revisión (1-5 días hábiles)
- Workflows de WhatsApp esperando desbloqueo

---

## 📋 Tabla de Contenidos

1. [Visión General del Sistema](#visión-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [WhatsApp: Estado y Próximos Pasos](#configuración-de-whatsapp)
5. [Configuración de Anthropic (Claude AI)](#configuración-de-claude)
6. [Configuración de n8n Cloud](#configuración-de-n8n)
7. [Importar Workflows](#importar-workflows)
8. [Configuración Post-Desbloqueo](#post-desbloqueo)
9. [Pruebas y Verificación](#pruebas)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General del Sistema

Este sistema implementa 3 agentes automáticos de n8n:

### **Agente 1: Monitoreo y Seguridad**
- ✅ Verifica uptime del sitio cada 5 minutos
- ✅ Monitorea health del backend (Supabase, APIs, Google Calendar)
- ✅ Revisa certificados SSL y seguridad
- ✅ Envía alertas por WhatsApp cuando detecta problemas

### **Agente 2: WhatsApp Bot con IA**
- ✅ Recibe mensajes de clientes por WhatsApp
- ✅ Detecta automáticamente el idioma (ES, EN, PT)
- ✅ Usa Claude AI para conversaciones naturales
- ✅ Agenda tours automáticamente mediante conversación
- ✅ Guarda historial de conversaciones en BD

### **Agente 3: Recordatorios Automáticos**
- ✅ Envía recordatorios 24 horas antes del tour
- ✅ Envía recordatorio 2 horas antes del tour
- ✅ Mensajes en el idioma del cliente
- ✅ Por WhatsApp y Email

---

## 📦 Requisitos Previos

### Cuentas y Servicios Necesarios

- [x] **Vercel**: Ya configurado ✅
- [x] **Neon PostgreSQL**: Ya configurado ✅ (migrado desde Supabase)
- [x] **Meta Business Account**: https://business.facebook.com
- [x] **WhatsApp Business API**: App ID `2863885403798741` (⏳ cuenta restringida)
- [ ] **n8n Cloud**: https://n8n.io (plan Starter ~$20/mes) - **PENDIENTE DE CREAR**
- [ ] **Anthropic API**: https://console.anthropic.com - **PENDIENTE DE CREAR**

### Costos Estimados Mensuales

| Servicio | Costo Mensual | Notas |
|----------|---------------|-------|
| Vercel (Hobby) | $0 | Gratis ✅ |
| Neon PostgreSQL (Free) | $0 | 0.5GB, queries ilimitadas ✅ |
| WhatsApp Business API | $0 | Gratis primeros 1,000 conversaciones/mes |
| n8n Cloud (Starter) | $20 USD | Hasta 2,500 ejecuciones/mes |
| Claude API (Anthropic) | ~$5-15 USD | ~$0.003 por mensaje, depende del uso |
| **TOTAL ESTIMADO** | **~$25-35 USD/mes** | ✅ Ahorraste $25/mes vs Supabase |

---

## 🗄️ Configuración de Base de Datos (Neon PostgreSQL)

### ✅ Ya Configurado

La base de datos Neon ya está funcionando con:
- Connection string configurado en Vercel
- Tabla `bookings` creada y funcionando
- Health endpoint verificando conexión

### Crear Tablas Adicionales para n8n (Opcional)

Si quieres las tablas adicionales para tracking de WhatsApp y monitoreo:

1. Ve a: **https://console.neon.tech**
2. Selecciona tu proyecto
3. Click en **SQL Editor**
4. Ejecuta el script `database/neon-setup.sql`

Esto creará:
- ✅ `whatsapp_conversations` - Historial de mensajes
- ✅ `monitoring_logs` - Logs de monitoreo
- ✅ `analytics_metrics` - Métricas de uso
- ✅ `booking_audit_log` - Auditoría de cambios

### Connection String (Ya configurado)

```env
DATABASE_URL=postgresql://USER:PASSWORD@your-neon-host.neon.tech/dbname?sslmode=require
```

Ya está agregado en:
- ✅ Vercel (production, preview, development)
- ⏳ n8n (agregar cuando crees la cuenta)

---

## 💬 WhatsApp Business API - Estado y Próximos Pasos

### ⚠️ ESTADO ACTUAL: Cuenta Restringida

**App ID:** `2863885403798741`
**Estado:** Cuenta WhatsApp Business **RESTRINGIDA** por Meta
**Acción:** Solicitud de revisión enviada (2025-11-12)
**Tiempo estimado:** 1-5 días hábiles

### ✅ Credenciales Ya Obtenidas

```env
APP_ID=2863885403798741
WHATSAPP_ACCESS_TOKEN=EAAossEgrvNUBPxRkFhcaIx2xTh9jcUP4hWtNrS4Wfq7Qf...
ADMIN_PHONE_NUMBER=56935134669
```

### ❌ Pendiente (Cuando se Desbloquee)

```env
WHATSAPP_PHONE_NUMBER_ID=PENDIENTE_OBTENER
```

### 📝 Cómo Obtener Phone Number ID (Post-Desbloqueo)

1. Ve a: https://developers.facebook.com/apps/2863885403798741
2. **WhatsApp** → **API Setup** (menú lateral)
3. Busca la sección "Send and receive messages"
4. Copia el **Phone number ID** (15 dígitos aproximadamente)

### 🚀 Configuración Post-Desbloqueo

Una vez que Meta desbloquee la cuenta:

#### 1. Agregar Phone Number ID a Vercel
```bash
echo "TU_PHONE_NUMBER_ID" | vercel env add WHATSAPP_PHONE_NUMBER_ID production
echo "TU_PHONE_NUMBER_ID" | vercel env add WHATSAPP_PHONE_NUMBER_ID preview
echo "TU_PHONE_NUMBER_ID" | vercel env add WHATSAPP_PHONE_NUMBER_ID development
```

#### 2. Agregar Access Token a Vercel
```bash
echo "EAAoss..." | vercel env add WHATSAPP_ACCESS_TOKEN production
echo "EAAoss..." | vercel env add WHATSAPP_ACCESS_TOKEN preview
echo "EAAoss..." | vercel env add WHATSAPP_ACCESS_TOKEN development
```

#### 3. Crear y Agregar Verify Token
```bash
echo "atacama_webhook_2025" | vercel env add WHATSAPP_VERIFY_TOKEN production
echo "atacama_webhook_2025" | vercel env add WHATSAPP_VERIFY_TOKEN preview
echo "atacama_webhook_2025" | vercel env add WHATSAPP_VERIFY_TOKEN development
```

#### 4. Configurar Webhook en Meta
1. Ve a: **WhatsApp → Configuration → Webhook**
2. **Callback URL:** `https://www.atacamadarksky.cl/api/whatsapp-webhook`
3. **Verify Token:** `atacama_webhook_2025`
4. Click **Verify and Save**
5. Subscribe to fields:
   - ✅ `messages`
   - ✅ `messaging_postbacks`

---

## 🤖 Configuración de Claude AI (Anthropic)

### Paso 1: Crear Cuenta en Anthropic

1. Ir a https://console.anthropic.com
2. Registrarse con tu email
3. Verificar email

### Paso 2: Obtener API Key

1. Ir a **API Keys** en el dashboard
2. Click **Create Key**
3. Nombre: `atacama-n8n-bot`
4. Copiar la key: `sk-ant-api03-...`

⚠️ **IMPORTANTE**: Guardar la key inmediatamente, solo se muestra una vez.

### Paso 3: Agregar Créditos

1. Ir a **Billing**
2. Agregar método de pago
3. Cargar créditos (mínimo $5 USD recomendado para empezar)

### Modelos Recomendados

Para este proyecto usaremos:
- **claude-3-5-sonnet-20241022**: Balance perfecto entre calidad y costo
- Costo: ~$3 por cada 1M tokens de entrada, $15 por 1M tokens de salida
- Estimado: ~1000 conversaciones = $2-3 USD

---

## ☁️ Configuración de n8n Cloud

### Paso 1: Crear Cuenta en n8n

1. Ir a https://n8n.io
2. Click **Start for free** o **Get Started**
3. Registrarse con email
4. Elegir plan **Starter** ($20/mes)

### Paso 2: Configurar Credenciales Globales

En n8n, ir a **Credentials** (menú izquierdo) y crear:

#### 1️⃣ Anthropic API Credentials

```
Name: Anthropic API
Type: Anthropic
API Key: sk-ant-api03-... (tu key de Anthropic)
```

#### 2️⃣ WhatsApp Business Credentials

```
Name: WhatsApp Business Account
Type: WhatsApp Business Cloud API
Access Token: [tu WHATSAPP_ACCESS_TOKEN]
Phone Number ID: [tu WHATSAPP_PHONE_NUMBER_ID]
```

#### 3️⃣ Supabase Credentials (opcional, si n8n tiene nodo nativo)

```
Name: Supabase - Atacama Dark Sky
Type: Supabase
Host: [tu SUPABASE_URL]
Service Role Key: [tu SUPABASE_SERVICE_KEY]
```

### Paso 3: Configurar Variables de Entorno en n8n

Ir a **Settings → Variables** y agregar:

```bash
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...
ADMIN_PHONE_NUMBER=+56950558761
ADMIN_EMAIL=vicente.litvak@gmail.com
ADMIN_WEBHOOK_URL=https://[tu-webhook-de-notificaciones]
```

---

## 📥 Importar Workflows en n8n

### Paso 1: Importar Workflow de Monitoreo

1. En n8n, ir a **Workflows**
2. Click **Import from File**
3. Seleccionar `n8n-workflows/1-monitoring-workflow.json`
4. Click **Import**
5. Revisar y configurar credenciales si es necesario
6. **Activar** el workflow (toggle en la esquina superior derecha)

### Paso 2: Importar Workflow de WhatsApp Bot

1. Importar `n8n-workflows/2-whatsapp-bot-workflow.json`
2. Configurar credenciales:
   - Seleccionar "Anthropic API" en los nodos de Claude
   - Seleccionar "WhatsApp Business Account" en nodos de WhatsApp
3. Copiar la **Webhook URL** del nodo "Webhook de WhatsApp"
   - Ejemplo: `https://[tu-instancia].n8n.cloud/webhook/whatsapp-messages`
4. **Activar** el workflow

### Paso 3: Importar Workflow de Recordatorios

1. Importar `n8n-workflows/3-booking-reminders-workflow.json`
2. Configurar credenciales de WhatsApp y Email (Resend SMTP)
3. **Activar** el workflow

---

## 🔧 Configurar Variables de Entorno en Vercel

### Paso 1: Ir a Vercel Dashboard

1. https://vercel.com/dashboard
2. Seleccionar proyecto `atacama-nightsky`
3. Ir a **Settings → Environment Variables**

### Paso 2: Agregar Nuevas Variables

Agregar las siguientes variables:

```bash
# WhatsApp Configuration
WHATSAPP_VERIFY_TOKEN=atacama_darksky_2024
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...

# n8n Webhook URLs
N8N_WHATSAPP_WEBHOOK_URL=https://[tu-n8n].n8n.cloud/webhook/whatsapp-messages

# Admin Configuration (ya existentes, verificar)
ADMIN_EMAIL=vicente.litvak@gmail.com
ADMIN_PHONE_NUMBER=+56950558761
```

### Paso 3: Re-deployar

Después de agregar las variables:

```bash
# Desde tu terminal local
vercel --prod
```

O simplemente hacer un nuevo commit y push, Vercel auto-desplegará.

---

## 🚀 Desplegar Nuevos Endpoints

Los endpoints ya están creados:
- ✅ `/api/health.js` - Health check
- ✅ `/api/whatsapp-webhook.js` - Recibir mensajes de WhatsApp

### Verificar Deployment

1. Esperar que Vercel complete el deployment
2. Verificar endpoints:

```bash
# Test health endpoint
curl https://www.atacamadarksky.cl/api/health

# Debería retornar:
{
  "status": "healthy",
  "timestamp": "2025-11-11T...",
  "checks": {
    "supabase": { "status": "healthy", ... },
    "googleCalendar": { "status": "healthy", ... },
    ...
  }
}
```

---

## 🧪 Pruebas y Verificación

### Prueba 1: Health Check Endpoint

```bash
curl https://www.atacamadarksky.cl/api/health | jq
```

Deberías ver status: "healthy" y todos los checks pasando.

### Prueba 2: Verificar Webhook de WhatsApp

1. Ir a Meta Business Dashboard
2. WhatsApp → Configuration → Webhook
3. Click **Verify** junto a tu webhook URL
4. Debería mostrar ✅ "Verified"

### Prueba 3: Enviar Mensaje de Prueba por WhatsApp

1. Desde tu teléfono, enviar WhatsApp a tu número business: `+56 9 5055 8761`
2. Mensaje de prueba: "Hola, quiero información sobre los tours"
3. Verificar:
   - ✅ n8n recibe el mensaje (ver execution log)
   - ✅ Claude procesa el mensaje
   - ✅ Recibes respuesta automática
   - ✅ Se guarda en Supabase tabla `whatsapp_conversations`

### Prueba 4: Verificar Workflow de Monitoreo

1. En n8n, ir al workflow "Atacama Dark Sky - Monitoreo y Seguridad"
2. Click **Execute Workflow** (botón de play)
3. Verificar que ejecuta sin errores
4. Revisar los resultados de cada nodo

### Prueba 5: Simular Reserva por WhatsApp

Enviar mensaje:
```
Hola! Quiero reservar el tour regular para 4 personas el 15 de diciembre
```

Verificar:
1. Bot detecta intención de reserva
2. Confirma datos con el cliente
3. Crea reserva en Supabase
4. Envía confirmación con código de reserva
5. Se registra en tabla `whatsapp_conversations` con `booking_id`

---

## 🔍 Verificar que Todo Funciona

### Checklist Final

#### Supabase
- [ ] Tablas creadas correctamente
- [ ] RLS policies habilitadas
- [ ] Service role tiene acceso completo

#### WhatsApp Business API
- [ ] Webhook verificado ✅
- [ ] Recibe mensajes de prueba
- [ ] Puede enviar mensajes de respuesta

#### n8n Workflows
- [ ] Workflow 1 (Monitoreo) activado y funcionando
- [ ] Workflow 2 (WhatsApp Bot) activado y responde mensajes
- [ ] Workflow 3 (Recordatorios) activado

#### Endpoints Vercel
- [ ] `/api/health` retorna status healthy
- [ ] `/api/whatsapp-webhook` recibe y procesa mensajes
- [ ] `/api/booking` funciona normalmente

#### Variables de Entorno
- [ ] Todas las variables configuradas en Vercel
- [ ] Todas las variables configuradas en n8n

---

## 📊 Monitoreo y Mantenimiento

### Dashboard de n8n

Revisar diariamente:
1. **Executions**: Ver todas las ejecuciones de workflows
2. **Errors**: Monitorear errores y fallos
3. **Active Workflows**: Verificar que todos estén activos

### Queries Útiles en Supabase

#### Ver conversaciones recientes
```sql
SELECT * FROM recent_conversations LIMIT 20;
```

#### Ver estadísticas de WhatsApp
```sql
SELECT * FROM get_whatsapp_stats(7); -- últimos 7 días
```

#### Ver alertas activas
```sql
SELECT * FROM get_active_alerts();
```

#### Ver reservas pendientes de recordatorio
```sql
SELECT *
FROM bookings
WHERE status = 'confirmed'
  AND reminder_sent = false
  AND date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '2 days'
ORDER BY date, time;
```

### Resolver Alertas

```sql
-- Marcar alerta como resuelta
SELECT resolve_alert('uuid-de-la-alerta');
```

### Logs de n8n

Acceder a logs en tiempo real:
1. n8n → Workflow → Executions
2. Click en cualquier ejecución
3. Ver paso a paso qué hizo cada nodo

---

## 🆘 Troubleshooting

### Problema: Webhook de WhatsApp no recibe mensajes

**Solución:**
1. Verificar que el webhook esté activo en Meta Business
2. Verificar que `WHATSAPP_VERIFY_TOKEN` sea correcto
3. Ver logs en Vercel: `vercel logs`

### Problema: Claude no responde o da error

**Solución:**
1. Verificar créditos en Anthropic Console
2. Verificar que la API key sea correcta en n8n
3. Ver límites de rate: https://docs.anthropic.com/en/api/rate-limits

### Problema: No se crean reservas desde WhatsApp

**Solución:**
1. Verificar que el endpoint `/api/booking` funcione: `curl -X POST https://www.atacamadarksky.cl/api/booking -H "Content-Type: application/json" -d '{"date":"2025-12-15","persons":2,"tour_type":"regular","name":"Test","email":"test@test.com","phone":"+56912345678"}'`
2. Ver logs de ejecución en n8n (nodo "Crear Reserva en Sistema")
3. Verificar permisos en Supabase

### Problema: Recordatorios no se envían

**Solución:**
1. Verificar que el workflow 3 esté **activo**
2. Verificar que haya reservas confirmadas en los próximos 2 días
3. Ejecutar manualmente el workflow para testear
4. Ver logs de Supabase para verificar columnas `reminder_sent`

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **n8n**: https://docs.n8n.io
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Anthropic Claude**: https://docs.anthropic.com
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### Soporte

- n8n Community: https://community.n8n.io
- WhatsApp Business Support: https://business.facebook.com/support
- Anthropic Discord: https://discord.gg/anthropic

---

## 🎉 ¡Listo!

Tu sistema de automatización completo está configurado:

✅ **Monitoreo 24/7** del sitio web y backend
✅ **WhatsApp Bot inteligente** con IA en 3 idiomas
✅ **Agendamiento automático** de tours por conversación
✅ **Recordatorios automáticos** 24h y 2h antes
✅ **Alertas en tiempo real** si algo falla

**Próximos pasos recomendados:**
1. Monitorear las primeras conversaciones de WhatsApp
2. Ajustar los prompts de Claude según sea necesario
3. Configurar dashboard de métricas (opcional)
4. Entrenar al equipo en cómo revisar logs de n8n

---

## 📞 Contacto

Si necesitas ayuda con la configuración:
- Email: vicente.litvak@gmail.com
- WhatsApp: +56 9 5055 8761

---

**Última actualización:** 2025-11-11
**Versión:** 1.0.0
