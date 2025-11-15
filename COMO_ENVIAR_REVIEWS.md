# 📱 Cómo Enviar Links de Review por WhatsApp

## Sistema de Reviews - Guía Rápida

Has creado una página especial para que tus clientes dejen reviews después del tour. Esta página es mobile-friendly y fácil de usar desde WhatsApp.

---

## 🔗 URL del Formulario de Review

La página de reviews está en:
```
https://atacamadarksky.cl/review-form.html
```

---

## 📲 Cómo Enviar el Link a tus Clientes

### Opción 1: Link Simple (Sin Booking ID)

Si no necesitas trackear el booking específico:

```
https://atacamadarksky.cl/review-form.html
```

**Mensaje de WhatsApp sugerido:**
```
¡Hola [Nombre]! 🌌

Gracias por vivir esta experiencia bajo las estrellas con nosotros.
Tu opinión es muy importante para ayudarnos a mejorar y para que
más personas descubran el cielo de Atacama.

¿Podrías compartir tu experiencia? Solo te tomará 2 minutos:
👉 https://atacamadarksky.cl/review-form.html

¡Esperamos verte pronto nuevamente! ✨

Vicente
Atacama NightSky
```

### Opción 2: Link con Booking ID (Recomendado)

Si quieres asociar la review con una reserva específica:

```
https://atacamadarksky.cl/review-form.html?booking_id=ATK-2025-001
```

**Mensaje de WhatsApp sugerido:**
```
¡Hola [Nombre]! 🌌

Fue un placer compartir el cielo del Atacama contigo anoche.

¿Nos ayudas a mejorar? Tu opinión es muy valiosa:
👉 https://atacamadarksky.cl/review-form.html?booking_id=ATK-2025-001

Solo 2 minutos y nos ayudas a que más personas descubran
esta experiencia única ⭐

¡Gracias!
Vicente - Atacama NightSky
```

**Reemplaza `ATK-2025-001` con el booking_id real de cada cliente**

---

## 📝 Qué Información Pide el Formulario

El formulario solicita:

**Obligatorio:**
- ✅ Nombre completo
- ✅ Email
- ✅ Fecha del tour
- ✅ Tipo de tour (Regular, Privado, Astrofotografía)
- ✅ Calificación general (1-5 estrellas)

**Opcional:**
- País de origen
- Calificaciones específicas (Guía, Equipamiento, Ubicación, Precio)
- Título de la review
- Comentario detallado

---

## ⏰ Cuándo Enviar el Link

**Mejor momento:** 12-24 horas después del tour

- La experiencia está fresca en su memoria
- Ya están en su hotel/hostal con tiempo
- Mayor probabilidad de respuesta

**Enviar el link:**
1. ✅ Inmediatamente después del tour (si el cliente lo menciona)
2. ✅ Al día siguiente por la mañana (RECOMENDADO)
3. ❌ No esperar más de 3 días (baja la tasa de respuesta)

---

## 📊 Cómo Ver las Reviews Recibidas

Las reviews se guardan en tu base de datos Neon PostgreSQL.

### Ver todas las reviews (pendientes y aprobadas):

Conecta a Neon SQL Editor y ejecuta:

```sql
SELECT
  review_id,
  reviewer_name,
  reviewer_email,
  overall_rating,
  status,
  created_at,
  comment
FROM reviews
ORDER BY created_at DESC;
```

### Ver solo las pendientes de aprobación:

```sql
SELECT
  review_id,
  reviewer_name,
  overall_rating,
  title,
  comment,
  created_at
FROM reviews
WHERE status = 'pending'
ORDER BY created_at DESC;
```

---

## ✅ Cómo Aprobar una Review

Cuando recibas una review, estará en estado `pending`. Para aprobarla:

```sql
-- Aprobar una review específica
SELECT approve_review('REV-1234567890-abc123');

-- Ver las reviews aprobadas
SELECT * FROM reviews WHERE status = 'approved';
```

**Para rechazar una review:**

```sql
UPDATE reviews
SET status = 'rejected',
    moderation_notes = 'Razón del rechazo aquí'
WHERE review_id = 'REV-1234567890-abc123';
```

---

## 📈 Estadísticas de Reviews

Para ver estadísticas generales:

```sql
-- Stats de todos los tours
SELECT * FROM get_review_stats();

-- Stats de un tipo de tour específico
SELECT * FROM get_review_stats('regular');
SELECT * FROM get_review_stats('private');
SELECT * FROM get_review_stats('astrophoto');
```

Esto te dará:
- Total de reviews
- Promedio de calificación
- Distribución de estrellas (5★, 4★, 3★, 2★, 1★)
- Total aprobadas
- Total pendientes

---

## 🎯 Tips para Obtener Más Reviews

1. **Pide la review en el momento adecuado**
   - Al final del tour si fue excepcional
   - Al día siguiente cuando tienen tiempo

2. **Personaliza el mensaje**
   - Usa el nombre del cliente
   - Menciona algo específico del tour (galaxia que vieron, foto que sacaron)

3. **Hazlo fácil**
   - Link directo, un solo click
   - Formulario corto (2 minutos)
   - Mobile-friendly

4. **Agradece siempre**
   - Responde a cada review
   - Usa la función de responses:

```sql
INSERT INTO review_responses (review_id, response_text)
VALUES (
  'REV-1234567890-abc123',
  '¡Gracias [Nombre]! Fue un placer compartir el cielo contigo.
  Esperamos verte pronto nuevamente bajo las estrellas del Atacama 🌟'
);
```

---

## 🔄 Flujo Completo

```
1. Cliente hace tour
   ↓
2. Envías WhatsApp con link (12-24h después)
   ↓
3. Cliente llena formulario (2 min)
   ↓
4. Review llega a DB con status='pending'
   ↓
5. Revisas y apruebas (SQL)
   ↓
6. Review visible en tu sitio web
   ↓
7. (Opcional) Respondes a la review
```

---

## 🌟 Ejemplo de Link Completo para Copiar

Para el cliente "Juan" que hizo tour el 15 de enero con booking ATK-2025-015:

```
¡Hola Juan! 🌌

Gracias por esta noche mágica bajo las estrellas del Atacama.

Tu opinión nos ayuda muchísimo. ¿Podrías compartir tu experiencia?
👉 https://atacamadarksky.cl/review-form.html?booking_id=ATK-2025-015

Solo 2 minutos y ayudas a otros viajeros a descubrir esta experiencia ⭐

¡Esperamos verte pronto!
Vicente - Atacama NightSky
```

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo enviar el mismo link a todos?**
R: Sí, pero es mejor personalizar con el booking_id para trackear mejor.

**P: ¿Las reviews se publican automáticamente?**
R: No, todas inician como 'pending'. Tú decides cuáles aprobar.

**P: ¿Cómo sé si alguien dejó una review nueva?**
R: Revisa periódicamente la tabla `reviews` en Neon. (Próximamente: notificaciones automáticas)

**P: ¿Puedo editar una review después?**
R: Sí, puedes actualizar cualquier campo directamente en la base de datos.

**P: ¿Cuántas reviews debo tener antes de mostrarlas en el sitio?**
R: Mínimo 3-5 reviews de calidad para dar credibilidad.

---

## 📞 Soporte

Si tienes problemas con el sistema de reviews, revisa:
- Logs en Vercel: https://vercel.com/vicholitvaks-projects/astronomico
- Base de datos en Neon: https://console.neon.tech
- API endpoint: https://atacamadarksky.cl/api/reviews

---

¡Buena suerte recolectando reviews! 🌟
