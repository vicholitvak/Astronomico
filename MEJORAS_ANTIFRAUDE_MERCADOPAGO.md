# 🛡️ Mejoras para Reducir Rechazos por "High Risk" en Mercado Pago

## Problema Identificado
Los pagos están siendo rechazados con código `cc_rejected_high_risk` debido a que el sistema antifraude de Mercado Pago/bancos no tiene suficiente información para validar que la transacción es legítima.

## 📊 Análisis del Caso de Lucia Bermúdez
- **2 intentos rechazados** en 2 minutos (16:39 y 16:41)
- **Mismo monto**: $211,880 CLP
- **Método**: Tarjeta de débito Mastercard
- **Problema**: Información del pagador incompleta (email: null, nombre: null)

---

## 🔧 Soluciones Inmediatas (Alta Prioridad)

### 1. **Agregar Identificación del Cliente** ⭐️⭐️⭐️
**Impacto: ALTO** - Esta es la mejora más importante.

En `api/create-preference.js`, agregar al objeto `payer`:

```javascript
payer: {
    name: name,
    surname: name.split(' ').slice(1).join(' ') || name, // Extraer apellido
    email: email,
    phone: {
        area_code: phone.replace(/\D/g, '').substring(0, 2), // Ej: "56"
        number: phone.replace(/\D/g, '').substring(2)  // Resto del número
    },
    identification: {
        type: "RUT",  // Para chilenos
        number: ""    // OPCIONAL: Si puedes pedirlo en el formulario
    },
    address: {
        zip_code: "",  // Código postal del alojamiento si lo conoces
        street_name: accommodation || "San Pedro de Atacama"
    }
},
```

**Acción**: Agregar campo opcional en el formulario para RUT/Pasaporte.

---

### 2. **Configurar Binary Mode** ⭐️⭐️
**Impacto: MEDIO-ALTO** - Evita pagos pendientes y reduce fraude.

En `api/create-preference.js`, agregar:

```javascript
binary_mode: true,  // Solo aprobado o rechazado, no "pendiente"
```

Esto hace que Mercado Pago sea más estricto en validación pero evita transacciones dudosas.

---

### 3. **Mejorar Statement Descriptor** ⭐️⭐️
**Impacto: MEDIO** - Ayuda a que el cliente reconozca el cargo.

Cambiar en `api/create-preference.js`:

```javascript
statement_descriptor: 'ATACAMA TOUR',  // Máximo 11 caracteres
```

Debe ser reconocible para el cliente cuando vea el cargo en su tarjeta.

---

### 4. **Agregar Información de Shipment (Delivery)** ⭐️⭐️
**Impacto: MEDIO** - Aunque es un servicio, esto ayuda con geolocalización.

```javascript
shipments: {
    receiver_address: {
        zip_code: "1410000",  // Código postal de San Pedro de Atacama
        state_name: "Antofagasta",
        city_name: "San Pedro de Atacama",
        street_name: accommodation || "Centro",
        street_number: ""
    }
}
```

---

## 🚀 Mejoras Intermedias

### 5. **Configurar Métodos de Pago Permitidos** ⭐️
**Impacto: MEDIO** - Permite solo métodos confiables.

```javascript
payment_methods: {
    excluded_payment_methods: [],
    excluded_payment_types: [],
    installments: 1,  // Solo 1 cuota para tours
    default_installments: 1
}
```

---

### 6. **Agregar Más Metadata de Seguridad** ⭐️
**Impacto: BAJO-MEDIO**

```javascript
metadata: {
    // ... tu metadata actual ...

    // Agregar:
    customer_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    user_agent: req.headers['user-agent'],
    booking_channel: 'website',
    business_type: 'tourism',
    service_date: date,
    advance_days: Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
}
```

---

### 7. **Configurar Notificaciones Más Robustas** ⭐️

```javascript
notification_url: 'https://atacamadarksky.cl/api/mercadopago-webhook',
marketplace: 'NONE',  // No es un marketplace
```

---

## 🔍 Mejoras Avanzadas (Opcional)

### 8. **Implementar 3DS (3D Secure)** ⭐️⭐️⭐️
**Impacto: MUY ALTO** - Reduce chargebacks y fraude.

Mercado Pago soporta 3DS automáticamente, pero puedes forzarlo:

```javascript
additional_info: {
    ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    items: [{
        id: tourType,
        title: tourName,
        description: description,
        picture_url: "https://atacamadarksky.cl/images/tour-preview.jpg",
        category_id: "travels",
        quantity: quantity,
        unit_price: unitPrice
    }],
    payer: {
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name,
        phone: {
            area_code: phone.substring(0, 3),
            number: phone.substring(3)
        },
        address: {
            zip_code: "1410000",
            street_name: accommodation || "San Pedro de Atacama"
        },
        registration_date: new Date().toISOString() // Fecha de "registro" del cliente
    },
    shipments: {
        receiver_address: {
            zip_code: "1410000",
            state_name: "Antofagasta",
            city_name: "San Pedro de Atacama",
            street_name: accommodation || "Centro"
        }
    }
}
```

---

### 9. **Agregar Campo de RUT/Pasaporte en el Formulario**

En `mercadopago-checkout.js`, agregar después del campo de email:

```html
<div class="form-group">
    <label for="mp-id-type">Tipo de Identificación</label>
    <select id="mp-id-type" name="id_type">
        <option value="RUT">RUT (chilenos)</option>
        <option value="Passport">Pasaporte (extranjeros)</option>
    </select>
</div>

<div class="form-group">
    <label for="mp-id-number">Número de Identificación (Opcional)</label>
    <input type="text" id="mp-id-number" name="id_number"
           placeholder="Ej: 12345678-9 o ABC123456">
    <small style="color: #9ca3af;">Ayuda a validar tu pago más rápido</small>
</div>
```

---

## 📈 Estrategia de Implementación

### Fase 1 - Implementar YA (1-2 horas):
1. ✅ Agregar `identification` al payer (aunque sea vacío por ahora)
2. ✅ Agregar `binary_mode: true`
3. ✅ Mejorar `statement_descriptor`
4. ✅ Agregar `shipments` con info de San Pedro

### Fase 2 - Esta Semana (2-3 horas):
1. ✅ Agregar campos de RUT/Pasaporte en formulario (opcional)
2. ✅ Implementar `additional_info` completo
3. ✅ Agregar metadata de seguridad (IP, user-agent)

### Fase 3 - Futuro (Opcional):
1. ⬜ Implementar verificación de identidad más robusta
2. ⬜ Integrar con sistema de scoring de clientes
3. ⬜ Configurar reglas de riesgo personalizadas en Mercado Pago

---

## 🎯 Resultados Esperados

Implementando las mejoras de **Fase 1 + Fase 2**:
- **Reducción esperada de rechazos**: 60-80%
- **Tasa de aprobación objetivo**: >85%
- **Menos falsos positivos** del antifraude

---

## 📞 Contacto con Mercado Pago

Si los rechazos persisten después de implementar estas mejoras:

1. **Contactar a soporte de Mercado Pago**:
   - Portal: https://www.mercadopago.cl/ayuda
   - Mencionar: "Alto ratio de rechazos por high_risk en negocio de turismo"
   - Solicitar: "Revisión de configuración antifraude"

2. **Solicitar**:
   - Ajuste de umbrales de riesgo para tu cuenta
   - Whitelist para tu tipo de negocio (turismo/tours)
   - Habilitar 3DS obligatorio

---

## 📊 Monitoreo

Después de implementar, monitorear:
- ✅ Tasa de aprobación de pagos
- ✅ Códigos de rechazo más comunes
- ✅ Tiempo promedio de procesamiento
- ✅ Tasa de conversión checkout → pago

Puedes agregar esto a tu webhook para logging:

```javascript
// En mercadopago-webhook.js
if (paymentInfo.status === 'rejected') {
    console.log('[REJECTED PAYMENT ANALYTICS]', {
        id: paymentInfo.id,
        status_detail: paymentInfo.status_detail,
        payment_method: paymentInfo.payment_method_id,
        amount: paymentInfo.transaction_amount,
        has_identification: !!paymentInfo.payer?.identification,
        timestamp: new Date().toISOString()
    });
}
```

---

## 🔗 Referencias

- [Mercado Pago - Prevención de Fraude](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-configuration/additional-info)
- [Mercado Pago - Mejores Prácticas](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/best-practices/approval-rate)
- [3D Secure en MP](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-configuration/card-authentication)

---

**Última actualización**: 24 de noviembre 2025
**Prioridad**: 🔴 ALTA - Implementar Fase 1 inmediatamente
