# 🔧 Configurar Variables de Entorno en Vercel

## ✅ Archivos Actualizados

Los siguientes archivos ya están listos para usar Neon:
- ✅ `api/booking.js` (actualizado)
- ✅ `api/health.js` (actualizado)
- ✅ `api/lib/db.js` (nuevo - utilidad de conexión)
- ✅ `package.json` (dependencia `pg` agregada)

---

## 📋 Paso 1: Ir a Vercel Dashboard

1. Abrir: **https://vercel.com/dashboard**
2. Seleccionar proyecto: `atacama-nightsky`
3. Ir a: **Settings → Environment Variables**

---

## ❌ Paso 2: ELIMINAR Variables de Supabase

Buscar y **DELETE** estas 3 variables:

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
SUPABASE_ANON_KEY
```

**⚠️ IMPORTANTE:** Eliminar las 3 variables completa antes de continuar.

---

## ✅ Paso 3: AGREGAR Variable de Neon

Click en **Add New** y agregar:

### Variable 1: DATABASE_URL

```
Name: DATABASE_URL
Value: [TU CONNECTION STRING DE NEON]
Environments: Production, Preview, Development (marcar todos)
```

**Ejemplo de connection string:**
```
postgresql://vicente:AbC123XyZ@ep-cool-darkness-123456.us-east-2.aws.neon.tech/atacama?sslmode=require
```

**⚠️ IMPORTANTE:**
- Debe empezar con `postgresql://`
- Debe terminar con `?sslmode=require`
- Copiar EXACTAMENTE como aparece en Neon Dashboard

---

## 💾 Paso 4: Guardar

Click en **Save** → Vercel te preguntará si quieres re-deployar.

**Click "Redeploy"** para aplicar los cambios.

---

## ✅ Verificación

Esperar ~2 minutos a que termine el deployment, luego verificar:

### Test 1: Health Check
```bash
curl https://www.atacamadarksky.cl/api/health
```

**Debe mostrar:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "provider": "Neon PostgreSQL",
      "bookings": 0
    }
  }
}
```

### Test 2: Crear Reserva de Prueba
```bash
curl -X POST https://www.atacamadarksky.cl/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-20",
    "persons": 2,
    "tourType": "regular",
    "name": "Test Neon",
    "email": "test@test.com",
    "phone": "+56912345678"
  }'
```

**Debe responder:**
```json
{
  "success": true,
  "bookingId": "ATK-...",
  "message": "Booking created successfully"
}
```

---

## 🔄 Si algo falla

### Error: "Cannot find module 'pg'"

**Causa:** No se instaló la dependencia en Vercel.

**Solución:**
```bash
# Hacer un nuevo commit para forzar reinstalación
git add .
git commit -m "Force reinstall dependencies"
git push
```

### Error: "Connection timeout" o "Database error"

**Causa:** Connection string incorrecto.

**Solución:**
1. Verificar que el connection string tenga `?sslmode=require` al final
2. Verificar que copiaste TODO el string (no solo una parte)
3. En Neon Dashboard → Connection String → copiar de nuevo

### Error: "Forbidden" o "Invalid credentials"

**Causa:** Password incorrecto en el connection string.

**Solución:**
1. En Neon Dashboard → Settings → Reset Password
2. Copiar el nuevo connection string completo
3. Actualizar `DATABASE_URL` en Vercel

---

## 📊 Resumen de Variables

Después de los cambios, deberías tener estas variables en Vercel:

### ✅ Variables Necesarias:
- `DATABASE_URL` (Neon) ✅ NUEVO
- `RESEND_API_KEY` (Email)
- `GOOGLE_SERVICE_ACCOUNT_KEY` (Calendar)
- `GOOGLE_CALENDAR_ID` (Calendar)
- `ADMIN_EMAIL` (Notificaciones)
- `WHATSAPP_VERIFY_TOKEN` (WhatsApp)
- `WHATSAPP_PHONE_NUMBER_ID` (WhatsApp)
- `WHATSAPP_ACCESS_TOKEN` (WhatsApp)

### ❌ Variables ELIMINADAS:
- ~~SUPABASE_URL~~ ❌
- ~~SUPABASE_SERVICE_KEY~~ ❌
- ~~SUPABASE_ANON_KEY~~ ❌

---

## 🎉 ¡Listo!

Una vez que el health check retorne `"status": "healthy"`, tu migración a Neon está completa.

**Beneficios:**
- ✅ $0/mes vs $25/mes de Supabase
- ✅ Queries ilimitadas
- ✅ Misma funcionalidad
- ✅ Más rápido para serverless

---

**Última actualización:** 2025-11-11
