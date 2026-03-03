/**
 * GYG Sync — fuerza sincronización de todas las fechas bloqueadas a GYG
 * Llamado por cron diario y cuando se bloquea una fecha
 */
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const GYG_API_URL = 'https://supplier-api.getyourguide.com';
const GYG_USERNAME = process.env.GYG_OUTBOUND_USERNAME || 'AtacamaDarkSky';
const GYG_PASSWORD = process.env.GYG_OUTBOUND_PASSWORD_V2 || '15ea726795960ec399a05b1d76882ca3';

// Solo el tour privado tiene Push Availability activado en GYG
// El tour regular (1152147) tiene ID inválido — pendiente verificar en portal GYG
const ACTIVE_GYG_PRODUCTS = [
  { productId: '1163787', times: ['20:00', '20:30', '21:00'], name: 'Tour Privado' }
];

async function pushBlockToGYG(productId, date, times) {
  const auth = Buffer.from(`${GYG_USERNAME}:${GYG_PASSWORD}`).toString('base64');
  const availabilities = times.map(t => ({
    dateTime: `${date}T${t}:00`,
    vacancies: 0
  }));

  const resp = await fetch(`${GYG_API_URL}/1/notify-availability-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body: JSON.stringify({ data: { productId, availabilities } })
  });

  return { status: resp.status, ok: resp.status === 202 };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Auth simple para cron
  const token = req.headers['x-cron-token'] || req.query.token;
  if (token !== (process.env.CRON_SECRET || 'atacama-cron-2024')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Obtener todas las fechas bloqueadas futuras
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT blocked_date::text as date, block_type FROM blocked_dates 
       WHERE blocked_date >= $1 ORDER BY blocked_date`,
      [today]
    );

    const blocked = result.rows;
    const syncResults = [];

    for (const { date, block_type } of blocked) {
      for (const product of ACTIVE_GYG_PRODUCTS) {
        if (block_type === 'private_only' && product.productId === '1163787') continue; // privado no se bloquea

        try {
          const r = await pushBlockToGYG(product.productId, date, product.times);
          syncResults.push({ date, product: product.productId, ...r });
        } catch (e) {
          syncResults.push({ date, product: product.productId, ok: false, error: e.message });
        }
      }
    }

    const ok = syncResults.filter(r => r.ok).length;
    const fail = syncResults.filter(r => !r.ok).length;

    return res.status(200).json({
      success: true,
      synced: ok,
      failed: fail,
      blockedDates: blocked.length,
      results: syncResults
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
