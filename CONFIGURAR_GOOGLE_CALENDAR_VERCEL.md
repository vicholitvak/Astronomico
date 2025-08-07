# 🚨 CONFIGURACIÓN URGENTE: Google Calendar en Vercel

## ⚠️ El problema actual
Las reservas NO se están agregando a Google Calendar porque faltan las variables de entorno en Vercel.

## ✅ Solución paso a paso:

### 1. Obtener las credenciales de Google (si no las tienes)
Si ya tienes el archivo JSON de la cuenta de servicio, salta al paso 2.

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto "Atacama NightSky Tours"
3. Ve a "APIs y servicios" > "Credenciales"
4. Haz clic en tu cuenta de servicio
5. Ve a la pestaña "Claves"
6. Crea una nueva clave JSON si no tienes una

### 2. Preparar el JSON para Vercel
El archivo JSON debe convertirse a una sola línea:

1. Abre el archivo JSON descargado
2. Copia TODO el contenido
3. Ve a [JSON Minifier](https://www.minifyjson.org/)
4. Pega el contenido y haz clic en "Minify"
5. Copia el resultado (una sola línea)

### 3. Configurar en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "atacama-nightsky"
3. Ve a "Settings" > "Environment Variables"
4. Agrega estas dos variables:

#### Variable 1: GOOGLE_SERVICE_ACCOUNT_KEY
- **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Value**: [Pega aquí el JSON minificado del paso 2]
- **Environment**: Production, Preview, Development

#### Variable 2: GOOGLE_CALENDAR_ID
- **Key**: `GOOGLE_CALENDAR_ID`
- **Value**: Tu email o ID del calendario (ej: `vicente.litvak@gmail.com`)
- **Environment**: Production, Preview, Development

### 4. Compartir el calendario con la cuenta de servicio

1. Abre [Google Calendar](https://calendar.google.com)
2. Haz clic en los 3 puntos junto a tu calendario
3. Selecciona "Configuración y uso compartido"
4. En "Compartir con personas específicas", agrega:
   - Email: [El email de la cuenta de servicio del JSON, algo como: atacama-calendar@proyecto.iam.gserviceaccount.com]
   - Permisos: "Hacer cambios en los eventos"
5. Guarda

### 5. Redesplegar en Vercel

1. En Vercel, ve a "Deployments"
2. Haz clic en los 3 puntos del último deployment
3. Selecciona "Redeploy"
4. Confirma

## 🧪 Verificar que funciona

### Opción 1: Hacer una reserva de prueba
1. Ve a tu sitio web
2. Completa el formulario de reserva
3. Revisa tu Google Calendar - debería aparecer el evento

### Opción 2: Revisar logs de Vercel
1. En Vercel, ve a "Functions" > "Logs"
2. Busca mensajes como:
   - ✅ "Google Calendar event created successfully"
   - ❌ "Google Calendar credentials not configured"

## 📝 Ejemplo del JSON minificado
```
{"type":"service_account","project_id":"atacama-nightsky","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n","client_email":"atacama@proyecto.iam.gserviceaccount.com","client_id":"123456","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/atacama%40proyecto.iam.gserviceaccount.com"}
```
(Todo en una sola línea, sin saltos)

## ❓ Si sigue sin funcionar

Revisa en los logs de Vercel:
- "Has service account key: false" → La variable GOOGLE_SERVICE_ACCOUNT_KEY no está configurada
- "Has calendar ID: false" → La variable GOOGLE_CALENDAR_ID no está configurada
- "Calendar access failed" → El calendario no está compartido con la cuenta de servicio
- "Invalid service account key format" → El JSON no está bien formateado

## 💡 Tip importante
Después de agregar las variables de entorno, SIEMPRE debes redesplegar para que surtan efecto.

---

**¿Necesitas ayuda?** Escríbeme por WhatsApp con los mensajes de error específicos de los logs de Vercel.