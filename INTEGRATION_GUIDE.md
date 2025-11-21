# 🔗 GUÍA DE INTEGRACIÓN - Sistema de Itinerarios

## 🎯 Opciones de Integración

Tienes **3 formas** de integrar el sistema en tu sitio:

---

## ✅ OPCIÓN 1: Página Standalone (MÁS RÁPIDA)

### Paso 1: Agregar enlace en tu index.html

```html
<!-- En tu menú de navegación (busca la sección de nav) -->
<li><a href="/itinerary-builder.html">
    <i class="fas fa-route"></i> Diseña Tu Expedición
</a></li>
```

### Paso 2: Desplegar

```bash
git add lib/ api/ itinerary-builder.html
git commit -m "Add itinerary builder system"
git push
```

### Paso 3: Probar

Abre: `https://atacamadarksky.cl/itinerary-builder.html`

**✅ Ventajas:**
- Implementación inmediata (5 minutos)
- No afecta tu código existente
- Fácil de mantener

**❌ Desventajas:**
- Página separada (no integrada visualmente)

---

## ✅ OPCIÓN 2: Integrar en index.html (RECOMENDADA)

### Paso 1: Agregar sección en index.html

Busca una sección apropiada (después de tours, antes de contacto) y agrega:

```html
<!-- Sección Diseña Tu Expedición -->
<section id="itinerary-builder" class="itinerary-section">
    <div class="container">
        <h2 class="section-title">✨ Diseña Tu Expedición Perfecta</h2>
        <p class="section-subtitle">
            Itinerario personalizado basado en tus preferencias y ritmo de viaje
        </p>

        <div id="wizard-container">
            <!-- El wizard se cargará aquí -->
        </div>
    </div>
</section>

<style>
.itinerary-section {
    padding: 80px 20px;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
}

.section-title {
    text-align: center;
    font-size: 2.5rem;
    color: white;
    margin-bottom: 20px;
}

.section-subtitle {
    text-align: center;
    color: rgba(255,255,255,0.7);
    margin-bottom: 40px;
    font-size: 1.2rem;
}

#wizard-container {
    max-width: 800px;
    margin: 0 auto;
}
</style>

<script type="module">
    // Cargar el wizard
    fetch('/itinerary-builder.html')
        .then(r => r.text())
        .then(html => {
            // Extraer solo el contenido del wizard (sin <html><body>)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const wizardCard = doc.querySelector('.wizard-card');

            if (wizardCard) {
                document.getElementById('wizard-container').appendChild(wizardCard);
            }
        });
</script>
```

### Paso 2: Agregar botón en hero section

```html
<!-- En tu hero section actual -->
<div class="cta-buttons">
    <a href="#reserva" class="btn btn-primary">Reservar Tour</a>
    <a href="#itinerary-builder" class="btn btn-secondary">
        <i class="fas fa-route"></i> Diseña Tu Expedición
    </a>
</div>
```

**✅ Ventajas:**
- Totalmente integrado
- User experience fluida
- Mismo estilo visual

**❌ Desventajas:**
- Requiere más tiempo de integración (30 min)

---

## ✅ OPCIÓN 3: Modal/Popup (MÁS ELEGANTE)

### Implementación

```html
<!-- Botón trigger -->
<button id="open-builder" class="btn btn-accent">
    <i class="fas fa-magic"></i> Diseña Tu Viaje Perfecto
</button>

<!-- Modal container -->
<div id="itinerary-modal" class="modal" style="display:none;">
    <div class="modal-backdrop"></div>
    <div class="modal-content">
        <button class="modal-close" id="close-builder">&times;</button>
        <div id="wizard-content"></div>
    </div>
</div>

<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(10px);
}

.modal-content {
    position: relative;
    max-width: 900px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 10000;
}

.modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    font-size: 2rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10001;
}

.modal-close:hover {
    background: rgba(255,255,255,0.2);
}
</style>

<script>
document.getElementById('open-builder').addEventListener('click', async () => {
    const modal = document.getElementById('itinerary-modal');
    const content = document.getElementById('wizard-content');

    // Cargar wizard
    const response = await fetch('/itinerary-builder.html');
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const wizardCard = doc.querySelector('.wizard-card');

    content.innerHTML = '';
    content.appendChild(wizardCard);

    modal.style.display = 'flex';
});

document.getElementById('close-builder').addEventListener('click', () => {
    document.getElementById('itinerary-modal').style.display = 'none';
});
</script>
```

**✅ Ventajas:**
- Experiencia premium
- No interrumpe navegación
- Fácil de cerrar

**❌ Desventajas:**
- Más complejo de implementar

---

## 🔧 Configuración Avanzada

### Personalizar Colores del Wizard

Edita `itinerary-builder.html`:

```css
/* Cambiar gradiente principal */
.btn-primary {
    background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
}

/* Cambiar color de acento */
.day-card {
    border-left: 4px solid #TU_COLOR_ACCENT;
}
```

### Conectar con Sistema de Pagos Existente

En `itinerary-builder.html`, modifica la función `bookNow()`:

```javascript
function bookNow() {
    // Opción A: Usar tu sistema de Mercado Pago
    const bookingData = {
        itinerary: currentItinerary,
        total: currentItinerary.total_price_usd
    };

    // Guardar en localStorage
    localStorage.setItem('pending_booking', JSON.stringify(bookingData));

    // Redirigir a tu checkout
    window.location.href = '/checkout.html';

    // Opción B: Usar Paddle (internacional)
    // window.location.href = '/paddle-checkout.html?itinerary=' + btoa(JSON.stringify(bookingData));
}
```

### Agregar Google Analytics Tracking

```javascript
// Después de generar itinerario exitosamente
function displayResults(itinerary) {
    // ... código existente ...

    // Track evento en GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'itinerary_generated', {
            'event_category': 'engagement',
            'event_label': itinerary.profile.vibe,
            'value': itinerary.total_price_usd
        });
    }
}
```

---

## 📊 Conexión con Base de Datos

### Guardar Itinerarios Generados

Edita `api/generate-itinerary.js`:

```javascript
// Descomentar esta función
async function saveItineraryToDatabase(itinerary) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('itineraries')
    .insert([{
      customer_name: itinerary.profile.name,
      customer_email: itinerary.profile.email || null,
      vibe: itinerary.profile.vibe,
      nights: itinerary.profile.nights,
      pax: itinerary.profile.pax,
      uyuni_preference: itinerary.profile.uyuni_preference,
      budget_level: itinerary.profile.budget_level,
      total_price_usd: itinerary.total_price_usd,
      itinerary_json: JSON.stringify(itinerary),
      created_at: new Date().toISOString(),
      status: 'generated' // pending, confirmed, cancelled
    }]);

  if (error) throw error;
  return data;
}
```

### Crear tabla en Supabase

```sql
CREATE TABLE itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  vibe TEXT NOT NULL,
  nights INTEGER NOT NULL,
  pax INTEGER DEFAULT 2,
  uyuni_preference TEXT,
  budget_level TEXT,
  total_price_usd NUMERIC(10,2),
  itinerary_json JSONB,
  status TEXT DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsquedas
CREATE INDEX idx_itineraries_created ON itineraries(created_at DESC);
CREATE INDEX idx_itineraries_status ON itineraries(status);
CREATE INDEX idx_itineraries_vibe ON itineraries(vibe);
```

---

## 🚀 Testing en Local

### Opción 1: Vercel Dev (Recomendado)

```bash
npm run dev
# Abre: http://localhost:3000/itinerary-builder.html
```

### Opción 2: Servidor Simple

```bash
# Con Python
python -m http.server 8000

# Con Node
npx http-server -p 8000

# Abre: http://localhost:8000/itinerary-builder.html
```

### Test de la API

```bash
# Usando curl
curl -X POST http://localhost:3000/api/generate-itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "vibe": "PHOTO",
    "nights": 3,
    "pax": 2,
    "uyuni_preference": "NONE",
    "budget_level": "MID",
    "hate_early_mornings": true,
    "special_requests": ""
  }'
```

---

## 📱 Mobile Optimization

El wizard ya es responsive, pero puedes mejorar:

```css
/* En itinerary-builder.html */
@media (max-width: 768px) {
    .vibe-selector {
        grid-template-columns: repeat(2, 1fr); /* 2 columnas en móvil */
    }

    .header h1 {
        font-size: 1.8rem; /* Título más pequeño */
    }

    .wizard-card {
        padding: 25px; /* Menos padding */
    }
}
```

---

## 🎨 Personalización de Mensajes

### Warnings Personalizados

Edita `lib/rules-engine.js`:

```javascript
// Cambiar mensajes de warning
warnings.push(
  "💤 Tu ritmo es nuestra prioridad: Evitamos salidas antes de las 08:00 AM"
);

// Agregar nuevos warnings
if (profile.pax > 6) {
  warnings.push(
    "👥 Para grupos grandes, recomendamos tour privado (mejor experiencia)"
  );
}
```

### Notas de Días

```javascript
day1.notes.push("🧳 Recuerda: Ropa térmica para la noche (puede bajar a 0°C)");
```

---

## 🔐 Seguridad

### Validación en Backend

El endpoint ya valida:
- ✅ Campos requeridos
- ✅ Rangos numéricos (nights 2-10)
- ✅ Tipos de datos

Para agregar más:

```javascript
// En api/generate-itinerary.js
if (pax > 16) {
  return res.status(400).json({
    error: 'Maximum 16 people per booking. Contact us for larger groups.'
  });
}

if (special_requests.length > 500) {
  return res.status(400).json({
    error: 'Special requests too long'
  });
}
```

---

## 📧 Email de Confirmación

### Enviar Itinerario por Email

```javascript
// Después de generar itinerario
async function sendItineraryEmail(itinerary, customerEmail) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailHtml = `
    <h2>Tu Expedición One Sky</h2>
    <p>Hola ${itinerary.profile.name},</p>

    ${itinerary.days.map(day => `
      <h3>Día ${day.day}</h3>
      ${day.morning ? `<p>☀️ ${day.morning.name}</p>` : ''}
      ${day.afternoon ? `<p>🌅 ${day.afternoon.name}</p>` : ''}
      ${day.night ? `<p>✨ ${day.night.name}</p>` : ''}
    `).join('')}

    <h3>Total: $${itinerary.total_price_usd} USD</h3>

    <a href="https://atacamadarksky.cl/reservar">Reservar Ahora</a>
  `;

  await resend.emails.send({
    from: 'One Sky <noreply@atacamadarksky.cl>',
    to: customerEmail,
    subject: '✨ Tu Expedición Personalizada - One Sky',
    html: emailHtml
  });
}
```

---

## ✅ Checklist de Deployment

- [ ] Sistema funciona en local (`npm run dev`)
- [ ] API endpoint responde correctamente
- [ ] Frontend se ve bien en móvil
- [ ] Warnings se muestran correctamente
- [ ] Precio total correcto
- [ ] Integración con pago (Mercado Pago/Paddle)
- [ ] Google Analytics tracking
- [ ] Email confirmación (opcional)
- [ ] Base de datos conectada (opcional)
- [ ] Probado en diferentes vibes
- [ ] Probado con/sin modo zombie
- [ ] Probado con Uyuni sí/no

---

## 🐛 Problemas Comunes

### "Cannot find module './lib/inventory.js'"

**Solución:** Asegúrate que las rutas son relativas correctamente:

```javascript
// En api/generate-itinerary.js
import { generateExpedition } from '../lib/rules-engine.js'; // ← Con ../
```

### Wizard no se carga

**Solución:** Verifica que el archivo existe y es accesible:

```bash
ls -la itinerary-builder.html
# Debe existir
```

### API devuelve 405 Method Not Allowed

**Solución:** Usas GET en lugar de POST:

```javascript
// ✅ Correcto
fetch('/api/generate-itinerary', {
  method: 'POST', // ← POST
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})

// ❌ Incorrecto
fetch('/api/generate-itinerary') // ← Falta method: POST
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa `ITINERARY_SYSTEM_README.md`
2. Verifica console.log() en DevTools
3. Prueba la API con curl primero
4. Revisa Network tab para errores

---

**¡Listo para implementar!** 🚀

Comienza con la **Opción 1** (standalone) para probar rápido, luego migra a la **Opción 2** (integrada) cuando estés listo.