"""
Generador de Cotizaciones - Atacama Dark Sky
Sistema modular para crear cotizaciones profesionales en PDF
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_JUSTIFY
from datetime import datetime
from typing import List, Dict, Optional


class CotizacionPDF:
    """Generador de cotizaciones en PDF con diseño profesional"""

    # Colores corporativos
    COLOR_PRINCIPAL = colors.HexColor('#1a5490')
    COLOR_SECUNDARIO = colors.HexColor('#2c5aa0')
    COLOR_ACENTO = colors.HexColor('#60a5fa')

    def __init__(self, nombre_archivo: str):
        """
        Inicializar generador de cotización

        Args:
            nombre_archivo: Nombre del archivo PDF a generar
        """
        self.pdf_filename = nombre_archivo
        self.doc = SimpleDocTemplate(
            self.pdf_filename,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        self.elements = []
        self._configurar_estilos()

    def _configurar_estilos(self):
        """Configurar estilos de texto"""
        self.styles = getSampleStyleSheet()

        # Estilos personalizados
        self.styles.add(ParagraphStyle(
            name='Justify',
            alignment=TA_JUSTIFY
        ))

        self.styles.add(ParagraphStyle(
            name='CenterBlue',
            alignment=TA_CENTER,
            fontSize=14,
            textColor=self.COLOR_SECUNDARIO,
            fontName='Helvetica-Bold'
        ))

        self.styles.add(ParagraphStyle(
            name='MainTitle',
            fontSize=24,
            textColor=self.COLOR_PRINCIPAL,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=20
        ))

        self.styles.add(ParagraphStyle(
            name='Subtitle',
            fontSize=16,
            textColor=self.COLOR_SECUNDARIO,
            fontName='Helvetica-Bold',
            spaceAfter=12
        ))

        self.styles.add(ParagraphStyle(
            name='RightAlign',
            alignment=TA_RIGHT,
            fontSize=10
        ))

    def agregar_fecha(self, fecha: Optional[str] = None):
        """Agregar fecha al documento"""
        if fecha is None:
            fecha_actual = datetime.now().strftime("%d de %B de %Y")
            meses_es = {
                'January': 'enero', 'February': 'febrero', 'March': 'marzo',
                'April': 'abril', 'May': 'mayo', 'June': 'junio',
                'July': 'julio', 'August': 'agosto', 'September': 'septiembre',
                'October': 'octubre', 'November': 'noviembre', 'December': 'diciembre'
            }
            for eng, esp in meses_es.items():
                fecha_actual = fecha_actual.replace(eng, esp)
            fecha = fecha_actual

        fecha_texto = Paragraph(f"<font size=10>Fecha: {fecha}</font>", self.styles['RightAlign'])
        self.elements.append(fecha_texto)
        self.elements.append(Spacer(1, 0.2*inch))

    def agregar_titulo(self, titulo: str = "COTIZACIÓN", subtitulo: Optional[str] = None):
        """Agregar título y subtítulo"""
        titulo_elem = Paragraph(titulo, self.styles['MainTitle'])
        self.elements.append(titulo_elem)
        self.elements.append(Spacer(1, 0.1*inch))

        if subtitulo:
            subtitulo_elem = Paragraph(subtitulo, self.styles['CenterBlue'])
            self.elements.append(subtitulo_elem)
            self.elements.append(Spacer(1, 0.1*inch))

    def agregar_info_adicional(self, texto: str):
        """Agregar información adicional bajo el subtítulo"""
        info = Paragraph(f"<para align=center><font size=10>{texto}</font></para>", self.styles['Normal'])
        self.elements.append(info)
        self.elements.append(Spacer(1, 0.3*inch))

    def agregar_seccion(self, titulo: str, contenido: str):
        """Agregar una sección con título y contenido"""
        titulo_elem = Paragraph(titulo, self.styles['Subtitle'])
        self.elements.append(titulo_elem)
        self.elements.append(Spacer(1, 0.1*inch))

        contenido_elem = Paragraph(contenido, self.styles['Justify'])
        self.elements.append(contenido_elem)
        self.elements.append(Spacer(1, 0.3*inch))

    def agregar_lista(self, titulo: str, items: List[str]):
        """Agregar una sección con lista de items"""
        titulo_elem = Paragraph(titulo, self.styles['Subtitle'])
        self.elements.append(titulo_elem)
        self.elements.append(Spacer(1, 0.1*inch))

        for item in items:
            p = Paragraph(item, self.styles['Normal'])
            self.elements.append(p)
            self.elements.append(Spacer(1, 0.05*inch))

        self.elements.append(Spacer(1, 0.2*inch))

    def agregar_tabla_costos(
        self,
        items: List[Dict[str, str]],
        monto_bruto: str,
        retencion: str,
        total_liquido: str,
        mostrar_retencion: bool = True
    ):
        """
        Agregar tabla de desglose de costos

        Args:
            items: Lista de dicts con 'concepto', 'detalle', 'precio'
            monto_bruto: Monto total antes de retención
            retencion: Monto de retención
            total_liquido: Total líquido a recibir
            mostrar_retencion: Si mostrar o no la línea de retención
        """
        titulo = Paragraph("DESGLOSE DE COSTOS", self.styles['Subtitle'])
        self.elements.append(titulo)
        self.elements.append(Spacer(1, 0.1*inch))

        # Estilos para celdas
        estilo_celda = ParagraphStyle(
            'CeldaTabla',
            fontSize=10,
            leading=12
        )
        estilo_celda_center = ParagraphStyle(
            'CeldaTablaCentro',
            fontSize=10,
            leading=12,
            alignment=TA_CENTER
        )
        estilo_celda_right = ParagraphStyle(
            'CeldaTablaRight',
            fontSize=10,
            leading=12,
            alignment=TA_RIGHT
        )

        # Crear datos de la tabla
        data = [['Concepto', 'Detalle', 'Precio']]

        for item in items:
            data.append([
                Paragraph(item['concepto'], estilo_celda),
                Paragraph(item['detalle'], estilo_celda_center),
                Paragraph(item['precio'], estilo_celda_right)
            ])

        # Agregar filas de totales
        data.append(['', 'MONTO DE LA BOLETA:', monto_bruto])

        if mostrar_retencion:
            data.append(['', 'Retención SII (14.5%):', retencion])

        data.append(['', 'TOTAL LÍQUIDO:', total_liquido])

        # Crear tabla
        tabla = Table(data, colWidths=[2.8*inch, 2.2*inch, 1.2*inch])

        # Calcular índices de filas especiales
        num_items = len(items)
        idx_monto = num_items + 1  # Índice de fila "MONTO DE LA BOLETA"
        idx_retencion = idx_monto + 1 if mostrar_retencion else None
        idx_total = idx_retencion + 1 if mostrar_retencion else idx_monto + 1

        # Estilos base
        estilos = [
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), self.COLOR_PRINCIPAL),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Items
            ('BACKGROUND', (0, 1), (-1, num_items), colors.beige),
            ('GRID', (0, 0), (-1, num_items), 1, colors.grey),

            # Fila del MONTO DE LA BOLETA
            ('BACKGROUND', (0, idx_monto), (-1, idx_monto), colors.HexColor('#f0f0f0')),
            ('FONTNAME', (0, idx_monto), (-1, idx_monto), 'Helvetica-Bold'),
            ('FONTSIZE', (0, idx_monto), (-1, idx_monto), 11),
            ('TOPPADDING', (0, idx_monto), (-1, idx_monto), 8),
            ('BOTTOMPADDING', (0, idx_monto), (-1, idx_monto), 8),
            ('LINEABOVE', (0, idx_monto), (-1, idx_monto), 1, colors.grey),
        ]

        # Agregar estilo de retención si corresponde
        if mostrar_retencion and idx_retencion:
            estilos.extend([
                ('BACKGROUND', (0, idx_retencion), (-1, idx_retencion), colors.HexColor('#ffe6e6')),
                ('FONTNAME', (0, idx_retencion), (-1, idx_retencion), 'Helvetica'),
                ('FONTSIZE', (0, idx_retencion), (-1, idx_retencion), 10),
                ('TOPPADDING', (0, idx_retencion), (-1, idx_retencion), 8),
                ('BOTTOMPADDING', (0, idx_retencion), (-1, idx_retencion), 8),
                ('TEXTCOLOR', (2, idx_retencion), (2, idx_retencion), colors.red),
            ])

        # Fila del TOTAL LÍQUIDO
        estilos.extend([
            ('LINEABOVE', (0, idx_total), (-1, idx_total), 2, self.COLOR_PRINCIPAL),
            ('BACKGROUND', (0, idx_total), (-1, idx_total), colors.HexColor('#e6f2ff')),
            ('FONTNAME', (0, idx_total), (-1, idx_total), 'Helvetica-Bold'),
            ('FONTSIZE', (0, idx_total), (-1, idx_total), 12),
            ('TOPPADDING', (0, idx_total), (-1, idx_total), 12),
            ('BOTTOMPADDING', (0, idx_total), (-1, idx_total), 12),
        ])

        tabla.setStyle(TableStyle(estilos))
        self.elements.append(tabla)
        self.elements.append(Spacer(1, 0.3*inch))

    def agregar_contacto(self):
        """Agregar información de contacto al final"""
        contacto = """
        <para align=center>
        <font size=10 color="#1a5490"><b>Contacto</b></font><br/>
        <font size=10><b>Vicente Litvak Montero</b></font><br/>
        <font size=9>Tel: +56 9 3513 4669</font><br/>
        <font size=9>Email: vicente.litvak@gmail.com</font><br/>
        <font size=9>Web: www.atacamadarksky.cl</font><br/>
        <br/>
        <font size=9>Para más información o confirmar su reserva, no dude en contactarnos.</font><br/>
        <font size=9>Esperamos poder brindarle una experiencia astronómica inolvidable.</font>
        </para>
        """
        contacto_texto = Paragraph(contacto, self.styles['Normal'])
        self.elements.append(contacto_texto)

    def generar(self):
        """Generar el PDF final"""
        self.doc.build(self.elements)
        print(f">> Cotizacion generada exitosamente: {self.pdf_filename}")
        return self.pdf_filename


def calcular_retencion(monto_bruto: float) -> tuple:
    """
    Calcular retención SII del 14.5% y total líquido

    Args:
        monto_bruto: Monto bruto en CLP

    Returns:
        Tuple con (retención, total_líquido)
    """
    retencion = monto_bruto * 0.145
    total_liquido = monto_bruto - retencion
    return (retencion, total_liquido)


def formatear_precio_clp(monto: float) -> str:
    """Formatear monto como precio CLP"""
    return f"${int(monto):,}".replace(',', '.')


def formatear_precio_usd(monto: float) -> str:
    """Formatear monto como precio USD"""
    return f"${int(monto):,} USD".replace(',', '.')
