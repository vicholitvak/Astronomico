# 📱 Configuración WhatsApp Business - PENDIENTE DE DESBLOQUEO

## ✅ Credenciales Obtenidas

### 1. WHATSAPP_ACCESS_TOKEN
```
EAAossEgrvNUBPxRkFhcaIx2xTh9jcUP4hWtNrS4Wfq7QfhOZCoRQBYfOz90tQK78HSwMPfjtraaSdEsiYKWqqAspSgu8HFao29UddcCDY4JBlC1GuQ5JSxipQPo2NGPRd4XJbtkwTauObzItFPb6nK3ZAZA6C18XnzCJ0vcg3cgPDxxGBI8xCTmW8LnZBkVdkOxwTrtZASQYxPZCzGuC1jnryp60Lc0FFj6h0PS39LIWSp9GauJkZCjAZAIo9ZBZB4m3nfQ7JOn6ImzDf4JBKZCaz99EgZDZD
```

**Nota:** Este token puede expirar. Cuando se desbloquee la cuenta, verifica que siga siendo válido o genera uno nuevo permanente.

### 2. APP_ID
```
2863885403798741
```

### 3. ADMIN_PHONE_NUMBER
```
56935134669
```
(Formato sin + ni espacios)

---

## ⏳ PENDIENTE - Esperar Desbloqueo

### ❌ WHATSAPP_PHONE_NUMBER_ID
**Estado:** No disponible por restricción de cuenta

**Cómo obtenerlo cuando se desbloquee:**
1. Ve a: https://developers.facebook.com/apps/2863885403798741
2. WhatsApp → API Setup
3. Busca "Phone number ID" en la sección de mensajes
4. Copia el número de 15 dígitos

---

## 📋 Pasos Completados

✅ Creada aplicación en Meta: `Atacama NightSky Bot`
✅ Agregado producto WhatsApp
✅ Obtenido Access Token temporal
✅ Identificado número de teléfono del negocio

---

## 🚧 Estado de Restricción

**Mensaje de Meta:**
> "Tu cuenta de WhatsApp Business está restringida"

**Acción tomada:**
- Solicitud de revisión enviada el: **2025-11-12**
- Tiempo estimado de respuesta: **1-5 días hábiles**

**Razón probable:**
- Cuenta nueva sin verificación de negocio
- Se requiere verificación de Business Manager

---

## ✅ Cuando se Desbloquee - Pasos Finales

### 1. Obtener Phone Number ID
```bash
# Una vez desbloqueado, ve a API Setup y copia el Phone Number ID
```

### 2. Agregar Variables a Vercel
```bash
vercel env add WHATSAPP_PHONE_NUMBER_ID production
# Pegar el Phone Number ID

vercel env add WHATSAPP_ACCESS_TOKEN production
# Pegar: EAAossEgrvNU...

vercel env add ADMIN_PHONE_NUMBER production
# Pegar: 56935134669

vercel env add WHATSAPP_VERIFY_TOKEN production
# Crear un token aleatorio (ej: "atacama_webhook_2025")
```

### 3. Configurar Webhook en Meta
1. Ve a: WhatsApp → Configuration
2. Callback URL: `https://www.atacamadarksky.cl/api/whatsapp-webhook`
3. Verify Token: El mismo que pusiste en WHATSAPP_VERIFY_TOKEN
4. Subscribe to fields:
   - ✅ messages
   - ✅ messaging_postbacks

### 4. Redeploy
```bash
vercel --prod
```

### 5. Probar el Bot
Envía un WhatsApp al número de la cuenta con:
```
Hola, quisiera información sobre los tours
```

---

## 🔗 Enlaces Útiles

- **App Dashboard:** https://developers.facebook.com/apps/2863885403798741
- **Business Manager:** https://business.facebook.com/
- **Verificación de Negocio:** https://business.facebook.com/settings/info
- **Centro de Ayuda:** https://business.facebook.com/business/help

---

## 📊 Variables Completas (Para Referencia)

Cuando esté todo listo, deberías tener estas variables en Vercel:

```env
# Base de Datos
DATABASE_URL=postgresql://neondb_owner:...

# Email
RESEND_API_KEY=re_...
ADMIN_EMAIL=vicente.litvak@gmail.com

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_KEY={...}
GOOGLE_CALENDAR_ID=...

# WhatsApp (PENDIENTES)
WHATSAPP_PHONE_NUMBER_ID=XXXXXXXXXXXXXXX  ← PENDIENTE
WHATSAPP_ACCESS_TOKEN=EAAossEgrvNU...     ✅
ADMIN_PHONE_NUMBER=56935134669            ✅
WHATSAPP_VERIFY_TOKEN=atacama_webhook_2025  ← CREAR
```

---

**Última actualización:** 2025-11-12
**Estado:** Esperando desbloqueo de cuenta WhatsApp Business
