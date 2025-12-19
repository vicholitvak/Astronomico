# Sistema de Cotizaciones - Atacama Dark Sky

Sistema modular para generar cotizaciones profesionales en PDF.

## Estructura

```
cotizaciones/
├── generador_cotizacion.py      # Clase base reutilizable
├── cotizacion_*.py               # Cotizaciones específicas
├── output/                       # PDFs generados
└── README.md                     # Esta documentación
```

## Uso Rápido

### Generar cotización existente

```bash
cd cotizaciones
python cotizacion_uyuni_enero_2026.py
```

El PDF se generará en `output/Cotizacion_Tour_Uyuni_Enero_2026.pdf`

## Crear Nueva Cotización

### Opción 1: Usar el generador (recomendado)

```python
from generador_cotizacion import CotizacionPDF, calcular_retencion, formatear_precio_clp

# Configuración
TOTAL_USD = 1500
TASA_CAMBIO = 950
total_liquido_clp = TOTAL_USD * TASA_CAMBIO

# Calcular monto bruto (incluyendo retención 14.5%)
monto_bruto = total_liquido_clp / 0.855
retencion, _ = calcular_retencion(monto_bruto)

# Crear PDF
pdf = CotizacionPDF("output/mi_cotizacion.pdf")

# Agregar contenido
pdf.agregar_fecha()  # Fecha actual
pdf.agregar_titulo("COTIZACIÓN", "Nombre del Tour")
pdf.agregar_info_adicional("Fecha: 10 de enero | Grupo: 15 personas")

# Descripción
pdf.agregar_seccion(
    "DESCRIPCIÓN DEL SERVICIO",
    "Texto de descripción..."
)

# Lista de items incluidos
items = [
    "• Item 1",
    "• Item 2",
    "• Item 3"
]
pdf.agregar_lista("EL TOUR INCLUYE", items)

# Tabla de costos
items_costos = [
    {
        'concepto': 'Servicio 1',
        'detalle': 'Descripción',
        'precio': '$500.000'
    },
    # ... más items
]

pdf.agregar_tabla_costos(
    items=items_costos,
    monto_bruto=formatear_precio_clp(monto_bruto),
    retencion=formatear_precio_clp(retencion),
    total_liquido=formatear_precio_clp(total_liquido_clp),
    mostrar_retencion=True
)

# Notas y contacto
pdf.agregar_lista("NOTAS IMPORTANTES", ["• Nota 1", "• Nota 2"])
pdf.agregar_contacto()

# Generar
pdf.generar()
```

### Opción 2: Duplicar cotización existente

```bash
cp cotizacion_uyuni_enero_2026.py cotizacion_mi_tour.py
# Editar cotizacion_mi_tour.py con los nuevos datos
python cotizacion_mi_tour.py
```

## Cálculo de Retención (14.5%)

El sistema calcula automáticamente:

```python
# Si quieres recibir $1,500 USD líquido:
TOTAL_USD = 1500
TASA_CAMBIO = 950

# Total líquido deseado
total_liquido_clp = TOTAL_USD * TASA_CAMBIO  # = 1,425,000 CLP

# Monto bruto (lo que cobras en la boleta)
monto_bruto = total_liquido_clp / 0.855  # = 1,666,667 CLP

# Retención SII
retencion = monto_bruto * 0.145  # = 241,667 CLP

# Verificación
# monto_bruto - retencion = total_liquido ✓
# 1,666,667 - 241,667 = 1,425,000 CLP = $1,500 USD
```

## Funciones Útiles

### `formatear_precio_clp(monto)`
Formatea número como precio CLP: `$1.425.000`

### `formatear_precio_usd(monto)`
Formatea número como precio USD: `$1,500 USD`

### `calcular_retencion(monto_bruto)`
Retorna tupla: `(retención, total_líquido)`

## Tips

1. **Tasa de cambio:** Actualiza la variable `TASA_CAMBIO` según el tipo de cambio del día
2. **Validez:** Las cotizaciones por defecto tienen validez de 30 días
3. **Personalización:** Modifica los colores en `generador_cotizacion.py`:
   ```python
   COLOR_PRINCIPAL = colors.HexColor('#1a5490')
   COLOR_SECUNDARIO = colors.HexColor('#2c5aa0')
   ```

## Ejemplos de Cotizaciones

- `cotizacion_uyuni_enero_2026.py` - Tour grupal 15 personas en Uyuni
- (Agregar más aquí conforme se creen)

## Requisitos

```bash
pip install reportlab
```

## Soporte

Para problemas o dudas, contactar a vicente.litvak@gmail.com
