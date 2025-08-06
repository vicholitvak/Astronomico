# Configuración de Google Calendar API

Para que las reservas se agreguen automáticamente a tu Google Calendar personal, necesitas configurar la Google Calendar API.

## Pasos para configurar:

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombra el proyecto "Atacama NightSky Tours"

### 2. Habilitar Google Calendar API
1. En el panel de navegación, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Calendar API"
3. Haz clic en "Habilitar"

### 3. Configurar pantalla de consentimiento OAuth
1. Ve a "APIs y servicios" > "Pantalla de consentimiento OAuth"
2. Selecciona "Externo" y haz clic en "Crear"
3. Completa los campos obligatorios:
   - Nombre de la aplicación: "Atacama NightSky Tours"
   - Email de soporte del usuario: vicente.litvak@gmail.com
   - Logotipo de la aplicación: (opcional)
   - Dominios autorizados: tu dominio del sitio web
   - Email de contacto del desarrollador: vicente.litvak@gmail.com

### 4. Crear credenciales
1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "ID de cliente OAuth"
3. Selecciona "Aplicación web"
4. Configura:
   - Nombre: "Atacama NightSky Web Client"
   - Orígenes de JavaScript autorizados: 
     - http://localhost (para desarrollo)
     - https://tu-dominio.com (para producción)
   - URIs de redirección autorizados: (mismos que arriba)

### 5. Crear API Key
1. En "Credenciales", haz clic en "Crear credenciales" > "Clave de API"
2. Copia la clave generada
3. (Opcional) Restringe la clave para mayor seguridad

### 6. Actualizar el código
En el archivo `index.html`, reemplaza las siguientes constantes:

```javascript
const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID_AQUI'; // Reemplazar con tu Client ID
const GOOGLE_API_KEY = 'TU_API_KEY_AQUI'; // Reemplazar con tu API Key
```

Con los valores obtenidos en los pasos anteriores.

## Cómo funciona:

### Cuando alguien hace una reserva:
1. El formulario captura todos los datos
2. Se crea automáticamente un evento en tu Google Calendar
3. El evento incluye:
   - Título: "Tour Astronómico - [X] personas"
   - Descripción detallada con:
     - Datos del cliente (nombre, email, teléfono)
     - Número de pasajeros
     - Comentarios especiales
     - Condiciones de la luna
     - Enlaces de contacto
   - Fecha y hora del tour (duración: 2 horas)
   - Recordatorios automáticos (1 día y 1 hora antes)
   - Cliente agregado como asistente

### Información del evento:
```
Tour Astronómico - 4 personas

📊 DETALLES DE LA RESERVA:
👥 Pasajeros: 4
📧 Contacto: Juan Pérez (juan@email.com)
📱 Teléfono: +56 9 1234 5678
💬 Comentarios: Primera vez visitando Atacama

🌙 CONDICIONES LUNARES:
Cuarto Creciente 🌓 - 45.2% iluminación

🔗 SITIO WEB: https://tu-sitio-web.com
📞 CONTACTO EMERGENCIA: +56 9 3513 4669
```

## Beneficios:
- ✅ Organización automática de reservas
- ✅ Recordatorios antes de cada tour
- ✅ Información completa del cliente en un lugar
- ✅ Sincronización con tu teléfono/dispositivos
- ✅ Historial de todas las reservas

## Seguridad:
- Las credenciales son específicas para tu dominio
- Solo tú tienes acceso a tu calendario
- Los clientes pueden ver el evento en sus calendarios
- Sistema de autenticación OAuth 2.0 de Google

## Problemas comunes:
- **"API no disponible"**: Verifica que las credenciales estén correctamente configuradas
- **"No autorizado"**: Asegúrate de que el dominio esté en la lista de orígenes autorizados
- **"Cuota excedida"**: Google tiene límites de uso, pero son muy generosos para uso normal

¡Una vez configurado, cada reserva se agregará automáticamente a tu calendario personal!