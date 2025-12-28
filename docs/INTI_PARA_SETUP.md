# Plataforma de Reservas Online - Inti Para Travel

## Resumen del Acuerdo

| Concepto | Detalle |
|----------|---------|
| **Agencia** | Inti Para Travel |
| **Servicio** | Sistema de reservas online para tours de día |
| **Comisión** | 15% por cada reserva completada |
| **Pago** | Liquidación mensual |

---

## Cómo Funciona

```
Cliente visita web de Inti Para
         ↓
  Ve los tours disponibles (widget)
         ↓
  Hace reserva online
         ↓
  Sistema registra la reserva
         ↓
  Inti Para recibe notificación
         ↓
  Cliente paga (MercadoPago/efectivo)
         ↓
  Tour se realiza
         ↓
  Fin de mes: liquidación
     - Inti Para: 85%
     - Tu comisión: 15%
```

---

## Instalación en WordPress

### Opción 1: Shortcode (Recomendado)

1. Ir a **Apariencia > Editor de Temas** o usar un plugin como **Insert Headers and Footers**

2. Agregar antes de `</body>`:
```html
<script src="https://atacamadarksky.cl/widgets/agency-booking-widget.js"></script>
```

3. En la página donde quieras mostrar los tours, agregar:
```html
<div id="booking-widget" data-agency="inti-para"></div>
```

### Opción 2: Plugin Personalizado

Crear archivo `inti-para-booking.php` en `/wp-content/plugins/`:

```php
<?php
/**
 * Plugin Name: Inti Para Booking Widget
 * Description: Sistema de reservas online para Inti Para Travel
 * Version: 1.0
 */

function inti_para_booking_shortcode($atts) {
    $atts = shortcode_atts(array(
        'agency' => 'inti-para'
    ), $atts);

    wp_enqueue_script(
        'inti-para-widget',
        'https://atacamadarksky.cl/widgets/agency-booking-widget.js',
        array(),
        '1.0',
        true
    );

    return '<div id="booking-widget" data-agency="' . esc_attr($atts['agency']) . '"></div>';
}
add_shortcode('inti_booking', 'inti_para_booking_shortcode');
```

Luego usar en cualquier página:
```
[inti_booking]
```

### Opción 3: Elementor

1. Agregar widget **HTML**
2. Pegar:
```html
<div id="booking-widget" data-agency="inti-para"></div>
<script src="https://atacamadarksky.cl/widgets/agency-booking-widget.js"></script>
```

---

## Tours Configurados

| Código | Tour | Precio | Horarios |
|--------|------|--------|----------|
| GEISERS-TATIO | Géisers del Tatio | $45.000 | 04:30 |
| VALLE-LUNA | Valle de la Luna | $25.000 | 15:00, 16:00 |
| SALAR-ATACAMA | Salar de Atacama | $35.000 | 08:00, 14:00 |
| PIEDRAS-ROJAS | Piedras Rojas | $55.000 | 07:00 |
| TERMAS-PURITAMA | Termas de Puritama | $30.000 | 09:00, 14:00 |

Para agregar/modificar tours, contactar al administrador.

---

## Flujo de Reservas

### 1. Cliente hace reserva
- Completa formulario en el widget
- Sistema crea reserva con estado "pendiente"
- Se envía notificación por email

### 2. Confirmación y pago
- Inti Para contacta al cliente
- Cliente paga (MercadoPago, transferencia, efectivo)
- Se marca como "confirmada" y "pagada"

### 3. Tour se realiza
- Estado cambia a "completada"

### 4. Liquidación mensual
- Fin de mes se genera reporte
- Se calcula: Total ventas - 15% comisión = Pago a Inti Para

---

## Panel de Administración

Acceso: `https://atacamadarksky.cl/admin`

En el panel puedes ver:
- Todas las reservas de Inti Para
- Filtrar por fecha/estado
- Ver reporte de comisiones
- Exportar datos

---

## API Endpoints

Para integraciones avanzadas:

```
GET  /api/agencies/inti-para              # Info de la agencia
GET  /api/agencies/inti-para/products     # Lista de tours
GET  /api/agencies/inti-para/bookings     # Reservas
GET  /api/agencies/inti-para/commissions  # Comisiones
POST /api/agencies/inti-para/book         # Crear reserva
```

---

## Personalización

### Cambiar colores
Contactar para ajustar:
- Color primario (botones, precios)
- Color secundario (fondos)
- Logo de la agencia

### Agregar tours
Enviar:
- Nombre del tour
- Descripción corta y larga
- Precio por persona
- Duración en minutos
- Horarios disponibles
- Foto principal

---

## Soporte

- **Email**: vicente.litvak@gmail.com
- **WhatsApp**: +56 9 XXXX XXXX

---

## Próximos Pasos

1. [ ] Ejecutar migración de base de datos
2. [ ] Configurar productos con fotos reales
3. [ ] Probar widget en WordPress de Inti Para
4. [ ] Configurar notificaciones por email
5. [ ] Definir método de pago (¿MercadoPago compartido o propio?)
6. [ ] Acordar día de liquidación mensual
