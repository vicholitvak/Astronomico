# 🚀 ONE SKY EXPEDITIONS - SISTEMA DE ITINERARIOS INTELIGENTE

## 📋 Descripción

Sistema completo de generación de itinerarios personalizados basado en reglas de negocio inteligentes.

### ✨ Características

- ✅ **Motor de Reglas de Negocio** - Lógica avanzada para matching actividad-perfil
- ✅ **Regla Anti-Zombie** - Protege el sueño después de tours nocturnos
- ✅ **Detección de Blacklist** - Filtra actividades de riesgo automáticamente
- ✅ **Multi-Gateway de Pagos** - Preparado para Paddle/Mercado Pago
- ✅ **Responsive UI** - Wizard moderno con animaciones
- ✅ **Validación en Tiempo Real** - Feedback inmediato al usuario

---

## 📁 Estructura de Archivos

```
/
├── lib/
│   ├── types.js          # Definiciones de tipos (JSDoc)
│   ├── inventory.js      # Base de datos de actividades
│   └── rules-engine.js   # Motor de lógica de negocio
│
├── api/
│   └── generate-itinerary.js  # API endpoint para generación
│
├── itinerary-builder.html     # UI del wizard (standalone)
│
└── ITINERARY_SYSTEM_README.md # Este archivo
```

---

## 🎯 Reglas de Negocio Implementadas

### 1. **Regla Anti-Zombie** (La más importante)

**Problema:** Clientes hacen tour astronómico hasta las 02:00 AM, luego reservan Geysers del Tatio con pickup a las 05:00 AM = Experiencia terrible.

**Solución:**
```javascript
if (isZombieMode && activity.logic_flags?.anti_zombie_blocker) {
  // Bloquear Tatio/Piedras Rojas
  // Ofrecer Termas Puritama (inicio 09:30)
}
```

### 2. **Detección de Blacklist**

**Actividades filtradas:**
- Sandboard (riesgo físico)
- Tours masivos (experiencia degradada)
- Actividades de baja calidad

**Implementación:**
```javascript
const forbiddenTerms = ['sandboard', 'vino barato', 'masivo'];
if (special_requests.includes(forbiddenTerms)) {
  warnings.push("Hemos filtrado actividades de riesgo");
}
```

### 3. **Matching por Vibe**

| Vibe | Actividades Recomendadas |
|------|--------------------------|
| PHOTO | Valle Luna Golden Hour, Piedras Rojas |
| RELAX | Laguna Cejar, Termas Puritama |
| ADVENTURE | Lagunas Altiplánicas, Uyuni |
| BUDGET | Tours clásicos sin lujo |

### 4. **Presupuesto Dinámico**

```javascript
if (budget_level === 'HIGH') {
  // Incluir experiencias LUX
  // Termas Puritama, Valle Luna Premium
}
```

### 5. **Altitud Progresiva**

**Día 1:** Máx 2,500m (Aclimatación)
**Día 2:** 2,500-3,500m (Adaptación)
**Día 3+:** Hasta 5,000m (Alta montaña)

---

## 🔧 Uso

### Opción A: Página Standalone

1. Abre `itinerary-builder.html` directamente en navegador
2. O agrégala a tu sitio: `/experiencias`

```html
<!-- En tu index.html -->
<a href="/itinerary-builder.html">Diseña Tu Expedición</a>
```

### Opción B: Integración en Página Existente

```html
<!-- En tu HTML -->
<div id="itinerary-wizard"></div>

<script type="module">
  import { generateExpedition } from './lib/rules-engine.js';

  async function handleSubmit(formData) {
    const profile = {
      name: formData.get('name'),
      vibe: formData.get('vibe'),
      nights: parseInt(formData.get('nights')),
      // ...
    };

    const itinerary = generateExpedition(profile);
    displayResults(itinerary);
  }
</script>
```

---

## 🧪 Testing

### Test Manual

```bash
# Probar API endpoint
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

### Test Casos de Uso

#### Caso 1: Zombie Mode Activado
```javascript
{
  vibe: "RELAX",
  hate_early_mornings: true,
  nights: 3
}
// Resultado: NO incluirá Geysers del Tatio
// SÍ incluirá Termas Puritama
```

#### Caso 2: Fotógrafo Iron Man
```javascript
{
  vibe: "PHOTO",
  hate_early_mornings: false,
  nights: 4
}
// Resultado: Incluye Piedras Rojas (06:00 AM)
// Incluye Valle Luna Golden Hour
```

#### Caso 3: Blacklist Detection
```javascript
{
  special_requests: "Quiero hacer sandboard"
}
// Resultado: Warning automático
// Actividad filtrada
```

---

## 📊 Estructura de Datos

### Activity Object

```javascript
{
  id: "astro_signature",
  name: "One Sky Signature Astronomy",
  category: "CORE",
  duration_hours: 4,
  start_time_range: ["20:30", "21:30"],
  altitude_max_meters: 2450,
  physical_effort: 1,
  active: true,
  financials: {
    cost_net_usd: 0,
    price_retail_usd: 165,
    margin_usd: 165
  },
  logic_flags: {
    is_night_activity: true,
    triggers_anti_zombie: true,
    moon_dependent: true
  }
}
```

### Generated Itinerary

```javascript
{
  profile: {
    name: "María González",
    vibe: "PHOTO",
    nights: 3,
    // ...
  },
  days: [
    {
      day: 1,
      afternoon: { Activity Object },
      night: null,
      notes: ["Aclimatación suave"]
    },
    // ...
  ],
  total_price_usd: 370,
  warnings: [
    "💤 Modo Anti-Zombie activado"
  ]
}
```

---

## 🎨 Personalización

### Agregar Nueva Actividad

1. Edita `lib/inventory.js`:

```javascript
{
  id: "nueva_actividad",
  name: "Mi Nueva Actividad",
  category: "CLASSIC",
  duration_hours: 5,
  start_time_range: ["14:00"],
  altitude_max_meters: 3000,
  physical_effort: 2,
  active: true,
  financials: {
    cost_net_usd: 50,
    price_retail_usd: 120,
    margin_usd: 70
  },
  logic_flags: {
    best_for_photographers: true
  }
}
```

2. Actualiza lógica en `rules-engine.js` si es necesario.

### Modificar Reglas

Edita `lib/rules-engine.js`:

```javascript
// Ejemplo: Cambiar threshold de modo zombie
const isZombieMode = profile.hate_early_mornings ||
  (astroTour && hour > 23); // Nueva condición
```

---

## 🚀 Deployment

### Vercel (Actual)

El sistema está listo para deployment en Vercel:

```bash
# Ya está configurado en vercel.json
vercel --prod
```

La API `/api/generate-itinerary.js` se despliega automáticamente como serverless function.

### Variables de Entorno (Futuro)

```bash
# .env.production
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
PADDLE_VENDOR_ID=your_vendor
```

---

## 📈 Próximos Pasos

### Fase 2: Analytics
- [ ] Guardar itinerarios generados en Supabase
- [ ] Dashboard de métricas (vibes más populares)
- [ ] A/B testing de precios

### Fase 3: Booking Integration
- [ ] Conectar con sistema de pagos (Paddle)
- [ ] Envío automático de itinerario por email
- [ ] Sincronización con Google Calendar

### Fase 4: AI Enhancement
- [ ] Usar OpenAI para descripciones personalizadas
- [ ] Recomendaciones basadas en clima/fase lunar
- [ ] Chat conversacional para ajustes

---

## 🐛 Troubleshooting

### Error: "Activity not found"

**Causa:** ID de actividad incorrecto en `rules-engine.js`

**Solución:**
```javascript
const act = INVENTORY.find(i => i.id === 'correcto_id');
if (!act) {
  console.error('Activity not found:', 'correcto_id');
}
```

### Error: "Module not found"

**Causa:** Rutas relativas incorrectas

**Solución:**
```javascript
// ✅ Correcto
import { INVENTORY } from '../lib/inventory.js';

// ❌ Incorrecto
import { INVENTORY } from 'lib/inventory.js';
```

### Precio no se actualiza

**Causa:** Falta sumar precio en lógica

**Solución:**
```javascript
if (act && act.active) {
  day.morning = act;
  totalPrice += act.financials.price_retail_usd; // ← Agregar esto
}
```

---

## 💡 Tips de Uso

1. **Siempre testea reglas con casos extremos:**
   - Usuario que odia madrugar + Uyuni (requiere 07:00)
   - Budget LOW + actividades LUX only
   - 10 noches (inventario limitado)

2. **Mantén inventory.js actualizado:**
   - Precios cambian con temporada
   - Actividades se descontinúan
   - Nuevas experiencias

3. **Documenta cambios en reglas:**
   - Comenta WHY, no solo WHAT
   - Agrega ejemplos en comentarios

---

## 📞 Soporte

**Preguntas sobre el sistema:**
- Revisa este README
- Consulta `ONE_SKY_EXPEDITIONS_BUSINESS_MODEL.md`
- Revisa código con comentarios JSDoc

**Bugs o mejoras:**
- Documenta caso de uso
- Incluye datos de input
- Describe comportamiento esperado vs actual

---

## 📄 Licencia

Código propietario de One Sky Expeditions.
Uso interno solamente.

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
**Mantenedor:** One Sky Tech Team