# 📱 Configuración de WhatsApp Business API

## 🎯 Objetivo
Recibir notificaciones automáticas en tu WhatsApp cuando alguien hace una reserva.

## 📋 Requisitos previos
1. Cuenta de Facebook Business
2. Número de WhatsApp Business (puede ser el mismo que usas actualmente)
3. Cuenta verificada de Meta Business

## 🚀 Pasos de configuración

### Paso 1: Crear una App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en "My Apps" → "Create App"
3. Selecciona "Business" como tipo de app
4. Completa los detalles:
   - **App Name**: Atacama NightSky Bookings
   - **App Contact Email**: vicente.litvak@gmail.com
   - **Business Account**: Selecciona tu cuenta de Business

### Paso 2: Configurar WhatsApp Business API

1. En el panel de tu app, ve a "Add Product"
2. Busca "WhatsApp" y haz clic en "Set Up"
3. En la configuración de WhatsApp:
   - Ve a "API Setup"
   - Selecciona o agrega tu número de WhatsApp Business

### Paso 3: Obtener credenciales

1. **Phone Number ID**:
   - En WhatsApp > API Setup
   - Copia el "Phone number ID" de tu número

2. **Access Token**:
   - Ve a WhatsApp > API Setup
   - Haz clic en "Generate Access Token"
   - **IMPORTANTE**: Usa un token permanente para producción
   - Para obtener un token permanente:
     - Ve a Business Settings > System Users
     - Crea un System User
     - Genera un token con permisos de `whatsapp_business_messaging`

3. **Verificar Webhook** (opcional pero recomendado):
   - En WhatsApp > Configuration
   - Configura el Webhook URL: `https://tu-dominio.vercel.app/api/webhook`
   - Token de verificación: Crea uno seguro (ej: `atacama_webhook_2024`)

### Paso 4: Configurar variables en Vercel

Ve a tu proyecto en [Vercel](https://vercel.com/) y agrega estas variables de entorno:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `WHATSAPP_TOKEN` | Token de acceso | El token permanente generado |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número | El ID de tu número de WhatsApp Business |
| `YOUR_PHONE_NUMBER` | +56935134669 | Tu número personal para recibir notificaciones |
| `WHATSAPP_WEBHOOK_TOKEN` | tu_token_secreto | Token para verificar webhooks (opcional) |

### Paso 5: Verificar el número del cliente (importante)

Para enviar mensajes a números que no han iniciado conversación:
1. Debes usar una **plantilla de mensaje aprobada**
2. O el cliente debe iniciar la conversación primero

#### Opción A: Crear una plantilla de mensaje
1. Ve a WhatsApp > Message Templates
2. Crea una nueva plantilla:
   - **Name**: booking_notification
   - **Category**: Transactional
   - **Language**: Spanish
   - **Content**:
   ```
   🌟 *Nueva Reserva - Atacama NightSky*
   
   Reserva ID: {{1}}
   Fecha: {{2}}
   Personas: {{3}}
   Cliente: {{4}}
   Teléfono: {{5}}
   ```

3. Espera la aprobación (24-48 horas)

#### Opción B: Mensajes de sesión (más simple)
- El cliente inicia conversación enviando un mensaje a tu WhatsApp Business
- Tienes 24 horas para responder libremente
- Ideal para confirmaciones inmediatas

### Paso 6: Probar la integración

1. Haz una reserva de prueba en tu sitio
2. Deberías recibir un mensaje en WhatsApp con los detalles
3. Revisa los logs en Vercel si hay problemas

## 🔧 Solución de problemas

### Error: "Token inválido"
- Verifica que el token esté activo en Meta Business
- Regenera el token si es necesario

### Error: "Número no registrado"
- Asegúrate de que el número esté verificado en WhatsApp Business
- El formato debe ser: +56935134669 (con código de país, sin espacios)

### No llegan mensajes
1. Verifica en los logs de Vercel:
   - "WhatsApp notification sent successfully" ✅
   - "WhatsApp error:" ❌

2. Revisa el estado en Meta:
   - Ve a WhatsApp > Insights
   - Verifica el estado de los mensajes enviados

## 💡 Alternativa simple: Sin API

Si prefieres no configurar la API, puedes:

1. **Usar WhatsApp Web con automatización**:
   - Servicios como Zapier o Make.com
   - Conectan el formulario con WhatsApp Web
   - Más simple pero menos confiable

2. **Notificación por email + IFTTT**:
   - Configura IFTTT para enviar WhatsApp cuando recibes un email
   - Menos directo pero funcional

## 📝 Formato del mensaje que recibirás

```
🌟 *NUEVA RESERVA - Atacama NightSky* 🌟

📅 *Fecha:* 15 de enero 2025
⏰ *Horario:* 21:00
👥 *Personas:* 4
🎯 *Tour:* Astronómico Regular
👤 *Cliente:* Juan Pérez
📱 *Teléfono:* +56 9 1234 5678

🆔 *ID Reserva:* ATK-ABC123

¡Confirma disponibilidad y contacta al cliente!
```

## ✅ Beneficios de la integración

- 📱 Notificaciones instantáneas en tu móvil
- 🔔 No perderás ninguna reserva
- 📊 Historial de conversaciones con clientes
- 🤝 Respuesta rápida a los clientes
- 📈 Mejor tasa de conversión

## 🔒 Seguridad

- Los tokens son privados y seguros
- Solo tú recibes las notificaciones
- Los datos viajan encriptados
- Cumple con políticas de Meta/WhatsApp

---

**¿Necesitas ayuda?** La configuración de WhatsApp Business API puede ser compleja. Si prefieres, podemos usar alternativas más simples como notificaciones por email o integración con Zapier.