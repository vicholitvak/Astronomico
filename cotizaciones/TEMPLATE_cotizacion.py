"""
TEMPLATE - Cotización Nueva
Copia este archivo y edita los valores según tu necesidad

Uso:
    1. Copiar este archivo: cp TEMPLATE_cotizacion.py cotizacion_mi_tour.py
    2. Editar los valores de CONFIGURACIÓN
    3. Ejecutar: python cotizacion_mi_tour.py
"""

from generador_cotizacion import CotizacionPDF, calcular_retencion, formatear_precio_clp, formatear_precio_usd


def main():
    # =========================================================================
    # CONFIGURACIÓN - EDITA ESTOS VALORES
    # =========================================================================

    # Datos del tour
    NOMBRE_TOUR = "Tour Astronómico en [LUGAR]"
    FECHA_TOUR = "10 de enero de 2026"  # Fecha del tour
    FECHA_COTIZACION = None  # None = fecha actual automática
    NUM_PERSONAS = 15

    # Precio
    TOTAL_USD = 1500  # Precio total que quieres recibir LÍQUIDO en USD
    TASA_CAMBIO = 950  # 1 USD = X CLP (actualizar según tasa del día)

    # Nombre del archivo PDF de salida
    ARCHIVO_PDF = "output/Cotizacion_Mi_Tour.pdf"

    # =========================================================================
    # CÁLCULOS AUTOMÁTICOS
    # =========================================================================

    total_liquido_clp = TOTAL_USD * TASA_CAMBIO
    monto_bruto = total_liquido_clp / 0.855  # Incluye retención 14.5%
    retencion, _ = calcular_retencion(monto_bruto)
    precio_por_persona = TOTAL_USD / NUM_PERSONAS

    # =========================================================================
    # GENERAR PDF
    # =========================================================================

    pdf = CotizacionPDF(ARCHIVO_PDF)

    # Fecha
    if FECHA_COTIZACION:
        pdf.agregar_fecha(FECHA_COTIZACION)
    else:
        pdf.agregar_fecha()  # Fecha actual

    # Título
    pdf.agregar_titulo(
        titulo="COTIZACIÓN",
        subtitulo=NOMBRE_TOUR
    )

    # Información del tour
    pdf.agregar_info_adicional(
        f"Fecha del tour: {FECHA_TOUR} | Grupo: {NUM_PERSONAS} personas"
    )

    # =========================================================================
    # DESCRIPCIÓN DEL SERVICIO - EDITAR TEXTO
    # =========================================================================

    descripcion = """
    [EDITAR] Descripción del servicio que estás ofreciendo.
    Explica qué hace especial este tour, las condiciones del lugar,
    y por qué es una experiencia única.
    """
    pdf.agregar_seccion("DESCRIPCIÓN DEL SERVICIO", descripcion)

    # =========================================================================
    # EL TOUR INCLUYE - EDITAR ITEMS
    # =========================================================================

    incluye_items = [
        "• [EDITAR] Item 1",
        "• [EDITAR] Item 2",
        "• [EDITAR] Item 3",
        "• Sesión de observación astronómica guiada",
        "• Telescopio profesional",
        "• Fotografías digitales de la experiencia",
    ]
    pdf.agregar_lista("EL TOUR INCLUYE", incluye_items)

    # =========================================================================
    # DURACIÓN
    # =========================================================================

    pdf.agregar_seccion(
        "DURACIÓN DEL SERVICIO",
        "Sesión astronómica de aproximadamente 1.5 horas (puede extenderse según condiciones)"
    )

    # =========================================================================
    # TABLA DE COSTOS - EDITAR ITEMS Y PRECIOS
    # =========================================================================

    items_costos = [
        {
            'concepto': '[EDITAR] Concepto 1',
            'detalle': 'Descripción del servicio',
            'precio': formatear_precio_clp(600000)  # Editar monto
        },
        {
            'concepto': '[EDITAR] Concepto 2',
            'detalle': 'Descripción del servicio',
            'precio': formatear_precio_clp(450000)  # Editar monto
        },
        {
            'concepto': '[EDITAR] Concepto 3',
            'detalle': 'Descripción del servicio',
            'precio': formatear_precio_clp(300000)  # Editar monto
        },
        {
            'concepto': 'Gastos de viaje y logística',
            'detalle': 'Traslado y alojamiento',
            'precio': formatear_precio_clp(317000)  # Editar monto (ajusta para que sume al monto_bruto)
        }
    ]

    pdf.agregar_tabla_costos(
        items=items_costos,
        monto_bruto=formatear_precio_clp(monto_bruto),
        retencion=formatear_precio_clp(retencion),
        total_liquido=formatear_precio_clp(total_liquido_clp),
        mostrar_retencion=True
    )

    # Nota sobre el precio
    nota_precio = f"""
    <b>Precio equivalente:</b> {formatear_precio_clp(total_liquido_clp)} CLP = {formatear_precio_usd(TOTAL_USD)}<br/>
    <i>Precio por persona: ${precio_por_persona:.0f} USD (aprox. ${int(total_liquido_clp / NUM_PERSONAS):,} CLP)</i>
    """.replace(',', '.')

    from reportlab.platypus import Paragraph, Spacer
    from reportlab.lib.units import inch
    pdf.elements.append(Paragraph(nota_precio, pdf.styles['Normal']))
    pdf.elements.append(Spacer(1, 0.3*inch))

    # =========================================================================
    # NOTAS IMPORTANTES - EDITAR
    # =========================================================================

    notas_items = [
        "• <b>Transporte interno:</b> Provisto por la agencia organizadora",
        "• <b>Condiciones climáticas:</b> Servicio sujeto a condiciones favorables",
        "• <b>Alojamiento del guía:</b> Incluido en el precio",
        "• <b>Duración flexible:</b> La sesión puede extenderse según condiciones",
        "• <b>Idiomas:</b> Disponible en español, inglés o portugués",
        "• <b>Validez:</b> Esta cotización tiene validez de 30 días"
    ]
    pdf.agregar_lista("NOTAS IMPORTANTES", notas_items)

    # =========================================================================
    # FORMA DE PAGO
    # =========================================================================

    pdf.agregar_seccion(
        "FORMA DE PAGO",
        """
        <b>• 50% de anticipo</b> para confirmar la reserva<br/>
        <b>• 50% restante</b> antes del inicio del tour<br/>
        <br/>
        <i>Métodos de pago:</i> Transferencia bancaria, PayPal, Efectivo
        """
    )

    # =========================================================================
    # CONTACTO
    # =========================================================================

    pdf.agregar_contacto()

    # =========================================================================
    # GENERAR
    # =========================================================================

    pdf.generar()

    # Resumen en consola
    print("\n" + "="*60)
    print("RESUMEN DE LA COTIZACION")
    print("="*60)
    print(f"Tour: {NOMBRE_TOUR}")
    print(f"Fecha: {FECHA_TOUR}")
    print(f"Grupo: {NUM_PERSONAS} personas")
    print(f"Precio total: {formatear_precio_usd(TOTAL_USD)} (aprox. {formatear_precio_clp(total_liquido_clp)} CLP)")
    print(f"Precio por persona: ${precio_por_persona:.0f} USD")
    print(f"Monto bruto (con retencion): {formatear_precio_clp(monto_bruto)} CLP")
    print(f"Retencion SII (14.5%): {formatear_precio_clp(retencion)} CLP")
    print(f"Total liquido: {formatear_precio_clp(total_liquido_clp)} CLP")
    print("="*60)


if __name__ == "__main__":
    main()
