// Index generator — creates gallery-index.html and observatory-log.html
// Reads from galleries.json and individual gallery.json files

import { promises as fs } from 'fs';
import path from 'path';
import { loadGalleriesIndex, loadGalleryData } from './gallery-data.js';

const BASE_URL = 'https://atacamadarksky.cl';

/**
 * Generate both index pages.
 */
export async function generateIndexPages() {
  const index = await loadGalleriesIndex();

  await generateGalleryIndex(index);
  await generateObservatoryLog(index);

  console.log('  Generated gallery-index.html and observatory-log.html');
}

/**
 * Generate gallery-index.html — filterable index of all galleries.
 */
async function generateGalleryIndex(index) {
  const { galleries, stats } = index;

  // Collect all unique tour types and months for filters
  const tourTypes = [...new Set(galleries.map(g => g.tourType))].sort();
  const months = [...new Set(galleries.map(g => g.date.slice(0, 7)))].sort().reverse();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tour Galleries — Atacama Dark Sky</title>
  <meta name="description" content="Browse ${stats.totalGalleries} stargazing tour galleries from the Atacama Desert. ${stats.totalGuests} guests from ${stats.totalCountries} countries have observed under Bortle Class 1 skies.">
  <link rel="canonical" href="${BASE_URL}/gallery/">

  <meta property="og:title" content="Tour Galleries — Atacama Dark Sky">
  <meta property="og:description" content="Stargazing tour galleries from the darkest skies on Earth">
  <meta property="og:url" content="${BASE_URL}/gallery/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Atacama Dark Sky">
  ${galleries.length ? `<meta property="og:image" content="${BASE_URL}/${galleries[0].ogImage}">` : ''}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Tour Galleries — Atacama Dark Sky">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/gallery/gallery-styles.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <style>
    .index-hero { padding: 8rem 1.5rem 2.5rem; text-align: center; background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); }
    .index-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .index-hero p { color: var(--text-secondary); font-size: 1.1rem; }

    .stats-strip { display: flex; justify-content: center; gap: 2.5rem; flex-wrap: wrap; padding: 1.5rem; margin-bottom: 1rem; }
    .stats-strip .stat { text-align: center; }
    .stats-strip .stat-number { font-size: 1.8rem; font-weight: 700; color: var(--primary-color); }
    .stats-strip .stat-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .filters { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; padding: 0 1.5rem 2rem; }
    .filter-btn { background: var(--bg-secondary); border: 1px solid rgba(255,255,255,0.08); color: var(--text-secondary); padding: 0.4rem 1rem; border-radius: 50px; cursor: pointer; font-size: 0.85rem; transition: all 0.3s; }
    .filter-btn:hover, .filter-btn.active { background: rgba(0,212,255,0.12); border-color: rgba(0,212,255,0.3); color: var(--primary-color); }

    .gallery-cards { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }

    .gallery-card { background: var(--bg-secondary); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--border-radius-lg); overflow: hidden; transition: border-color 0.3s, transform 0.3s; text-decoration: none; color: inherit; display: block; }
    .gallery-card:hover { border-color: rgba(0,212,255,0.2); transform: translateY(-3px); color: inherit; }
    .gallery-card .card-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
    .gallery-card .card-body { padding: 1.25rem; }
    .gallery-card .card-date { font-size: 0.8rem; color: var(--primary-color); margin-bottom: 0.25rem; }
    .gallery-card .card-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem; }
    .gallery-card .card-meta { display: flex; gap: 1rem; font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap; }

    .empty-state { text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); }
    .empty-state h2 { color: var(--text-secondary); margin-bottom: 0.5rem; }

    .observatory-link { text-align: center; padding: 2rem 1.5rem; }
    .observatory-link a { color: var(--text-secondary); font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px; }

    @media (max-width: 768px) {
      .index-hero { padding: 6rem 1rem 2rem; }
      .index-hero h1 { font-size: 1.75rem; }
      .stats-strip { gap: 1.5rem; }
      .gallery-cards { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav class="gallery-nav">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/images/Nightskylogo.webp" alt="Atacama Dark Sky" width="120" height="40" loading="eager">
      </a>
      <ul class="nav-links">
        <li><a href="/gallery/">Galleries</a></li>
        <li><a href="/observatory-log">Observatory Log</a></li>
        <li><a href="/#tours">Book a Tour</a></li>
      </ul>
    </div>
  </nav>

  <header class="index-hero">
    <h1>Tour Galleries</h1>
    <p>Stargazing experiences from the darkest skies on Earth</p>
  </header>

  ${stats.totalGalleries > 0 ? `
  <div class="stats-strip">
    <div class="stat">
      <div class="stat-number">${stats.totalGalleries}</div>
      <div class="stat-label">Nights</div>
    </div>
    <div class="stat">
      <div class="stat-number">${stats.totalGuests}</div>
      <div class="stat-label">Guests</div>
    </div>
    <div class="stat">
      <div class="stat-number">${stats.totalCountries}</div>
      <div class="stat-label">Countries</div>
    </div>
    <div class="stat">
      <div class="stat-number">${stats.topObjects.length}</div>
      <div class="stat-label">Objects Observed</div>
    </div>
  </div>

  ${tourTypes.length > 1 ? `
  <div class="filters" id="filters">
    <button class="filter-btn active" data-filter="all">All</button>
    ${tourTypes.map(t => `<button class="filter-btn" data-filter="${esc(t)}">${esc(t)}</button>`).join('\n    ')}
  </div>` : ''}

  <div class="gallery-cards" id="galleryCards">
    ${galleries.map(g => `
    <a href="${g.url}" class="gallery-card" data-type="${esc(g.tourType)}" data-month="${g.date.slice(0, 7)}">
      <img class="card-image" src="/${g.ogImage}" alt="${esc(g.title)}" loading="lazy" width="600" height="338">
      <div class="card-body">
        <div class="card-date">${formatDate(g.date)}</div>
        <div class="card-title">${esc(g.title)}</div>
        <div class="card-meta">
          <span>${g.photoCount} photos</span>
          <span>${g.objects.length} objects</span>
          <span>${g.guestCount} guest${g.guestCount !== 1 ? 's' : ''}</span>
          ${g.countries.length ? `<span>${g.countries.map(c => countryFlag(c)).join(' ')}</span>` : ''}
        </div>
      </div>
    </a>`).join('\n')}
  </div>

  <div class="observatory-link">
    <a href="/observatory-log">View Observatory Log &rarr;</a>
  </div>
  ` : `
  <div class="empty-state">
    <h2>No galleries yet</h2>
    <p>Tour galleries will appear here after each stargazing session.</p>
    <p style="margin-top: 1rem;"><a href="/#tours" class="cta-btn">Book Your Tour</a></p>
  </div>
  `}

  <section class="booking-cta">
    <h2>Experience the Darkest Skies on Earth</h2>
    <p>Join us for an unforgettable night of stargazing under Bortle Class 1 skies in the Atacama Desert.</p>
    <a href="/#tours" class="cta-btn">Book Your Tour &#10141;</a>
  </section>

  <footer class="gallery-footer">
    <p>&copy; ${new Date().getFullYear()} <a href="/">Atacama Dark Sky</a> &middot; San Pedro de Atacama, Chile</p>
  </footer>

  ${tourTypes.length > 1 ? `
  <script>
    document.getElementById('filters').addEventListener('click', function(e) {
      if (!e.target.classList.contains('filter-btn')) return;
      var filter = e.target.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      e.target.classList.add('active');
      document.querySelectorAll('.gallery-card').forEach(function(card) {
        if (filter === 'all' || card.dataset.type === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  </script>` : ''}
</body>
</html>`;

  await fs.writeFile(path.join('gallery', 'gallery-index.html'), html, 'utf-8');
}

/**
 * Generate observatory-log.html — cumulative astronomical observation log.
 */
async function generateObservatoryLog(index) {
  const { galleries, stats } = index;

  // Load full gallery data for each gallery to get object details
  const allObjects = {};
  const monthlyData = {};

  for (const g of galleries) {
    const fullData = await loadGalleryData(g.slug);
    if (!fullData) continue;

    const monthKey = g.date.slice(0, 7);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { galleries: 0, guests: 0, objects: new Set() };
    }
    monthlyData[monthKey].galleries++;
    monthlyData[monthKey].guests += g.guestCount;

    if (fullData.objects) {
      for (const obj of fullData.objects) {
        const key = obj.name;
        monthlyData[monthKey].objects.add(key);

        if (!allObjects[key]) {
          allObjects[key] = {
            name: obj.name,
            catalog: obj.catalog,
            type: obj.type,
            constellation: obj.constellation,
            count: 0,
            dates: []
          };
        }
        allObjects[key].count++;
        allObjects[key].dates.push(g.date);
      }
    }
  }

  const sortedObjects = Object.values(allObjects).sort((a, b) => b.count - a.count);
  const sortedMonths = Object.entries(monthlyData).sort((a, b) => b[0].localeCompare(a[0]));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Observatory Log — Atacama Dark Sky</title>
  <meta name="description" content="Cumulative astronomical observation log from ${stats.totalGalleries} stargazing nights in the Atacama Desert. ${sortedObjects.length} unique celestial objects observed.">
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
    .log-hero { padding: 8rem 1.5rem 2.5rem; text-align: center; background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); }
    .log-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .log-hero p { color: var(--text-secondary); font-size: 1.1rem; }

    .log-stats { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; padding: 2rem 1.5rem; }
    .log-stats .stat { text-align: center; }
    .log-stats .stat-number { font-size: 2.2rem; font-weight: 700; color: var(--primary-color); }
    .log-stats .stat-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .log-section { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; }
    .log-section h2 { font-size: 1.5rem; margin-bottom: 1.25rem; }

    .ranking-list { list-style: none; }
    .ranking-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .ranking-position { width: 2rem; font-size: 1.1rem; font-weight: 700; color: var(--text-muted); text-align: right; }
    .ranking-position.top3 { color: var(--primary-color); }
    .ranking-info { flex: 1; }
    .ranking-name { font-weight: 500; font-size: 1rem; }
    .ranking-meta { font-size: 0.8rem; color: var(--text-muted); }
    .ranking-count { font-size: 0.9rem; color: var(--text-secondary); background: var(--bg-secondary); padding: 0.2rem 0.6rem; border-radius: 50px; }

    .monthly-log { display: grid; gap: 1.25rem; }
    .month-card { background: var(--bg-secondary); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--border-radius-lg); padding: 1.25rem; }
    .month-card h3 { font-size: 1.1rem; color: var(--primary-color); margin-bottom: 0.5rem; }
    .month-stats { display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .month-objects { font-size: 0.85rem; color: var(--text-secondary); }

    .countries-section { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; padding: 1rem 0; }
    .country-badge { background: var(--bg-secondary); border: 1px solid rgba(255,255,255,0.06); border-radius: 50px; padding: 0.4rem 1rem; font-size: 0.9rem; }

    @media (max-width: 768px) {
      .log-hero { padding: 6rem 1rem 2rem; }
      .log-hero h1 { font-size: 1.75rem; }
      .log-stats { gap: 1.5rem; }
    }
  </style>
</head>
<body>
  <nav class="gallery-nav">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/images/Nightskylogo.webp" alt="Atacama Dark Sky" width="120" height="40" loading="eager">
      </a>
      <ul class="nav-links">
        <li><a href="/gallery/">Galleries</a></li>
        <li><a href="/observatory-log">Observatory Log</a></li>
        <li><a href="/#tours">Book a Tour</a></li>
      </ul>
    </div>
  </nav>

  <header class="log-hero">
    <h1>Observatory Log</h1>
    <p>Cumulative astronomical observations from the Atacama Desert</p>
  </header>

  ${stats.totalGalleries > 0 ? `
  <div class="log-stats">
    <div class="stat">
      <div class="stat-number">${stats.totalGalleries}</div>
      <div class="stat-label">Observing Nights</div>
    </div>
    <div class="stat">
      <div class="stat-number">${sortedObjects.length}</div>
      <div class="stat-label">Objects Observed</div>
    </div>
    <div class="stat">
      <div class="stat-number">${stats.totalGuests}</div>
      <div class="stat-label">Guests</div>
    </div>
    <div class="stat">
      <div class="stat-number">${stats.totalCountries}</div>
      <div class="stat-label">Countries</div>
    </div>
  </div>

  <hr class="section-divider">

  ${stats.countries.length ? `
  <section class="log-section" style="text-align: center;">
    <h2>Guest Countries</h2>
    <div class="countries-section">
      ${stats.countries.map(c => `<span class="country-badge">${countryFlag(c)} ${esc(c)}</span>`).join('\n      ')}
    </div>
  </section>

  <hr class="section-divider">
  ` : ''}

  <section class="log-section">
    <h2>Most Observed Objects</h2>
    <ol class="ranking-list">
      ${sortedObjects.slice(0, 30).map((obj, i) => `
      <li class="ranking-item">
        <span class="ranking-position${i < 3 ? ' top3' : ''}">${i + 1}</span>
        <div class="ranking-info">
          <div class="ranking-name">${esc(obj.name)}</div>
          <div class="ranking-meta">${obj.catalog !== 'Unknown' ? esc(obj.catalog) + ' · ' : ''}${esc(obj.type || '')}${obj.constellation && obj.constellation !== 'Unknown' && obj.constellation !== 'varies' ? ' · ' + esc(obj.constellation) : ''}</div>
        </div>
        <span class="ranking-count">${obj.count}x</span>
      </li>`).join('')}
    </ol>
  </section>

  <hr class="section-divider">

  <section class="log-section">
    <h2>Monthly Summary</h2>
    <div class="monthly-log">
      ${sortedMonths.map(([month, data]) => `
      <div class="month-card">
        <h3>${formatMonth(month)}</h3>
        <div class="month-stats">
          <span>${data.galleries} night${data.galleries !== 1 ? 's' : ''}</span>
          <span>${data.guests} guest${data.guests !== 1 ? 's' : ''}</span>
          <span>${data.objects.size} objects</span>
        </div>
        <div class="month-objects">${[...data.objects].slice(0, 10).join(', ')}${data.objects.size > 10 ? ` +${data.objects.size - 10} more` : ''}</div>
      </div>`).join('')}
    </div>
  </section>
  ` : `
  <div style="text-align: center; padding: 4rem 1.5rem; color: var(--text-muted);">
    <h2 style="color: var(--text-secondary); margin-bottom: 0.5rem;">No observations yet</h2>
    <p>The observatory log will build up as tours are conducted.</p>
  </div>
  `}

  <hr class="section-divider">

  <section class="booking-cta">
    <h2>Experience the Darkest Skies on Earth</h2>
    <p>Join us for an unforgettable night of stargazing under Bortle Class 1 skies in the Atacama Desert.</p>
    <a href="/#tours" class="cta-btn">Book Your Tour &#10141;</a>
  </section>

  <footer class="gallery-footer">
    <p>&copy; ${new Date().getFullYear()} <a href="/">Atacama Dark Sky</a> &middot; San Pedro de Atacama, Chile</p>
  </footer>
</body>
</html>`;

  await fs.writeFile(path.join('gallery', 'observatory-log.html'), html, 'utf-8');
}

// === Helpers ===

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const COUNTRY_CODES = {
  'germany': 'DE', 'usa': 'US', 'united states': 'US', 'japan': 'JP',
  'brazil': 'BR', 'france': 'FR', 'uk': 'GB', 'united kingdom': 'GB',
  'spain': 'ES', 'italy': 'IT', 'australia': 'AU', 'canada': 'CA',
  'mexico': 'MX', 'chile': 'CL', 'argentina': 'AR', 'colombia': 'CO',
  'peru': 'PE', 'china': 'CN', 'south korea': 'KR', 'korea': 'KR',
  'india': 'IN', 'netherlands': 'NL', 'switzerland': 'CH', 'austria': 'AT',
  'portugal': 'PT', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
  'finland': 'FI', 'ireland': 'IE', 'poland': 'PL', 'new zealand': 'NZ',
  'singapore': 'SG', 'israel': 'IL', 'south africa': 'ZA', 'belgium': 'BE',
  'czech republic': 'CZ', 'czechia': 'CZ', 'hungary': 'HU', 'romania': 'RO',
  'greece': 'GR', 'turkey': 'TR', 'thailand': 'TH', 'taiwan': 'TW',
  'hong kong': 'HK', 'russia': 'RU', 'ukraine': 'UA', 'bolivia': 'BO',
  'ecuador': 'EC', 'uruguay': 'UY', 'croatia': 'HR', 'iceland': 'IS'
};

function countryFlag(country) {
  const code = COUNTRY_CODES[country.toLowerCase()] || 'UN';
  if (code === 'UN') return '';
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}
