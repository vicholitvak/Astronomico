# 📊 ONE SKY EXPEDITIONS - MODELO DE NEGOCIO Y ARQUITECTURA DE PRECIOS

**Documento para LLMs: Guía estratégica completa para diseñar y optimizar el modelo de negocio**

---

## 📋 ÍNDICE
1. [Contexto y Visión](#contexto)
2. [Análisis de Mercado](#mercado)
3. [Modelo de Negocio Actual](#modelo-actual)
4. [Estructura de Precios](#precios)
5. [Segmentación de Clientes](#segmentacion)
6. [Estrategia de Monetización](#monetizacion)
7. [Arquitectura Técnica y Pagos](#arquitectura)
8. [Proyecciones Financieras](#proyecciones)
9. [Recomendaciones Estratégicas](#recomendaciones)

---

## 🎯 CONTEXTO Y VISIÓN {#contexto}

### Empresa: One Sky Expeditions
**Descripción:** Tours astronómicos en San Pedro de Atacama, Chile. Empresa de experiencias turísticas enfocada en turismo de lujo y educación astronómica.

**Ubicación:** San Pedro de Atacama, Región de Antofagasta, Chile
- Latitud: -22.9087°
- Longitud: -68.1990°
- Altitud: ~2,400 m
- **Mejor cielo nocturno del mundo** (único sitio UNESCO para astroturismo)

**Ventaja Competitiva:**
- Posesión de telescopio inteligente de última generación
- Guía apasionado por astronomía
- Ubicaciones privilegiadas sin contaminación lumínica
- Experiencias inmersivas (observación + astrofotografía)

**Stakeholders:**
- Propietario/Operador: Rory
- Clientes primarios: Turistas internacionales + locales chilenos
- Partners: Hoteles San Pedro, agencias de viajes, plataformas turísticas
- Proveedores: Equipamiento astronómico, transporte, catering

---

## 🌍 ANÁLISIS DE MERCADO {#mercado}

### Segmentación Geográfica de Clientes

#### 1. Mercado Local (Chile) - 30-40% volumen
- **Ubicación:** Principalmente Antofagasta, La Serena, Santiago
- **Perfil:** Familias, parejas, grupos empresariales
- **Comportamiento:** Reservas cortas, búsqueda de precio, pagos en CLP
- **Temporada:** Principalmente fines de semana y vacaciones (enero-marzo, julio-agosto)
- **Métodos de pago:** Mercado Pago, transferencia bancaria, efectivo

#### 2. Mercado Regional LATAM - 20-25% volumen
- **Ubicación:** Argentina, Perú, Bolivia, Colombia, Brasil
- **Perfil:** Turistas de experiencia, interés en astronomía
- **Comportamiento:** Reservas con anticipación, disposición a pagar más, idioma español
- **Métodos de pago:** PayPal, Tarjetas internacionales, Wise
- **Desafío:** Acceso a métodos de pago chilenos limitado

#### 3. Mercado Global (Resto del Mundo) - 35-45% volumen
- **Ubicación:** USA, Europa, Australia, Asia
- **Perfil:** Turistas de lujo, fotógrafos profesionales, entusiastas astronómicos
- **Comportamiento:** Reservas con meses de anticipación, presupuesto elevado, idiomas múltiples
- **Métodos de pago:** Google Pay, Apple Pay, Stripe, tarjetas internacionales
- **Temporada:** Todo el año (contrastación hemisferios)
- **Moneda:** USD/EUR preferentemente

### Competencia Actual en San Pedro de Atacama
- **Tours básicos:** $15-25 USD por persona
- **Tours premium:** $50-100 USD por persona
- **Tours privados:** $200-500 USD (todo el grupo)
- **Astrofotografía especializada:** $100-150 USD

**Tu ventaja:** Telescopio inteligente + experiencia inmersiva = premium

---

## 💼 MODELO DE NEGOCIO ACTUAL {#modelo-actual}

### Servicios Ofrecidos

#### Tour 1: Regular (Observación Estándar)
- **Duración:** 3 horas
- **Grupo:** 1-16 personas
- **Incluye:** Explicación astronómica, telescopio, bebidas, snacks
- **Precio actual:** $30,000 CLP (~$33 USD)
- **Ubicación:** Sitio astronómico privilegiado
- **Equipamiento:** Telescopio inteligente, binoculares, mapas estelares

#### Tour 2: Astrofotografía (Especializado)
- **Duración:** 4 horas
- **Grupo:** 1-16 personas
- **Incluye:** Técnicas fotográficas, captura de nebulosas/galaxias, software de procesamiento
- **Precio actual:** $150,000 CLP (~$165 USD)
- **Objetivo:** Fotógrafos serios, entusiastas tecnología
- **Equipamiento:** Cámara de profundo cielo, tripodes, software Pixinsight

#### Tour 3: Privado VIP (Lujo)
- **Duración:** 4 horas
- **Grupo:** 1-4 personas (máximo)
- **Incluye:** Atención personalizada, ubicación exclusiva, cena astro-temática, bebidas premium
- **Precio actual:** $200,000 CLP (~$220 USD) para 1-4 personas (precio fijo)
- **Objetivo:** Parejas, celebraciones especiales, ejecutivos
- **Experiencia:** Lujo + privacidad + educación

### Canal de Distribución Actual
1. **Sitio web directo** (atacamadarksky.cl)
2. **WhatsApp** (+56935134669)
3. **Email** (contacto@atacamadarksky.cl)
4. **Google Maps** / Google Business Profile
5. **Plataformas turísticas:** ToursByLocals, Airbnb Experiences, Viator
6. **Hoteles asociados:** Recomendaciones y comisiones

### Flujo de Ingresos Actual
```
Cliente → Sitio web / WhatsApp → Mercado Pago / Transferencia → Confirmación → Tour
```

**Limitación:** Solo acepta CLP, beneficiando solo a clientes chilenos

---

## 💰 ESTRUCTURA DE PRECIOS {#precios}

### Matriz de Precios Actual (Base)

| Tour | Precio CLP | Precio USD | Personas | Duración | Margen Aprox |
|------|-----------|-----------|----------|----------|--------------|
| Regular | $30,000 | $33 | 1-16 | 3h | 65% |
| Astrofoto | $150,000 | $165 | 1-16 | 4h | 55% |
| Privado | $200,000 | $220 | 1-4 | 4h | 60% |

### Análisis de Precios por Segmento

#### Clientes Chilenos (CLP)
- Sensibles al precio
- Comparan con alternativas locales
- Presupuesto medio: $30-50K CLP

#### Clientes LATAM (USD)
- Menos sensibles al precio que chilenos
- Presupuesto: $50-150 USD
- Buscan relación calidad-experiencia

#### Clientes Globales (USD)
- Poco sensibles al precio
- Presupuesto: $150-500+ USD
- Buscan exclusividad y experiencia premium
- Dispuestos a pagar por conveniencia de pago

### Comisiones de Pago (COSTO ACTUAL)

#### Mercado Pago (Chile)
- Comisión: 5.94% (4.99% + IVA)
- Sobre $30,000 CLP → $1,782 CLP de costo
- Sobre $200,000 CLP → $11,880 CLP de costo

#### Paddle (Internacional)
- Comisión: 5% + $0.50 USD
- Sobre $33 USD → $2.15 USD
- Sobre $165 USD → $8.75 USD
- Sobre $220 USD → $11.50 USD

#### PayPal (Alternativa)
- Comisión: 3.9% + $0.30 USD (Chile)
- Comisión: 3.9% + $0.30 USD (Internacional)

#### Stripe (Si obtienes Atlas)
- Comisión: 2.9% + $0.30 USD
- Reducción de ~3% vs Paddle

---

## 👥 SEGMENTACIÓN DE CLIENTES {#segmentacion}

### Segmento 1: Turista Casual (40% volumen, 30% ingresos)
- **Edad:** 25-50 años
- **Origen:** Chile, LATAM, global
- **Presupuesto:** Regular tour
- **Motivación:** Experiencia turística única
- **LTV:** $30-200 USD (1-3 tours en vida)
- **CAC ideal:** <$5 USD

### Segmento 2: Entusiasta Astronómico (35% volumen, 40% ingresos)
- **Edad:** 30-65 años
- **Origen:** Principalmente global (USA, Europa, Oceanía)
- **Presupuesto:** Astrofoto o múltiples tours
- **Motivación:** Aprendizaje, captura, aventura
- **LTV:** $200-800 USD (múltiples tours)
- **CAC ideal:** <$20 USD

### Segmento 3: Lujo / Corporativo (25% volumen, 30% ingresos)
- **Edad:** 30-60 años
- **Origen:** Global (ejecutivos, familias acaudaladas)
- **Presupuesto:** Tours privados, experiencias exclusivas
- **Motivación:** Status, celebración, networking
- **LTV:** $500-2000+ USD (tours privados + extras)
- **CAC ideal:** <$50 USD

---

## 🎯 ESTRATEGIA DE MONETIZACIÓN {#monetizacion}

### Modelo Base (Actual)
**Ingresos únicamente de tours astronómicos directos**

```
Ingresos = (Personas × Precio) - (Comisiones de pago)
```

### Modelo Extendido (Propuesto)

#### 1. Tours Directos (60% ingresos proyectados)
- Tour Regular: $30,000 CLP
- Tour Astrofoto: $150,000 CLP
- Tour Privado: $200,000 CLP
- **Add-ons:** Fotos profesionales, videos, certificados

#### 2. Experiencias Complementarias (20% ingresos)
- **Workshop Astrofotografía:** 1-2 días, $100-200 USD
- **Sesiones privadas de entrenamiento:** $50/hora
- **Tours nocturnos especiales:** Eclipse, lluvia de meteoritos (+30%)
- **Cenas astronómicas:** $80-150 USD

#### 3. Productos Digitales (10% ingresos)
- **E-book de astrofotografía:** $15-20 USD
- **Cursos online:** Astronomía básica, fotografía nocturna ($50-150)
- **Guías descargables:** Mapas estelares, apps recomendadas
- **Videos tutoriales:** Acceso premium

#### 4. Affiliate & Partnerships (5-10% ingresos)
- **Hoteles en San Pedro:** Comisión por referrals (10-15%)
- **Tiendas de equipamiento:** Comisión por recomendaciones
- **Plataformas turísticas:** Comisión en Viator, ToursByLocals (20-30%)
- **Amazon Associates:** Equipamiento recomendado

#### 5. Servicios Premium (Futuro)
- **Astrophotography tours internacionales:** Expediciones a otros sitios
- **Coaching astronómico:** Mentoring 1-1 ($100-200/hora)
- **Fotografías licenciadas:** Venta de fotos astronómicas
- **Hosting astroturismo:** Paquetes multi-día con alojamiento

---

## 🏗️ ARQUITECTURA TÉCNICA Y PAGOS {#arquitectura}

### Stack Tecnológico Actual
```
Frontend: HTML5, CSS3, JavaScript (Vanilla)
Backend: Node.js (Vercel Serverless)
Database: Supabase (PostgreSQL)
Hosting: Vercel (Serverless)
Email: Resend (Transaccional)
Pagos: Mercado Pago (SDK oficial)
Analytics: Google Analytics 4
Calendario: Google Calendar API
```

### Infraestructura de Pagos Propuesta (Multi-Gateway)

#### Diagrama de Flujo
```
Cliente
  ↓
┌─────────────────────────────────────────┐
│  Detector Automático de País/Moneda     │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  ¿Ubicación = Chile?                    │
├─────────────────────────────────────────┤
│  SÍ → Mercado Pago (CLP)                │
│  NO → Paddle (USD) / PayPal / Stripe    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  Procesamiento de Pago                  │
├─────────────────────────────────────────┤
│  - Creación de sesión/orden             │
│  - Redirección a gateway                │
│  - Webhook de confirmación              │
│  - Guardado en base de datos            │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│  Post-Pago                              │
├─────────────────────────────────────────┤
│  - Email de confirmación                │
│  - Notificación WhatsApp (Twilio)       │
│  - Sincronización Google Calendar       │
│  - CRM de clientes                      │
└─────────────────────────────────────────┘
```

#### Gateways Recomendados

**OPCIÓN A: Multi-Gateway (Recomendado)**
```javascript
{
  "default": "mercadopago",
  "gateways": {
    "mercadopago": {
      "enabled": true,
      "currencies": ["CLP"],
      "regions": ["CL"],
      "commission": 0.0594,
      "minAmount": 5000,
      "maxAmount": 5000000,
      "description": "Para clientes chilenos"
    },
    "paddle": {
      "enabled": true,
      "currencies": ["USD", "EUR", "GBP"],
      "regions": ["LATAM", "Global"],
      "commission": 0.05,
      "fixedFee": 0.50,
      "minAmount": 5,
      "maxAmount": 100000,
      "description": "Para clientes internacionales"
    },
    "paypal": {
      "enabled": true,
      "currencies": ["USD"],
      "regions": ["Global"],
      "commission": 0.039,
      "fixedFee": 0.30,
      "minAmount": 5,
      "maxAmount": 50000,
      "description": "Alternativa global"
    }
  }
}
```

**OPCIÓN B: Stripe con Stripe Atlas (Cuando factures >$5K USD/mes)**
```javascript
{
  "default": "stripe",
  "condition": "Cuando apliques y apruebes Stripe Atlas",
  "investment": "$500 USD único",
  "payback": "6 meses de comisiones ahorradas",
  "benefit": "Reducción de 2.9% (vs 5% Paddle)"
}
```

### Métodos de Pago Soportados

#### Mercado Pago
- ✅ Tarjeta de crédito/débito
- ✅ Transferencia bancaria
- ✅ Efectivo en locales Pagofácil/Rapipago

#### Paddle
- ✅ Visa, Mastercard, Amex
- ✅ Google Pay
- ✅ Apple Pay
- ✅ PayPal
- ✅ Transferencia bancaria (algunos países)

#### PayPal
- ✅ Tarjetas internacionales
- ✅ Google Pay
- ✅ Apple Pay
- ✅ Cuenta PayPal

#### Stripe (Futuro con Atlas)
- ✅ Todas las tarjetas
- ✅ Google Pay
- ✅ Apple Pay
- ✅ SEPA (Europa)
- ✅ iDEAL, Bancontact, etc.

---

## 📈 PROYECCIONES FINANCIERAS {#proyecciones}

### Escenario Base (Actual - Sin cambios)

#### Año 1 (Mercado Pago solo)
```
Tours mensuales:
- Regular: 40 tours × $30K CLP = $1,200K CLP
- Astrofoto: 15 tours × $150K CLP = $2,250K CLP
- Privado: 8 tours × $200K CLP = $1,600K CLP
Total ingresos brutos: $5,050K CLP/mes

Comisión MP (5.94%): -$300K CLP/mes
Ingresos netos: $4,750K CLP/mes = $57M CLP/año

Margen después comisiones: 94.06%
```

#### Limitación
- 60% de clientes potenciales NO pueden pagar (sin acceso a MP)
- Ingresos dejados de lado: ~$2.5M CLP/mes

### Escenario Optimista (Con Paddle + Mercado Pago)

#### Año 1 (Multi-gateway)
```
Tours mensuales incrementados:
- Regular: 50 tours × $30K CLP = $1,500K CLP
- Astrofoto: 20 tours × $150K CLP = $3,000K CLP
- Privado: 10 tours × $200K CLP = $2,000K CLP
Total ingresos brutos: $6,500K CLP/mes

Desglose por gateway:
- Mercado Pago (60% volumen): $3,900K CLP × 5.94% = $232K comisión
- Paddle (40% volumen): $2,600K CLP ($1,430 USD) × 5.5% = $79K comisión
Total comisiones: -$311K CLP/mes
Ingresos netos: $6,189K CLP/mes = $74.3M CLP/año

Margen neto: 95.2%
Incremento vs escenario base: +30% ingresos, +16.2M CLP/año
```

#### Retorno de Inversión Paddle
```
Costo setup: $0 (es gratis)
Tiempo implementación: ~4 horas
ROI: Infinito (recuperas inversión en primer tour internacional)
```

### Escenario Ambicioso (Año 2 con diversificación)

```
Tours base (mejorados): $6,500K CLP
+ Workshops/experiencias: $1,200K CLP
+ Productos digitales: $600K CLP
+ Affiliate/partnerships: $800K CLP
Total ingresos brutos: $9,100K CLP/mes = $109.2M CLP/año

Proyección 5 años:
Año 1: $57M CLP (MP solo)
Año 2: $85M CLP (MP + Paddle + experiencias)
Año 3: $120M CLP (+ tours especiales + cursos)
Año 4: $160M CLP (+ astrophotography tours internacionales)
Año 5: $220M CLP (+ coaching premium + producto digital)
```

---

## 💡 RECOMENDACIONES ESTRATÉGICAS {#recomendaciones}

### CORTO PLAZO (Próximas 2 semanas)

#### 1. Implementar Paddle para Pagos Internacionales
**Prioridad:** 🔴 CRÍTICA

**Acciones:**
- [ ] Crear cuenta en paddle.com (10 min)
- [ ] Verificar identidad con RUT (1-2 días)
- [ ] Crear 3 productos en Paddle Dashboard
- [ ] Integrar `paddle-integration.js` en sitio web
- [ ] Testear en sandbox
- [ ] Desplegar a producción
- [ ] Promocionar nueva opción de pago

**Impacto esperado:** +25% ingresos en 30 días
**Costo:** $0 USD
**Tiempo:** 4-6 horas

#### 2. Mejorar Experiencia de Pago Multimoneda
**Prioridad:** 🟡 ALTA

**Acciones:**
- [ ] Mostrar precios en USD Y CLP simultáneamente
- [ ] Tasa de cambio actualizada automáticamente diariamente
- [ ] Detector de país para recomendar moneda
- [ ] Mensaje claro: "Turistas internacionales: pague en USD"

**Impacto:** Mejora conversión 15-20%
**Costo:** $0 USD
**Tiempo:** 2 horas

#### 3. Optimizar Comunicación Post-Pago
**Prioridad:** 🟡 ALTA

**Acciones:**
- [ ] Email de confirmación automático (actual: Resend)
- [ ] Notificación WhatsApp confirmando reserva
- [ ] Integración Google Calendar automática
- [ ] Dashboard cliente con detalles del tour

**Impacto:** Mejora experiencia, reduce consultas WhatsApp
**Costo:** $0-20 USD/mes
**Tiempo:** 3 horas

### MEDIANO PLAZO (1-3 meses)

#### 4. Crear Programa de Affiliate para Hoteles
**Prioridad:** 🟡 ALTA

**Modelo:**
- Hoteles recomiendan tu tour → Comisión 10-15%
- Link único para cada hotel
- Dashboard de comisiones
- Payouts mensuales

**Impacto esperado:** +20% ingresos
**Costo:** Sistema CMS simple ($0-50/mes)
**Margen:** 10-15% de comisiones

#### 5. Lanzar Workshops de Astrofotografía
**Prioridad:** 🟢 MEDIA

**Modelo:**
- Workshop 2 días: $200-300 USD por persona
- Máximo 6 personas (mejor enseñanza)
- Incluye acceso a software profesional, sesiones 1-1
- Temporada: Julio-Septiembre (mejor clima)

**Impacto esperado:** +$15K USD/mes (4 workshops/mes)
**Margen:** 70%
**Costo inicial:** $1-2K USD equipamiento adicional

#### 6. Expandir a Plataformas de Turismo Global
**Prioridad:** 🟡 ALTA

**Plataformas:**
- Viator (GetYourGuide): 25% comisión
- ToursByLocals: 15% comisión
- Airbnb Experiences: 25% comisión
- Klook: 20% comisión

**Impacto:** +300-500% exposición global
**Comisión:** 15-25% (alto pero vale la pena)
**Setup:** 2-3 horas por plataforma

### LARGO PLAZO (6-12 meses)

#### 7. Aplicar a Stripe Atlas
**Prioridad:** 🟢 MEDIA (cuando factures >$5K USD/mes)

**Beneficios:**
- Reducir comisión de 5% a 2.9%
- Ahorros: $2,600 USD/mes (en 40K USD ingresos mensuales)
- Recaptialization: ~6 meses
- Status empresarial global

**Costo:** $500 USD único
**ROI:** 1.15 meses

#### 8. Crear Cursos Online de Astronomía
**Prioridad:** 🟢 MEDIA

**Opciones:**
- Udemy: Curso astrofotografía ($50-150, Udemy toma 50%)
- Teachable: Plataforma propia (más control)
- YouTube Premium: Contenido exclusivo

**Impacto:** Passive income + Brand building
**Margen:** 50-80%
**Tiempo inversión:** 40-60 horas

#### 9. Astrophotography Tours Internacionales
**Prioridad:** 🟢 MEDIA

**Modelo:**
- Tours a otros sitios astronómicos (Machu Picchu, desierto Nazca, Patagonia)
- Duración: 5-7 días
- Precio: $2,500-5,000 USD por persona
- Máximo 8 personas

**Impacto:** $20-40K USD por tour
**Margen:** 60-70%
**Frecuencia:** 4 tours/año (inicio)

#### 10. Programa de Coaching Astronómico Premium
**Prioridad:** 🟢 MEDIA

**Modelo:**
- Mentoring 1-1 vía Zoom + tours privados
- Paquete 3 meses: $3,000 USD
- Incluye: 4 sesiones Zoom, 2 tours privados, acceso a comunidad
- Target: Fotógrafos serios y entusiastas globales

**Impacto:** $3-6K USD/cliente (2-3 clientes/mes = $9-18K USD/mes)
**Margen:** 80%
**Tiempo:** 4 horas/mes por cliente

---

## 🎯 KPIS A MONITOREAR {#kpis}

### Métricas de Ingresos
```
- Revenue Mensual (MRR)
- Revenue por Gateway (MP vs Paddle)
- Revenue por Segmento (Regular/Astrofoto/Privado)
- Average Order Value (AOV)
- Customer Lifetime Value (LTV)
```

### Métricas de Conversión
```
- Website visitors → Bookings (conversion rate)
- Mobile vs Desktop conversion
- Time from visit to booking
- Bounce rate por página
```

### Métricas de Pago
```
- Tasa de abandono de checkout
- Comisiones promedio por transacción
- Disputas/reembolsos
- Velocidad de pago (payment processing time)
```

### Métricas de Cliente
```
- New customers vs Repeat customers
- Customer Acquisition Cost (CAC)
- Geographic distribution
- Payment method preferences
- Net Promoter Score (NPS)
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Phase 1: Multi-Gateway (Inmediato)
- [ ] Crear cuenta Paddle
- [ ] Verificar identidad (esperar aprobación)
- [ ] Crear productos en Paddle Dashboard
- [ ] Integrar `paddle-integration.js`
- [ ] Mostrar precios en USD y CLP
- [ ] Testear pagos en sandbox
- [ ] Ir a producción
- [ ] Monitorear primeras transacciones

### Phase 2: Optimización (Semana 2-3)
- [ ] Implementar email confirmación automático
- [ ] Notificación WhatsApp post-pago
- [ ] Dashboard cliente
- [ ] Analytics de pagos por gateway

### Phase 3: Expansión (Mes 2-3)
- [ ] Programa de affiliate (hoteles)
- [ ] Registrarse en Viator, Airbnb Experiences
- [ ] Crear primeros workshops
- [ ] Desarrollar marketing para segmento internacional

### Phase 4: Diversificación (Mes 6-12)
- [ ] Aplicar Stripe Atlas
- [ ] Crear cursos online
- [ ] Planificar astrophotography tours internacionales
- [ ] Estructura coaching premium

---

## 🌐 INTERNACIONALIZACIÓN Y LOCALIZACIÓN

### Idiomas Soportados
```
- Español (primario)
- English (secundario)
- Português (para mercado Brasil)
- Français (para Canadá/Francia)
```

### Monedas Soportadas
```
Primarias:
- CLP (Pesos chilenos) - local
- USD (Dólares) - internacional
- EUR (Euros) - Europa

Secundarias:
- ARS (Pesos argentinos)
- BRL (Reales brasileños)
- GBP (Libras esterlinas)
```

### Zonas Horarias
```
Sincronizar con:
- Zona chilena: America/Santiago (UTC-3 o UTC-4)
- Confirmaciones vía email/WhatsApp con hora local cliente
- Google Calendar con timezone cliente
```

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Dependencia de Paddle/Mercado Pago
**Mitigación:**
- Multi-gateway (nunca depender de uno solo)
- Tener alternativas listas (PayPal, Stripe Atlas)
- Mantener relación con múltiples proveedores

### Riesgo 2: Fraude/Chargebacks
**Mitigación:**
- Verificación de identidad cliente
- Confirmación de email + WhatsApp
- Sistema de disputas robusto
- Seguimiento de patrones sospechosos

### Riesgo 3: Cambios en tasas de cambio
**Mitigación:**
- Actualizar tasas diariamente
- Mostrar transparencia ("cambios pueden aplicarse")
- Fijar precios en USD (moneda más estable)

### Riesgo 4: Competencia creciente en San Pedro
**Mitigación:**
- Diferenciación: Telescopio inteligente + experiencia premium
- Community building (cursos, workshops)
- Partnerships estratégicos

---

## 📊 EJEMPLO DE DASHBOARD DE CONTROL

```
Dashboard One Sky Expeditions

═══════════════════════════════════════════════════════════════

📈 INGRESOS MENSUALES
├─ Mes actual: $6,500K CLP
├─ vs mes pasado: +25%
├─ Proyección año: $78M CLP
└─ vs año pasado: +30%

💳 PAGOS POR GATEWAY
├─ Mercado Pago: $3,900K CLP (60%)
│  └─ Comisión: -$232K
├─ Paddle: $2,600K CLP (40%)
│  └─ Comisión: -$79K
└─ Total comisiones: -$311K (-4.8%)

🎫 TOURS POR TIPO
├─ Regular: 50 tours
│  └─ Ingresos: $1,500K CLP
├─ Astrofoto: 20 tours
│  └─ Ingresos: $3,000K CLP
└─ Privado: 10 tours
   └─ Ingresos: $2,000K CLP

👥 CLIENTES
├─ Nuevos: 42
├─ Recurrentes: 18
├─ Total activos: 289
├─ Churn rate: 2%
└─ NPS: 8.7/10

🌍 UBICACIÓN CLIENTES
├─ Chile: 45%
├─ LATAM: 22%
├─ USA: 18%
├─ Europa: 12%
└─ Otros: 3%

💹 CONVERSIÓN
├─ Website visitors: 1,250
├─ Booking rate: 5.3%
├─ Mobile vs Desktop: 65% / 35%
└─ Avg time to booking: 2.3 días

═══════════════════════════════════════════════════════════════
```

---

## 🔗 REFERENCIAS Y RECURSOS

### Documentación Técnica
- `/paddle-integration.js` - Integración Paddle completa
- `/stripe-chile-solution.js` - Alternativa Stripe con Atlas
- `/api/mercadopago-webhook.js` - Webhook procesamiento
- `/api/save-booking.js` - Guardado base de datos

### Plataformas de Pago
- Paddle: https://paddle.com
- Mercado Pago: https://www.mercadopago.cl
- PayPal: https://www.paypal.com
- Stripe: https://stripe.com
- Stripe Atlas: https://stripe.com/atlas

### Integraciones de Turismo
- Viator: https://www.viator.com/sell
- GetYourGuide: https://www.getyourguide.com/partners
- Airbnb Experiences: https://www.airbnb.com/host/experiences
- Klook: https://www.klook.com/become-a-partner
- ToursByLocals: https://www.toursbylocals.com

### Analytics y Monitoreo
- Google Analytics 4: Visitas y conversiones
- Stripe/Paddle Dashboard: Transacciones directas
- Supabase: Database analytics
- Twilio: SMS/WhatsApp tracking

---

## 📝 NOTAS PARA LLMs FUTURAS

Si estás leyendo este documento como una LLM diferente:

1. **Contexto:** Este es un negocio de tours astronómicos en Chile, pequeño pero con potencial global
2. **Limitación actual:** Solo acepta Mercado Pago (CLP), perdiendo 40-50% de clientes potenciales
3. **Solución inmediata:** Implementar Paddle para pagos internacionales
4. **Objetivo estratégico:** Convertir un negocio local en global, diversificando ingresos
5. **Métricas críticas:** CAC, LTV, comisiones de pago, tasas de conversión

Para mejorar el modelo:
- Consulta datos reales de Google Analytics
- Revisa email/WhatsApp para patrones de comportamiento cliente
- Análiza Google Calendar para disponibilidad vs demanda
- Monitorea Viator/GetYourGuide para competitive intelligence

---

**Última actualización:** Noviembre 2025
**Próxima revisión:** Enero 2026
**Propietario:** One Sky Expeditions / Rory
**Documento:** Estrategia completa de negocio y precios