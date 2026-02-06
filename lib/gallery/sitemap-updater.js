// Sitemap updater — adds gallery URLs to sitemap.xml

import { promises as fs } from 'fs';

const SITEMAP_PATH = 'sitemap.xml';
const BASE_URL = 'https://atacamadarksky.cl';

/**
 * Add a gallery URL to the sitemap.xml.
 * Inserts before the closing </urlset> tag.
 */
export async function addToSitemap(slug, date) {
  let content = await fs.readFile(SITEMAP_PATH, 'utf-8');

  const galleryUrl = `${BASE_URL}/gallery/${slug}/`;

  // Check if already exists
  if (content.includes(galleryUrl)) {
    // Update lastmod
    const regex = new RegExp(
      `(<url>\\s*<loc>${escapeRegex(galleryUrl)}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`,
      's'
    );
    content = content.replace(regex, `$1${date}$2`);
    await fs.writeFile(SITEMAP_PATH, content, 'utf-8');
    return;
  }

  // Add new entry before </urlset>
  const entry = `
  <!-- Tour gallery: ${slug} -->
  <url>
    <loc>${galleryUrl}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

  content = content.replace('</urlset>', `${entry}</urlset>`);
  await fs.writeFile(SITEMAP_PATH, content, 'utf-8');
}

/**
 * Add the gallery index page to sitemap if not present.
 */
export async function addGalleryIndexToSitemap() {
  let content = await fs.readFile(SITEMAP_PATH, 'utf-8');
  const indexUrl = `${BASE_URL}/gallery/`;

  if (content.includes(`<loc>${indexUrl}</loc>`)) return;

  const today = new Date().toISOString().split('T')[0];
  const entry = `
  <!-- Tour galleries index -->
  <url>
    <loc>${indexUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  content = content.replace('</urlset>', `${entry}</urlset>`);
  await fs.writeFile(SITEMAP_PATH, content, 'utf-8');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
