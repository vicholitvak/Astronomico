# Modelo de Negocio: Alianza con Inti Para Travel

## 1. Estructura de Precios

| Tour | Precio Público | Duración | Capacidad Vehículo |
|------|---------------|----------|-------------------|
| Géisers del Tatio | $45.000 | 6 hrs | 16 pax |
| Valle de la Luna | $25.000 | 4 hrs | 16 pax |
| Salar de Atacama | $35.000 | 5 hrs | 16 pax |
| Piedras Rojas | $55.000 | 9 hrs | 16 pax |
| Termas de Puritama | $30.000 | 4 hrs | 16 pax |

---

## 2. Escenarios de Margen (Negociación)

### Opción A: Comisión 15% (conservador)
| Tour | Precio Público | Tu comisión | Inti Para recibe |
|------|---------------|-------------|------------------|
| Géisers | $45.000 | $6.750 | $38.250 |
| Valle Luna | $25.000 | $3.750 | $21.250 |
| Salar | $35.000 | $5.250 | $29.750 |
| Piedras Rojas | $55.000 | $8.250 | $46.750 |
| Termas | $30.000 | $4.500 | $25.500 |

### Opción B: Comisión 20% (agresivo)
| Tour | Precio Público | Tu comisión | Inti Para recibe |
|------|---------------|-------------|------------------|
| Géisers | $45.000 | $9.000 | $36.000 |
| Valle Luna | $25.000 | $5.000 | $20.000 |
| Salar | $35.000 | $7.000 | $28.000 |
| Piedras Rojas | $55.000 | $11.000 | $44.000 |
| Termas | $30.000 | $6.000 | $24.000 |

### Opción C: Precio fijo de traspaso
| Tour | Precio Público | Precio Traspaso | Tu margen |
|------|---------------|-----------------|-----------|
| Géisers | $45.000 | $35.000 | $10.000 |
| Valle Luna | $25.000 | $18.000 | $7.000 |
| Salar | $35.000 | $27.000 | $8.000 |
| Piedras Rojas | $55.000 | $42.000 | $13.000 |
| Termas | $30.000 | $23.000 | $7.000 |

---

## 3. Proyección Mensual de Ventas

### Temporada BAJA (Abril-Junio, Ago-Nov)
Supuesto: 2-3 reservas por semana promedio

| Escenario | Reservas/mes | Ticket promedio | Ingreso bruto | Tu comisión (20%) |
|-----------|--------------|-----------------|---------------|-------------------|
| Pesimista | 8 | $38.000 | $304.000 | **$60.800** |
| Normal | 12 | $38.000 | $456.000 | **$91.200** |
| Optimista | 20 | $38.000 | $760.000 | **$152.000** |

### Temporada ALTA (Dic-Mar, Julio)
Supuesto: 5-10 reservas por semana

| Escenario | Reservas/mes | Ticket promedio | Ingreso bruto | Tu comisión (20%) |
|-----------|--------------|-----------------|---------------|-------------------|
| Pesimista | 20 | $40.000 | $800.000 | **$160.000** |
| Normal | 35 | $40.000 | $1.400.000 | **$280.000** |
| Optimista | 50 | $40.000 | $2.000.000 | **$400.000** |

---

## 4. Proyección Anual

### Escenario Conservador (15% comisión)

| Período | Meses | Reservas/mes | Ticket prom. | Comisión mensual | Subtotal |
|---------|-------|--------------|--------------|------------------|----------|
| Temp. Baja | 7 | 10 | $38.000 | $57.000 | $399.000 |
| Temp. Alta | 5 | 30 | $40.000 | $180.000 | $900.000 |
| **TOTAL ANUAL** | | | | | **$1.299.000** |

### Escenario Moderado (20% comisión)

| Período | Meses | Reservas/mes | Ticket prom. | Comisión mensual | Subtotal |
|---------|-------|--------------|--------------|------------------|----------|
| Temp. Baja | 7 | 12 | $38.000 | $91.200 | $638.400 |
| Temp. Alta | 5 | 35 | $40.000 | $280.000 | $1.400.000 |
| **TOTAL ANUAL** | | | | | **$2.038.400** |

### Escenario Optimista (20% comisión + crecimiento)

| Período | Meses | Reservas/mes | Ticket prom. | Comisión mensual | Subtotal |
|---------|-------|--------------|--------------|------------------|----------|
| Temp. Baja | 7 | 20 | $38.000 | $152.000 | $1.064.000 |
| Temp. Alta | 5 | 50 | $40.000 | $400.000 | $2.000.000 |
| **TOTAL ANUAL** | | | | | **$3.064.000** |

---

## 5. Análisis por Vehículo Lleno

Si llenas un vehículo completo (16 pax):

| Tour | Ingreso Total | Tu comisión 20% | Inti Para |
|------|--------------|-----------------|-----------|
| Géisers (16 pax) | $720.000 | **$144.000** | $576.000 |
| Valle Luna (16 pax) | $400.000 | **$80.000** | $320.000 |
| Piedras Rojas (16 pax) | $880.000 | **$176.000** | $704.000 |

**1 vehículo lleno de Géisers = $144.000 para ti**

---

## 6. Costos Operativos (tu lado)

| Concepto | Costo mensual | Notas |
|----------|---------------|-------|
| Hosting Vercel | $0 | Plan gratuito |
| Base de datos Neon | $0 | Plan gratuito |
| Dominio | ~$1.000 | Ya lo tienes |
| Pasarela de pago | 3-4% por transacción | MercadoPago |
| Marketing digital | Variable | Google Ads, Meta |
| **TOTAL FIJO** | **~$1.000/mes** | |

### Costo de adquisición de cliente (CAC)
Si inviertes en ads:
- Supuesto: $50.000/mes en Google Ads
- Conversión: 5% de clics compran
- Costo por clic: $200
- Clics: 250
- Conversiones: 12-13 reservas
- **CAC: ~$4.000 por reserva**

Si tu comisión promedio es $7.600 (20% de $38.000):
- **Margen neto por reserva: $3.600**
- **ROI de ads: 90%**

---

## 7. Punto de Equilibrio

### Sin inversión en marketing (solo orgánico)
- Costos fijos: ~$1.000/mes
- Comisión promedio: $7.600
- **Break-even: 1 reserva/mes** ✅

### Con inversión en marketing ($50.000/mes)
- Costos totales: $51.000/mes
- Comisión promedio: $7.600
- **Break-even: 7 reservas/mes**

---

## 8. Flujo de Caja

### ¿Quién cobra al cliente?

**Opción A: Tú cobras, luego pagas a Inti Para**
```
Cliente paga $45.000 → Tu cuenta
Fin de semana: Transfieres $36.000 a Inti Para
Quedas con $9.000
```
✅ Mejor control
⚠️ Necesitas capital para flujo

**Opción B: Inti Para cobra, te paga comisión**
```
Cliente paga $45.000 → Cuenta Inti Para
Fin de mes: Inti Para te transfiere $9.000
```
✅ Sin riesgo de flujo
⚠️ Dependes de que paguen

**Opción C: Split automático (MercadoPago Marketplace)**
```
Cliente paga $45.000
MercadoPago divide automáticamente:
  → Inti Para: $36.000
  → Tú: $9.000
```
✅ Transparente para ambos
⚠️ Requiere configuración técnica

---

## 9. Escenario de Crecimiento (3 años)

| Año | Agencias | Reservas/mes | Comisión mensual | Anual |
|-----|----------|--------------|------------------|-------|
| 1 | 1 (Inti Para) | 20 | $152.000 | $1.824.000 |
| 2 | 3 agencias | 50 | $380.000 | $4.560.000 |
| 3 | 5 agencias | 100 | $760.000 | $9.120.000 |

**Si replicas el modelo con más agencias de San Pedro, el ingreso escala.**

---

## 10. Propuesta para Inti Para

### Lo que ofreces:
1. ✅ Widget de reservas en su web (ya listo)
2. ✅ Sistema de gestión de reservas
3. ✅ Integración con Google Calendar
4. ✅ Publicación en GetYourGuide/Viator (próximamente)
5. ✅ Mejora de imagen y web
6. ✅ Posicionamiento en Google

### Lo que pides:
- 20% de comisión por reserva completada
- O precio fijo de traspaso por tour

### Argumento de venta:
> "Hoy esos asientos salen vacíos. Yo te los lleno sin que inviertas un peso.
> Solo me pagas cuando hay cliente sentado en tu van."

---

## 11. Resumen Ejecutivo

| Métrica | Conservador | Moderado | Optimista |
|---------|-------------|----------|-----------|
| Comisión | 15% | 20% | 20% |
| Reservas/mes promedio | 15 | 22 | 35 |
| Ingreso mensual | $85.500 | $167.200 | $266.000 |
| **Ingreso anual** | **$1.026.000** | **$2.006.400** | **$3.192.000** |

### En USD (tipo cambio $950):
| Escenario | Mensual USD | Anual USD |
|-----------|-------------|-----------|
| Conservador | $90 | $1.080 |
| Moderado | $176 | $2.112 |
| Optimista | $280 | $3.360 |

---

## 12. Próximos Pasos

1. [ ] Reunión con Inti Para - presentar propuesta
2. [ ] Negociar % de comisión o precio traspaso
3. [ ] Definir método de liquidación (semanal/mensual)
4. [ ] Instalar widget en su WordPress
5. [ ] Configurar productos con fotos reales
6. [ ] Lanzar primeras campañas de marketing
7. [ ] Medir y optimizar

---

*Modelo generado: 28 Diciembre 2025*
