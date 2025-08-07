# Configuración de Google Calendar API

Para que las reservas se agreguen automáticamente a tu Google Calendar personal, necesitas configurar la Google Calendar API usando una **Cuenta de Servicio** (método recomendado para aplicaciones web).

## Pasos para configurar:

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombra el proyecto "Atacama NightSky Tours"

### 2. Habilitar Google Calendar API
1. En el panel de navegación, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Calendar API"
3. Haz clic en "Habilitar"

### 3. Crear una Cuenta de Servicio (RECOMENDADO)
1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "Cuenta de servicio"
3. Configura:
   - Nombre: "Atacama Calendar Service"
   - ID: "atacama-calendar-service"
   - Descripción: "Servicio para agregar reservas al calendario"
4. Haz clic en "Crear y continuar"
5. **No asignes roles** por ahora, haz clic en "Continuar"
6. Haz clic en "Listo"

### 4. Generar clave de la cuenta de servicio
1. En la lista de cuentas de servicio, haz clic en la cuenta recién creada
2. Ve a la pestaña "Claves"
3. Haz clic en "Agregar clave" > "Crear clave nueva"
4. Selecciona formato "JSON" y haz clic en "Crear"
5. **GUARDA ESTE ARCHIVO SEGURAMENTE** - lo necesitarás más adelante

### 5. Compartir tu calendario con la cuenta de servicio
1. Abre Google Calendar en tu navegador
2. En el calendario donde quieres recibir las reservas:
   - Haz clic en los 3 puntos junto al nombre del calendario
   - Selecciona "Configuración y uso compartido"
3. En "Compartir con personas específicas":
   - Haz clic en "Agregar personas"
   - Ingresa el email de la cuenta de servicio (algo como: atacama-calendar-service@tu-proyecto.iam.gserviceaccount.com)
   - Selecciona permisos: "Hacer cambios en los eventos"
   - Haz clic en "Enviar"

### 6. Obtener el ID de tu calendario
1. En Google Calendar, ve a "Configuración y uso compartido" del calendario
2. Desplázate hacia abajo hasta "Integrar calendario"
3. Copia el "ID del calendario" (por ejemplo: vicente.litvak@gmail.com)

### 7. Configurar variables de entorno
En tu archivo `.env.local`, actualiza las siguientes variables:

```bash
# El contenido completo del archivo JSON de la cuenta de servicio (todo en una línea)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto",...}

# El ID de tu calendario personal
GOOGLE_CALENDAR_ID=vicente.litvak@gmail.com
```

**IMPORTANTE**: El valor de `GOOGLE_SERVICE_ACCOUNT_KEY` debe ser todo el contenido del archivo JSON en una sola línea, sin saltos de línea.

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