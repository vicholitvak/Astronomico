# Workflows de n8n - Atacama Dark Sky

Este directorio contiene los workflows de automatización para el sistema de Atacama Dark Sky.

## 📁 Archivos

### 1. `1-monitoring-workflow.json`
**Monitoreo y Seguridad 24/7**
- Ejecuta cada 5 minutos
- Verifica uptime del sitio web
- Monitorea health del backend (Supabase, APIs)
- Revisa certificados SSL
- Envía alertas automáticas si detecta problemas

### 2. `2-whatsapp-bot-workflow.json`
**Bot de WhatsApp con Claude AI**
- Recibe mensajes de clientes vía webhook
- Detecta idioma automáticamente (ES/EN/PT)
- Analiza intención con Claude AI
- Responde en lenguaje natural
- Agenda tours mediante conversación
- Guarda historial en base de datos

### 3. `3-booking-reminders-workflow.json`
**Recordatorios Automáticos**
- Ejecuta cada 6 horas
- Envía recordatorio 24h antes del tour
- Envía recordatorio 2h antes del tour
- Mensajes multiidioma
- Por WhatsApp y Email

## 🚀 Cómo Importar

### Método 1: Via UI de n8n

1. Abrir n8n Cloud: https://app.n8n.cloud
2. Ir a **Workflows** → **Import from File**
3. Seleccionar uno de los archivos JSON
4. Click **Import**
5. Configurar credenciales necesarias
6. Activar el workflow

### Método 2: Via n8n CLI (self-hosted)

```bash
# Copiar workflows al directorio de n8n
cp *.json ~/.n8n/workflows/

# Reiniciar n8n
n8n restart
```

## 🔧 Configuración Requerida

### Credenciales en n8n

Antes de activar los workflows, configurar:

1. **Anthropic API** (para Claude AI)
   - Type: Anthropic
   - API Key: `sk-ant-api03-...`

2. **WhatsApp Business** (para mensajes)
   - Type: WhatsApp Business Cloud API
   - Access Token: Tu token de Meta
   - Phone Number ID: Tu ID de teléfono

3. **Resend SMTP** (para emails)
   - Type: SMTP
   - Host: smtp.resend.com
   - Port: 587
   - User: resend
   - Password: Tu API key de Resend

### Variables de Entorno en n8n

Ir a **Settings → Variables** y agregar:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
ADMIN_PHONE_NUMBER=+56950558761
ADMIN_EMAIL=vicente.litvak@gmail.com
ADMIN_WEBHOOK_URL=https://tu-webhook-de-alertas
```

## ✅ Checklist de Activación

Antes de activar cada workflow:

### Workflow 1 (Monitoreo)
- [ ] Verificar URL del sitio es correcta
- [ ] Endpoint `/api/health` está desplegado
- [ ] Variables de entorno configuradas
- [ ] Webhook de alertas configurado

### Workflow 2 (WhatsApp Bot)
- [ ] Credenciales de Anthropic configuradas
- [ ] Credenciales de WhatsApp configuradas
- [ ] Webhook de WhatsApp verificado en Meta
- [ ] Tabla `whatsapp_conversations` creada en Supabase
- [ ] Variable `N8N_WHATSAPP_WEBHOOK_URL` en Vercel

### Workflow 3 (Recordatorios)
- [ ] Credenciales de WhatsApp configuradas
- [ ] Credenciales de Email (Resend) configuradas
- [ ] Columnas `reminder_sent` y `reminder_sent_at` en tabla `bookings`
- [ ] Hay reservas de prueba en los próximos 2 días

## 🧪 Pruebas

### Probar Workflow 1 (Monitoreo)
```bash
# Ejecutar manualmente en n8n
# Debería completar sin errores
# Verificar que los checks retornan "healthy"
```

### Probar Workflow 2 (WhatsApp Bot)
```bash
# Enviar mensaje de WhatsApp a tu número business:
"Hola, quiero información sobre tours"

# Verificar:
# 1. n8n recibe el mensaje
# 2. Claude responde
# 3. Recibes respuesta en WhatsApp
# 4. Se guarda en tabla whatsapp_conversations
```

### Probar Workflow 3 (Recordatorios)
```bash
# Crear reserva de prueba para mañana
INSERT INTO bookings (
  booking_id, date, persons, tour_type, time,
  name, email, phone, status
) VALUES (
  'ATK-TEST-001',
  CURRENT_DATE + INTERVAL '1 day',
  2,
  'regular',
  '21:30',
  'Test User',
  'test@example.com',
  '+56912345678',
  'confirmed'
);

# Ejecutar workflow manualmente
# Debería enviar recordatorio
```

## 📊 Monitoreo

### Ver Ejecuciones
1. n8n → Workflows
2. Click en el workflow
3. Tab **Executions**
4. Ver historial completo

### Ver Errores
1. n8n → Executions
2. Filtrar por **Error**
3. Click en ejecución fallida
4. Ver detalle de cada nodo

### Métricas Importantes

| Workflow | Frecuencia | Duración Esperada | Alertar si |
|----------|------------|-------------------|------------|
| Monitoreo | Cada 5 min | < 30 segundos | > 1 min |
| WhatsApp Bot | On-demand | < 5 segundos | > 15 seg |
| Recordatorios | Cada 6 horas | < 2 minutos | > 5 min |

## 🔄 Actualizaciones

### Cómo Actualizar un Workflow

1. Desactivar el workflow en n8n
2. Exportar versión actual (backup)
3. Importar nueva versión
4. Verificar credenciales
5. Probar manualmente
6. Activar

### Versionado

Los workflows siguen semver: `MAJOR.MINOR.PATCH`

- **MAJOR**: Cambios incompatibles (requieren reconfiguración)
- **MINOR**: Nuevas funcionalidades (compatibles)
- **PATCH**: Bug fixes (compatibles)

Versión actual: `1.0.0`

## 🆘 Troubleshooting

### Workflow no se activa
- Verificar que no haya errores de configuración
- Verificar que todas las credenciales estén configuradas
- Ver logs en la pestaña Executions

### Webhook no recibe datos
- Verificar URL del webhook
- Verificar que esté activado en el servicio externo
- Ver logs de red en el nodo Webhook

### Error "Invalid credentials"
- Reconfigurar la credencial
- Verificar que no haya expirado
- Probar la conexión

### Error de timeout
- Aumentar timeout en opciones del nodo
- Verificar que el servicio externo esté respondiendo
- Considerar usar modo async

## 📚 Recursos

- **Documentación n8n**: https://docs.n8n.io
- **Community n8n**: https://community.n8n.io
- **Ejemplos**: https://n8n.io/workflows

## 📝 Notas

- Los workflows están optimizados para n8n Cloud
- Pueden requerir ajustes para self-hosted
- Revisar límites de rate de cada servicio externo
- Configurar alertas de cuota de ejecuciones

---

**Mantenido por:** Vicente Litvak
**Última actualización:** 2025-11-11
**Versión:** 1.0.0
