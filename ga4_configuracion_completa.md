# 📊 CONFIGURACIÓN COMPLETA DE GOOGLE ANALYTICS 4

## ✅ PASO 1: MARCAR EVENTOS COMO CONVERSIONES

1. Ve a **GA4 → Configurar → Eventos**
2. Busca estos eventos y activa el switch "Marcar como conversión":
   - `booking_click` → Tu conversión principal
   - `contact` → Conversión secundaria
   - `view_item` → Para remarketing

## 📈 PASO 2: CREAR AUDIENCIAS PERSONALIZADAS

Ve a **Configurar → Audiencias** y crea:

### 1. **Interesados en Tours** (Para remarketing)
- Condición: Usuarios que activaron `view_item`
- Duración: Últimos 30 días
- Uso: Campañas de remarketing en Google Ads

### 2. **Intentaron Reservar** (Alta intención)
- Condición: Usuarios que activaron `booking_click`
- Duración: Últimos 7 días
- Uso: Campañas agresivas de conversión

### 3. **Contacto WhatsApp** (Leads calientes)
- Condición: Usuarios que activaron `contact` con label "whatsapp"
- Duración: Últimos 14 días
- Uso: Audiencias similares en Google Ads

## 🎯 PASO 3: VINCULAR CON GOOGLE ADS

1. Ve a **Admin → Vínculos de productos**
2. Selecciona **Google Ads**
3. Vincula tu cuenta de Google Ads
4. Activa:
   - ✅ Habilitar anuncios personalizados
   - ✅ Habilitar exportación de conversiones
   - ✅ Exportar audiencias

## 📊 PASO 4: CONFIGURAR INFORMES PERSONALIZADOS

Ve a **Explorar → Crear exploración** y configura:

### Informe de Embudo de Conversión:
1. Tipo: Exploración de embudo
2. Pasos:
   - Paso 1: `page_view` (página de inicio)
   - Paso 2: `view_item` (vio tour)
   - Paso 3: `booking_click` (intentó reservar)

### Informe de Rendimiento de Tours:
1. Tipo: Exploración libre
2. Dimensiones: `event_label` (tipo de tour)
3. Métricas: Eventos totales, Usuarios únicos
4. Filtro: `event_name = view_item`

## 🔔 PASO 5: CONFIGURAR ALERTAS

Ve a **Configurar → Estadísticas personalizadas**:

1. **Alerta de Conversiones Bajas**
   - Condición: Si `booking_click` < 5 en un día
   - Notificar por email

2. **Alerta de Tráfico Alto**
   - Condición: Si usuarios > 200% del promedio
   - Para detectar campañas exitosas

## 📱 PASO 6: CONFIGURAR GOOGLE ADS

En tu cuenta de Google Ads:

### Importar Conversiones:
1. Herramientas → Medición → Conversiones
2. "+ Nueva conversión" → Importar → Google Analytics 4
3. Selecciona `booking_click` y `contact`
4. Configura valores:
   - `booking_click`: $50 USD (valor estimado)
   - `contact`: $20 USD

### Crear Campañas con Audiencias:
1. Nueva campaña → Seleccionar objetivo "Conversiones"
2. Conversión principal: `booking_click`
3. Audiencias:
   - Incluir: "Interesados en Tours"
   - Observación: "Intentaron Reservar"

## 📊 PASO 7: DASHBOARDS RECOMENDADOS

### KPIs Principales a Monitorear:
- **Tasa de conversión**: booking_click / usuarios
- **Valor por usuario**: (booking_click × $50) / usuarios
- **Embudo de conversión**: % que completa cada paso
- **Tours más populares**: por event_label
- **Fuentes de tráfico**: que generan más conversiones

## 🚀 PASO 8: OPTIMIZACIONES AVANZADAS

### Enhanced Ecommerce (Próximo paso):
```javascript
// Agregar a tu index.html cuando tengas pasarela de pago:
function trackPurchase(transactionId, tourName, amount) {
  gtag('event', 'purchase', {
    'transaction_id': transactionId,
    'value': amount,
    'currency': 'CLP',
    'items': [{
      'item_id': tourName,
      'item_name': tourName,
      'price': amount,
      'quantity': 1
    }]
  });
}
```

### Server-Side Tracking (Para mayor precisión):
- Considera implementar Measurement Protocol
- Útil para tracking de reservas confirmadas por email

## 📋 CHECKLIST DIARIO

- [ ] Revisar conversiones del día anterior
- [ ] Verificar campañas de Google Ads
- [ ] Ajustar pujas según rendimiento
- [ ] Revisar embudos de conversión
- [ ] Identificar páginas con alto rebote

## 🎯 MÉTRICAS OBJETIVO (PRIMEROS 30 DÍAS)

- Tasa de conversión: 2-3%
- Costo por conversión: < $10 USD
- ROAS (Return on Ad Spend): > 300%
- Tiempo en sitio: > 2 minutos
- Páginas por sesión: > 3

## 💡 TIPS IMPORTANTES

1. **Espera 24-48 horas** para ver datos completos
2. **No hagas cambios drásticos** los primeros 7 días
3. **Documenta todos los cambios** en anotaciones de GA4
4. **Revisa semanalmente** el rendimiento
5. **Ajusta presupuestos** según conversiones, no clics

---
¿Necesitas ayuda? Contacta soporte de Google Ads: 
- Chile: 800-914-816
- Horario: Lun-Vie 9:00-18:00