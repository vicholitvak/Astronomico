# 🚀 Quick Start: Migración a Neon en 15 Minutos

---

## Paso 1: Crear Cuenta en Neon (3 min)

1. Ir a: **https://neon.tech**
2. Click **Sign Up** (usa GitHub para login rápido)
3. Click **Create Project**
   - Name: `atacama-darksky`
   - Region: `AWS / US East (Ohio)`
   - PostgreSQL: `16`
4. **COPIAR Y GUARDAR** el connection string:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require
   ```

---

## Paso 2: Crear Tablas en Neon (3 min)

1. En Neon Dashboard → **SQL Editor**
2. Copiar TODO el contenido de: `database/neon-setup.sql`
3. Pegar en el editor
4. Click **Run** (o `Ctrl+Enter`)
5. Verificar que dice: `"Neon database setup completed successfully! 🚀"`

---

## Paso 3: Instalar Dependencia `pg` (2 min)

```bash
cd D:\dev\projects\astro-page
npm install pg
```

---

## Paso 4: Actualizar Vercel (3 min)

### 4.1 Variables de Entorno

1. Ir a: **https://vercel.com/dashboard**
2. Proyecto `atacama-nightsky` → **Settings → Environment Variables**

### 4.2 ELIMINAR estas variables:
- ❌ `SUPABASE_URL`
- ❌ `SUPABASE_SERVICE_KEY`
- ❌ `SUPABASE_ANON_KEY`

### 4.3 AGREGAR esta variable:
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require
```
(Usar TU connection string de Neon)

Click **Save**

---

## Paso 5: Actualizar Archivos y Desplegar (4 min)

### 5.1 Reemplazar archivos

Renombrar estos archivos (el código nuevo ya está listo):

```bash
# En D:\dev\projects\astro-page\api\

# Hacer backup de los originales
mv booking.js booking-supabase-backup.js
mv health.js health-supabase-backup.js

# Renombrar los nuevos
mv booking-neon.js booking.js
mv health-neon.js health.js
```

O simplemente **COPIAR el contenido** de:
- `booking-neon.js` → `booking.js`
- `health-neon.js` → `health.js`

### 5.2 Desplegar a Vercel

```bash
cd D:\dev\projects\astro-page
git add .
git commit -m "Migrar de Supabase a Neon"
git push origin main
```

Vercel auto-desplegará en ~2 minutos.

O manualmente:
```bash
vercel --prod
```

---

## ✅ Verificación (2 min)

### Test 1: Health Check

```bash
curl https://www.atacamadarksky.cl/api/health
```

**Debe retornar:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "provider": "Neon PostgreSQL"
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
    "tour_type": "regular",
    "name": "Test Neon",
    "email": "test@example.com",
    "phone": "+56912345678"
  }'
```

**Debe retornar:**
```json
{
  "success": true,
  "bookingId": "ATK-..."
}
```

### Test 3: Verificar en Neon

1. Neon Dashboard → **SQL Editor**
2. Ejecutar:
   ```sql
   SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
   ```
3. Deberías ver tu reserva de prueba

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ PostgreSQL en Neon (gratis para siempre)
- ✅ 0.5GB almacenamiento (~5000 reservas)
- ✅ Queries ilimitadas
- ✅ Mismo código, mejor base de datos
- ✅ $0 al mes vs $25 de Supabase

---

## 🔄 Si algo falla

### Error: "Cannot find module 'pg'"

**Solución:**
```bash
npm install pg
vercel --prod
```

### Error: "Connection timeout"

**Solución:** Verificar que el connection string tenga `?sslmode=require` al final

### Error: "Database error"

**Solución:** Verificar que ejecutaste `database/neon-setup.sql` completo en Neon

---

## 📞 Soporte

- **Guía completa:** Ver `NEON_MIGRATION_GUIDE.md`
- **Email:** vicente.litvak@gmail.com
- **WhatsApp:** +56 9 5055 8761

---

**Tiempo total:** ~15 minutos ⏱️
**Ahorro mensual:** $25 USD 💰
**Última actualización:** 2025-11-11
