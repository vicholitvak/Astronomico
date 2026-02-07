// HTML Generator for tour gallery pages
// Uses tagged template literals — no external template engine

const BASE_URL = 'https://atacamadarksky.cl';

/**
 * Generate the complete gallery HTML page.
 */
export function generateGalleryHTML(data) {
  const {
    slug, date, tourType, title, subtitle,
    bortle, conditions, highlights,
    objects, photos, guests, testimonials = [], astro,
    prev, next,
    photosPrivate = false
  } = data;

  const url = `${BASE_URL}/gallery/${slug}/`;
  // Use first photo as OG image when available, fallback to legacy og-image.jpg
  const ogImageUrl = (photos.length && photos[0].original_url) ? photos[0].original_url : `${BASE_URL}/gallery/${slug}/og-image.jpg`;
  const dateFormatted = formatDate(date);
  const dateISO = date;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} — Atacama Dark Sky</title>
  <meta name="description" content="${esc(subtitle)}. ${objects.length} celestial objects observed under Bortle ${bortle} skies in San Pedro de Atacama.">
  <link rel="canonical" href="${url}">

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(subtitle)}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Atacama Dark Sky">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(subtitle)}">
  <meta name="twitter:image" content="${ogImageUrl}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
${generateSchemaJSON(data)}
  </script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <!-- Styles -->
  <link rel="stylesheet" href="/gallery/gallery-styles.css">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  ${photosPrivate ? `<style>
    .photos-private-notice{text-align:center;padding:3rem 1.5rem;background:var(--bg-secondary);border:1px solid rgba(255,255,255,.06);border-radius:var(--border-radius-lg)}
    .photos-private-notice .private-lock{font-size:3rem;margin-bottom:1rem;opacity:.6}
    .photos-private-notice p{color:var(--text-secondary);margin:0 0 .75rem;line-height:1.6}
    .photos-private-notice p strong{color:var(--text-primary)}
    .photos-private-wa{display:inline-flex;align-items:center;gap:.5rem;background:#25D366;color:#fff;padding:.6rem 1.25rem;border-radius:50px;text-decoration:none;font-weight:500;font-size:.9rem;margin-top:.5rem;transition:opacity .3s}
    .photos-private-wa:hover{opacity:.85;color:#fff}
  </style>` : ''}
</head>
<body>
  <!-- Navigation -->
  <nav class="gallery-nav">
    <div class="nav-container">
      <a href="/" class="nav-logo">
        <img src="/images/Nightskylogo.webp" alt="Atacama Dark Sky" width="120" height="40" loading="eager">
      </a>
      <ul class="nav-links">
        <li><a href="/gallery/">All Galleries</a></li>
        <li><a href="/#tours">Book a Tour</a></li>
      </ul>
    </div>
  </nav>

  <!-- Hero -->
  <header class="gallery-hero">
    <div>
      <span class="badge-bortle">Bortle Class ${bortle}</span>${conditions ? `
      <span class="badge-conditions">${esc(conditions)}</span>` : ''}
      <h1>${esc(title)}</h1>
      <p class="hero-subtitle">${esc(subtitle)}</p>
      <p class="hero-date">${dateFormatted}${guests.length ? ` &middot; ${guests.length} guest${guests.length > 1 ? 's' : ''}` : ''}</p>
    </div>
  </header>

  <hr class="section-divider">

  ${highlights ? `
  <!-- Highlights -->
  <section class="gallery-section">
    <div class="highlights-section">
      <strong>Highlights:</strong> ${esc(highlights)}
    </div>
  </section>

  <hr class="section-divider">
  ` : ''}

  <!-- Observation Log -->
  <section class="gallery-section">
    <h2>Observation Log &mdash; ${objects.length} Objects</h2>
    <div class="observation-log">
${objects.map(obj => generateObjectCard(obj)).join('\n')}
    </div>
  </section>

  <hr class="section-divider">

  ${photosPrivate ? `
  <!-- Photos Private Notice -->
  <section class="gallery-section">
    <h2>Photos &mdash; ${photos.length} Images</h2>
    <div class="photos-private-notice">
      <div class="private-lock">&#128274;</div>
      <p><strong>${photos.length} tour photos</strong> are available exclusively to participants.</p>
      <p>If you joined this tour, use the private link you received via WhatsApp.</p>
      <p>Lost your link? We'll send it again:</p>
      <a href="https://wa.me/56920441937?text=${encodeURIComponent(`Hi! I'd like access to the gallery for the tour on ${formatDate(date)}. Can you send me the link?`)}" class="photos-private-wa" target="_blank" rel="noopener">
        &#128172; Contact on WhatsApp
      </a>
    </div>
  </section>
  ` : `
  <!-- Photo Gallery -->
  <section class="gallery-section">
    <h2>Photos &mdash; ${photos.length} Images</h2>
    <div class="photo-grid">
${photos.map((photo, i) => generatePhotoItem(photo, i, slug)).join('\n')}
    </div>
    ${photos.length > 3 ? `
    <div style="text-align: center; margin-top: 1.5rem;">
      <button id="downloadAllBtn" class="share-btn copy-link">
        <span>&#128230;</span> Download All Photos
      </button>
    </div>` : ''}
  </section>

  <!-- Lightbox -->
  <div class="gallery-lightbox" id="galleryLightbox">
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-nav lightbox-prev" aria-label="Previous">&#8249;</button>
    <button class="lightbox-nav lightbox-next" aria-label="Next">&#8250;</button>
    <img id="lightboxImage" src="" alt="">
    <div class="lightbox-counter" id="lightboxCounter"></div>
    <a class="lightbox-download" id="lightboxDownload" href="#" download>
      <span>&#11015;</span> Download
    </a>
  </div>
  `}

  ${guests.length ? `
  <hr class="section-divider">

  <!-- Guests -->
  <section class="gallery-section" style="text-align: center;">
    <h2>Tonight's Explorers</h2>
    <div class="guests-list">
${guests.map(g => `      <div class="guest-chip">
        <span class="flag">${g.flag}</span>
        <span class="guest-name">${esc(g.name)}</span>
        <span class="guest-country">${esc(g.country)}</span>
      </div>`).join('\n')}
    </div>
  </section>
  ` : ''}

  <hr class="section-divider">

  <!-- Social Sharing -->
  <section class="sharing-section">
    <p>Share this experience with friends and fellow stargazers</p>
    <div class="sharing-buttons">
      <a class="share-btn whatsapp" href="https://wa.me/?text=${encodeURIComponent(`Check out this incredible stargazing experience in the Atacama Desert! ${url}`)}" target="_blank" rel="noopener">
        <span class="share-icon">&#128172;</span> WhatsApp
      </a>
      <a class="share-btn facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">
        <span class="share-icon">&#102;</span> Facebook
      </a>
      <a class="share-btn copy-link" href="#">
        <span class="share-icon">&#128279;</span> Copy Link
      </a>
    </div>
    <p class="copy-feedback" id="copyFeedback">Link copied to clipboard!</p>
  </section>

  ${testimonials.length ? `
  <hr class="section-divider">

  <!-- Guest Testimonials -->
  <section class="gallery-section testimonial-section">
    <h2>What Our Guests Say</h2>
    <div class="testimonial-list">
${testimonials.map(t => `      <div class="testimonial-card">
        <blockquote class="testimonial-quote">${esc(t.quote)}</blockquote>
        <div class="testimonial-author">
          <span class="testimonial-name">${esc(t.name)}</span>${t.country ? `
          <span class="testimonial-country">${esc(t.country)}</span>` : ''}
        </div>
      </div>`).join('\n')}
    </div>
  </section>
  ` : ''}

  <hr class="section-divider">

  <!-- Booking CTA -->
  <section class="booking-cta">
    <h2>Experience the Darkest Skies on Earth</h2>
    <p>Join us for an unforgettable night of stargazing under Bortle Class 1 skies in the Atacama Desert.</p>
    <a href="/#tours" class="cta-btn">
      Book Your Tour &#10141;
    </a>
  </section>

  <!-- Astro Footer -->
  <div class="astro-footer">
    <div class="container">
      <div class="astro-stats">
        <div class="astro-stat">
          <div class="stat-emoji">${astro.moon.emoji}</div>
          <div class="stat-value">${astro.moon.phase}</div>
          <div class="stat-label">${astro.moon.illumination}% illuminated</div>
        </div>
        <div class="astro-stat">
          <div class="stat-emoji">&#127749;</div>
          <div class="stat-value">${astro.sun.sunset}</div>
          <div class="stat-label">Sunset</div>
        </div>
        <div class="astro-stat">
          <div class="stat-emoji">&#127748;</div>
          <div class="stat-value">${astro.sun.sunrise}</div>
          <div class="stat-label">Sunrise</div>
        </div>
        ${astro.sun.astronomicalTwilightEnd ? `
        <div class="astro-stat">
          <div class="stat-emoji">&#127747;</div>
          <div class="stat-value">${astro.sun.astronomicalTwilightEnd}</div>
          <div class="stat-label">Astro Twilight</div>
        </div>` : ''}
        ${astro.planets.length ? `
        <div class="astro-stat">
          <div class="stat-emoji">&#127756;</div>
          <div class="stat-value">${astro.planets.map(p => p.name).join(', ')}</div>
          <div class="stat-label">Visible Planets</div>
        </div>` : ''}
      </div>

      <div class="gallery-pagination">
        <div>
          ${prev ? `<a href="/gallery/${prev.slug}/">&larr; ${esc(prev.title || prev.slug)}</a>` : '<span></span>'}
        </div>
        <div>
          <a href="/gallery/">All Galleries</a>
        </div>
        <div>
          ${next ? `<a href="/gallery/${next.slug}/">${esc(next.title || next.slug)} &rarr;</a>` : '<span></span>'}
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="gallery-footer">
    <p>&copy; ${new Date().getFullYear()} <a href="/">Atacama Dark Sky</a> &middot; San Pedro de Atacama, Chile</p>
  </footer>

  <script src="/gallery/gallery-scripts.js"></script>
</body>
</html>`;
}

function generateObjectCard(obj) {
  return `      <div class="object-card">
        <div class="card-header">
          <h3>${esc(obj.name)}</h3>
          ${obj.catalog && obj.catalog !== 'Unknown' ? `<span class="catalog-id">${esc(obj.catalog)}</span>` : ''}
        </div>
        <div class="object-meta">
          ${obj.type && obj.type !== 'unknown' ? `<span><span class="icon">${getTypeIcon(obj.type)}</span> ${esc(obj.type)}</span>` : ''}
          ${obj.constellation && obj.constellation !== 'Unknown' && obj.constellation !== 'varies' ? `<span><span class="icon">&#9734;</span> ${esc(obj.constellation)}</span>` : ''}
          ${obj.distance && obj.distance !== 'Unknown' && obj.distance !== 'varies' && obj.distance !== 'N/A' ? `<span><span class="icon">&#8614;</span> ${esc(obj.distance)}</span>` : ''}
          ${obj.magnitude && obj.magnitude !== 'N/A' && obj.magnitude !== 'varies' ? `<span><span class="icon">&#9728;</span> mag ${esc(String(obj.magnitude))}</span>` : ''}
        </div>
        ${obj.description ? `<p class="description">${esc(obj.description)}</p>` : ''}
      </div>`;
}

function generatePhotoItem(photo, index, slug) {
  // Support both Supabase URLs (original_url/thumbnail_url) and legacy relative paths
  const thumbSrc = photo.thumbnail_url || `/gallery/${slug}/${photo.thumbWebp}`;
  const fullSrc = photo.original_url || `/gallery/${slug}/${photo.webp}`;
  const jpgSrc = photo.original_url || `/gallery/${slug}/${photo.jpg}`;

  if (index < 3) {
    // First 3 images load eagerly
    return `      <div class="photo-item" data-full="${fullSrc}" data-jpg="${jpgSrc}">
        <img src="${thumbSrc}" alt="Stargazing photo ${index + 1}" width="400" height="300" loading="eager">
        <div class="photo-overlay"><div class="expand-icon">&#43;</div></div>
      </div>`;
  }

  // Lazy load remaining
  return `      <div class="photo-item" data-full="${fullSrc}" data-jpg="${jpgSrc}">
        <img data-src="${thumbSrc}" alt="Stargazing photo ${index + 1}" width="400" height="300" loading="lazy">
        <div class="photo-overlay"><div class="expand-icon">&#43;</div></div>
      </div>`;
}

function generateSchemaJSON(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    'name': data.title,
    'description': data.subtitle,
    'touristType': 'Astronomy enthusiast',
    'url': `${BASE_URL}/gallery/${data.slug}/`,
    'image': `${BASE_URL}/gallery/${data.slug}/og-image.jpg`,
    'dateCreated': data.date,
    'provider': {
      '@type': 'LocalBusiness',
      'name': 'Atacama Dark Sky',
      'url': BASE_URL,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'San Pedro de Atacama',
        'addressRegion': 'Antofagasta',
        'addressCountry': 'CL'
      }
    },
    'location': {
      '@type': 'Place',
      'name': 'San Pedro de Atacama, Chile',
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': -22.9068,
        'longitude': -68.1998
      }
    }
  };

  if (data.photos && data.photos.length && !data.photosPrivate) {
    schema.subjectOf = data.photos.map((photo, i) => ({
      '@type': 'ImageObject',
      'url': photo.original_url || `${BASE_URL}/gallery/${data.slug}/${photo.jpg}`,
      'thumbnailUrl': photo.thumbnail_url || `${BASE_URL}/gallery/${data.slug}/${photo.thumbJpg}`,
      'name': `Stargazing photo ${i + 1}`,
      'description': `Photo from ${data.tourType} tour on ${data.date}`
    }));
  }

  return JSON.stringify(schema, null, 4);
}

function getTypeIcon(type) {
  const icons = {
    'emission nebula': '&#9729;',
    'dark nebula': '&#9724;',
    'planetary nebula': '&#9711;',
    'emission/reflection nebula': '&#9729;',
    'reflection nebula': '&#9729;',
    'globular cluster': '&#10039;',
    'open cluster': '&#10037;',
    'spiral galaxy': '&#127756;',
    'elliptical galaxy': '&#11044;',
    'irregular galaxy': '&#9671;',
    'irregular galaxies': '&#9671;',
    'galaxy cluster': '&#10039;',
    'planet': '&#9898;',
    'moon': '&#9789;',
    'star': '&#9733;',
    'double star': '&#10023;',
    'constellation': '&#10025;',
    'asterism': '&#10025;',
    'galactic center': '&#10040;',
    'galaxy': '&#127756;',
    'solar system phenomenon': '&#9788;'
  };
  return icons[type] || '&#9734;';
}

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
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
