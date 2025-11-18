# 📧 Configuración de Resend - Paso a Paso

## ✅ Checklist de Configuración

- [ ] Paso 1: Crear cuenta en Resend
- [ ] Paso 2: Obtener API Key
- [ ] Paso 3: Configurar en Vercel
- [ ] Paso 4: Agregar dominio atacamadarksky.cl
- [ ] Paso 5: Configurar registros DNS
- [ ] Paso 6: Verificar dominio
- [ ] Paso 7: Hacer deploy
- [ ] Paso 8: Probar con pago real

---

## 📋 Paso 1: Crear Cuenta en Resend

1. Ir a: **https://resend.com/signup**
2. Llenar formulario:
   - Email: (tu email)
   - Password: (crear contraseña segura)
3. Click **Sign Up**
4. Revisar email y click en link de verificación
5. ✅ Cuenta creada

---

## 🔑 Paso 2: Obtener API Key

1. Iniciar sesión en: **https://resend.com/login**
2. En el dashboard, buscar menú izquierdo
3. Click en **API Keys**
4. Click en botón **Create API Key**
5. Llenar:
   - Name: `Atacama NightSky Production`
   - Permission: **Sending access** (dejar seleccionado)
   - Domain: `All domains` (por ahora)
6. Click **Add**
7. **COPIAR LA KEY INMEDIATAMENTE** (empieza con `re_`)
   - ⚠️ Solo la verás UNA vez
   - Guardarla en un lugar seguro (notepad temporalmente)

Ejemplo de API Key:
```
re_123456789abcdefghijklmnop
```

---

## ⚙️ Paso 3: Configurar en Vercel

1. Ir a: **https://vercel.com/dashboard**
2. Buscar proyecto: **astronomico** o **atacama-nightsky**
3. Click en el proyecto
4. En el menú superior, click **Settings**
5. En el menú izquierdo, click **Environment Variables**
6. Click botón **Add New** (arriba a la derecha)
7. Llenar el formulario:

```
Name: RESEND_API_KEY

Value: re_123456789abcdefghijklmnop
(pegar tu API key aquí)

Environments:
☑️ Production
☑️ Preview
☑️ Development
```

8. Click **Save**
9. Vercel preguntará: "Redeploy to apply changes?"
10. Click **Redeploy**
11. ✅ Variable configurada

---

## 📮 Paso 4: Agregar Dominio

1. En Resend dashboard
2. Menú izquierdo → Click **Domains**
3. Click botón **Add Domain**
4. Ingresar: `atacamadarksky.cl`
5. Click **Add**
6. Resend mostrará 3 registros DNS que debes configurar

---

## 🌐 Paso 5: Configurar Registros DNS

Resend te mostrará algo como esto:

### Registro 1: SPF (TXT)
```
Type: TXT
Name: @ (o vacío)
Value: v=spf1 include:resend.com ~all
```

### Registro 2: DKIM (TXT)
```
Type: TXT
Name: resend._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
(valor largo)
```

### Registro 3: DMARC (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@atacamadarksky.cl
```

### ¿Dónde agregar estos registros?

Depende de dónde compraste el dominio `atacamadarksky.cl`:

#### Si compraste en NIC Chile:
1. Ir a: https://www.nic.cl
2. Login con tu cuenta
3. Mis Dominios → atacamadarksky.cl
4. DNS / Nameservers
5. Agregar los 3 registros TXT

#### Si usas Cloudflare:
1. Ir a: https://dash.cloudflare.com
2. Seleccionar atacamadarksky.cl
3. Click en **DNS** (menú izquierdo)
4. Click **Add record** para cada uno
5. Agregar los 3 registros TXT

#### Si usas otro proveedor:
- Buscar sección "DNS Management" o "DNS Records"
- Agregar los 3 registros tipo TXT

---

## ✅ Paso 6: Verificar Dominio

1. Después de agregar los registros DNS
2. **Esperar 10-15 minutos** (propagación de DNS)
3. Volver a Resend → Domains
4. Click en botón **Verify** junto a atacamadarksky.cl
5. Si dice ✅ Verified → ¡Listo!
6. Si dice ❌ Not verified → Esperar más tiempo y volver a intentar

---

## 🚀 Paso 7: Deploy

```bash
cd D:\dev\projects\astro-page
vercel --prod
```

Esperar ~1 minuto.

---

## 🧪 Paso 8: Probar el Sistema

### Hacer un pago de prueba:

1. Ir a: https://atacamadarksky.cl
2. Scroll a Tours
3. Click en **Pagar** (cualquier tour)
4. Llenar el formulario
5. Usar tarjeta de prueba de Mercado Pago:
   ```
   Tarjeta: 5031 7557 3453 0604
   CVV: 123
   Fecha: 11/25
   Nombre: APRO (para aprobar)
   ```
6. Completar pago

### Qué debería pasar:

1. ✅ Redirige a página de éxito
2. ✅ Email 1 (Mercado Pago):
   ```
   Subject: Tu pago ya se acreditó
   Operación: 133343697409
   ```
3. ✅ Email 2 (Atacama NightSky) - **5-10 segundos después**:
   ```
   Subject: ✅ Reserva Confirmada - Tour X
   Número de Reserva: ATK-133343697409
   ID de Pago: 133343697409
   ```

---

## 🔍 Verificar Logs

### En Vercel:
1. Ir a: https://vercel.com/vicholitvaks-projects/astronomico
2. Click en último deployment
3. Click en **Functions**
4. Click en `/api/mercadopago-webhook`
5. Ver logs:
```
[WEBHOOK] Notification received
[WEBHOOK] Payment approved, processing...
[WEBHOOK] Booking saved to database
[WEBHOOK] Confirmation email sent successfully ✅
```

### En Resend:
1. Ir a: https://resend.com/emails
2. Ver email enviado
3. Estado debería ser: **Delivered** ✅

---

## ❓ Troubleshooting

### Email no llega:

**Verificar API Key:**
```bash
# En Vercel → Settings → Environment Variables
# Debe existir: RESEND_API_KEY = re_xxxxx
```

**Verificar dominio:**
- En Resend → Domains
- Debe mostrar ✅ Verified
- Si no, revisar registros DNS

**Verificar logs:**
- Vercel → Functions → mercadopago-webhook
- Buscar errores

### Email va a spam:

- Usar dominio verificado (no `onboarding@resend.dev`)
- Asegurar que SPF, DKIM y DMARC estén configurados
- Esperar ~24 horas después de verificar dominio

### Webhook no se ejecuta:

**Verificar webhook en Mercado Pago:**
1. Panel de Mercado Pago
2. Integraciones → Webhooks
3. URL: https://atacamadarksky.cl/api/mercadopago-webhook
4. Estado: Activo ✅

---

## 📊 Monitoreo

### Dashboard de Resend:
- Ver emails enviados: https://resend.com/emails
- Analytics: https://resend.com/analytics

### Base de Datos:
```sql
-- Ver últimas reservas
SELECT booking_id, name, email, status, created_at
FROM bookings
WHERE source = 'mercadopago'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 💡 Tips

1. **Testing:** Usa tarjetas de prueba de MP para probar
2. **Spam:** Primeros emails pueden ir a spam, márcalos como "No spam"
3. **Dominio:** SIEMPRE verifica el dominio para evitar spam
4. **Logs:** Revisa logs en Vercel si algo falla
5. **Soporte:** Resend tiene excelente documentación

---

## ✅ Checklist Final

- [ ] Cuenta Resend creada ✅
- [ ] API Key obtenida ✅
- [ ] Variable en Vercel configurada ✅
- [ ] Dominio agregado en Resend ✅
- [ ] Registros DNS configurados ✅
- [ ] Dominio verificado ✅
- [ ] Deploy realizado ✅
- [ ] Pago de prueba exitoso ✅
- [ ] Email recibido ✅

---

¡Todo listo! 🎉
