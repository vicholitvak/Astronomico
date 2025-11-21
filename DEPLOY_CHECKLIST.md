# ✅ Checklist de Deployment - Atacama DarkSky

## 🎯 Resumen de Cambios Implementados

Esta noche (15 Nov 2025) se implementaron las siguientes mejoras:

1. ✅ **Schema.org Markup** para optimización LLM
2. ✅ **Sección FAQ** completa (14 preguntas)
3. ✅ **Sistema de Reviews** (BD + API + Frontend)
4. ✅ **Campo de alojamiento** en formulario de reserva
5. ✅ **Meta tags mejorados** (SEO)

---

## 📋 Pre-Deployment Checklist

### 1. Base de Datos (Neon PostgreSQL)

- [ ] **Conectar a Neon PostgreSQL**
  ```bash
  psql -h ep-xxx-xxx.us-east-2.aws.neon.tech -U usuario -d atacama_db
  ```

- [ ] **Ejecutar migraciones SQL**
  ```bash
  # Opción A: Script completo
  \i database/MIGRATION_COMPLETE.sql

  # Opción B: Scripts individuales
  \i database/neon-setup.sql
  \i database/add-accommodation-field.sql
  \i database/reviews-system.sql
  ```

- [ ] **Verificar que las tablas se crearon**
  ```sql
  \dt
  -- Deberías ver: bookings, reviews, review_responses, review_helpful_votes, etc.
  ```

- [ ] **Verificar funciones**
  ```sql
  \df
  -- Deberías ver: get_review_stats, approve_review, mark_review_helpful, etc.
  ```

### 2. Variables de Entorno en Vercel

- [ ] **DATABASE_URL** - Connection string de Neon PostgreSQL
  ```bash
  vercel env add DATABASE_URL production
  # Pegar: postgresql://USER:PASSWORD@your-neon-host.neon.tech/dbname?sslmode=require
  ```

- [ ] **STRIPE_SECRET_KEY** (si aún no está)
  ```bash
  vercel env add STRIPE_SECRET_KEY production
  # sk_test_... o sk_live_...
  ```

- [ ] **STRIPE_PUBLISHABLE_KEY** (si aún no está)
  ```bash
  vercel env add STRIPE_PUBLISHABLE_KEY production
  # pk_test_... o pk_live_...
  ```

- [ ] **Verificar todas las env vars**
  ```bash
  vercel env ls
  ```

### 3. Dependencies

- [ ] **Verificar package.json tiene:**
  - `pg` - PostgreSQL client
  - `stripe` - Stripe SDK

  ```bash
  npm install pg stripe --save
  ```

### 4. Archivos Nuevos a Deployar

Verificar que estos archivos estén en el repo:

**Base de datos:**
- [ ] `database/reviews-system.sql`
- [ ] `database/add-accommodation-field.sql`
- [ ] `database/MIGRATION_COMPLETE.sql`

**API Endpoints:**
- [ ] `api/reviews.js`
- [ ] `api/review-helpful.js`

**Frontend:**
- [ ] `reviews.js`
- [ ] `reviews-styles.css`
- [ ] `faq-styles.css`

**Documentación:**
- [ ] `LLM_OPTIMIZATION_GUIDE.md`
- [ ] `IMPLEMENTATION_SUMMARY.md`
- [ ] `DEPLOY_CHECKLIST.md` (este archivo)

**Modificaciones:**
- [ ] `index.html` (Schema.org, FAQ, meta tags, links a CSS/JS)
- [ ] `stripe-checkout.js` (campo accommodation)
- [ ] `api/create-checkout.js` (campo accommodation)

### 5. Validaciones Pre-Deploy

- [ ] **Validar Schema.org markup**
  - Ir a: https://validator.schema.org
  - Pegar el contenido de los `<script type="application/ld+json">` del index.html
  - Verificar que no hay errores

- [ ] **Testear FAQ localmente**
  - Abrir index.html en browser
  - Verificar que las FAQs se expanden/contraen correctamente
  - Verificar que el scroll es suave

- [ ] **Revisar meta tags**
  - Title: "Tours Astronómicos en San Pedro de Atacama | Telescopio Profesional..."
  - Description: Debe ser descriptiva y tener keywords relevantes
  - Open Graph tags presentes

---

## 🚀 Deployment Steps

### Paso 1: Commit y Push

```bash
# Ver cambios
git status

# Agregar archivos nuevos y modificados
git add .

# Commit con mensaje descriptivo
git commit -m "Add LLM optimization, FAQ section, reviews system, and accommodation field

- Add Schema.org JSON-LD markup for SEO and LLM discovery
- Add comprehensive FAQ section (14 questions) with Brazilian Portuguese support
- Implement complete reviews system (database, API, frontend)
- Add accommodation field to booking form and Stripe metadata
- Improve meta tags for better SEO
- Add FAQ and reviews styling
- Update documentation"

# Push a GitHub
git push origin main
```

### Paso 2: Deploy a Vercel

```bash
# Deploy a producción
vercel --prod

# O si prefieres preview primero
vercel

# Luego promover a producción desde dashboard
```

### Paso 3: Verificar Deploy

- [ ] **Sitio accesible**
  - Visitar: https://www.atacamadarksky.cl
  - Verificar que carga sin errores

- [ ] **Schema.org visible**
  - View Source → buscar `<script type="application/ld+json">`
  - Debe estar presente y sin errores

- [ ] **Sección FAQ funciona**
  - Scroll a sección FAQ
  - Click en preguntas → deben expandirse/contraerse
  - Verificar que estilos se ven bien

- [ ] **Sistema de Reviews**
  - Verificar que `/api/reviews` responde (aunque sin reviews aún)
  - Curl test:
    ```bash
    curl https://www.atacamadarksky.cl/api/reviews?status=approved&limit=5
    ```

- [ ] **Campo de alojamiento en formulario**
  - Ir a sección de reservas
  - Verificar que campo "Hostal o Dirección de Alojamiento" está presente

---

## 🧪 Post-Deployment Testing

### Test 1: API de Reviews

```bash
# Test GET reviews (debería retornar array vacío inicialmente)
curl https://www.atacamadarksky.cl/api/reviews?status=approved

# Test stats
curl https://www.atacamadarksky.cl/api/reviews?stats=true
```

### Test 2: Schema.org Validation

1. Ir a: https://search.google.com/test/rich-results
2. Pegar URL: https://www.atacamadarksky.cl
3. Ejecutar test
4. Verificar que detecta:
   - TouristAttraction
   - LocalBusiness
   - Offers (3 tipos de tours)

### Test 3: FAQ Functionality

1. Abrir sitio en mobile y desktop
2. Click en cada FAQ
3. Verificar animaciones suaves
4. Verificar que solo 1 FAQ abierto a la vez

### Test 4: Stripe con Accommodation

1. Intentar hacer reserva de prueba (test mode)
2. Llenar campo de alojamiento: "Hotel Test"
3. Completar checkout
4. Verificar en Stripe Dashboard → Payment → Metadata
5. Debe aparecer: `customerAccommodation: "Hotel Test"`

---

## 📊 Monitoreo Post-Deploy

### Primera Semana

- [ ] **Monitorear errores en Vercel Dashboard**
  - Ir a: Vercel Dashboard → Project → Logs
  - Filtrar por errores (500, 400, etc.)

- [ ] **Verificar que FAQs están siendo indexadas**
  ```bash
  # Usar Google Search Console
  # Request indexing para: https://www.atacamadarksky.cl#faq
  ```

- [ ] **Tracking de descubrimiento por LLMs**
  - Preguntar a cada cliente: "¿Cómo nos encontraste?"
  - Registrar menciones de ChatGPT, Claude, Grok
  - Meta: Al menos 1 reserva vía LLM en primera semana

- [ ] **Solicitar primeras reviews**
  - Contactar a los 2 primeros clientes que ya hiciste el tour
  - Enviarles link para dejar review
  - Meta: 3 reviews aprobadas en primera semana

### Primera 30 Días

- [ ] **Optimizar FAQs basado en preguntas recurrentes**
  - Si clientes preguntan lo mismo → agregar FAQ
  - Actualizar respuestas basado en feedback

- [ ] **Analizar tráfico desde LLMs**
  - Usar Google Analytics
  - Buscar referrers con "chatgpt", "claude.ai", etc.

- [ ] **Completar Google My Business**
  - Agregar todas las fotos
  - Responder a todas las reviews
  - Actualizar info basada en FAQs

---

## 🔄 Rollback Plan (Si algo sale mal)

### Si el sitio no carga:

```bash
# Revertir a versión anterior en Vercel Dashboard
# O hacer rollback del commit:
git revert HEAD
git push origin main
vercel --prod
```

### Si la base de datos tiene problemas:

```sql
-- Eliminar tablas de reviews (si causan problemas)
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS review_responses CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- Eliminar campo accommodation (si causa problemas)
ALTER TABLE bookings DROP COLUMN IF EXISTS accommodation;
```

### Si las FAQs rompen el layout:

```html
<!-- Comentar temporalmente la sección FAQ en index.html -->
<!-- <section id="faq" class="faq-section"> ... </section> -->
```

---

## 📞 Soporte y Ayuda

### Si tienes problemas:

1. **Revisar logs de Vercel:**
   - Vercel Dashboard → Project → Logs
   - Buscar errores 500, 400, etc.

2. **Revisar logs de Neon:**
   - Neon Dashboard → Database → Logs
   - Buscar queries que fallan

3. **Testear APIs directamente:**
   ```bash
   # Test review API
   curl -X POST https://www.atacamadarksky.cl/api/reviews \
     -H "Content-Type: application/json" \
     -d '{
       "booking_id": "ATK-TEST-001",
       "overall_rating": 5,
       "reviewer_name": "Test User",
       "reviewer_email": "test@example.com",
       "comment": "Great tour!"
     }'
   ```

4. **Contactar soporte:**
   - Vercel: https://vercel.com/support
   - Neon: https://neon.tech/docs/introduction/support

---

## 🎯 Métricas de Éxito

### Semana 1:
- [ ] 0 errores críticos en producción
- [ ] Schema.org markup validado por Google
- [ ] Al menos 1 FAQ expandido por 50% de visitantes
- [ ] 3 reviews aprobadas y publicadas

### Mes 1:
- [ ] 10+ reviews con promedio 4.5+ estrellas
- [ ] 1+ reserva originada de ChatGPT/Claude/Grok
- [ ] FAQs en top 3 de páginas más visitadas
- [ ] Rich snippets apareciendo en Google Search

### Mes 3:
- [ ] 25+ reviews
- [ ] 5+ reservas de LLMs
- [ ] Featured snippets en Google para "tours astronómicos atacama"
- [ ] 10+ menciones orgánicas en blogs/redes

---

## ✅ Sign-Off Final

Antes de marcar como completado:

- [ ] Todas las migraciones SQL ejecutadas sin errores
- [ ] Todos los archivos deployados a Vercel
- [ ] Todas las validaciones pasadas
- [ ] Monitoreo configurado
- [ ] Cliente informado de nuevas funcionalidades
- [ ] Documentación actualizada

**Deployed by:** _________
**Date:** _________
**Vercel URL:** https://www.atacamadarksky.cl
**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Deployed | ⬜ Verified

---

**Última actualización:** 2025-11-15
**Versión:** 1.0.0
