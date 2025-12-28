/**
 * Claude AI Assistant with Tool Use
 * Central intelligence for Atacama Dark Sky operations
 */

import { query } from '../lib/db.js';
import { sendWhatsAppMessage, sendBulkWhatsApp, isWhatsAppConfigured } from '../lib/whatsapp.js';
import { pushAvailabilityToGYG } from './gyg.js';

// ============ HELPER FUNCTIONS ============

function getChileDate() {
  const now = new Date();
  const chileOffset = -3; // Chile Summer Time
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const chile = new Date(utc + (3600000 * chileOffset));
  return chile.toISOString().split('T')[0];
}

function getDateFromRange(range) {
  const today = getChileDate();
  const todayDate = new Date(today + 'T12:00:00');

  switch (range) {
    case 'today':
      return { start: today, end: today };
    case 'tomorrow':
      const tomorrow = new Date(todayDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      return { start: tomorrowStr, end: tomorrowStr };
    case 'week':
      const weekEnd = new Date(todayDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return { start: today, end: weekEnd.toISOString().split('T')[0] };
    default:
      return { start: today, end: today };
  }
}

// ============ TOOLS DEFINITION ============

const tools = [
  {
    name: "query_bookings",
    description: "Consultar reservas de tours. Usa esto para saber quién viene hoy, mañana, esta semana, o buscar un cliente específico por nombre o teléfono.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Fecha específica en formato YYYY-MM-DD"
        },
        date_range: {
          type: "string",
          enum: ["today", "tomorrow", "week"],
          description: "Rango de fechas predefinido"
        },
        client_name: {
          type: "string",
          description: "Nombre del cliente a buscar (búsqueda parcial)"
        },
        phone: {
          type: "string",
          description: "Número de teléfono a buscar"
        },
        status: {
          type: "string",
          enum: ["confirmed", "pending", "cancelled", "all"],
          description: "Filtrar por estado de reserva"
        },
        tour_type: {
          type: "string",
          enum: ["regular", "private", "astrophoto"],
          description: "Filtrar por tipo de tour"
        }
      }
    }
  },
  {
    name: "send_whatsapp",
    description: "Enviar mensaje de WhatsApp a un cliente. IMPORTANTE: Siempre muestra el mensaje propuesto y pide confirmación antes de usar esta herramienta.",
    input_schema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Número de teléfono con código de país (ej: +33612345678)"
        },
        message: {
          type: "string",
          description: "Mensaje a enviar. Debe ser en INGLÉS para turistas internacionales."
        },
        booking_id: {
          type: "string",
          description: "ID de la reserva relacionada (opcional, para logging)"
        }
      },
      required: ["phone", "message"]
    }
  },
  {
    name: "send_bulk_whatsapp",
    description: "Enviar el mismo mensaje a múltiples clientes. IMPORTANTE: Muestra el mensaje y la lista de destinatarios, pide confirmación antes de enviar.",
    input_schema: {
      type: "object",
      properties: {
        phones: {
          type: "array",
          items: { type: "string" },
          description: "Lista de números de teléfono"
        },
        message: {
          type: "string",
          description: "Mensaje a enviar a todos (en INGLÉS)"
        }
      },
      required: ["phones", "message"]
    }
  },
  {
    name: "save_memory",
    description: "Guardar información importante en la memoria del sistema para recordar en el futuro. Usa esto para patrones, preferencias de clientes, aprendizajes operacionales.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["cliente", "operacion", "clima", "preferencia", "aprendizaje", "hotel"],
          description: "Categoría del conocimiento"
        },
        key: {
          type: "string",
          description: "Identificador único (ej: nombre_cliente, fecha, concepto)"
        },
        content: {
          type: "string",
          description: "El conocimiento a guardar"
        }
      },
      required: ["category", "key", "content"]
    }
  },
  {
    name: "recall_memory",
    description: "Buscar en la memoria del sistema. Usa esto para recordar información guardada anteriormente.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Categoría a buscar (opcional)"
        },
        search: {
          type: "string",
          description: "Texto a buscar en el contenido"
        }
      }
    }
  },
  {
    name: "get_stats",
    description: "Obtener estadísticas del negocio: reservas del mes, ingresos, etc.",
    input_schema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["today", "week", "month", "year"],
          description: "Período para las estadísticas"
        }
      }
    }
  },
  {
    name: "update_booking",
    description: "Modificar una reserva existente. Puedes cambiar fecha, hora, número de personas, estado, hotel, o agregar notas. IMPORTANTE: Confirma los cambios con el usuario antes de ejecutar.",
    input_schema: {
      type: "object",
      properties: {
        booking_id: {
          type: "string",
          description: "ID de la reserva (ej: GYG-ABC123 o ATK-123456)"
        },
        date: {
          type: "string",
          description: "Nueva fecha en formato YYYY-MM-DD"
        },
        time: {
          type: "string",
          description: "Nueva hora (ej: 21:00, 21:30)"
        },
        persons: {
          type: "integer",
          description: "Nuevo número de personas"
        },
        status: {
          type: "string",
          enum: ["confirmed", "pending", "cancelled"],
          description: "Nuevo estado de la reserva"
        },
        accommodation: {
          type: "string",
          description: "Nuevo hotel/alojamiento para pickup"
        },
        message: {
          type: "string",
          description: "Notas adicionales sobre la reserva"
        }
      },
      required: ["booking_id"]
    }
  },
  {
    name: "create_booking",
    description: "Crear una nueva reserva. IMPORTANTE: Confirma los datos con el usuario antes de crear. Genera automáticamente un ID único.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre completo del cliente"
        },
        phone: {
          type: "string",
          description: "Teléfono con código de país (ej: +33612345678)"
        },
        email: {
          type: "string",
          description: "Email del cliente (opcional)"
        },
        date: {
          type: "string",
          description: "Fecha del tour en formato YYYY-MM-DD"
        },
        time: {
          type: "string",
          description: "Hora del tour (default: 21:00)"
        },
        tour_type: {
          type: "string",
          enum: ["regular", "private", "astrophoto"],
          description: "Tipo de tour"
        },
        persons: {
          type: "integer",
          description: "Número de personas"
        },
        accommodation: {
          type: "string",
          description: "Hotel para pickup"
        },
        message: {
          type: "string",
          description: "Notas adicionales"
        }
      },
      required: ["name", "phone", "date", "tour_type", "persons"]
    }
  },
  {
    name: "client_history",
    description: "Ver historial completo de un cliente: todas sus reservas anteriores, frecuencia, preferencias.",
    input_schema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Teléfono del cliente"
        },
        email: {
          type: "string",
          description: "Email del cliente"
        },
        name: {
          type: "string",
          description: "Nombre del cliente (búsqueda parcial)"
        }
      }
    }
  },
  {
    name: "availability_check",
    description: "Verificar disponibilidad para una fecha. Muestra cuántos espacios quedan por tipo de tour.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Fecha a consultar en formato YYYY-MM-DD"
        },
        date_range: {
          type: "string",
          enum: ["today", "tomorrow", "week"],
          description: "O usar un rango predefinido"
        },
        tour_type: {
          type: "string",
          enum: ["regular", "private", "astrophoto"],
          description: "Filtrar por tipo de tour específico"
        }
      }
    }
  },
  {
    name: "weather_check",
    description: "Consultar el clima y condiciones del cielo para San Pedro de Atacama. Útil para decidir si hacer el tour.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          enum: ["today", "tomorrow", "week"],
          description: "Cuándo consultar el clima"
        }
      }
    }
  },
  {
    name: "send_reminder",
    description: "Enviar recordatorio de tour a un cliente o a todos los clientes de una fecha específica.",
    input_schema: {
      type: "object",
      properties: {
        booking_id: {
          type: "string",
          description: "ID de reserva específica para enviar recordatorio"
        },
        date: {
          type: "string",
          description: "Enviar recordatorio a TODOS los clientes de esta fecha (YYYY-MM-DD)"
        },
        hours_before: {
          type: "integer",
          description: "Tipo de recordatorio: 24 (día antes) o 2 (horas antes del tour)"
        }
      }
    }
  },
  {
    name: "get_alerts",
    description: "Obtener alertas y avisos importantes del sistema: reservas pendientes, capacidad excedida, clientes frecuentes, etc.",
    input_schema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "block_date",
    description: "Bloquear una fecha para tours. Notifica automáticamente a GetYourGuide. Tipos: 'full' (todo bloqueado), 'private_only' (solo privados bloqueados), 'regular_only' (solo regulares bloqueados).",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Fecha a bloquear en formato YYYY-MM-DD"
        },
        block_type: {
          type: "string",
          enum: ["full", "private_only", "regular_only"],
          description: "Tipo de bloqueo: full (todo), private_only (solo privados), regular_only (solo regulares)"
        },
        reason: {
          type: "string",
          description: "Motivo del bloqueo (ej: mal clima, evento especial, mantenimiento)"
        }
      },
      required: ["date", "reason"]
    }
  },
  {
    name: "unblock_date",
    description: "Desbloquear una fecha previamente bloqueada. Notifica automáticamente a GetYourGuide para restaurar disponibilidad.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Fecha a desbloquear en formato YYYY-MM-DD"
        }
      },
      required: ["date"]
    }
  },
  {
    name: "list_blocked_dates",
    description: "Ver todas las fechas bloqueadas y sus motivos.",
    input_schema: {
      type: "object",
      properties: {
        from_date: {
          type: "string",
          description: "Fecha inicio (opcional, default: hoy)"
        },
        to_date: {
          type: "string",
          description: "Fecha fin (opcional, default: +30 días)"
        }
      }
    }
  }
];

// ============ TOOL HANDLERS ============

async function handleQueryBookings(params) {
  const conditions = ["status != 'cancelled'"];
  const values = [];
  let paramIndex = 1;

  // Date handling
  if (params.date) {
    conditions.push(`date = $${paramIndex}`);
    values.push(params.date);
    paramIndex++;
  } else if (params.date_range) {
    const { start, end } = getDateFromRange(params.date_range);
    conditions.push(`date >= $${paramIndex} AND date <= $${paramIndex + 1}`);
    values.push(start, end);
    paramIndex += 2;
  }

  // Status filter
  if (params.status && params.status !== 'all') {
    conditions.push(`status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }

  // Tour type filter
  if (params.tour_type) {
    conditions.push(`tour_type = $${paramIndex}`);
    values.push(params.tour_type);
    paramIndex++;
  }

  // Client name search
  if (params.client_name) {
    conditions.push(`LOWER(name) LIKE LOWER($${paramIndex})`);
    values.push(`%${params.client_name}%`);
    paramIndex++;
  }

  // Phone search
  if (params.phone) {
    conditions.push(`phone LIKE $${paramIndex}`);
    values.push(`%${params.phone.replace(/[^0-9]/g, '')}%`);
    paramIndex++;
  }

  const sql = `
    SELECT booking_id, date, time, tour_type, persons, name, email, phone,
           accommodation, status, source, message, payment_method
    FROM bookings
    WHERE ${conditions.join(' AND ')}
    ORDER BY date ASC, time ASC
    LIMIT 50
  `;

  const result = await query(sql, values);

  if (result.rows.length === 0) {
    return { found: 0, message: "No se encontraron reservas con esos criterios." };
  }

  return {
    found: result.rows.length,
    bookings: result.rows.map(b => ({
      id: b.booking_id,
      fecha: b.date,
      hora: b.time,
      tipo: b.tour_type,
      personas: b.persons,
      nombre: b.name,
      telefono: b.phone,
      email: b.email,
      hotel: b.accommodation,
      estado: b.status,
      fuente: b.source,
      notas: b.message
    }))
  };
}

async function handleSendWhatsApp(params) {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp no está configurado en el sistema." };
  }

  try {
    const result = await sendWhatsAppMessage(params.phone, params.message, {
      bookingId: params.booking_id,
      sentBy: 'ai_assistant'
    });
    return {
      success: true,
      message: `Mensaje enviado exitosamente a ${params.phone}`,
      messageId: result.messageId
    };
  } catch (error) {
    return {
      success: false,
      error: `Error enviando mensaje: ${error.message}`
    };
  }
}

async function handleBulkWhatsApp(params) {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp no está configurado en el sistema." };
  }

  const recipients = params.phones.map(phone => ({ phone }));
  const results = await sendBulkWhatsApp(recipients, params.message, { sentBy: 'ai_assistant' });

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: failed === 0,
    sent: successful,
    failed: failed,
    details: results
  };
}

async function handleSaveMemory(params) {
  try {
    // Check if key exists, update or insert
    const existing = await query(
      'SELECT id FROM ai_memory WHERE category = $1 AND key = $2',
      [params.category, params.key]
    );

    if (existing.rows.length > 0) {
      await query(
        'UPDATE ai_memory SET content = $1, updated_at = NOW() WHERE category = $2 AND key = $3',
        [params.content, params.category, params.key]
      );
      return { success: true, action: 'updated', key: params.key };
    } else {
      await query(
        'INSERT INTO ai_memory (category, key, content) VALUES ($1, $2, $3)',
        [params.category, params.key, params.content]
      );
      return { success: true, action: 'created', key: params.key };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleRecallMemory(params) {
  try {
    let sql = 'SELECT category, key, content, created_at, updated_at FROM ai_memory WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (params.category) {
      sql += ` AND category = $${paramIndex}`;
      values.push(params.category);
      paramIndex++;
    }

    if (params.search) {
      sql += ` AND (LOWER(content) LIKE LOWER($${paramIndex}) OR LOWER(key) LIKE LOWER($${paramIndex}))`;
      values.push(`%${params.search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY updated_at DESC LIMIT 20';

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return { found: 0, message: "No encontré información relevante en mi memoria." };
    }

    return {
      found: result.rows.length,
      memories: result.rows
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetStats(params) {
  const today = getChileDate();
  let startDate, endDate = today;

  switch (params.period) {
    case 'today':
      startDate = today;
      break;
    case 'week':
      const weekAgo = new Date(today + 'T12:00:00');
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'month':
      startDate = today.substring(0, 7) + '-01';
      break;
    case 'year':
      startDate = today.substring(0, 4) + '-01-01';
      break;
    default:
      startDate = today.substring(0, 7) + '-01';
  }

  const result = await query(`
    SELECT
      COUNT(*) as total_reservas,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmadas,
      COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN persons ELSE 0 END), 0) as total_personas,
      COUNT(*) FILTER (WHERE tour_type = 'regular') as tours_regular,
      COUNT(*) FILTER (WHERE tour_type = 'private') as tours_privados,
      COUNT(*) FILTER (WHERE tour_type = 'astrophoto') as tours_astrofoto,
      COUNT(*) FILTER (WHERE source = 'gyg') as via_gyg,
      COUNT(*) FILTER (WHERE source != 'gyg' OR source IS NULL) as via_directa
    FROM bookings
    WHERE date >= $1 AND date <= $2
  `, [startDate, endDate]);

  return {
    periodo: `${startDate} a ${endDate}`,
    ...result.rows[0]
  };
}

async function handleUpdateBooking(params) {
  try {
    // First, find the booking
    const existing = await query(
      'SELECT * FROM bookings WHERE booking_id = $1',
      [params.booking_id]
    );

    if (existing.rows.length === 0) {
      return { success: false, error: `No se encontró la reserva ${params.booking_id}` };
    }

    const booking = existing.rows[0];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (params.date) {
      updates.push(`date = $${paramIndex}`);
      values.push(params.date);
      paramIndex++;
    }
    if (params.time) {
      updates.push(`time = $${paramIndex}`);
      values.push(params.time);
      paramIndex++;
    }
    if (params.persons) {
      updates.push(`persons = $${paramIndex}`);
      values.push(params.persons);
      paramIndex++;
    }
    if (params.status) {
      updates.push(`status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }
    if (params.accommodation) {
      updates.push(`accommodation = $${paramIndex}`);
      values.push(params.accommodation);
      paramIndex++;
    }
    if (params.message) {
      updates.push(`message = $${paramIndex}`);
      values.push(params.message);
      paramIndex++;
    }

    if (updates.length === 0) {
      return { success: false, error: 'No se especificaron campos para actualizar' };
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Execute update
    values.push(params.booking_id);
    const sql = `
      UPDATE bookings
      SET ${updates.join(', ')}
      WHERE booking_id = $${paramIndex}
      RETURNING booking_id, date, time, tour_type, persons, name, phone, accommodation, status, message
    `;

    const result = await query(sql, values);
    const updated = result.rows[0];

    // Build change summary
    const changes = [];
    if (params.date && params.date !== booking.date) changes.push(`fecha: ${booking.date} → ${params.date}`);
    if (params.time && params.time !== booking.time) changes.push(`hora: ${booking.time} → ${params.time}`);
    if (params.persons && params.persons !== booking.persons) changes.push(`personas: ${booking.persons} → ${params.persons}`);
    if (params.status && params.status !== booking.status) changes.push(`estado: ${booking.status} → ${params.status}`);
    if (params.accommodation) changes.push(`hotel: ${params.accommodation}`);
    if (params.message) changes.push(`notas actualizadas`);

    return {
      success: true,
      message: `Reserva ${params.booking_id} actualizada`,
      cambios: changes,
      reserva: {
        id: updated.booking_id,
        cliente: updated.name,
        fecha: updated.date,
        hora: updated.time,
        personas: updated.persons,
        tipo: updated.tour_type,
        hotel: updated.accommodation,
        estado: updated.status,
        telefono: updated.phone
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate unique booking ID
function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'ATK-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function handleCreateBooking(params) {
  try {
    const bookingId = generateBookingId();
    const time = params.time || '21:00';

    const result = await query(`
      INSERT INTO bookings (booking_id, name, phone, email, date, time, tour_type, persons, accommodation, message, status, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'admin', NOW())
      RETURNING *
    `, [
      bookingId,
      params.name,
      params.phone,
      params.email || null,
      params.date,
      time,
      params.tour_type,
      params.persons,
      params.accommodation || null,
      params.message || null
    ]);

    const booking = result.rows[0];
    return {
      success: true,
      message: `Reserva creada exitosamente`,
      reserva: {
        id: booking.booking_id,
        cliente: booking.name,
        telefono: booking.phone,
        fecha: booking.date,
        hora: booking.time,
        tipo: booking.tour_type,
        personas: booking.persons,
        hotel: booking.accommodation,
        estado: 'pending'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleClientHistory(params) {
  try {
    let conditions = [];
    let values = [];
    let paramIndex = 1;

    if (params.phone) {
      conditions.push(`phone LIKE $${paramIndex}`);
      values.push(`%${params.phone.replace(/[^0-9]/g, '')}%`);
      paramIndex++;
    }
    if (params.email) {
      conditions.push(`LOWER(email) = LOWER($${paramIndex})`);
      values.push(params.email);
      paramIndex++;
    }
    if (params.name) {
      conditions.push(`LOWER(name) LIKE LOWER($${paramIndex})`);
      values.push(`%${params.name}%`);
      paramIndex++;
    }

    if (conditions.length === 0) {
      return { success: false, error: 'Debes especificar phone, email o name para buscar' };
    }

    const result = await query(`
      SELECT booking_id, date, time, tour_type, persons, name, phone, email, status, source, created_at
      FROM bookings
      WHERE ${conditions.join(' OR ')}
      ORDER BY date DESC
      LIMIT 50
    `, values);

    if (result.rows.length === 0) {
      return { found: 0, message: 'No se encontró historial para este cliente' };
    }

    // Calculate stats
    const bookings = result.rows;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const totalPersons = bookings.reduce((sum, b) => sum + (parseInt(b.persons) || 0), 0);
    const tourTypes = {};
    bookings.forEach(b => {
      tourTypes[b.tour_type] = (tourTypes[b.tour_type] || 0) + 1;
    });

    return {
      found: bookings.length,
      cliente: {
        nombre: bookings[0].name,
        telefono: bookings[0].phone,
        email: bookings[0].email
      },
      estadisticas: {
        total_reservas: bookings.length,
        confirmadas: confirmed,
        canceladas: cancelled,
        total_personas: totalPersons,
        cliente_frecuente: bookings.length >= 3,
        tours_por_tipo: tourTypes
      },
      historial: bookings.map(b => ({
        id: b.booking_id,
        fecha: b.date,
        tipo: b.tour_type,
        personas: b.persons,
        estado: b.status,
        fuente: b.source
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleAvailabilityCheck(params) {
  try {
    // Capacity limits
    const CAPACITY = {
      regular: 16,    // Max 16 persons per regular tour
      private: 4,     // Max 4 persons per private (1 tour per night)
      astrophoto: 6   // Max 6 persons for astrophoto
    };

    let dates = [];
    const today = getChileDate();

    if (params.date) {
      dates = [params.date];
    } else if (params.date_range) {
      const { start, end } = getDateFromRange(params.date_range);
      // Generate date range
      let current = new Date(start + 'T12:00:00');
      const endDate = new Date(end + 'T12:00:00');
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    } else {
      dates = [today];
    }

    const result = await query(`
      SELECT date, tour_type, SUM(persons) as total_persons, COUNT(*) as num_bookings
      FROM bookings
      WHERE date = ANY($1) AND status != 'cancelled'
      GROUP BY date, tour_type
      ORDER BY date, tour_type
    `, [dates]);

    // Build availability map
    const availability = {};
    dates.forEach(date => {
      availability[date] = {
        regular: { capacity: CAPACITY.regular, booked: 0, available: CAPACITY.regular },
        private: { capacity: CAPACITY.private, booked: 0, available: CAPACITY.private },
        astrophoto: { capacity: CAPACITY.astrophoto, booked: 0, available: CAPACITY.astrophoto }
      };
    });

    result.rows.forEach(row => {
      const date = row.date;
      const type = row.tour_type;
      if (availability[date] && availability[date][type]) {
        availability[date][type].booked = parseInt(row.total_persons);
        availability[date][type].available = CAPACITY[type] - parseInt(row.total_persons);
      }
    });

    // Filter by tour type if specified
    if (params.tour_type) {
      Object.keys(availability).forEach(date => {
        const typeData = availability[date][params.tour_type];
        availability[date] = { [params.tour_type]: typeData };
      });
    }

    return {
      success: true,
      fechas_consultadas: dates.length,
      disponibilidad: availability
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleWeatherCheck(params) {
  try {
    // San Pedro de Atacama coordinates
    const lat = -22.9087;
    const lon = -68.1997;

    // Use Open-Meteo API (free, no API key needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,cloudcover_mean,weathercode&hourly=cloudcover,visibility&timezone=America/Santiago&forecast_days=7`
    );

    if (!response.ok) {
      return { success: false, error: 'Error consultando API de clima' };
    }

    const data = await response.json();
    const today = getChileDate();

    // Weather codes interpretation for astronomy
    const getWeatherDescription = (code) => {
      if (code === 0) return { desc: 'Despejado', icon: '☀️', good_for_astronomy: true };
      if (code <= 3) return { desc: 'Parcialmente nublado', icon: '⛅', good_for_astronomy: true };
      if (code <= 49) return { desc: 'Niebla/Bruma', icon: '🌫️', good_for_astronomy: false };
      if (code <= 69) return { desc: 'Lluvia', icon: '🌧️', good_for_astronomy: false };
      if (code <= 79) return { desc: 'Nieve', icon: '❄️', good_for_astronomy: false };
      return { desc: 'Tormenta', icon: '⛈️', good_for_astronomy: false };
    };

    // Get tonight's cloud cover (21:00 - 00:00)
    const getTonightCloudCover = (hourlyData, dateStr) => {
      const dateIndex = hourlyData.time.findIndex(t => t.startsWith(dateStr));
      if (dateIndex === -1) return null;
      // Hours 21, 22, 23 of that day
      const nightHours = [21, 22, 23].map(h => dateIndex + h);
      const clouds = nightHours.map(i => hourlyData.cloudcover[i]).filter(c => c !== undefined);
      return clouds.length > 0 ? Math.round(clouds.reduce((a, b) => a + b, 0) / clouds.length) : null;
    };

    const forecast = data.daily.time.map((date, i) => {
      const weather = getWeatherDescription(data.daily.weathercode[i]);
      const nightCloudCover = getTonightCloudCover(data.hourly, date);

      return {
        fecha: date,
        temperatura_max: data.daily.temperature_2m_max[i],
        temperatura_min: data.daily.temperature_2m_min[i],
        nubes_promedio: data.daily.cloudcover_mean[i],
        nubes_noche: nightCloudCover,
        prob_lluvia: data.daily.precipitation_probability_max[i],
        clima: weather.desc,
        icono: weather.icon,
        bueno_para_tour: weather.good_for_astronomy && (nightCloudCover === null || nightCloudCover < 30),
        recomendacion: (nightCloudCover !== null && nightCloudCover < 20) ? '✅ Excelente para observación' :
                       (nightCloudCover !== null && nightCloudCover < 40) ? '👍 Buenas condiciones' :
                       (nightCloudCover !== null && nightCloudCover < 60) ? '⚠️ Condiciones regulares' :
                       '❌ No recomendado para tour'
      };
    });

    // Limit based on requested range
    let days = 1;
    if (params.date === 'tomorrow') days = 2;
    else if (params.date === 'week') days = 7;

    return {
      success: true,
      ubicacion: 'San Pedro de Atacama',
      pronostico: forecast.slice(0, days),
      nota: 'Nubes < 20% = cielo excelente para astronomía'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleSendReminder(params) {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp no está configurado' };
  }

  try {
    let bookings = [];

    if (params.booking_id) {
      const result = await query(
        'SELECT * FROM bookings WHERE booking_id = $1 AND status = $2',
        [params.booking_id, 'confirmed']
      );
      bookings = result.rows;
    } else if (params.date) {
      const result = await query(
        'SELECT * FROM bookings WHERE date = $1 AND status = $2',
        [params.date, 'confirmed']
      );
      bookings = result.rows;
    } else {
      return { success: false, error: 'Especifica booking_id o date' };
    }

    if (bookings.length === 0) {
      return { success: false, error: 'No hay reservas confirmadas para enviar recordatorio' };
    }

    const hoursText = params.hours_before === 2 ? '2 hours' : 'tomorrow';
    const results = [];

    for (const booking of bookings) {
      const message = params.hours_before === 2
        ? `Hi ${booking.name.split(' ')[0]}! 🌟 Reminder: Your stargazing tour starts in 2 hours. We'll pick you up at ${booking.accommodation || 'your hotel'} at ${booking.time}. Please be ready 5 minutes before. See you soon!`
        : `Hi ${booking.name.split(' ')[0]}! 🌌 This is a reminder that your Atacama Dark Sky tour is ${hoursText} at ${booking.time}. We'll pick you up at ${booking.accommodation || 'your hotel'}. Dress warmly - it gets cold in the desert at night! Questions? Reply to this message.`;

      try {
        await sendWhatsAppMessage(booking.phone, message, {
          bookingId: booking.booking_id,
          sentBy: 'ai_reminder'
        });
        results.push({ booking_id: booking.booking_id, name: booking.name, success: true });
      } catch (err) {
        results.push({ booking_id: booking.booking_id, name: booking.name, success: false, error: err.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    return {
      success: true,
      enviados: successful,
      fallidos: results.length - successful,
      detalles: results
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleGetAlerts(params) {
  try {
    const today = getChileDate();
    const tomorrow = new Date(today + 'T12:00:00');
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const alerts = [];

    // 1. Pending bookings for today/tomorrow
    const pending = await query(`
      SELECT booking_id, name, date, tour_type, persons
      FROM bookings
      WHERE status = 'pending' AND date IN ($1, $2)
      ORDER BY date
    `, [today, tomorrowStr]);

    if (pending.rows.length > 0) {
      alerts.push({
        tipo: '⚠️ RESERVAS PENDIENTES',
        urgencia: 'alta',
        mensaje: `${pending.rows.length} reservas sin confirmar para hoy/mañana`,
        detalles: pending.rows.map(r => `${r.name} - ${r.date} (${r.persons} pers)`)
      });
    }

    // 2. Capacity check for today/tomorrow
    const capacity = await query(`
      SELECT date, tour_type, SUM(persons) as total
      FROM bookings
      WHERE date IN ($1, $2) AND status != 'cancelled'
      GROUP BY date, tour_type
    `, [today, tomorrowStr]);

    const LIMITS = { regular: 16, private: 4, astrophoto: 6 };
    capacity.rows.forEach(row => {
      if (parseInt(row.total) > LIMITS[row.tour_type]) {
        alerts.push({
          tipo: '🚨 CAPACIDAD EXCEDIDA',
          urgencia: 'crítica',
          mensaje: `${row.tour_type} del ${row.date}: ${row.total} personas (máx ${LIMITS[row.tour_type]})`,
          accion: 'Reubicar clientes o agregar guía'
        });
      }
    });

    // 3. Frequent clients (3+ bookings)
    const frequent = await query(`
      SELECT name, phone, COUNT(*) as total_bookings
      FROM bookings
      WHERE status = 'confirmed' AND date >= $1
      GROUP BY name, phone
      HAVING COUNT(*) >= 3
    `, [today]);

    if (frequent.rows.length > 0) {
      alerts.push({
        tipo: '⭐ CLIENTES FRECUENTES',
        urgencia: 'info',
        mensaje: `${frequent.rows.length} cliente(s) con 3+ reservas`,
        detalles: frequent.rows.map(r => `${r.name}: ${r.total_bookings} reservas`)
      });
    }

    // 4. Today's summary
    const todaySummary = await query(`
      SELECT
        COUNT(*) as total,
        SUM(persons) as personas,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmadas
      FROM bookings
      WHERE date = $1 AND status != 'cancelled'
    `, [today]);

    const ts = todaySummary.rows[0];
    if (parseInt(ts.total) > 0) {
      alerts.push({
        tipo: '📅 RESUMEN DE HOY',
        urgencia: 'info',
        mensaje: `${ts.total} reservas, ${ts.personas || 0} personas (${ts.confirmadas} confirmadas)`
      });
    }

    // 5. Tomorrow's summary
    const tomorrowSummary = await query(`
      SELECT
        COUNT(*) as total,
        SUM(persons) as personas,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmadas
      FROM bookings
      WHERE date = $1 AND status != 'cancelled'
    `, [tomorrowStr]);

    const tms = tomorrowSummary.rows[0];
    if (parseInt(tms.total) > 0) {
      alerts.push({
        tipo: '📅 RESUMEN DE MAÑANA',
        urgencia: 'info',
        mensaje: `${tms.total} reservas, ${tms.personas || 0} personas (${tms.confirmadas} confirmadas)`
      });
    }

    return {
      success: true,
      fecha: today,
      total_alertas: alerts.length,
      alertas_criticas: alerts.filter(a => a.urgencia === 'crítica').length,
      alertas: alerts
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// GYG Product IDs for availability notifications
const GYG_PRODUCTS = {
  regular: '1152147',
  private: '1163787'
};

async function handleBlockDate(params) {
  try {
    const blockType = params.block_type || 'full';
    const date = params.date;
    const reason = params.reason;

    // Check if already blocked
    const existing = await query(
      'SELECT * FROM blocked_dates WHERE blocked_date = $1',
      [date]
    );

    if (existing.rows.length > 0) {
      // Update existing block
      await query(
        `UPDATE blocked_dates SET block_type = $1, reason = $2, updated_at = NOW() WHERE blocked_date = $3`,
        [blockType, reason, date]
      );
    } else {
      // Insert new block
      await query(
        `INSERT INTO blocked_dates (blocked_date, block_type, reason, created_at) VALUES ($1, $2, $3, NOW())`,
        [date, blockType, reason]
      );
    }

    // Notify GYG - set vacancies to 0 for blocked products
    const gygResults = [];

    if (blockType === 'full' || blockType === 'regular_only') {
      // Block regular tours
      try {
        const availability = [{
          dateTime: `${date}T21:00:00`,
          vacancies: 0
        }];
        await pushAvailabilityToGYG(GYG_PRODUCTS.regular, availability, false);
        gygResults.push({ product: 'regular', status: 'notified' });
      } catch (e) {
        gygResults.push({ product: 'regular', status: 'error', message: e.message });
      }
    }

    if (blockType === 'full' || blockType === 'private_only') {
      // Block private tours (multiple time slots)
      try {
        const availability = [
          { dateTime: `${date}T20:00:00`, vacancies: 0 },
          { dateTime: `${date}T20:30:00`, vacancies: 0 },
          { dateTime: `${date}T21:00:00`, vacancies: 0 }
        ];
        await pushAvailabilityToGYG(GYG_PRODUCTS.private, availability, false);
        gygResults.push({ product: 'private', status: 'notified' });
      } catch (e) {
        gygResults.push({ product: 'private', status: 'error', message: e.message });
      }
    }

    return {
      success: true,
      message: `Fecha ${date} bloqueada`,
      bloqueo: {
        fecha: date,
        tipo: blockType,
        motivo: reason
      },
      gyg_notificacion: gygResults
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleUnblockDate(params) {
  try {
    const date = params.date;

    // Check if blocked
    const existing = await query(
      'SELECT * FROM blocked_dates WHERE blocked_date = $1',
      [date]
    );

    if (existing.rows.length === 0) {
      return { success: false, error: `La fecha ${date} no está bloqueada` };
    }

    const blockInfo = existing.rows[0];

    // Remove block
    await query('DELETE FROM blocked_dates WHERE blocked_date = $1', [date]);

    // Calculate current bookings to restore correct availability
    const bookingsResult = await query(`
      SELECT tour_type, SUM(persons) as booked
      FROM bookings
      WHERE date = $1 AND status != 'cancelled'
      GROUP BY tour_type
    `, [date]);

    const bookedByType = {};
    bookingsResult.rows.forEach(r => {
      bookedByType[r.tour_type] = parseInt(r.booked) || 0;
    });

    // Notify GYG with restored availability
    const gygResults = [];
    const CAPACITY = { regular: 16, private: 4 };

    // Restore regular tours
    try {
      const regularVacancies = Math.max(0, CAPACITY.regular - (bookedByType.regular || 0));
      const availability = [{
        dateTime: `${date}T21:00:00`,
        vacancies: regularVacancies
      }];
      await pushAvailabilityToGYG(GYG_PRODUCTS.regular, availability, false);
      gygResults.push({ product: 'regular', status: 'restored', vacancies: regularVacancies });
    } catch (e) {
      gygResults.push({ product: 'regular', status: 'error', message: e.message });
    }

    // Restore private tours
    try {
      const privateVacancies = Math.max(0, CAPACITY.private - (bookedByType.private || 0));
      const availability = [
        { dateTime: `${date}T20:00:00`, vacancies: privateVacancies },
        { dateTime: `${date}T20:30:00`, vacancies: privateVacancies },
        { dateTime: `${date}T21:00:00`, vacancies: privateVacancies }
      ];
      await pushAvailabilityToGYG(GYG_PRODUCTS.private, availability, false);
      gygResults.push({ product: 'private', status: 'restored', vacancies: privateVacancies });
    } catch (e) {
      gygResults.push({ product: 'private', status: 'error', message: e.message });
    }

    return {
      success: true,
      message: `Fecha ${date} desbloqueada`,
      bloqueo_anterior: {
        tipo: blockInfo.block_type,
        motivo: blockInfo.reason
      },
      gyg_notificacion: gygResults
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleListBlockedDates(params) {
  try {
    const today = getChileDate();
    const fromDate = params.from_date || today;

    // Default to 30 days ahead
    const defaultEnd = new Date(today + 'T12:00:00');
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    const toDate = params.to_date || defaultEnd.toISOString().split('T')[0];

    const result = await query(`
      SELECT blocked_date, block_type, reason, created_at
      FROM blocked_dates
      WHERE blocked_date >= $1 AND blocked_date <= $2
      ORDER BY blocked_date ASC
    `, [fromDate, toDate]);

    if (result.rows.length === 0) {
      return {
        success: true,
        message: 'No hay fechas bloqueadas en este rango',
        rango: { desde: fromDate, hasta: toDate },
        fechas_bloqueadas: []
      };
    }

    return {
      success: true,
      rango: { desde: fromDate, hasta: toDate },
      total: result.rows.length,
      fechas_bloqueadas: result.rows.map(r => ({
        fecha: r.blocked_date,
        tipo: r.block_type,
        motivo: r.reason,
        bloqueado_desde: r.created_at
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Tool execution router
async function executeTool(toolName, toolInput) {
  console.log(`Executing tool: ${toolName}`, toolInput);

  switch (toolName) {
    case 'query_bookings':
      return await handleQueryBookings(toolInput);
    case 'send_whatsapp':
      return await handleSendWhatsApp(toolInput);
    case 'send_bulk_whatsapp':
      return await handleBulkWhatsApp(toolInput);
    case 'save_memory':
      return await handleSaveMemory(toolInput);
    case 'recall_memory':
      return await handleRecallMemory(toolInput);
    case 'get_stats':
      return await handleGetStats(toolInput);
    case 'update_booking':
      return await handleUpdateBooking(toolInput);
    case 'create_booking':
      return await handleCreateBooking(toolInput);
    case 'client_history':
      return await handleClientHistory(toolInput);
    case 'availability_check':
      return await handleAvailabilityCheck(toolInput);
    case 'weather_check':
      return await handleWeatherCheck(toolInput);
    case 'send_reminder':
      return await handleSendReminder(toolInput);
    case 'get_alerts':
      return await handleGetAlerts(toolInput);
    case 'block_date':
      return await handleBlockDate(toolInput);
    case 'unblock_date':
      return await handleUnblockDate(toolInput);
    case 'list_blocked_dates':
      return await handleListBlockedDates(toolInput);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ============ SYSTEM PROMPT ============

function getSystemPrompt() {
  const today = getChileDate();
  const whatsappStatus = isWhatsAppConfigured() ? 'ACTIVO' : 'NO CONFIGURADO';

  return `Eres el asistente inteligente de Atacama Dark Sky, una empresa de tours astronómicos en San Pedro de Atacama, Chile.

FECHA ACTUAL: ${today}
WHATSAPP: ${whatsappStatus}

TU ROL:
1. CONSULTAR reservas con query_bookings y disponibilidad con availability_check
2. CREAR reservas nuevas con create_booking
3. MODIFICAR reservas con update_booking (fecha, hora, personas, estado, hotel)
4. VER HISTORIAL de clientes con client_history (detectar clientes frecuentes)
5. CONSULTAR CLIMA con weather_check para decidir si hacer tours
6. ENVIAR RECORDATORIOS con send_reminder (24h antes o 2h antes)
7. VER ALERTAS del sistema con get_alerts (pendientes, capacidad, etc.)
8. BLOQUEAR/DESBLOQUEAR fechas con block_date/unblock_date (notifica automáticamente a GetYourGuide)
9. VER FECHAS BLOQUEADAS con list_blocked_dates
10. COMUNICARTE con clientes via WhatsApp
11. APRENDER y recordar información con save_memory/recall_memory

REGLAS IMPORTANTES:
- Para CREAR o MODIFICAR reservas: PRIMERO muestra los datos y pregunta "¿Confirmo?"
- Para BLOQUEAR fechas: PRIMERO confirma la fecha, tipo de bloqueo y motivo
- Para enviar WhatsApp: PRIMERO muestra el mensaje propuesto y pregunta "¿Envío?"
- Solo ejecuta cuando el usuario confirme con "sí", "ok", "dale", "confirma", etc.
- Mensajes a clientes deben ser en INGLÉS (son turistas internacionales)
- Usa get_alerts al inicio del día para ver el estado general
- Usa weather_check antes de decidir cancelar tours por clima
- Cuando bloquees una fecha, GetYourGuide se actualiza automáticamente
- Sé conciso y profesional

CONTEXTO DEL NEGOCIO:
- Tours astronómicos nocturnos en el desierto de Atacama
- El clima es crítico: nubes = no se puede hacer tour
- Hacemos pickup desde los hoteles de San Pedro
- Tours disponibles:
  • Regular: Tour grupal, máx 16 personas, 21:00, CLP 42,000/persona
  • Privado: Tour exclusivo, máx 4 personas, horario flexible, CLP 200,000 total
  • Astrofotografía: Tour especializado, 21:00, CLP 120,000/persona

FLUJO TÍPICO PARA ENVIAR MENSAJES:
1. Usuario: "avisa a los de hoy que está nublado"
2. Tú: Consultas las reservas de hoy
3. Tú: Muestras quiénes son y propones un mensaje en inglés
4. Tú: Preguntas "¿Envío este mensaje a X clientes?"
5. Usuario: "sí"
6. Tú: Envías y confirmas

Responde siempre en español al administrador.`;
}

// ============ CLAUDE API CALLS ============

async function callClaudeWithTools(messages, pendingToolResults = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  // If we have pending tool results, add them to messages
  if (pendingToolResults.length > 0) {
    messages = [...messages, ...pendingToolResults];
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: getSystemPrompt(),
      tools: tools,
      messages: messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// ============ MAIN HANDLER ============

function validateSession(req) {
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('admin_session='));
  if (!sessionCookie) return null;

  try {
    const sessionToken = sessionCookie.split('=')[1];
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));
    if (sessionData.exp < Date.now()) return null;
    return sessionData;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = validateSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build initial messages
    let messages = [
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // Call Claude - may require multiple rounds for tool use
    let claudeResponse = await callClaudeWithTools(messages);
    let iterations = 0;
    const maxIterations = 5;
    const toolsExecuted = []; // Track all tools used

    while (claudeResponse.stop_reason === 'tool_use' && iterations < maxIterations) {
      iterations++;

      // Find tool use blocks
      const toolUseBlocks = claudeResponse.content.filter(c => c.type === 'tool_use');

      // Execute all tools
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input);
        toolsExecuted.push({
          name: toolUse.name,
          input: toolUse.input,
          result: result
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }

      // Add assistant message and tool results to conversation
      messages = [
        ...messages,
        { role: 'assistant', content: claudeResponse.content },
        { role: 'user', content: toolResults }
      ];

      // Call Claude again with tool results
      claudeResponse = await callClaudeWithTools(messages);
    }

    // Extract text response
    const textContent = claudeResponse.content.find(c => c.type === 'text');
    const assistantMessage = textContent?.text || 'No response generated';

    // Save chat log (async, don't wait)
    const sessionId = session.user || 'admin';
    query(
      `INSERT INTO chat_logs (session_id, user_message, assistant_response, tools_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        sessionId,
        message,
        assistantMessage,
        toolsExecuted.length > 0 ? JSON.stringify(toolsExecuted) : null,
        claudeResponse.usage ? JSON.stringify(claudeResponse.usage) : null
      ]
    ).catch(err => console.error('Error saving chat log:', err));

    return res.status(200).json({
      success: true,
      response: assistantMessage,
      usage: claudeResponse.usage,
      toolsUsed: iterations > 0
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Error processing request',
      details: error.message
    });
  }
}
