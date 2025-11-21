# 📘 GUÍA COMPLETA: Usar Stripe desde Chile

## 🚨 Situación Actual
**Stripe NO está disponible directamente en Chile**, pero hay formas LEGALES de usarlo.

## ✅ Opciones Disponibles

### OPCIÓN 1: Stripe Atlas ($500 USD) - RECOMENDADA
**La forma oficial y más profesional**

#### Qué obtienes:
- ✅ Empresa LLC en Delaware, USA
- ✅ EIN (Tax ID americano)
- ✅ Cuenta bancaria en Silicon Valley Bank
- ✅ Cuenta Stripe USA completa
- ✅ Asesoría legal y fiscal básica
- ✅ Puedes facturar desde USA globalmente

#### Proceso paso a paso:
1. **Aplicar en:** https://stripe.com/atlas
2. **Completar formulario** (10 minutos)
3. **Pagar $500 USD** con tarjeta
4. **Esperar aprobación** (1-2 semanas)
5. **Recibir documentos** de tu empresa USA
6. **Activar cuenta Stripe** automáticamente
7. **Configurar cuenta bancaria** (Mercury o SVB)

#### Costos operativos anuales:
- Registered Agent: $100-200 USD/año
- Impuestos Delaware: $300 USD/año
- Contabilidad: $500-1000 USD/año (opcional)
- **Total: ~$900-1500 USD/año**

#### Ventajas fiscales:
- Como no residente de USA, solo pagas impuestos sobre ingresos de fuente USA
- Clientes internacionales = 0% impuesto en USA
- Puedes deducir gastos de la empresa

---

### OPCIÓN 2: Usar Paddle como intermediario (SIN empresa USA)
**Más simple pero más caro**

#### Qué es Paddle:
- Merchant of Record (ellos son el vendedor oficial)
- Tiene Stripe integrado internamente
- Maneja impuestos automáticamente
- Disponible para Chile inmediatamente

#### Proceso:
1. **Registrarte en:** https://paddle.com
2. **Verificar identidad** (RUT chileno OK)
3. **Crear productos** en dashboard
4. **Integrar código** (provisto arriba)
5. **Comenzar a vender** inmediatamente

#### Comisiones:
- 5% + $0.50 USD por transacción
- Retiros a cuenta bancaria chilena disponibles

---

### OPCIÓN 3: 2Checkout/Verifone (Disponible en Chile)
**Alternativa directa a Stripe**

#### Proceso:
1. **Registrarte en:** https://www.2checkout.com
2. **Verificar empresa** chilena
3. **Integrar API** similar a Stripe
4. **Aceptar pagos** internacionales

#### Comisiones:
- 3.5% + $0.35 USD
- Setup fee: $45 USD

---

## 🔧 Implementación Técnica

### 1. Si eliges Stripe Atlas:

```javascript
// .env
STRIPE_PUBLISHABLE_KEY=pk_live_51ABC... // Tu key de Stripe
STRIPE_SECRET_KEY=sk_live_51ABC...      // Tu secret key

// Frontend
const stripe = Stripe('pk_live_51ABC...');

// Backend (Vercel)
const stripe = require('stripe')('sk_live_51ABC...');
```

### 2. Si eliges Paddle:

```javascript
// Integración más simple
<script src="https://cdn.paddle.com/paddle/paddle.js"></script>
<script>
Paddle.Setup({ vendor: 12345 }); // Tu vendor ID

Paddle.Checkout.open({
    product: 678910,        // ID de tu tour
    email: 'cliente@email.com',
    passthrough: {
        tourDate: '2025-01-15',
        persons: 2
    }
});
</script>
```

---

## 💰 Comparación de Costos

| Método | Setup | Comisión | Tiempo | Complejidad |
|--------|-------|----------|--------|-------------|
| **Stripe Atlas** | $500 USD | 2.9% + $0.30 | 2 semanas | Media |
| **Paddle** | Gratis | 5% + $0.50 | 1 día | Fácil |
| **2Checkout** | $45 USD | 3.5% + $0.35 | 3 días | Media |
| **Mercado Pago** | Gratis | 5.94% | Inmediato | Fácil |

---

## 📊 Calculadora de Costos

Para un tour de $30,000 CLP (~$33 USD):

- **Stripe Atlas:** $1.26 USD (3.8%)
- **Paddle:** $2.15 USD (6.5%)
- **2Checkout:** $1.50 USD (4.5%)
- **Mercado Pago:** $1,782 CLP (5.94%)

---

## 🎯 Mi Recomendación

### Si tu volumen es > $5,000 USD/mes:
→ **Stripe Atlas** vale la pena. Recuperas la inversión en ~6 meses.

### Si tu volumen es < $5,000 USD/mes:
→ **Paddle** o mantén **Mercado Pago** + agregar **2Checkout** para internacionales.

### Para empezar rápido:
→ Mantén **Mercado Pago** para Chile + agrega **Paddle** para internacionales hoy mismo.

---

## 🚀 Pasos Inmediatos

### Opción A: Implementar Paddle HOY (1 día)
1. Crear cuenta en Paddle.com
2. Verificar identidad con RUT
3. Copiar el código de `stripe-chile-solution.js`
4. Reemplazar vendor ID
5. Desplegar cambios

### Opción B: Aplicar a Stripe Atlas (2 semanas)
1. Aplicar en stripe.com/atlas
2. Mientras esperas, usa Paddle temporalmente
3. Cuando aprueban, migrar a Stripe directo
4. Reducir comisiones de 5% a 2.9%

---

## ⚠️ Consideraciones Legales

### Con Stripe Atlas:
- ✅ 100% legal y oficial
- ✅ Empresa real en USA
- ✅ Debes declarar ingresos en Chile
- ✅ Puedes emitir facturas desde USA

### Con Paddle/2Checkout:
- ✅ Legal para recibir pagos
- ✅ Ellos manejan impuestos
- ✅ Recibes transferencias como "servicios digitales"
- ✅ Declarar ingresos en Chile normalmente

---

## 📞 Soporte

### Stripe Atlas:
- Email: atlas-support@stripe.com
- Chat: Dashboard de Stripe
- Comunidad: https://stripe.com/atlas/guides

### Paddle:
- Email: support@paddle.com
- Docs: https://developer.paddle.com

### 2Checkout:
- Email: support@2checkout.com
- Teléfono: +1-877-294-0273

---

## 🔄 Próximos Pasos

1. **Decidir método** según tu volumen
2. **Crear cuenta** en plataforma elegida
3. **Implementar código** provisto
4. **Testear en sandbox** primero
5. **Ir a producción** cuando funcione

---

## 💡 Tips Finales

1. **Mantén Mercado Pago** para clientes chilenos (están acostumbrados)
2. **Agrega método internacional** para turistas
3. **Muestra precios en USD y CLP** siempre
4. **Actualiza tasa de cambio** semanalmente
5. **Considera fees** en tu precio final

¿Necesitas ayuda con la implementación? ¡Pregúntame!