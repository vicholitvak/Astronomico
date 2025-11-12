# Arquitectura del Sistema de Automatización n8n
## Atacama Dark Sky - Diagrama y Flujos

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ATACAMA DARK SKY                              │
│                    Sistema de Automatización                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   CLIENTES   │        │   SISTEMA    │        │ MONITOREO    │
│              │        │   WEB        │        │   24/7       │
└──────────────┘        └──────────────┘        └──────────────┘
      │                       │                       │
      │ WhatsApp              │ Web Form              │ Automated
      │ Messages              │ Bookings              │ Checks
      ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL EDGE                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ /api/whatsapp-   │  │  /api/booking    │  │  /api/health     │  │
│  │      webhook     │  │                  │  │                  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼────────────────────┼─────────────┘
            │                    │                    │
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          N8N CLOUD                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WORKFLOW 1: Monitoreo y Seguridad (cada 5 min)            │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐  │  │
│  │  │ Uptime  │→│ Backend  │→│  SSL   │→│ Enviar Alertas   │  │  │
│  │  │ Check   │ │ Health   │ │ Check  │ │ (WhatsApp/Email) │  │  │
│  │  └─────────┘ └──────────┘ └────────┘ └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WORKFLOW 2: WhatsApp Bot con Claude AI                     │  │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐  │  │
│  │  │ Recibir  │→│ Analizar  │→│ ¿Reserva? │→│ Crear       │  │  │
│  │  │ Mensaje  │ │ con       │ │ SI → ──┐  │ │ Booking     │  │  │
│  │  │          │ │ Claude AI │ │ NO → ──┼──→│ Responder   │  │  │
│  │  └──────────┘ └───────────┘ └───────────┘ └─────────────┘  │  │
│  │                   │                            │             │  │
│  │                   │ Detectar idioma            │             │  │
│  │                   │ (ES/EN/PT)                 │             │  │
│  │                   ▼                            ▼             │  │
│  │           ┌─────────────────┐        ┌────────────────┐     │  │
│  │           │ Generar         │        │ Guardar en     │     │  │
│  │           │ Respuesta en    │        │ Supabase       │     │  │
│  │           │ idioma cliente  │        │                │     │  │
│  │           └─────────────────┘        └────────────────┘     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WORKFLOW 3: Recordatorios Automáticos (cada 6 horas)       │  │
│  │  ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │  │
│  │  │ Buscar   │→│ Filtrar    │→│ Formatear  │→│ Enviar     │  │  │
│  │  │ Reservas │ │ por hora   │ │ mensaje    │ │ WhatsApp   │  │  │
│  │  │ próximas │ │ (24h/2h)   │ │ en idioma  │ │ + Email    │  │  │
│  │  └──────────┘ └────────────┘ └────────────┘ └────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Store & Retrieve
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (PostgreSQL)                         │
│  ┌────────────────┐  ┌──────────────────────┐  ┌────────────────┐  │
│  │   bookings     │  │ whatsapp_conversations│  │ monitoring_logs│  │
│  │                │  │                       │  │                │  │
│  │ • booking_id   │  │ • customer_phone      │  │ • alert_type   │  │
│  │ • date/time    │  │ • message_in/out      │  │ • severity     │  │
│  │ • persons      │  │ • language            │  │ • message      │  │
│  │ • tour_type    │  │ • intent              │  │ • resolved     │  │
│  │ • status       │  │ • booking_id (FK)     │  │ • created_at   │  │
│  │ • reminder_sent│  │ • created_at          │  │                │  │
│  └────────────────┘  └──────────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICIOS EXTERNOS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ WhatsApp     │  │ Claude AI    │  │ Google       │              │
│  │ Business API │  │ (Anthropic)  │  │ Calendar     │              │
│  │ (Meta)       │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo 1: Cliente Envía Mensaje por WhatsApp

```
Cliente                WhatsApp        Vercel          n8n           Claude AI      Supabase
  │                       │              │              │                │              │
  │ "Hola, quiero un     │              │              │                │              │
  │  tour para 2"        │              │              │                │              │
  ├──────────────────────>│              │              │                │              │
  │                       │              │              │                │              │
  │                       │ POST webhook │              │                │              │
  │                       ├─────────────>│              │                │              │
  │                       │              │              │                │              │
  │                       │              │ Forward to   │                │              │
  │                       │              │ n8n webhook  │                │              │
  │                       │              ├─────────────>│                │              │
  │                       │              │              │                │              │
  │                       │              │              │ Analyze text  │              │
  │                       │              │              ├──────────────>│              │
  │                       │              │              │                │              │
  │                       │              │              │ Return:       │              │
  │                       │              │              │ - Language: es│              │
  │                       │              │              │ - Intent: info│              │
  │                       │              │              │ - Sentiment   │              │
  │                       │              │              │<──────────────┤              │
  │                       │              │              │                │              │
  │                       │              │              │ Generate      │              │
  │                       │              │              │ response      │              │
  │                       │              │              ├──────────────>│              │
  │                       │              │              │                │              │
  │                       │              │              │ "¡Hola! Los  │              │
  │                       │              │              │  tours son..." │              │
  │                       │              │              │<──────────────┤              │
  │                       │              │              │                │              │
  │                       │              │              │ Save conversation             │
  │                       │              │              ├──────────────────────────────>│
  │                       │              │              │                │              │
  │                       │ Send reply   │              │                │              │
  │                       │ via API      │              │                │              │
  │<──────────────────────┼──────────────┼──────────────┤                │              │
  │                       │              │              │                │              │
  │ Recibe: "¡Hola!      │              │              │                │              │
  │  Los tours son..."   │              │              │                │              │
  │                       │              │              │                │              │
```

**Tiempo total:** ~3-5 segundos

---

## 🔄 Flujo 2: Cliente Agenda Tour por WhatsApp

```
Cliente                WhatsApp        Vercel          n8n           Claude AI      Supabase
  │                       │              │              │                │              │
  │ "Quiero reservar     │              │              │                │              │
  │  para 2 personas     │              │              │                │              │
  │  el 20 de dic"       │              │              │                │              │
  ├──────────────────────>│              │              │                │              │
  │                       │              │              │                │              │
  │                       │ [Similar flujo inicial...]  │                │              │
  │                       │              │              │                │              │
  │                       │              │              │ Analyze:      │              │
  │                       │              │              │ Intent: booking│             │
  │                       │              │              │ Date: 2025-12-20│            │
  │                       │              │              │ Persons: 2    │              │
  │                       │              │              │<──────────────┤              │
  │                       │              │              │                │              │
  │                       │              │              │ Create booking│              │
  │                       │              │ POST /api/booking             │              │
  │                       │              │<─────────────┤                │              │
  │                       │              │              │                │              │
  │                       │              │ Insert booking│               │              │
  │                       │              ├──────────────────────────────────────────────>│
  │                       │              │              │                │              │
  │                       │              │ Return booking_id: ATK-...    │              │
  │                       │              ├<──────────────────────────────────────────────┤
  │                       │              │              │                │              │
  │                       │              │ Success!     │                │              │
  │                       │              ├─────────────>│                │              │
  │                       │              │              │                │              │
  │                       │              │              │ Generate      │              │
  │                       │              │              │ confirmation  │              │
  │                       │              │              ├──────────────>│              │
  │                       │              │              │                │              │
  │                       │              │              │ "✅ Reserva   │              │
  │                       │              │              │  confirmada!  │              │
  │                       │              │              │  Código: ATK-"│              │
  │                       │              │              │<──────────────┤              │
  │                       │              │              │                │              │
  │<──────────────────────┴──────────────┴──────────────┤                │              │
  │                                                      │                │              │
  │ Recibe confirmación                                 │                │              │
  │ con código de reserva                               │                │              │
  │                                                      │                │              │
  │                       ┌──────────────────────────────┘                │              │
  │                       │                                               │              │
  │                       ▼                                               │              │
  │               También recibe:                                         │              │
  │               - Email de confirmación (via Resend)                    │              │
  │               - Evento en Google Calendar                             │              │
  │                                                                        │              │
```

**Tiempo total:** ~5-8 segundos

---

## 🔄 Flujo 3: Monitoreo Automático

```
Tiempo               n8n Cron        Vercel              Supabase        Admin
  │                     │              │                    │              │
  │ Cada 5 minutos      │              │                    │              │
  ├────────────────────>│              │                    │              │
  │                     │              │                    │              │
  │                     │ GET /        │                    │              │
  │                     ├─────────────>│                    │              │
  │                     │              │                    │              │
  │                     │ 200 OK ✅    │                    │              │
  │                     │<─────────────┤                    │              │
  │                     │              │                    │              │
  │                     │ GET /api/health                   │              │
  │                     ├─────────────>│                    │              │
  │                     │              │                    │              │
  │                     │              │ Check Supabase    │              │
  │                     │              ├───────────────────>│              │
  │                     │              │                    │              │
  │                     │              │ Connected ✅       │              │
  │                     │              │<───────────────────┤              │
  │                     │              │                    │              │
  │                     │ {status: healthy, checks: {...}}  │              │
  │                     │<─────────────┤                    │              │
  │                     │              │                    │              │
  │ Todo OK ✅         │              │                    │              │
  │ No enviar alertas  │              │                    │              │
  │                     │              │                    │              │
  │                     │              │                    │              │
  │ --- SI ALGO FALLA ---             │                    │              │
  │                     │              │                    │              │
  │                     │ 500 Error ❌ │                    │              │
  │                     │<─────────────┤                    │              │
  │                     │              │                    │              │
  │                     │ Save alert   │                    │              │
  │                     ├──────────────────────────────────>│              │
  │                     │              │                    │              │
  │                     │ Send WhatsApp│                    │              │
  │                     │ + Email alert│                    │              │
  │                     ├────────────────────────────────────────────────>│
  │                     │              │                    │              │
  │                     │              │                    │ Recibe alerta:│
  │                     │              │                    │ "🚨 Sitio    │
  │                     │              │                    │  caído!"     │
  │                     │              │                    │              │
```

**Frecuencia:** Cada 5 minutos (288 veces al día)

---

## 🔄 Flujo 4: Recordatorios Automáticos

```
Tiempo               n8n Cron        Supabase            WhatsApp        Cliente
  │                     │              │                    │              │
  │ Cada 6 horas        │              │                    │              │
  ├────────────────────>│              │                    │              │
  │                     │              │                    │              │
  │                     │ SELECT bookings WHERE            │              │
  │                     │ date = tomorrow AND              │              │
  │                     │ reminder_sent = false             │              │
  │                     ├─────────────>│                    │              │
  │                     │              │                    │              │
  │                     │ [2 reservas] │                    │              │
  │                     │<─────────────┤                    │              │
  │                     │              │                    │              │
  │ For each booking:   │              │                    │              │
  │                     │              │                    │              │
  │ 1. Calculate hours  │              │                    │              │
  │    until tour       │              │                    │              │
  │                     │              │                    │              │
  │ 2. If 20-28 hours:  │              │                    │              │
  │    - Detect language│              │                    │              │
  │    - Format message │              │                    │              │
  │                     │              │                    │              │
  │ 3. Send reminder    │              │                    │              │
  │                     ├──────────────────────────────────>│              │
  │                     │              │                    │              │
  │                     │              │                    │ Forward      │
  │                     │              │                    ├─────────────>│
  │                     │              │                    │              │
  │                     │              │                    │ "¡Hola Juan! │
  │                     │              │                    │  Mañana...   │
  │                     │              │                    │  a las 21:30"│
  │                     │              │                    │              │
  │ 4. Mark as sent     │              │                    │              │
  │                     │ UPDATE bookings SET              │              │
  │                     │ reminder_sent = true              │              │
  │                     ├─────────────>│                    │              │
  │                     │              │                    │              │
  │                     │ ✅ Updated   │                    │              │
  │                     │<─────────────┤                    │              │
  │                     │              │                    │              │
```

**Frecuencia:** Cada 6 horas (4 veces al día)
**Recordatorios por reserva:** 2 (24h antes + 2h antes)

---

## 📊 Datos y Almacenamiento

### Supabase Tables

#### `bookings` (existente + nuevas columnas)
```sql
booking_id          VARCHAR(50)   PRIMARY KEY
date                DATE          NOT NULL
time                VARCHAR(10)
persons             INTEGER
tour_type           VARCHAR(20)
name                VARCHAR(100)
email               VARCHAR(100)
phone               VARCHAR(20)
status              VARCHAR(20)   DEFAULT 'pending'
source              VARCHAR(50)   DEFAULT 'web'      -- NUEVO
reminder_sent       BOOLEAN       DEFAULT false      -- NUEVO
reminder_sent_at    TIMESTAMP                        -- NUEVO
created_at          TIMESTAMP     DEFAULT NOW()
```

#### `whatsapp_conversations` (nueva)
```sql
id                  UUID          PRIMARY KEY
customer_phone      VARCHAR(20)   NOT NULL
customer_name       VARCHAR(100)
message_in          TEXT          NOT NULL
message_out         TEXT
language            VARCHAR(5)    DEFAULT 'es'
intent              VARCHAR(50)
sentiment           VARCHAR(20)
booking_id          VARCHAR(50)   FOREIGN KEY → bookings
created_at          TIMESTAMP     DEFAULT NOW()
```

#### `monitoring_logs` (nueva)
```sql
id                  UUID          PRIMARY KEY
alert_type          VARCHAR(50)   NOT NULL
severity            VARCHAR(20)   NOT NULL (critical/high/medium/low)
message             TEXT          NOT NULL
details             JSONB
resolved            BOOLEAN       DEFAULT false
resolved_at         TIMESTAMP
created_at          TIMESTAMP     DEFAULT NOW()
```

---

## 🔐 Seguridad y Autenticación

### Variables de Entorno Sensibles

**Vercel:**
```bash
SUPABASE_URL
SUPABASE_SERVICE_KEY       # ⚠️ NUNCA exponer en frontend
WHATSAPP_ACCESS_TOKEN      # ⚠️ Renovar cada 60 días
WHATSAPP_VERIFY_TOKEN
RESEND_API_KEY
GOOGLE_SERVICE_ACCOUNT_KEY
```

**n8n:**
```bash
# Mismas variables + credenciales específicas de n8n
ANTHROPIC_API_KEY          # ⚠️ Rotar periódicamente
```

### Permisos de Supabase (RLS)

- `bookings`: Solo lectura para anon, escritura para service_role
- `whatsapp_conversations`: Solo service_role (100% privado)
- `monitoring_logs`: Solo service_role

---

## 💰 Costos y Límites

### n8n Cloud (Starter Plan: $20/mes)
- **Executions:** 2,500/mes incluidos
- **Estimado actual:**
  - Monitoreo: 8,640/mes (288/día × 30)
  - WhatsApp: ~100-500/mes (variable)
  - Recordatorios: ~120/mes (4/día × 30)
  - **TOTAL:** ~8,860/mes ⚠️ **Excede límite**

**Solución:** Cambiar a plan PRO ($50/mes) con 10K executions

### WhatsApp Business API (Meta)
- **Gratis:** Primeros 1,000 mensajes/mes
- **Después:** $0.005-$0.01 por mensaje
- **Estimado:** ~200 msgs/mes = $0 (dentro de free tier)

### Claude AI (Anthropic)
- **Modelo:** claude-3-5-sonnet-20241022
- **Costo:** ~$3 entrada + $15 salida por 1M tokens
- **Estimado:** 500 conversaciones/mes = ~$5-10

### **TOTAL MENSUAL ESTIMADO: $65-80 USD**

---

## 📈 Escalabilidad

### Límites Actuales
- n8n: 10,000 executions/mes (plan Pro)
- WhatsApp: Tier 1 = 1,000 conversaciones/24h
- Claude: Sin límite duro, rate limit ~50 req/min
- Supabase: 500MB base de datos (Free tier)

### Si necesitas escalar (>1000 reservas/mes):
1. n8n Enterprise ($150/mes): 100K executions
2. WhatsApp Tier 2: Hasta 10K conversaciones/24h
3. Supabase Pro ($25/mes): 8GB base de datos
4. Claude: Negociar volumen con Anthropic

---

## 🛠️ Mantenimiento

### Diario
- ✅ Revisar n8n Executions (buscar errores)
- ✅ Revisar métricas de WhatsApp en Meta Business
- ✅ Verificar alertas en Supabase

### Semanal
- ✅ Revisar estadísticas: `SELECT * FROM get_whatsapp_stats(7);`
- ✅ Verificar créditos de Claude en Anthropic
- ✅ Revisar logs de Vercel

### Mensual
- ✅ Renovar WhatsApp Access Token (expira cada 60 días)
- ✅ Revisar costos de Claude
- ✅ Optimizar prompts si es necesario
- ✅ Backup de base de datos Supabase

---

## 📞 Contacto y Soporte

**Desarrollador:** Vicente Litvak
**Email:** vicente.litvak@gmail.com
**WhatsApp:** +56 9 5055 8761

**Última actualización:** 2025-11-11
**Versión del Sistema:** 1.0.0
