# ⚡ CONFIGURACIÓN URGENTE - Antes de Deploy

## 🔴 PASO CRÍTICO: Configurar Variable de Entorno

Antes de hacer deploy, **DEBES** configurar tu Access Token de Mercado Pago en Vercel.

---

## 🚀 Pasos Rápidos (2 minutos)

### 1. Obtener tu Access Token

1. Ve a: https://www.mercadopago.cl/developers/panel/app
2. Inicia sesión
3. Selecciona tu aplicación (o crea una nueva)
4. Ve a **"Credenciales"**
5. Copia el **Access Token de Producción**

**Formato:**
```
APP_USR-1234567890123456-123456-abc123def456...
```

---

### 2. Configurar en Vercel

**Opción A: Por la Web**

1. Ve a: https://vercel.com/vicholitvaks-projects/astronomico/settings/environment-variables
2. Click en **"Add New"**
3. Completa:
   - **Name:** `MERCADOPAGO_ACCESS_TOKEN`
   - **Value:** [Pega tu Access Token aquí]
   - **Environment:** Selecciona **Production**, **Preview** y **Development**
4. Click en **"Save"**

**Opción B: Por la Terminal**

```bash
vercel env add MERCADOPAGO_ACCESS_TOKEN
# Pega tu Access Token cuando te lo pida
# Selecciona: Production, Preview, Development
```

---

### 3. Verificar

```bash
vercel env ls
```

Deberías ver:
```
MERCADOPAGO_ACCESS_TOKEN    Production, Preview, Development
```

---

## ✅ Ahora SÍ puedes hacer Deploy

```bash
git push
vercel --prod
```

---

## 🧪 Probar en Modo Sandbox Primero

Si quieres probar antes de usar tu token real:

1. Usa tu **Access Token de TEST** en lugar del de producción
2. Usa tarjetas de prueba: https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards

**Tarjeta de Prueba Aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: `11/25`
- Nombre: Cualquier nombre

---

## ⚠️ Si No Configuras el Access Token

El botón "Pagar con Mercado Pago" mostrará error:
```
"Payment system not configured. Please contact support."
```

---

## 📞 ¿Problemas?

1. **Verifica que copiaste el token completo** (empieza con `APP_USR-`)
2. **Verifica que sea el de PRODUCCIÓN** (no el de TEST)
3. **Recarga la página de environment variables** en Vercel
4. **Haz redeploy** después de agregar la variable

---

## 🎯 Checklist Final

- [ ] Access Token obtenido de Mercado Pago
- [ ] Variable configurada en Vercel (Production + Preview + Development)
- [ ] Verificado con `vercel env ls`
- [ ] Listo para deploy

---

✅ **Una vez configurado, continúa con:**
```bash
git push
vercel --prod
```

🎉 ¡Tu sistema de pagos con Mercado Pago estará listo!
