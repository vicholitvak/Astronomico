/**
 * Gallery API — Combined admin + public page renderer
 *
 * Public (no auth):
 *   ?slug=X                    → Render gallery page
 *   ?action=page-index         → Render gallery index
 *   ?action=page-log           → Render observatory log
 *
 * Admin (auth required):
 *   ?action=list|get|create|update|publish|unpublish|delete|upload-url|add-photo|delete-photo|reorder-photos
 */

import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { generateGalleryHTML } from '../lib/gallery/html-generator.js';
import { enrichObjects } from '../lib/gallery/astronomical-catalog.js';
import { getAstroSummary } from '../lib/gallery/astro-calculator.js';
import { parseGuests } from '../lib/gallery/gallery-data.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'gallery-photos';
const BASE_URL = 'https://atacamadarksky.cl';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ============ AUTH ============

function verifySession(req) {
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

// ============ SLUG GENERATION ============

function generateSlug(date, tourType) {
  const d = new Date(date + 'T12:00:00');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}-${tourType}`;
}

// ============ HANDLER ============

const PUBLIC_ACTIONS = new Set(['page-index', 'page-log']);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, slug } = req.query;

  try {
    // Public routes (no auth)
    if (slug) {
      return await renderGallery(slug, res);
    }
    if (PUBLIC_ACTIONS.has(action)) {
      if (action === 'page-index') return await renderIndex(res);
      if (action === 'page-log') return await renderObservatoryLog(res);
    }

    // Admin routes (auth required)
    const session = verifySession(req);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    switch (action) {
      case 'list':
        return await handleList(req, res);
      case 'get':
        return await handleGet(req, res);
      case 'create':
        return await handleCreate(req, res);
      case 'update':
        return await handleUpdate(req, res);
      case 'publish':
        return await handlePublish(req, res);
      case 'unpublish':
        return await handleUnpublish(req, res);
      case 'delete':
        return await handleDelete(req, res);
      case 'upload-url':
        return await handleUploadUrl(req, res);
      case 'add-photo':
        return await handleAddPhoto(req, res);
      case 'delete-photo':
        return await handleDeletePhoto(req, res);
      case 'reorder-photos':
        return await handleReorderPhotos(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error(`[Gallery API] Error in ${action || slug}:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ================================================================
// PUBLIC PAGE RENDERING
// ================================================================

async function renderGallery(slug, res) {
  const galleryResult = await pool.query(
    "SELECT * FROM galleries WHERE slug = $1 AND status = 'published'",
    [slug]
  );

  if (!galleryResult.rows.length) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(404).send(render404());
  }

  const gallery = galleryResult.rows[0];

  const photosResult = await pool.query(
    'SELECT * FROM gallery_photos WHERE gallery_id = $1 ORDER BY sort_order ASC',
    [gallery.id]
  );

  const [prevResult, nextResult] = await Promise.all([
    pool.query("SELECT slug, title FROM galleries WHERE status = 'published' AND date < $1 ORDER BY date DESC LIMIT 1", [gallery.date]),
    pool.query("SELECT slug, title FROM galleries WHERE status = 'published' AND date > $1 ORDER BY date ASC LIMIT 1", [gallery.date])
  ]);
  const prev = prevResult.rows[0] || null;
  const next = nextResult.rows[0] || null;

  const rawGuests = Array.isArray(gallery.guests) ? gallery.guests : [];
  const guestsString = rawGuests.map(g =>
    typeof g === 'string' ? g : `${g.name} (${g.country || 'Unknown'})`
  ).join(', ');
  const parsedGuests = guestsString ? parseGuests(guestsString) : [];

  const objectNames = Array.isArray(gallery.objects) ? gallery.objects : [];
  const conditionLevel = gallery.bortle <= 2 ? 'excellent' : gallery.bortle <= 3 ? 'good' : 'standard';
  const enrichedObjects = enrichObjects(objectNames, conditionLevel);

  const astro = getAstroSummary(gallery.date.toISOString().split('T')[0]);

  const html = generateGalleryHTML({
    slug: gallery.slug,
    date: gallery.date.toISOString().split('T')[0],
    tourType: gallery.tour_type,
    title: gallery.title,
    subtitle: gallery.subtitle || '',
    bortle: gallery.bortle,
    conditions: gallery.conditions || '',
    highlights: gallery.highlights || '',
    objects: enrichedObjects,
    photos: photosResult.rows,
    guests: parsedGuests,
    astro,
    prev,
    next
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  return res.send(html);
}

async function renderIndex(res) {
  const result = await pool.query(`
    SELECT g.*, COUNT(p.id)::int AS photo_count,
           (SELECT p2.thumbnail_url FROM gallery_photos p2 WHERE p2.gallery_id = g.id ORDER BY p2.sort_order ASC LIMIT 1) AS cover_image
    FROM galleries g
    LEFT JOIN gallery_photos p ON p.gallery_id = g.id
    WHERE g.status = 'published'
    GROUP BY g.id
    ORDER BY g.date DESC
  `);

  const galleries = result.rows;
  const allCountries = new Set();
  let totalGuests = 0;
  for (const g of galleries) {
    const guests = Array.isArray(g.guests) ? g.guests : [];
    totalGuests += guests.length;
    for (const guest of guests) {
      if (guest.country) allCountries.add(guest.country);
    }
  }

  const html = generateIndexHTML(galleries, {
    totalGalleries: galleries.length,
    totalGuests,
    totalCountries: allCountries.size
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  return res.send(html);
}

async function renderObservatoryLog(res) {
  const result = await pool.query(`
    SELECT date, tour_type, bortle, objects, guests
    FROM galleries WHERE status = 'published' ORDER BY date DESC
  `);

  const galleries = result.rows;
  const objectCounts = {};
  const allCountries = new Set();
  let totalGuests = 0;
  const monthlyData = {};

  for (const g of galleries) {
    const objects = Array.isArray(g.objects) ? g.objects : [];
    const guests = Array.isArray(g.guests) ? g.guests : [];
    totalGuests += guests.length;

    for (const obj of objects) {
      objectCounts[obj] = (objectCounts[obj] || 0) + 1;
    }
    for (const guest of guests) {
      if (guest.country) allCountries.add(guest.country);
    }

    const monthKey = g.date.toISOString().slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { nights: 0, objects: new Set(), guests: 0 };
    }
    monthlyData[monthKey].nights++;
    objects.forEach(o => monthlyData[monthKey].objects.add(o));
    monthlyData[monthKey].guests += guests.length;
  }

  const topObjects = Object.entries(objectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  const html = generateObservatoryLogHTML({
    totalNights: galleries.length,
    totalObjects: Object.keys(objectCounts).length,
    totalGuests,
    totalCountries: allCountries.size,
    countries: [...allCountries].sort(),
    topObjects,
    monthlyData
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  return res.send(html);
}

// ================================================================
// ADMIN CRUD
// ================================================================

async function handleList(req, res) {
  const result = await pool.query(`
    SELECT g.*, COUNT(p.id)::int AS photo_count
    FROM galleries g
    LEFT JOIN gallery_photos p ON p.gallery_id = g.id
    GROUP BY g.id
    ORDER BY g.date DESC
  `);
  return res.json(result.rows);
}

async function handleGet(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const gallery = await pool.query('SELECT * FROM galleries WHERE id = $1', [id]);
  if (!gallery.rows.length) return res.status(404).json({ error: 'Gallery not found' });

  const photos = await pool.query(
    'SELECT * FROM gallery_photos WHERE gallery_id = $1 ORDER BY sort_order ASC',
    [id]
  );

  return res.json({ ...gallery.rows[0], photos: photos.rows });
}

async function handleCreate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { date, tour_type, title, subtitle, bortle, conditions, highlights, guests, objects } = req.body;
  if (!date || !tour_type || !title) {
    return res.status(400).json({ error: 'Missing required fields: date, tour_type, title' });
  }

  let slug = generateSlug(date, tour_type);
  const existing = await pool.query('SELECT id FROM galleries WHERE slug = $1', [slug]);
  if (existing.rows.length) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const result = await pool.query(`
    INSERT INTO galleries (slug, date, tour_type, title, subtitle, bortle, conditions, highlights, guests, objects)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [slug, date, tour_type, title, subtitle || null, bortle || 1, conditions || null, highlights || null,
      JSON.stringify(guests || []), JSON.stringify(objects || [])]);

  return res.json(result.rows[0]);
}

async function handleUpdate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, title, subtitle, bortle, conditions, highlights, guests, objects } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const result = await pool.query(`
    UPDATE galleries SET
      title = COALESCE($2, title),
      subtitle = $3,
      bortle = COALESCE($4, bortle),
      conditions = $5,
      highlights = $6,
      guests = COALESCE($7, guests),
      objects = COALESCE($8, objects),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, title, subtitle, bortle, conditions, highlights,
      guests ? JSON.stringify(guests) : null, objects ? JSON.stringify(objects) : null]);

  if (!result.rows.length) return res.status(404).json({ error: 'Gallery not found' });
  return res.json(result.rows[0]);
}

async function handlePublish(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const result = await pool.query(
    "UPDATE galleries SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Gallery not found' });
  return res.json(result.rows[0]);
}

async function handleUnpublish(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const result = await pool.query(
    "UPDATE galleries SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Gallery not found' });
  return res.json(result.rows[0]);
}

async function handleDelete(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const gallery = await pool.query('SELECT slug FROM galleries WHERE id = $1', [id]);
  if (!gallery.rows.length) return res.status(404).json({ error: 'Gallery not found' });

  const slug = gallery.rows[0].slug;

  try {
    const supabase = getSupabase();
    const { data: files } = await supabase.storage.from(BUCKET).list(slug);
    if (files && files.length) {
      const paths = files.map(f => `${slug}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch (err) {
    console.error('[Gallery API] Error deleting Supabase files:', err);
  }

  await pool.query('DELETE FROM galleries WHERE id = $1', [id]);
  return res.json({ success: true });
}

async function handleUploadUrl(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { slug, filename, contentType } = req.body;
  if (!slug || !filename || !contentType) {
    return res.status(400).json({ error: 'Missing slug, filename, or contentType' });
  }

  const supabase = getSupabase();
  const filePath = `${slug}/${filename}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error('[Gallery API] Signed URL error:', error);
    return res.status(500).json({ error: 'Failed to create upload URL' });
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;

  return res.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: filePath,
    publicUrl
  });
}

async function handleAddPhoto(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { gallery_id, original_url, thumbnail_url, filename, width, height, size_bytes } = req.body;
  if (!gallery_id || !original_url || !thumbnail_url || !filename) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const orderResult = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM gallery_photos WHERE gallery_id = $1',
    [gallery_id]
  );
  const sortOrder = orderResult.rows[0].next_order;

  const result = await pool.query(`
    INSERT INTO gallery_photos (gallery_id, original_url, thumbnail_url, filename, sort_order, width, height, size_bytes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [gallery_id, original_url, thumbnail_url, filename, sortOrder, width || null, height || null, size_bytes || null]);

  return res.json(result.rows[0]);
}

async function handleDeletePhoto(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const photo = await pool.query(`
    SELECT p.*, g.slug FROM gallery_photos p
    JOIN galleries g ON g.id = p.gallery_id
    WHERE p.id = $1
  `, [id]);

  if (!photo.rows.length) return res.status(404).json({ error: 'Photo not found' });

  const { slug, filename } = photo.rows[0];

  try {
    const supabase = getSupabase();
    await supabase.storage.from(BUCKET).remove([
      `${slug}/${filename}`,
      `${slug}/thumb_${filename}`
    ]);
  } catch (err) {
    console.error('[Gallery API] Error deleting photo from Supabase:', err);
  }

  await pool.query('DELETE FROM gallery_photos WHERE id = $1', [id]);
  return res.json({ success: true });
}

async function handleReorderPhotos(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { photo_ids } = req.body;
  if (!photo_ids || !Array.isArray(photo_ids)) {
    return res.status(400).json({ error: 'Missing photo_ids array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < photo_ids.length; i++) {
      await client.query('UPDATE gallery_photos SET sort_order = $1 WHERE id = $2', [i, photo_ids[i]]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return res.json({ success: true });
}

// ================================================================
// HTML TEMPLATES (for public pages)
// ================================================================

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function render404() {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gallery Not Found — Atacama Dark Sky</title>
<link rel="stylesheet" href="/gallery/gallery-styles.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head><body>
<nav class="gallery-nav"><div class="nav-container">
<a href="/" class="nav-logo"><img src="/images/Nightskylogo.webp" alt="Atacama Dark Sky" width="120" height="40"></a>
<ul class="nav-links"><li><a href="/gallery/">All Galleries</a></li><li><a href="/#tours">Book a Tour</a></li></ul>
</div></nav>
<div style="text-align:center;padding:8rem 1.5rem 4rem;">
<h1 style="font-size:2rem;margin-bottom:1rem;">Gallery Not Found</h1>
<p style="color:var(--text-secondary);">This gallery doesn't exist or hasn't been published yet.</p>
<p style="margin-top:2rem;"><a href="/gallery/" class="cta-btn">Browse All Galleries</a></p>
</div>
<footer class="gallery-footer"><p>&copy; ${new Date().getFullYear()} <a href="/">Atacama Dark Sky</a></p></footer>
</body></html>`;
}

function generateIndexHTML(galleries, stats) {
  const galleryCards = galleries.length ? galleries.map(g => {
    const dateStr = g.date.toISOString().split('T')[0];
    const guests = Array.isArray(g.guests) ? g.guests : [];
    const objects = Array.isArray(g.objects) ? g.objects : [];
    const coverImg = g.cover_image || '/images/Nightskylogo.webp';

    return `<a href="/gallery/${esc(g.slug)}/" class="gallery-card">
      <img class="card-image" src="${esc(coverImg)}" alt="${esc(g.title)}" loading="lazy">
      <div class="card-body">
        <div class="card-date">${formatDateShort(dateStr)}</div>
        <div class="card-title">${esc(g.title)}</div>
        <div class="card-meta">
          <span>&#128247; ${g.photo_count} photos</span>
          <span>&#127760; ${guests.length} guests</span>
          <span>&#9734; ${objects.length} objects</span>
          <span>Bortle ${g.bortle}</span>
        </div>
      </div>
    </a>`;
  }).join('\n') : '';

  const statsStrip = stats.totalGalleries > 0 ? `
  <div class="stats-strip">
    <div class="stat"><div class="stat-number">${stats.totalGalleries}</div><div class="stat-label">Galleries</div></div>
    <div class="stat"><div class="stat-number">${stats.totalGuests}</div><div class="stat-label">Guests</div></div>
    <div class="stat"><div class="stat-number">${stats.totalCountries}</div><div class="stat-label">Countries</div></div>
  </div>` : '';

  const content = galleries.length ? `
  ${statsStrip}
  <div class="gallery-cards">${galleryCards}</div>` : `
  <div class="empty-state">
    <h2>No galleries yet</h2>
    <p>Tour galleries will appear here after each stargazing session.</p>
    <p style="margin-top: 1rem;"><a href="/#tours" class="cta-btn">Book Your Tour</a></p>
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tour Galleries — Atacama Dark Sky</title>
  <meta name="description" content="Browse ${stats.totalGalleries} stargazing tour galleries from the Atacama Desert. ${stats.totalGuests} guests from ${stats.totalCountries} countries have observed under Bortle Class 1 skies.">
  <link rel="canonical" href="${BASE_URL}/gallery/">
  <meta property="og:title" content="Tour Galleries — Atacama Dark Sky">
  <meta property="og:description" content="Stargazing tour galleries from the darkest skies on Earth">
  <meta property="og:url" content="${BASE_URL}/gallery/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Atacama Dark Sky">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/gallery/gallery-styles.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    .index-hero{padding:8rem 1.5rem 2.5rem;text-align:center;background:linear-gradient(180deg,var(--bg-secondary) 0%,var(--bg-primary) 100%)}
    .index-hero h1{font-size:2.5rem;margin-bottom:.5rem}.index-hero p{color:var(--text-secondary);font-size:1.1rem}
    .stats-strip{display:flex;justify-content:center;gap:2.5rem;flex-wrap:wrap;padding:1.5rem;margin-bottom:1rem}
    .stats-strip .stat{text-align:center}.stats-strip .stat-number{font-size:1.8rem;font-weight:700;color:var(--primary-color)}
    .stats-strip .stat-label{font-size:.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px}
    .gallery-cards{max-width:1200px;margin:0 auto;padding:0 1.5rem 3rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:1.5rem}
    .gallery-card{background:var(--bg-secondary);border:1px solid rgba(255,255,255,.06);border-radius:var(--border-radius-lg);overflow:hidden;transition:border-color .3s,transform .3s;text-decoration:none;color:inherit;display:block}
    .gallery-card:hover{border-color:rgba(0,212,255,.2);transform:translateY(-3px);color:inherit}
    .gallery-card .card-image{width:100%;aspect-ratio:16/9;object-fit:cover}.gallery-card .card-body{padding:1.25rem}
    .gallery-card .card-date{font-size:.8rem;color:var(--primary-color);margin-bottom:.25rem}
    .gallery-card .card-title{font-size:1.15rem;font-weight:600;margin-bottom:.5rem}
    .gallery-card .card-meta{display:flex;gap:1rem;font-size:.82rem;color:var(--text-muted);flex-wrap:wrap}
    .empty-state{text-align:center;padding:4rem 1.5rem;color:var(--text-muted)}.empty-state h2{color:var(--text-secondary);margin-bottom:.5rem}
    @media(max-width:768px){.index-hero{padding:6rem 1rem 2rem}.index-hero h1{font-size:1.75rem}.gallery-cards{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <nav class="gallery-nav"><div class="nav-container">
    <a href="/" class="nav-logo"><img src="/images/Nightskylogo.webp" alt="Atacama Dark Sky" width="120" height="40" loading="eager"></a>
    <ul class="nav-links"><li><a href="/gallery/">Galleries</a></li><li><a href="/observatory-log">Observatory Log</a></li><li><a href="/#tours">Book a Tour</a></li></ul>
  </div></nav>
  <header class="index-hero"><h1>Tour Galleries</h1><p>Stargazing experiences from the darkest skies on Earth</p></header>
  ${content}
  <section class="booking-cta"><h2>Experience the Darkest Skies on Earth</h2><p>Join us for an unforgettable night of stargazing under Bortle Class 1 skies in the Atacama Desert.</p><a href="/#tours" class="cta-btn">Book Your Tour &#10141;</a></section>
  <footer class="gallery-footer"><p>&copy; ${new Date().getFullYear()} <a href="/">Atacama Dark Sky</a> &middot; San Pedro de Atacama, Chile</p></footer>
</body></html>`;
}

function generateObservatoryLogHTML(data) {
  const { totalNights, totalObjects, totalGuests, totalCountries, countries, topObjects, monthlyData } = data;

  const rankingItems = topObjects.map((obj, i) => `
    <li class="ranking-item">
      <span class="ranking-position${i < 3 ? ' top3' : ''}">${i + 1}</span>
      <span class="ranking-info"><span class="ranking-name">${esc(obj.name)}</span></span>
      <span class="ranking-count">${obj.count}x</span>
    </li>`).join('');

  const monthCards = Object.entries(monthlyData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, d]) => {
      const dateObj = new Date(month + '-15T12:00:00');
      const monthName = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      return `<div class="month-card"><h3>${monthName}</h3>
        <div class="month-stats"><span>${d.nights} night${d.nights !== 1 ? 's' : ''}</span><span>${d.objects.size} objects</span><span>${d.guests} guests</span></div>
        <div class="month-objects">${[...d.objects].join(', ')}</div></div>`;
    }).join('');

  const countryBadges = countries.map(c => `<span class="country-badge">${esc(c)}</span>`).join('');

  const content = totalNights > 0 ? `
  <div class="log-stats">
    <div class="stat"><div class="stat-number">${totalNights}</div><div class="stat-label">Nights</div></div>
    <div class="stat"><div class="stat-number">${totalObjects}</div><div class="stat-label">Objects</div></div>
    <div class="stat"><div class="stat-number">${totalGuests}</div><div class="stat-label">Guests</div></div>
    <div class="stat"><div class="stat-number">${totalCountries}</div><div class="stat-label">Countries</div></div>
  </div>
  <div class="log-section"><h2>Most Observed Objects</h2><ol class="ranking-list">${rankingItems}</ol></div>
  <hr class="section-divider">
  <div class="log-section"><h2>Monthly Log</h2><div class="monthly-log">${monthCards}</div></div>
  ${countryBadges ? `<hr class="section-divider"><div class="log-section"><h2>Guests From Around the World</h2><div class="countries-section">${countryBadges}</div></div>` : ''}` : `
  <div style="text-align:center;padding:4rem 1.5rem;color:var(--text-muted);">
    <h2 style="color:var(--text-secondary);margin-bottom:.5rem;">No observations yet</h2>
    <p>The observatory log will build up as tours are conducted.</p>
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Observatory Log — Atacama Dark Sky</title>
  <meta name="description" content="Cumulative astronomical observation log from ${totalNights} stargazing nights in the Atacama Desert. ${totalObjects} unique celestial objects observed.">
  <link rel="canonical" href="${BASE_URL}/observatory-log">
  <meta property="og:title" content="Observatory Log — Atacama Dark Sky">
  <meta property="og:description" content="Cumulative observation log from the darkest skies on Earth">
  <meta property="og:url" content="${BASE_URL}/observatory-log">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/gallery/gallery-styles.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    .log-hero{padding:8rem 1.5rem 2.5rem;text-align:center;background:linear-gradient(180deg,var(--bg-secondary) 0%,var(--bg-primary) 100%)}
    .log-hero h1{font-size:2.5rem;margin-bottom:.5rem}.log-hero p{color:var(--text-secondary);font-size:1.1rem}
    .log-stats{display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;padding:2rem 1.5rem}
    .log-stats .stat{text-align:center}.log-stats .stat-number{font-size:2.2rem;font-weight:700;color:var(--primary-color)}
    .log-stats .stat-label{font-size:.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px}
    .log-section{max-width:1000px;margin:0 auto;padding:2rem 1.5rem}.log-section h2{font-size:1.5rem;margin-bottom:1.25rem}
    .ranking-list{list-style:none}.ranking-item{display:flex;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.04)}
    .ranking-position{width:2rem;font-size:1.1rem;font-weight:700;color:var(--text-muted);text-align:right}.ranking-position.top3{color:var(--primary-color)}
    .ranking-info{flex:1}.ranking-name{font-weight:500;font-size:1rem}
    .ranking-count{font-size:.9rem;color:var(--text-secondary);background:var(--bg-secondary);padding:.2rem .6rem;border-radius:50px}
    .monthly-log{display:grid;gap:1.25rem}
    .month-card{background:var(--bg-secondary);border:1px solid rgba(255,255,255,.06);border-radius:var(--border-radius-lg);padding:1.25rem}
    .month-card h3{font-size:1.1rem;color:var(--primary-color);margin-bottom:.5rem}
    .month-stats{display:flex;gap:1.5rem;font-size:.85rem;color:var(--text-muted);margin-bottom:.5rem}
    .month-objects{font-size:.85rem;color:var(--text-secondary)}
    .countries-section{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center;padding:1rem 0}
    .country-badge{background:var(--bg-secondary);border:1px solid rgba(255,255,255,.06);border-radius:50px;padding:.4rem 1rem;font-size:.9rem}
    @media(max-width:768px){.log-hero{padding:6rem 1rem 2rem}.log-hero h1{font-size:1.75rem}.log-stats{gap:1.5rem}}
  </style>
</head>
<body>
  <nav class="gallery-nav"><div class="nav-container">
    <a href="/" class="nav-logo"><img src="/images/Nightskylogo.webp" alt="Atacama Dark Sky" width="120" height="40" loading="eager"></a>
    <ul class="nav-links"><li><a href="/gallery/">Galleries</a></li><li><a href="/observatory-log">Observatory Log</a></li><li><a href="/#tours">Book a Tour</a></li></ul>
  </div></nav>
  <header class="log-hero"><h1>Observatory Log</h1><p>Cumulative astronomical observations from the Atacama Desert</p></header>
  ${content}
  <hr class="section-divider">
  <section class="booking-cta"><h2>Experience the Darkest Skies on Earth</h2><p>Join us for an unforgettable night of stargazing under Bortle Class 1 skies in the Atacama Desert.</p><a href="/#tours" class="cta-btn">Book Your Tour &#10141;</a></section>
  <footer class="gallery-footer"><p>&copy; ${new Date().getFullYear()} <a href="/">Atacama Dark Sky</a> &middot; San Pedro de Atacama, Chile</p></footer>
</body></html>`;
}
