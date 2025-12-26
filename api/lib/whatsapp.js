/**
 * WhatsApp Business API Integration
 * Handles sending messages via Meta's WhatsApp Cloud API
 */

import { query } from './db.js';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Send a WhatsApp text message
 * @param {string} phone - Phone number with country code (e.g., +56912345678)
 * @param {string} message - Message text to send
 * @param {object} options - Additional options
 * @returns {Promise<object>} API response
 */
export async function sendWhatsAppMessage(phone, message, options = {}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error('WhatsApp credentials not configured (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID)');
  }

  // Clean phone number - remove all non-numeric characters
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const data = await response.json();

    // Log the message
    await logWhatsAppMessage({
      phone: cleanPhone,
      message,
      booking_id: options.bookingId || null,
      sent_by: options.sentBy || 'ai_assistant',
      status: data.messages ? 'sent' : 'failed',
      whatsapp_message_id: data.messages?.[0]?.id || null,
      error_message: data.error?.message || null
    });

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      throw new Error(data.error?.message || 'Failed to send WhatsApp message');
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      phone: cleanPhone
    };

  } catch (error) {
    console.error('WhatsApp send error:', error);

    // Log failed attempt
    await logWhatsAppMessage({
      phone: cleanPhone,
      message,
      booking_id: options.bookingId || null,
      sent_by: options.sentBy || 'ai_assistant',
      status: 'error',
      error_message: error.message
    });

    throw error;
  }
}

/**
 * Send WhatsApp message to multiple recipients
 * @param {Array<{phone: string, message?: string}>} recipients - Array of recipients
 * @param {string} defaultMessage - Default message if not specified per recipient
 * @param {object} options - Additional options
 * @returns {Promise<Array>} Results for each recipient
 */
export async function sendBulkWhatsApp(recipients, defaultMessage, options = {}) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await sendWhatsAppMessage(
        recipient.phone,
        recipient.message || defaultMessage,
        { ...options, bookingId: recipient.bookingId }
      );
      results.push({
        phone: recipient.phone,
        success: true,
        messageId: result.messageId
      });
    } catch (error) {
      results.push({
        phone: recipient.phone,
        success: false,
        error: error.message
      });
    }

    // Small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Log WhatsApp message to database
 */
async function logWhatsAppMessage(data) {
  try {
    await query(`
      INSERT INTO whatsapp_messages
      (phone, message, booking_id, sent_by, status, whatsapp_message_id, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.phone,
      data.message,
      data.booking_id,
      data.sent_by,
      data.status,
      data.whatsapp_message_id,
      data.error_message
    ]);
  } catch (error) {
    console.error('Failed to log WhatsApp message:', error);
    // Don't throw - logging shouldn't break the main flow
  }
}

/**
 * Get WhatsApp message history for a phone number
 */
export async function getMessageHistory(phone, limit = 20) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const result = await query(`
    SELECT * FROM whatsapp_messages
    WHERE phone = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [cleanPhone, limit]);

  return result.rows;
}

/**
 * Check if WhatsApp is properly configured
 */
export function isWhatsAppConfigured() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export default {
  sendWhatsAppMessage,
  sendBulkWhatsApp,
  getMessageHistory,
  isWhatsAppConfigured
};
