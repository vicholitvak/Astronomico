/**
 * WhatsApp Webhook para recibir y procesar mensajes
 * Integración con Meta/Facebook WhatsApp Business API
 * Diseñado para trabajar con n8n
 */

export default async function handler(req, res) {
  // Verificación de webhook (GET request de Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verificar el token (configúralo en las variables de entorno)
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'atacama_darksky_2024';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado correctamente');
      return res.status(200).send(challenge);
    } else {
      console.error('Verificación de webhook fallida');
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  // Procesar mensajes entrantes (POST request)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Verificar que sea un mensaje válido de WhatsApp
      if (!body.object || body.object !== 'whatsapp_business_account') {
        return res.status(400).json({ error: 'Invalid webhook object' });
      }

      // Extraer información del mensaje
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        // No hay mensajes para procesar (puede ser un status update)
        return res.status(200).json({ status: 'no_messages' });
      }

      const message = messages[0];
      const from = message.from; // Número de teléfono del remitente
      const messageId = message.id;
      const timestamp = message.timestamp;

      // Extraer el contenido del mensaje según tipo
      let messageText = '';
      let messageType = message.type;

      switch (messageType) {
        case 'text':
          messageText = message.text.body;
          break;
        case 'button':
          messageText = message.button.text;
          break;
        case 'interactive':
          if (message.interactive.type === 'button_reply') {
            messageText = message.interactive.button_reply.title;
          } else if (message.interactive.type === 'list_reply') {
            messageText = message.interactive.list_reply.title;
          }
          break;
        default:
          messageText = `[${messageType} message]`;
      }

      // Información del perfil del contacto
      const contactName = value?.contacts?.[0]?.profile?.name || 'Unknown';

      // Preparar datos para enviar a n8n
      const webhookData = {
        messageId,
        from,
        contactName,
        messageText,
        messageType,
        timestamp,
        receivedAt: new Date().toISOString(),
        // Metadata útil
        metadata: {
          wabaId: value?.metadata?.phone_number_id,
          displayPhoneNumber: value?.metadata?.display_phone_number
        }
      };

      console.log('Mensaje de WhatsApp recibido:', {
        from,
        contactName,
        text: messageText
      });

      // Enviar a n8n webhook para procesamiento
      if (process.env.N8N_WHATSAPP_WEBHOOK_URL) {
        const n8nResponse = await fetch(process.env.N8N_WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (!n8nResponse.ok) {
          console.error('Error enviando a n8n:', await n8nResponse.text());
        } else {
          console.log('Mensaje enviado a n8n correctamente');
        }
      } else {
        console.warn('N8N_WHATSAPP_WEBHOOK_URL no configurado');
      }

      // Responder a Meta inmediatamente (requerido)
      return res.status(200).json({
        status: 'received',
        messageId
      });

    } catch (error) {
      console.error('Error procesando webhook de WhatsApp:', error);
      // Siempre responder 200 a Meta para evitar reintentos
      return res.status(200).json({
        status: 'error',
        error: error.message
      });
    }
  }

  // Método no permitido
  return res.status(405).json({ error: 'Method not allowed' });
}
