# 📱 COMPLETAR CONFIGURACIÓN WHATSAPP

## ✅ Lo que ya tienes configurado:
- ✅ Token de acceso: `EAAKX7ymF...` (válido)
- ✅ App ID: `730003402995386`
- ✅ Permisos correctos: `whatsapp_business_messaging`

## 🔍 Lo que necesitas hacer ahora:

### Paso 1: Obtener Phone Number ID

1. **Ve a Meta Developer Console**:
   👉 https://developers.facebook.com/apps/730003402995386/whatsapp-business/wa-dev-console/

2. **Busca tu número de WhatsApp**:
   - Deberías ver tu número (+56935134669 o similar)
   - Al lado del número hay un "Phone number ID"
   - Es algo como: `123456789012345`

3. **Copia ese número** - lo necesitarás para el siguiente paso

### Paso 2: Configurar en Vercel

Ve a [Vercel Dashboard](https://vercel.com/dashboard) → tu proyecto → Settings → Environment Variables

Agrega estas 3 variables:

| Variable | Valor |
|----------|-------|
| `WHATSAPP_TOKEN` | `EAAKX7ymFNroBPBtBlRM4ZAroG5ZBUTpca5JtBE9igBeRnZAMEimWicUzqOl0lPSX4JuQcrTZCZBcZBZAqFxuPgfMqk2VZBTFRKmRbcqu4AePXPuEXevqGvqEMYVqB0WxczgkVxhQWV8OigZBTkzvWNwCIebZCC42rG04cZCeHvcQZA9ZA2ZC1ZBGTZAYZCE6y8uWafZBWDy6anLvZBo11G5ZAlj5SGBFPcZCvJA66LiHZBSgQwZBk8xTcQnjtPqa5kZD` |
| `WHATSAPP_PHONE_NUMBER_ID` | `[El número que copiaste del paso 1]` |
| `YOUR_PHONE_NUMBER` | `+56935134669` |

### Paso 3: Redesplegar

1. En Vercel, ve a "Deployments"
2. Haz clic en los 3 puntos del último deployment
3. Selecciona "Redeploy"

### Paso 4: Iniciar conversación

⚠️ **MUY IMPORTANTE**: Para que funcione, debes:

1. **Enviar "Hola" a tu número de WhatsApp Business** desde tu teléfono personal
2. Esto inicia la "ventana de 24 horas" para que el sistema pueda enviarte mensajes

### Paso 5: Probar

1. Haz una reserva de prueba en tu sitio web
2. Deberías recibir un WhatsApp como este:

```
🌟 *NUEVA RESERVA - Atacama NightSky* 🌟

📅 *Fecha:* 15 de enero 2025
⏰ *Horario:* 21:00
👥 *Personas:* 4
🎯 *Tour:* regular
👤 *Cliente:* Juan Pérez
📱 *Teléfono:* +56 9 1234 5678

🆔 *ID Reserva:* ATK-ABC123

¡Confirma disponibilidad y contacta al cliente!
```

## 🚨 Si no funciona:

### Verifica en los logs de Vercel:
- ✅ "WhatsApp notification sent successfully"
- ❌ "WhatsApp error: (24-hour window expired)"

### Soluciones comunes:
1. **"Token inválido"** → Regenera el token en Meta
2. **"24-hour window expired"** → Envía "Hola" a tu WhatsApp Business nuevamente
3. **"Phone number not found"** → Verifica el Phone Number ID

## 🔗 Enlaces útiles:
- [Meta Developer Console](https://developers.facebook.com/apps/730003402995386/)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/)
- [Vercel Dashboard](https://vercel.com/dashboard)

## ❓ ¿Necesitas ayuda?

Si tienes problemas encontrando el Phone Number ID o configurando algo, envíame un screenshot de la pantalla de Meta Developer Console y te ayudo específicamente.

---

**Una vez configurado, cada nueva reserva te llegará automáticamente por WhatsApp! 🎉**