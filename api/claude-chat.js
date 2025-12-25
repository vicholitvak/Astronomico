/**
 * Claude Chat API Endpoint
 * Provides AI-powered chat for the admin panel
 */

import { query } from './lib/db.js';

// Helper to get Chile date (UTC-3 or UTC-4 depending on DST)
function getChileDate() {
  const now = new Date();
  const chileOffset = -3; // Chile Summer Time (CLST)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const chile = new Date(utc + (3600000 * chileOffset));
  return chile.toISOString().split('T')[0];
}

// Fetch context data for Claude
async function getContextData() {
  const today = getChileDate();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Parallel queries for efficiency
  const [
    todayBookings,
    tomorrowBookings,
    weekBookings,
    pendingPayments,
    monthStats
  ] = await Promise.all([
    // Today's bookings
    query(
      `SELECT booking_id, date, time, tour_type, persons, name, phone, status, source
       FROM bookings WHERE date = $1 AND status != 'cancelled' ORDER BY time`,
      [today]
    ),
    // Tomorrow's bookings
    query(
      `SELECT booking_id, date, time, tour_type, persons, name, phone, status, source
       FROM bookings WHERE date = $1 AND status != 'cancelled' ORDER BY time`,
      [tomorrowStr]
    ),
    // This week's bookings
    query(
      `SELECT booking_id, date, time, tour_type, persons, name, status
       FROM bookings WHERE date >= $1 AND date <= $2 AND status != 'cancelled' ORDER BY date, time`,
      [today, weekEndStr]
    ),
    // Pending payments
    query(
      `SELECT booking_id, date, time, tour_type, persons, name, phone, created_at
       FROM bookings WHERE status = 'pending' AND date >= $1 ORDER BY date`,
      [today]
    ),
    // Month statistics
    query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmadas,
        COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
        COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN persons ELSE 0 END), 0) as total_personas,
        COUNT(*) FILTER (WHERE tour_type = 'regular' AND status = 'confirmed') as tours_regular,
        COUNT(*) FILTER (WHERE tour_type = 'private' AND status = 'confirmed') as tours_privados,
        COUNT(*) FILTER (WHERE tour_type = 'astrophoto' AND status = 'confirmed') as tours_astrofoto
      FROM bookings
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
        AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `)
  ]);

  return {
    today,
    todayBookings: todayBookings.rows,
    tomorrowBookings: tomorrowBookings.rows,
    weekBookings: weekBookings.rows,
    pendingPayments: pendingPayments.rows,
    monthStats: monthStats.rows[0]
  };
}

// Format context for Claude
function formatContextForClaude(data) {
  const { today, todayBookings, tomorrowBookings, weekBookings, pendingPayments, monthStats } = data;

  let context = `Eres un asistente para el panel de administración de Atacama Dark Sky, una empresa de tours astronómicos en San Pedro de Atacama, Chile.

FECHA ACTUAL: ${today}

RESERVAS DE HOY (${todayBookings.length}):
${todayBookings.length === 0 ? 'No hay reservas para hoy.' :
  todayBookings.map(b => `- ${b.time}: ${b.name} (${b.tour_type}, ${b.persons} personas) [${b.status}] - Tel: ${b.phone}`).join('\n')}

RESERVAS DE MAÑANA (${tomorrowBookings.length}):
${tomorrowBookings.length === 0 ? 'No hay reservas para mañana.' :
  tomorrowBookings.map(b => `- ${b.time}: ${b.name} (${b.tour_type}, ${b.persons} personas) [${b.status}] - Tel: ${b.phone}`).join('\n')}

RESERVAS ESTA SEMANA (próximos 7 días): ${weekBookings.length} reservas, ${weekBookings.reduce((sum, b) => sum + b.persons, 0)} personas en total

PENDIENTES DE PAGO (${pendingPayments.length}):
${pendingPayments.length === 0 ? 'No hay reservas pendientes de pago.' :
  pendingPayments.map(b => `- ${b.date} ${b.time}: ${b.name} (${b.tour_type}, ${b.persons} personas) - Tel: ${b.phone}`).join('\n')}

ESTADÍSTICAS DEL MES:
- Total reservas: ${monthStats.total}
- Confirmadas: ${monthStats.confirmadas}
- Pendientes: ${monthStats.pendientes}
- Canceladas: ${monthStats.canceladas}
- Total personas confirmadas: ${monthStats.total_personas}
- Tours regulares: ${monthStats.tours_regular}
- Tours privados: ${monthStats.tours_privados}
- Tours astrofotografía: ${monthStats.tours_astrofoto}

TIPOS DE TOUR:
- Regular: Tour grupal, máx 16 personas, 21:00, CLP 42,000/persona
- Privado: Tour exclusivo, máx 4 personas, horario flexible, CLP 200,000 total
- Astrofotografía: Tour especializado, 21:00, CLP 120,000/persona

Responde en español, de forma concisa y útil. Si te preguntan sobre reservas específicas, usa los datos proporcionados.`;

  return context;
}

// Call Claude API
async function callClaudeAPI(systemPrompt, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Claude API error:', error);
    throw new Error(`Claude API error: ${response.status}`);
  }

  return await response.json();
}

// Validate admin session
function validateSession(request) {
  const cookies = request.headers.get('cookie') || '';
  const sessionMatch = cookies.match(/admin_session=([^;]+)/);

  if (!sessionMatch) {
    return null;
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionMatch[1], 'base64').toString());
    if (sessionData.exp && sessionData.exp > Date.now()) {
      return sessionData;
    }
  } catch (e) {
    console.error('Session parse error:', e);
  }

  return null;
}

// Main handler
export default async function handler(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate session
  const session = validateSession(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get context data
    const contextData = await getContextData();
    const systemPrompt = formatContextForClaude(contextData);

    // Build messages array
    const messages = [
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call Claude API
    const claudeResponse = await callClaudeAPI(systemPrompt, messages);

    const assistantMessage = claudeResponse.content[0].text;

    return new Response(JSON.stringify({
      success: true,
      response: assistantMessage,
      usage: {
        input_tokens: claudeResponse.usage?.input_tokens,
        output_tokens: claudeResponse.usage?.output_tokens
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({
      error: 'Error processing request',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
