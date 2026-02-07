#!/usr/bin/env node

// Atacama Dark Sky — Gallery CLI
// Creates tour gallery pages from photos and metadata
//
// Usage:
//   node bin/ads-gallery.js create \
//     --date 2026-02-06 \
//     --tour-type "Deep Sky" \
//     --guests "Maria (Germany), John (USA)" \
//     --objects "Jupiter, Orion Nebula, Carina Nebula" \
//     --conditions "clear, excellent seeing" \
//     --bortle 1 \
//     --photos ./fotos-tour/ \
//     --highlights "First time guests saw the Magellanic Clouds"

import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { processPhotos, generateOGImage, generateInstagramCard } from '../lib/gallery/image-processor.js';
import { enrichObjects } from '../lib/gallery/astronomical-catalog.js';
import { getAstroSummary } from '../lib/gallery/astro-calculator.js';
import { saveGalleryData, updateGalleriesIndex, buildIndexEntry, parseGuests, loadGalleriesIndex } from '../lib/gallery/gallery-data.js';
import { generateGalleryHTML } from '../lib/gallery/html-generator.js';
import { addToSitemap, addGalleryIndexToSitemap } from '../lib/gallery/sitemap-updater.js';
import { generateIndexPages } from '../lib/gallery/index-generator.js';

// ==========================================
// Argument parsing
// ==========================================
function parseArgs(argv) {
  const args = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { command: positional[0], args };
}

// ==========================================
// Slug generation
// ==========================================
function generateSlug(date, tourType) {
  const typePart = tourType
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${date}-${typePart}`;
}

// ==========================================
// Subtitle generation
// ==========================================
function generateSubtitle(tourType, objects, guests, bortle) {
  const objCount = objects.length;
  const guestCountries = [...new Set(guests.map(g => g.country).filter(c => c !== 'Unknown'))];

  if (guestCountries.length > 0) {
    return `${tourType} tour observing ${objCount} celestial objects under Bortle ${bortle} skies, with guests from ${guestCountries.join(', ')}`;
  }
  return `${tourType} tour observing ${objCount} celestial objects under Bortle ${bortle} skies in the Atacama Desert`;
}

// ==========================================
// WhatsApp message template
// ==========================================
function generateWhatsAppMessage(data) {
  const names = data.guests.map(g => g.name);
  let greeting;
  if (names.length === 1) greeting = `Hi ${names[0]}!`;
  else if (names.length === 2) greeting = `Hi ${names[0]} and ${names[1]}!`;
  else greeting = `Hi ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}!`;

  const galleryUrl = data.accessToken
    ? `https://atacamadarksky.cl/gallery/${data.slug}/?key=${data.accessToken}`
    : `https://atacamadarksky.cl/gallery/${data.slug}/`;

  return `${greeting} 🌌

Thank you for joining our ${data.tourType} tour tonight!
Here are your photos and observation log:

👉 ${galleryUrl}

This is your private link — only people with this link can see the photos.

Clear skies,
Vicente — Atacama Dark Sky ✨`;
}

// ==========================================
// CREATE command
// ==========================================
async function createGallery(args) {
  console.log('\n🌌 Atacama Dark Sky — Gallery Creator\n');

  // Validate required args
  const required = ['date', 'tour-type', 'objects', 'photos'];
  for (const key of required) {
    if (!args[key]) {
      console.error(`❌ Missing required argument: --${key}`);
      printUsage();
      process.exit(1);
    }
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    console.error('❌ Date must be in YYYY-MM-DD format');
    process.exit(1);
  }

  // Validate photos directory
  const photosDir = path.resolve(args.photos);
  try {
    await fs.access(photosDir);
  } catch {
    console.error(`❌ Photos directory not found: ${photosDir}`);
    process.exit(1);
  }

  const date = args.date;
  const tourType = args['tour-type'];
  const bortle = parseInt(args.bortle || '1', 10);
  const conditions = args.conditions || '';
  const highlights = args.highlights || '';

  // 1. Generate slug
  const slug = generateSlug(date, tourType);
  const outputDir = path.join('gallery', slug);
  console.log(`📁 Gallery: ${slug}`);

  // 2. Parse guests
  const guests = parseGuests(args.guests || '');
  if (guests.length) {
    console.log(`👥 Guests: ${guests.map(g => `${g.flag} ${g.name}`).join(', ')}`);
  }

  // 3. Enrich astronomical objects
  const objectNames = args.objects.split(',').map(s => s.trim()).filter(Boolean);
  const objects = enrichObjects(objectNames, conditions);
  const foundCount = objects.filter(o => o.found).length;
  console.log(`🔭 Objects: ${objects.length} (${foundCount} in catalog, ${objects.length - foundCount} custom)`);

  // 4. Calculate astronomical data
  const astro = getAstroSummary(date);
  console.log(`🌙 Moon: ${astro.moon.emoji} ${astro.moon.phase} (${astro.moon.illumination}% illuminated)`);
  console.log(`🌅 Sunset: ${astro.sun.sunset} | Sunrise: ${astro.sun.sunrise}`);

  // 5. Process images
  console.log('\n📷 Processing photos...');
  const photos = await processPhotos(photosDir, outputDir);
  console.log(`  ✅ ${photos.length} photos processed\n`);

  // 6. Generate OG image
  const firstPhotoPath = path.join(photosDir, photos[0].original);
  const title = `${tourType} Tour — ${formatDateShort(date)}`;
  const subtitle = generateSubtitle(tourType, objects, guests, bortle);

  console.log('🖼️  Generating social images...');
  await generateOGImage(firstPhotoPath, path.join(outputDir, 'og-image.jpg'), {
    title: `${tourType} Tour`,
    subtitle: `${objects.length} objects observed · Bortle ${bortle}`,
    date: formatDateShort(date)
  });

  // Instagram card
  await generateInstagramCard(firstPhotoPath, path.join(outputDir, 'instagram-card.jpg'), {
    title: `${tourType} Tour`,
    date: formatDateShort(date),
    bortle
  });

  // 7. Build gallery data
  const accessToken = crypto.randomBytes(9).toString('base64url'); // 12 chars

  const galleryData = {
    slug,
    date,
    tourType,
    title,
    subtitle,
    bortle,
    conditions,
    highlights,
    accessToken,
    objects: objects.map(o => ({
      name: o.name,
      catalog: o.catalog,
      type: o.type,
      constellation: o.constellation,
      distance: o.distance,
      magnitude: o.magnitude,
      description: o.description,
      found: o.found
    })),
    photos,
    guests,
    astro,
    createdAt: new Date().toISOString()
  };

  // 8. Get prev/next galleries for pagination
  const index = await loadGalleriesIndex();
  const prevGallery = index.galleries.find(g => g.date < date);
  const nextGallery = [...index.galleries].reverse().find(g => g.date > date);

  // 9. Generate HTML
  console.log('📝 Generating HTML...');
  const html = generateGalleryHTML({
    ...galleryData,
    prev: prevGallery || null,
    next: nextGallery || null
  });

  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf-8');

  // 10. Save gallery.json
  await saveGalleryData(slug, galleryData);

  // 11. Update galleries.json index
  const entry = buildIndexEntry(galleryData);
  await updateGalleriesIndex(entry);

  // 12. Update sitemap
  console.log('🗺️  Updating sitemap...');
  await addToSitemap(slug, date);
  await addGalleryIndexToSitemap();

  // 13. Regenerate index pages
  console.log('📄 Generating index pages...');
  await generateIndexPages();

  // 14. Print summary
  const totalSizeKB = photos.reduce((sum, p) => sum + p.sizeKB + p.thumbSizeKB, 0);
  console.log('\n✅ Gallery created successfully!\n');
  console.log(`  📁 Path:   gallery/${slug}/`);
  console.log(`  🌐 URL:    https://atacamadarksky.cl/gallery/${slug}/`);
  console.log(`  🔑 Private: https://atacamadarksky.cl/gallery/${slug}/?key=${accessToken}`);
  console.log(`  📷 Photos: ${photos.length} (${totalSizeKB}KB total)`);
  console.log(`  🔭 Objects: ${objects.length}`);
  console.log(`  👥 Guests: ${guests.length}`);

  // WhatsApp message
  if (guests.length) {
    console.log('\n📱 WhatsApp message (copy below):\n');
    console.log('─'.repeat(50));
    console.log(generateWhatsAppMessage(galleryData));
    console.log('─'.repeat(50));
  }

  console.log('\n🚀 Next steps:');
  console.log('  1. Review the gallery: open gallery/' + slug + '/index.html');
  console.log('  2. Commit and push: git add gallery/' + slug + ' && git commit -m "Add gallery: ' + slug + '"');
  console.log('  3. Deploy will happen automatically on push to main\n');
}

// ==========================================
// LIST command
// ==========================================
async function listGalleries() {
  const index = await loadGalleriesIndex();

  if (!index.galleries.length) {
    console.log('No galleries found. Create one with: node bin/ads-gallery.js create --help');
    return;
  }

  console.log(`\n🌌 Atacama Dark Sky — ${index.galleries.length} Galleries\n`);

  for (const g of index.galleries) {
    console.log(`  ${g.date}  ${g.tourType.padEnd(15)} ${g.photoCount} photos  ${g.guestCount} guests  ${g.slug}`);
  }

  if (index.stats) {
    console.log(`\n📊 Stats: ${index.stats.totalGalleries} galleries, ${index.stats.totalGuests} guests, ${index.stats.totalCountries} countries`);
  }
  console.log();
}

// ==========================================
// Helpers
// ==========================================
function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function printUsage() {
  console.log(`
Usage: node bin/ads-gallery.js <command> [options]

Commands:
  create    Create a new gallery from photos
  list      List all galleries

Create options:
  --date <YYYY-MM-DD>       Tour date (required)
  --tour-type <type>        Tour type, e.g. "Deep Sky" (required)
  --objects <list>          Comma-separated celestial objects (required)
  --photos <directory>      Path to source photos (required)
  --guests <list>           Guests, e.g. "Maria (Germany), John (USA)"
  --conditions <text>       Observing conditions, e.g. "clear, excellent seeing"
  --bortle <1-9>            Bortle class (default: 1)
  --highlights <text>       Tour highlights

Example:
  node bin/ads-gallery.js create \\
    --date 2026-02-06 \\
    --tour-type "Deep Sky" \\
    --guests "Maria (Germany), John (USA), Yuki (Japan)" \\
    --objects "Jupiter, Orion Nebula, Carina Nebula, Magellanic Clouds" \\
    --conditions "clear, no moon, excellent seeing" \\
    --bortle 1 \\
    --photos ./fotos-tour-20260206/ \\
    --highlights "First time guests saw the Magellanic Clouds with naked eye"
`);
}

// ==========================================
// Main
// ==========================================
const { command, args } = parseArgs(process.argv.slice(2));

switch (command) {
  case 'create':
    if (args.help) { printUsage(); break; }
    createGallery(args).catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
    break;

  case 'list':
    listGalleries().catch(console.error);
    break;

  default:
    printUsage();
    break;
}
