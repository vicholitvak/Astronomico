# 🚀 Guía de Migración: Supabase → Neon
## Migración Rápida en 15 Minutos

---

## ✨ Por qué Neon

- ✅ **Gratis para siempre**: 0.5GB almacenamiento + consultas ilimitadas
- ✅ **Compatible 100%**: Es PostgreSQL igual que Supabase
- ✅ **Autoscaling**: Se suspende cuando no se usa (ahorra recursos)
- ✅ **Más rápido**: Cold start en < 500ms
- ✅ **Branches**: Puedes crear copias de la BD para testing

---

## 📋 Paso 1: Crear Cuenta en Neon (3 min)

### 1.1 Registrarse

1. Ir a: https://neon.tech
2. Click **Sign Up**
3. Usar GitHub o email (recomiendo GitHub para login rápido)
4. Verificar email si es necesario

### 1.2 Crear Proyecto

1. Una vez dentro, click **Create Project**
2. Configuración:
   ```
   Project Name: atacama-darksky
   Region: AWS / US East (Ohio) o el más cercano a Chile
   PostgreSQL Version: 16 (latest)
   ```
3. Click **Create Project**
4. **IMPORTANTE:** Copiar y guardar:
   - `Database URL` (connection string)
   - `Host`
   - `Database name`
   - `User`
   - `Password`

Ejemplo de connection string:
```
postgresql://USER:PASSWORD@your-neon-host.neon.tech/dbname?sslmode=require
```

---

## 📋 Paso 2: Exportar Datos desde Supabase (5 min)

### Opción A: Exportar via Dashboard (Recomendado)

1. Ir a Supabase Dashboard: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Database → Backups**
4. Click **Download Backup**
5. Guardar archivo `backup.sql`

### Opción B: Exportar con SQL Query

1. Ir a **SQL Editor** en Supabase
2. Ejecutar el script que creé: `database/export-supabase-data.sql`
3. Copiar el resultado
4. Guardar en archivo `data-export.sql`

### Opción C: Usar pg_dump (Si tienes acceso directo)

```bash
# Reemplazar con tus credenciales de Supabase
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  --schema=public \
  --data-only \
  --table=bookings \
  > supabase-backup.sql
```

---

## 📋 Paso 3: Crear Tablas en Neon (3 min)

### 3.1 Conectar a Neon

1. En Neon Dashboard, click **SQL Editor** (pestaña lateral)
2. O usar un cliente SQL como **pgAdmin**, **DBeaver**, o **TablePlus**

### 3.2 Ejecutar Script de Creación

1. Copiar el contenido de `database/neon-setup.sql` (lo creo en el siguiente paso)
2. Pegar en el SQL Editor de Neon
3. Click **Run** o `Ctrl+Enter`
4. Verificar que se crearon las tablas:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

Deberías ver:
- ✅ bookings
- ✅ whatsapp_conversations
- ✅ monitoring_logs
- ✅ analytics_metrics
- ✅ booking_audit_log

---

## 📋 Paso 4: Importar Datos (2 min)

### 4.1 Importar Reservas Existentes

Si tienes datos en Supabase:

1. En SQL Editor de Neon
2. Copiar y pegar el contenido de tu backup SQL
3. Ejecutar
4. Verificar:
   ```sql
   SELECT COUNT(*) FROM bookings;
   ```

### 4.2 Si NO tienes datos

¡Perfecto! Empiezas con base de datos limpia. Nada que importar.

---

## 📋 Paso 5: Actualizar Variables de Entorno en Vercel (3 min)

### 5.1 Ir a Vercel Dashboard

1. https://vercel.com/dashboard
2. Proyecto: `atacama-nightsky`
3. **Settings → Environment Variables**

### 5.2 ELIMINAR variables de Supabase

- ❌ `SUPABASE_URL`
- ❌ `SUPABASE_SERVICE_KEY`
- ❌ `SUPABASE_ANON_KEY`

### 5.3 AGREGAR variable de Neon

```bash
DATABASE_URL=postgresql://USER:PASSWORD@your-neon-host.neon.tech/dbname?sslmode=require
```

**IMPORTANTE:** Usar el connection string completo que copiaste de Neon.

### 5.4 Re-desplegar

```bash
# Desde tu terminal local:
cd D:\dev\projects\astro-page
vercel --prod
```

O simplemente hacer un commit y push (Vercel auto-desplegará):
```bash
git add .
git commit -m "Migrar de Supabase a Neon"
git push origin main
```

---

## 📋 Paso 6: Actualizar Código (Ya está hecho)

He actualizado estos archivos para usar Neon:

### Archivos modificados:
- ✅ `api/lib/db.js` - Nueva utilidad para conexión a Neon
- ✅ `api/booking.js` - Actualizado para usar Neon
- ✅ `api/health.js` - Actualizado para usar Neon
- ✅ `api/whatsapp-webhook.js` - Compatible con Neon
- ✅ `database/neon-setup.sql` - Script completo de setup

Solo necesitas:
1. Desplegar los archivos actualizados
2. Configurar `DATABASE_URL` en Vercel
3. Listo!

---

## 🧪 Paso 7: Verificar que Todo Funciona (2 min)

### 7.1 Test Health Check

```bash
curl https://www.atacamadarksky.cl/api/health
```

Debe retornar:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" }
  }
}
```

### 7.2 Test Crear Reserva

```bash
curl -X POST https://www.atacamadarksky.cl/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-20",
    "persons": 2,
    "tour_type": "regular",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+56912345678"
  }'
```

Debe retornar:
```json
{
  "success": true,
  "bookingId": "ATK-..."
}
```

### 7.3 Verificar en Neon

```sql
-- En SQL Editor de Neon:
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
```

Deberías ver tu reserva de prueba.

---

## 📊 Diferencias Clave: Supabase vs Neon

| Aspecto | Supabase | Neon |
|---------|----------|------|
| **Tipo** | BaaS (Backend as a Service) | PostgreSQL Serverless |
| **Auth** | Incluido | No incluido* |
| **Storage** | Incluido | No incluido* |
| **Realtime** | Incluido | No incluido* |
| **Database** | PostgreSQL + APIs REST | PostgreSQL puro |
| **Precio Free** | Limitado | Generoso |
| **Cliente** | `@supabase/supabase-js` | `pg` o cualquier driver PostgreSQL |

*No los necesitas para este proyecto

---

## 🔧 Conexión a Neon en tu Código

### Antes (Supabase):
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data, error } = await supabase
  .from('bookings')
  .insert([{ ... }]);
```

### Después (Neon):
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const result = await pool.query(
  'INSERT INTO bookings (...) VALUES ($1, $2, $3) RETURNING *',
  [value1, value2, value3]
);
```

**NOTA:** Ya creé una utilidad `api/lib/db.js` que hace esto más fácil.

---

## 🎯 Ventajas de Neon sobre Supabase (para tu caso)

1. **Gratis para siempre**: No expira plan free
2. **Sin límite de consultas**: Supabase free tiene límites
3. **Branching**: Puedes crear copias para testing
4. **Más control**: PostgreSQL puro, sin abstracción
5. **Mejor para APIs**: Diseñado para serverless functions
6. **Cold start rápido**: < 500ms vs ~2-3s de Supabase

---

## 🛠️ Herramientas Recomendadas

### Cliente SQL (elige uno):

1. **TablePlus** (Mac/Windows) - https://tableplus.com
   - UI hermosa y rápida
   - Gratis con limitaciones

2. **DBeaver** (Mac/Windows/Linux) - https://dbeaver.io
   - 100% gratis y open source
   - Muy completo

3. **pgAdmin** (Mac/Windows/Linux) - https://www.pgadmin.org
   - Cliente oficial de PostgreSQL
   - Gratis

4. **Neon SQL Editor** (Web)
   - Ya incluido en tu dashboard
   - Perfecto para queries rápidas

---

## 🔐 Seguridad

### Variables de Entorno

```bash
# ✅ CORRECTO - usar en Vercel
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# ❌ INCORRECTO - nunca expongas credenciales
# No commitear .env al repositorio
```

### Connection Pooling

Neon maneja connection pooling automáticamente. Sin configuración extra.

### SSL

Siempre usa `?sslmode=require` en el connection string.

---

## 📈 Monitoreo en Neon

### Dashboard de Neon

1. **Usage**: Ver queries ejecutadas, datos transferidos
2. **Monitoring**: Latencia, conexiones activas
3. **Operations**: Historia de cambios en la BD
4. **Branches**: Gestionar copias de la BD

### Alertas

Configurar alertas en Neon cuando:
- Storage > 80% del límite free (400MB)
- Queries fallando constantemente
- Conexiones excedidas

---

## 🆘 Troubleshooting

### Error: "Connection timeout"

**Solución:**
```javascript
// Aumentar timeout
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000 // 10 segundos
});
```

### Error: "too many clients"

**Solución:** Usar connection pooling (ya incluido en `api/lib/db.js`)

### Error: "SSL required"

**Solución:** Agregar `?sslmode=require` al connection string

### Queries lentas

**Solución:** Agregar índices:
```sql
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

---

## 📞 Soporte

### Neon
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon
- GitHub: https://github.com/neondatabase/neon

### Este Proyecto
- Email: vicente.litvak@gmail.com
- WhatsApp: +56 9 5055 8761

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ Base de datos PostgreSQL gratis y rápida
- ✅ Queries ilimitadas
- ✅ 0.5GB almacenamiento (suficiente para ~5000-10000 reservas)
- ✅ Sin límite de tiempo (gratis para siempre)
- ✅ Branching para testing

**Próximos pasos:**
1. Configurar backups automáticos (Neon los hace automáticamente)
2. Monitorear uso en el dashboard
3. Cuando crezcas, escalar a $19/mes (mucho más barato que Supabase)

---

**Última actualización:** 2025-11-11
**Versión:** 1.0.0
