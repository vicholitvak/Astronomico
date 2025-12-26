#!/usr/bin/env node
/**
 * Atacama Dark Sky - Database Assistant
 * Script para consultar y gestionar reservas directamente desde la terminal
 *
 * Uso: node db-assistant.js <comando> [opciones]
 *
 * Comandos:
 *   hoy                    - Reservas de hoy
 *   manana                 - Reservas de mañana
 *   semana                 - Reservas de los próximos 7 días
 *   fecha <YYYY-MM-DD>     - Reservas de una fecha específica
 *   buscar <término>       - Buscar por nombre, email o teléfono
 *   pendientes             - Reservas pendientes de pago
 *   confirmar <id>         - Confirmar una reserva
 *   cancelar <id>          - Cancelar una reserva
 *   detalle <id>           - Ver detalle de una reserva
 *   stats                  - Estadísticas del mes
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.production') });

const { Pool } = pg;

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Función para formatear fecha
function formatDate(dateStr) {
  // Handle both string dates and Date objects from PostgreSQL
  let dateString = dateStr;
  if (dateStr instanceof Date) {
    dateString = dateStr.toISOString().split('T')[0];
  }
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para mostrar una reserva
function displayBooking(booking, detailed = false) {
  const statusColors = {
    confirmed: colors.green,
    pending: colors.yellow,
    cancelled: colors.red,
  };
  const statusColor = statusColors[booking.status] || colors.reset;
  const statusEmoji = {
    confirmed: '✅',
    pending: '⏳',
    cancelled: '❌',
  };

  console.log(`\n${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}ID:${colors.reset} ${booking.booking_id}`);
  console.log(`${colors.cyan}Cliente:${colors.reset} ${booking.name}`);
  console.log(`${colors.cyan}Fecha:${colors.reset} ${formatDate(booking.date)} - ${booking.time}`);
  console.log(`${colors.cyan}Tour:${colors.reset} ${booking.tour_type} (${booking.persons} personas)`);
  console.log(`${colors.cyan}Estado:${colors.reset} ${statusColor}${statusEmoji[booking.status] || ''} ${booking.status}${colors.reset}`);
  console.log(`${colors.cyan}Teléfono:${colors.reset} ${booking.phone}`);

  if (detailed) {
    console.log(`${colors.cyan}Email:${colors.reset} ${booking.email || 'N/A'}`);
    console.log(`${colors.cyan}Alojamiento:${colors.reset} ${booking.accommodation || 'N/A'}`);
    console.log(`${colors.cyan}Mensaje:${colors.reset} ${booking.message || 'N/A'}`);
    console.log(`${colors.cyan}Fuente:${colors.reset} ${booking.source}`);
    console.log(`${colors.cyan}Pago:${colors.reset} ${booking.payment_status} (${booking.payment_method})`);
    console.log(`${colors.cyan}Creado:${colors.reset} ${new Date(booking.created_at).toLocaleString('es-CL')}`);
  }
}

// Función para mostrar resumen
function displaySummary(bookings) {
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const totalPersons = bookings.reduce((sum, b) => sum + (parseInt(b.persons) || 0), 0);

  console.log(`\n${colors.bright}📊 RESUMEN${colors.reset}`);
  console.log(`${colors.green}Confirmadas: ${confirmed}${colors.reset}`);
  console.log(`${colors.yellow}Pendientes: ${pending}${colors.reset}`);
  console.log(`Total personas: ${totalPersons}`);
}

// Comandos disponibles
const commands = {
  async hoy() {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT * FROM bookings WHERE date = $1 AND status != 'cancelled' ORDER BY time`,
      [today]
    );
    console.log(`\n${colors.bright}${colors.magenta}🌟 RESERVAS DE HOY (${formatDate(today)})${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo hay reservas para hoy.');
    } else {
      result.rows.forEach(b => displayBooking(b));
      displaySummary(result.rows);
    }
    return result.rows;
  },

  async manana() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT * FROM bookings WHERE date = $1 AND status != 'cancelled' ORDER BY time`,
      [tomorrowStr]
    );
    console.log(`\n${colors.bright}${colors.magenta}🌟 RESERVAS DE MAÑANA (${formatDate(tomorrowStr)})${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo hay reservas para mañana.');
    } else {
      result.rows.forEach(b => displayBooking(b));
      displaySummary(result.rows);
    }
    return result.rows;
  },

  async semana() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT * FROM bookings WHERE date >= $1 AND date <= $2 AND status != 'cancelled' ORDER BY date, time`,
      [today, nextWeekStr]
    );
    console.log(`\n${colors.bright}${colors.magenta}🌟 RESERVAS PRÓXIMOS 7 DÍAS${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo hay reservas para los próximos 7 días.');
    } else {
      result.rows.forEach(b => displayBooking(b));
      displaySummary(result.rows);
    }
    return result.rows;
  },

  async fecha(dateStr) {
    if (!dateStr) {
      console.log('Error: Debes especificar una fecha (YYYY-MM-DD)');
      return;
    }
    const result = await pool.query(
      `SELECT * FROM bookings WHERE date = $1 ORDER BY time`,
      [dateStr]
    );
    console.log(`\n${colors.bright}${colors.magenta}🌟 RESERVAS DEL ${formatDate(dateStr)}${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo hay reservas para esta fecha.');
    } else {
      result.rows.forEach(b => displayBooking(b));
      displaySummary(result.rows);
    }
    return result.rows;
  },

  async buscar(term) {
    if (!term) {
      console.log('Error: Debes especificar un término de búsqueda');
      return;
    }
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR booking_id ILIKE $1
       ORDER BY date DESC LIMIT 20`,
      [`%${term}%`]
    );
    console.log(`\n${colors.bright}${colors.magenta}🔍 RESULTADOS PARA "${term}"${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo se encontraron reservas.');
    } else {
      result.rows.forEach(b => displayBooking(b));
    }
    return result.rows;
  },

  async pendientes() {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE status = 'pending' AND date >= CURRENT_DATE
       ORDER BY date, time`
    );
    console.log(`\n${colors.bright}${colors.yellow}⏳ RESERVAS PENDIENTES DE PAGO${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo hay reservas pendientes.');
    } else {
      result.rows.forEach(b => displayBooking(b));
      displaySummary(result.rows);
    }
    return result.rows;
  },

  async confirmar(id) {
    if (!id) {
      console.log('Error: Debes especificar el ID de la reserva');
      return;
    }
    const result = await pool.query(
      `UPDATE bookings SET status = 'confirmed', payment_status = 'completed', updated_at = NOW()
       WHERE (id::text = $1 OR booking_id = $1) RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      console.log('Error: No se encontró la reserva.');
    } else {
      console.log(`\n${colors.green}✅ RESERVA CONFIRMADA${colors.reset}`);
      displayBooking(result.rows[0], true);
    }
    return result.rows[0];
  },

  async cancelar(id) {
    if (!id) {
      console.log('Error: Debes especificar el ID de la reserva');
      return;
    }
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW()
       WHERE (id::text = $1 OR booking_id = $1) RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      console.log('Error: No se encontró la reserva.');
    } else {
      console.log(`\n${colors.red}❌ RESERVA CANCELADA${colors.reset}`);
      displayBooking(result.rows[0], true);
    }
    return result.rows[0];
  },

  async detalle(id) {
    if (!id) {
      console.log('Error: Debes especificar el ID de la reserva');
      return;
    }
    const result = await pool.query(
      `SELECT * FROM bookings WHERE id::text = $1 OR booking_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      console.log('Error: No se encontró la reserva.');
    } else {
      console.log(`\n${colors.bright}${colors.cyan}📋 DETALLE DE RESERVA${colors.reset}`);
      displayBooking(result.rows[0], true);
    }
    return result.rows[0];
  },

  async stats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmadas,
        COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
        COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas,
        SUM(CASE WHEN status = 'confirmed' THEN persons ELSE 0 END) as total_personas,
        COUNT(*) FILTER (WHERE tour_type = 'regular' AND status = 'confirmed') as tours_regular,
        COUNT(*) FILTER (WHERE tour_type = 'private' AND status = 'confirmed') as tours_privados,
        COUNT(*) FILTER (WHERE tour_type = 'astrophoto' AND status = 'confirmed') as tours_astrofoto
      FROM bookings
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
        AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `);
    const stats = result.rows[0];
    console.log(`\n${colors.bright}${colors.magenta}📊 ESTADÍSTICAS DEL MES${colors.reset}`);
    console.log(`\n${colors.cyan}Reservas:${colors.reset}`);
    console.log(`  ${colors.green}Confirmadas: ${stats.confirmadas}${colors.reset}`);
    console.log(`  ${colors.yellow}Pendientes: ${stats.pendientes}${colors.reset}`);
    console.log(`  ${colors.red}Canceladas: ${stats.canceladas}${colors.reset}`);
    console.log(`  Total: ${stats.total}`);
    console.log(`\n${colors.cyan}Personas confirmadas:${colors.reset} ${stats.total_personas || 0}`);
    console.log(`\n${colors.cyan}Por tipo de tour:${colors.reset}`);
    console.log(`  Regular: ${stats.tours_regular}`);
    console.log(`  Privado: ${stats.tours_privados}`);
    console.log(`  Astrofoto: ${stats.tours_astrofoto}`);
    return stats;
  },

  async query(sql) {
    if (!sql) {
      console.log('Error: Debes especificar una consulta SQL');
      return;
    }
    const result = await pool.query(sql);
    console.log(`\n${colors.cyan}Resultado (${result.rows.length} filas):${colors.reset}`);
    console.table(result.rows);
    return result.rows;
  },

  async chats(limit = '20') {
    const result = await pool.query(`
      SELECT
        id,
        created_at,
        user_message,
        LEFT(assistant_response, 100) as respuesta,
        CASE WHEN tools_used IS NOT NULL THEN
          (SELECT string_agg(t->>'name', ', ') FROM jsonb_array_elements(tools_used) t)
        ELSE 'ninguna' END as herramientas
      FROM chat_logs
      ORDER BY created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    console.log(`\n${colors.bright}${colors.magenta}💬 ÚLTIMAS CONVERSACIONES CON HIKARU${colors.reset}`);
    if (result.rows.length === 0) {
      console.log('\nNo hay conversaciones registradas.');
    } else {
      result.rows.forEach(chat => {
        console.log(`\n${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.cyan}Fecha:${colors.reset} ${new Date(chat.created_at).toLocaleString('es-CL')}`);
        console.log(`${colors.yellow}Usuario:${colors.reset} ${chat.user_message}`);
        console.log(`${colors.green}Hikaru:${colors.reset} ${chat.respuesta}...`);
        console.log(`${colors.magenta}Herramientas:${colors.reset} ${chat.herramientas}`);
      });
    }
    return result.rows;
  },

  async chat(id) {
    if (!id) {
      console.log('Error: Debes especificar el ID del chat');
      return;
    }
    const result = await pool.query('SELECT * FROM chat_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      console.log('Error: No se encontró el chat.');
      return;
    }
    const chat = result.rows[0];
    console.log(`\n${colors.bright}${colors.cyan}💬 DETALLE DE CONVERSACIÓN #${id}${colors.reset}`);
    console.log(`\n${colors.cyan}Fecha:${colors.reset} ${new Date(chat.created_at).toLocaleString('es-CL')}`);
    console.log(`${colors.cyan}Sesión:${colors.reset} ${chat.session_id}`);
    console.log(`\n${colors.yellow}━━ USUARIO ━━${colors.reset}`);
    console.log(chat.user_message);
    console.log(`\n${colors.green}━━ HIKARU ━━${colors.reset}`);
    console.log(chat.assistant_response);
    if (chat.tools_used) {
      console.log(`\n${colors.magenta}━━ HERRAMIENTAS USADAS ━━${colors.reset}`);
      const tools = JSON.parse(chat.tools_used);
      tools.forEach((t, i) => {
        console.log(`\n${colors.bright}${i + 1}. ${t.name}${colors.reset}`);
        console.log(`   Input: ${JSON.stringify(t.input)}`);
        console.log(`   Result: ${JSON.stringify(t.result).substring(0, 200)}...`);
      });
    }
    if (chat.tokens_used) {
      const tokens = JSON.parse(chat.tokens_used);
      console.log(`\n${colors.cyan}Tokens:${colors.reset} ${tokens.input_tokens} entrada, ${tokens.output_tokens} salida`);
    }
    return chat;
  },

  help() {
    console.log(`
${colors.bright}${colors.magenta}🌌 Atacama Dark Sky - Asistente de Base de Datos${colors.reset}

${colors.cyan}Uso:${colors.reset} node db-assistant.js <comando> [opciones]

${colors.cyan}Comandos disponibles:${colors.reset}

  ${colors.green}hoy${colors.reset}                    Reservas de hoy
  ${colors.green}manana${colors.reset}                 Reservas de mañana
  ${colors.green}semana${colors.reset}                 Reservas de los próximos 7 días
  ${colors.green}fecha${colors.reset} <YYYY-MM-DD>     Reservas de una fecha específica
  ${colors.green}buscar${colors.reset} <término>       Buscar por nombre, email o teléfono
  ${colors.green}pendientes${colors.reset}             Reservas pendientes de pago
  ${colors.green}confirmar${colors.reset} <id>         Confirmar una reserva
  ${colors.green}cancelar${colors.reset} <id>          Cancelar una reserva
  ${colors.green}detalle${colors.reset} <id>           Ver detalle de una reserva
  ${colors.green}stats${colors.reset}                  Estadísticas del mes
  ${colors.green}chats${colors.reset} [n]              Últimas n conversaciones con Hikaru (default: 20)
  ${colors.green}chat${colors.reset} <id>              Ver detalle completo de una conversación
  ${colors.green}query${colors.reset} "<SQL>"          Ejecutar consulta SQL personalizada
  ${colors.green}help${colors.reset}                   Mostrar esta ayuda

${colors.cyan}Ejemplos:${colors.reset}
  node db-assistant.js hoy
  node db-assistant.js fecha 2025-12-31
  node db-assistant.js buscar "John"
  node db-assistant.js confirmar ATK-123456
`);
  }
};

// Función principal
async function main() {
  const [,, command, ...args] = process.argv;

  if (!command || command === 'help') {
    commands.help();
    process.exit(0);
  }

  if (!commands[command]) {
    console.log(`${colors.red}Error: Comando desconocido "${command}"${colors.reset}`);
    console.log('Usa "node db-assistant.js help" para ver los comandos disponibles.');
    process.exit(1);
  }

  try {
    await commands[command](args.join(' '));
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  } finally {
    await pool.end();
  }
}

// Exportar funciones para uso programático (por Claude Code)
export { commands, pool };

// Ejecutar si es el archivo principal
main();
