"""
Cotización: Tour Astronómico Uyuni - Grupo 15 personas
Fecha: 10 de enero de 2026
Total: $1,500 USD (≈ $1,425,000 CLP líquido)
"""

from generador_cotizacion import CotizacionPDF, calcular_retencion, formatear_precio_clp, formatear_precio_usd


def main():
    # Configuración de la cotización
    TASA_CAMBIO = 1000  # 1 USD = 1000 CLP (redondeo para cotización)
    TOTAL_USD = 1500
    NUM_PERSONAS = 15

    # Cálculos
    total_liquido_clp = 1500000  # $1.500.000 CLP
    monto_bruto = total_liquido_clp / 0.855  # Calcular bruto considerando retención 14.5%
    retencion, _ = calcular_retencion(monto_bruto)

    # Crear PDF
    pdf = CotizacionPDF("output/Cotizacion_Tour_Uyuni_Enero_2026.pdf")

    # Fecha
    pdf.agregar_fecha("26 de noviembre de 2025")

    # Título
    pdf.agregar_titulo(
        titulo="COTIZACIÓN",
        subtitulo="Tour Astronómico en Salar de Uyuni"
    )

    # Información del tour
    pdf.agregar_info_adicional(
        "Fecha del tour: 10 de enero de 2026 | Grupo: 15 personas"
    )

    # Descripción del servicio
    descripcion = """
    Servicio especializado de guía astronómico para grupo de 15 personas en el Salar de Uyuni, Bolivia.
    Experiencia única que aprovecha las condiciones excepcionales del salar - considerado uno de los lugares
    con menor contaminación lumínica del planeta - para ofrecer una sesión de observación astronómica
    profesional con telescopio de última generación y astrofotografía guiada del cielo estrellado.
    La inmensidad del salar crea un espejo natural perfecto para capturar el universo reflejado.
    """
    pdf.agregar_seccion("DESCRIPCIÓN DEL SERVICIO", descripcion)

    # El tour incluye
    incluye_items = [
        "• Sesión de observación astronómica guiada (2 horas aprox.)",
        "• Telescopio profesional Unistellar eVscope para observación de espacio profundo",
        "• Telescopio óptico para observación de planetas y Luna",
        "• Sesión de astrofotografía profesional del cielo estrellado sobre el salar",
        "• Charla astronómica especializada sobre constelaciones del hemisferio sur",
        "• Explicación detallada de objetos celestes: planetas, nebulosas, galaxias y cúmulos",
        "• Tips profesionales de astrofotografía con celular y cámara DSLR",
        "• Fotografías digitales de la experiencia (entregadas vía WhatsApp)",
        "• Fotos de recuerdo del grupo bajo las estrellas",
        "• Puntero láser astronómico para identificar constelaciones",
        "• Adaptación del contenido según el nivel de conocimiento del grupo"
    ]
    pdf.agregar_lista("EL TOUR INCLUYE", incluye_items)

    # Duración
    pdf.agregar_seccion(
        "DURACIÓN DEL SERVICIO",
        "Sesión astronómica de aproximadamente 2 horas (puede extenderse según condiciones climáticas e interés del grupo)"
    )

    # Salto de página antes del desglose de costos
    from reportlab.platypus import PageBreak
    pdf.elements.append(PageBreak())

    # Tabla de costos
    items_costos = [
        {
            'concepto': 'Sesión de observación astronómica',
            'detalle': 'Telescopios profesionales para grupo',
            'precio': formatear_precio_clp(500000)
        },
        {
            'concepto': 'Sesión de astrofotografía especializada',
            'detalle': 'Fotos del cielo sobre el salar',
            'precio': formatear_precio_clp(500000)
        },
        {
            'concepto': 'Charla astronómica y guía experto',
            'detalle': 'Constelaciones y objetos celestes',
            'precio': formatear_precio_clp(300000)
        },
        {
            'concepto': 'Gastos de viaje, transporte, logística, alojamiento y alimentación',
            'detalle': 'Traslado y estadía en Uyuni',
            'precio': formatear_precio_clp(200000)
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
    precio_por_persona = TOTAL_USD / NUM_PERSONAS
    nota_precio = f"""
    <b>Precio equivalente:</b> {formatear_precio_clp(total_liquido_clp)} CLP = {formatear_precio_usd(TOTAL_USD)}<br/>
    <i>Precio por persona: ${precio_por_persona:.0f} USD (aprox. {formatear_precio_clp(int(total_liquido_clp / NUM_PERSONAS))} CLP)</i>
    """

    nota_elem = pdf.styles['Normal']
    from reportlab.platypus import Paragraph
    pdf.elements.append(Paragraph(nota_precio, nota_elem))
    from reportlab.platypus import Spacer
    from reportlab.lib.units import inch
    pdf.elements.append(Spacer(1, 0.3*inch))

    # Notas importantes
    notas_items = [
        "• <b>Transporte interno:</b> Provisto por la agencia organizadora",
        "• <b>Condiciones climáticas:</b> Servicio sujeto a condiciones favorables para observación astronómica",
        "• <b>Alojamiento del guía:</b> Incluido en el precio (2 noches en Uyuni)",
        "• <b>Duración flexible:</b> La sesión puede extenderse según condiciones e interés del grupo",
        "• <b>Idiomas:</b> Tour disponible en español, inglés o portugués",
        "• <b>Validez:</b> Esta cotización tiene validez de 30 días"
    ]
    pdf.agregar_lista("NOTAS IMPORTANTES", notas_items)

    # Información adicional
    info_adicional = """
    <b>¿Por qué Uyuni?</b><br/>
    El Salar de Uyuni, además de ser el salar más grande del mundo, ofrece condiciones excepcionales
    para la astronomía: altitud de 3,656 metros, cielo Bortle Class 1 (oscuridad total), y la superficie
    reflectante del salar que crea un efecto de espejo natural del cielo estrellado - una experiencia
    visual que no existe en ningún otro lugar del planeta.<br/>
    <br/>
    <b>Objetos celestes visibles en enero:</b><br/>
    • Nebulosa de Carina (una de las más brillantes y coloridas)<br/>
    • Nubes de Magallanes (galaxias vecinas)<br/>
    • Cúmulo de las Pléyades<br/>
    • Júpiter y sus lunas galileanas<br/>
    • Docenas de nebulosas y cúmulos estelares del cielo austral
    """
    pdf.agregar_seccion("INFORMACIÓN ADICIONAL", info_adicional)

    # Contacto
    pdf.agregar_contacto()

    # Generar PDF
    pdf.generar()

    # Resumen en consola
    print("\n" + "="*60)
    print("RESUMEN DE LA COTIZACION")
    print("="*60)
    print(f"Tour: Uyuni - 10 de enero de 2026")
    print(f"Grupo: {NUM_PERSONAS} personas")
    print(f"Precio total: {formatear_precio_usd(TOTAL_USD)} (aprox. {formatear_precio_clp(total_liquido_clp)} CLP)")
    print(f"Precio por persona: ${precio_por_persona:.0f} USD")
    print(f"Monto bruto (con retencion): {formatear_precio_clp(monto_bruto)} CLP")
    print(f"Retencion SII (14.5%): {formatear_precio_clp(retencion)} CLP")
    print(f"Total liquido: {formatear_precio_clp(total_liquido_clp)} CLP")
    print("="*60)


if __name__ == "__main__":
    main()
