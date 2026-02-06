// Gallery data management — CRUD for gallery.json and galleries.json index

import { promises as fs } from 'fs';
import path from 'path';

const GALLERY_BASE = 'gallery';
const INDEX_FILE = path.join(GALLERY_BASE, 'galleries.json');

/**
 * Create or update a gallery's metadata file.
 */
export async function saveGalleryData(slug, data) {
  const galleryDir = path.join(GALLERY_BASE, slug);
  await fs.mkdir(galleryDir, { recursive: true });
  const filePath = path.join(galleryDir, 'gallery.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

/**
 * Read a gallery's metadata.
 */
export async function loadGalleryData(slug) {
  const filePath = path.join(GALLERY_BASE, slug, 'gallery.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Load the master galleries index.
 */
export async function loadGalleriesIndex() {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { galleries: [], stats: {} };
  }
}

/**
 * Update the master galleries index with a new or updated gallery.
 */
export async function updateGalleriesIndex(galleryEntry) {
  const index = await loadGalleriesIndex();

  // Remove existing entry for this slug if present
  index.galleries = index.galleries.filter(g => g.slug !== galleryEntry.slug);

  // Add new entry
  index.galleries.push(galleryEntry);

  // Sort by date descending (newest first)
  index.galleries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Update stats
  const allCountries = new Set();
  let totalGuests = 0;
  const objectCounts = {};

  for (const g of index.galleries) {
    totalGuests += g.guestCount || 0;
    if (g.countries) g.countries.forEach(c => allCountries.add(c));
    if (g.objects) {
      for (const obj of g.objects) {
        objectCounts[obj] = (objectCounts[obj] || 0) + 1;
      }
    }
  }

  index.stats = {
    totalGalleries: index.galleries.length,
    totalGuests,
    totalCountries: allCountries.size,
    countries: [...allCountries].sort(),
    topObjects: Object.entries(objectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count })),
    lastUpdated: new Date().toISOString()
  };

  await fs.mkdir(GALLERY_BASE, { recursive: true });
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  return index;
}

/**
 * Build a gallery index entry from full gallery data.
 */
export function buildIndexEntry(data) {
  return {
    slug: data.slug,
    date: data.date,
    tourType: data.tourType,
    title: data.title,
    guestCount: data.guests ? data.guests.length : 0,
    countries: data.guests ? [...new Set(data.guests.map(g => g.country))] : [],
    objects: data.objects ? data.objects.map(o => o.name) : [],
    photoCount: data.photos ? data.photos.length : 0,
    bortle: data.bortle,
    ogImage: `gallery/${data.slug}/og-image.jpg`,
    url: `/gallery/${data.slug}/`
  };
}

/**
 * Parse guest strings like "Maria (Germany), John (USA)" into structured data.
 */
export function parseGuests(guestsString) {
  if (!guestsString) return [];

  return guestsString.split(',').map(g => {
    const match = g.trim().match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      const name = match[1].trim();
      const country = match[2].trim();
      return {
        name,
        country,
        code: countryToCode(country),
        flag: countryToFlag(country)
      };
    }
    return { name: g.trim(), country: 'Unknown', code: 'UN', flag: '🏳️' };
  });
}

// Country name to ISO 3166-1 alpha-2 code mapping
const COUNTRY_CODES = {
  'germany': 'DE', 'usa': 'US', 'united states': 'US', 'japan': 'JP',
  'brazil': 'BR', 'brasil': 'BR', 'france': 'FR', 'uk': 'GB',
  'united kingdom': 'GB', 'england': 'GB', 'spain': 'ES', 'italy': 'IT',
  'australia': 'AU', 'canada': 'CA', 'mexico': 'MX', 'chile': 'CL',
  'argentina': 'AR', 'colombia': 'CO', 'peru': 'PE', 'china': 'CN',
  'south korea': 'KR', 'korea': 'KR', 'india': 'IN', 'netherlands': 'NL',
  'holland': 'NL', 'belgium': 'BE', 'switzerland': 'CH', 'austria': 'AT',
  'portugal': 'PT', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
  'finland': 'FI', 'ireland': 'IE', 'poland': 'PL', 'czech republic': 'CZ',
  'czechia': 'CZ', 'hungary': 'HU', 'romania': 'RO', 'greece': 'GR',
  'turkey': 'TR', 'israel': 'IL', 'south africa': 'ZA', 'new zealand': 'NZ',
  'singapore': 'SG', 'malaysia': 'MY', 'thailand': 'TH', 'vietnam': 'VN',
  'indonesia': 'ID', 'philippines': 'PH', 'taiwan': 'TW', 'russia': 'RU',
  'ukraine': 'UA', 'egypt': 'EG', 'morocco': 'MA', 'scotland': 'GB',
  'wales': 'GB', 'bolivia': 'BO', 'ecuador': 'EC', 'uruguay': 'UY',
  'paraguay': 'PY', 'venezuela': 'VE', 'costa rica': 'CR', 'panama': 'PA',
  'cuba': 'CU', 'dominican republic': 'DO', 'puerto rico': 'PR',
  'croatia': 'HR', 'serbia': 'RS', 'slovenia': 'SI', 'slovakia': 'SK',
  'iceland': 'IS', 'luxembourg': 'LU', 'estonia': 'EE', 'latvia': 'LV',
  'lithuania': 'LT', 'malta': 'MT', 'cyprus': 'CY', 'uae': 'AE',
  'qatar': 'QA', 'saudi arabia': 'SA', 'hong kong': 'HK'
};

function countryToCode(country) {
  return COUNTRY_CODES[country.toLowerCase()] || 'UN';
}

function countryToFlag(country) {
  const code = countryToCode(country);
  if (code === 'UN') return '🏳️';
  // Convert country code to flag emoji (regional indicator symbols)
  return String.fromCodePoint(
    ...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}
