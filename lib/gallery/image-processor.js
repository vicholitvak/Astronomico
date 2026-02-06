// Gallery image processor using Sharp
// Processes tour photos into web-optimized formats with thumbnails and OG images

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const FULL_WIDTH = 1920;
const THUMB_WIDTH = 400;
const WEBP_QUALITY = 80;
const JPG_QUALITY = 85;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Process all photos from a source directory into gallery format.
 * Creates full-size WebP+JPG and thumbnail WebP+JPG for each photo.
 * Returns array of photo metadata.
 */
export async function processPhotos(sourceDir, outputDir) {
  const photosDir = path.join(outputDir, 'photos');
  const thumbsDir = path.join(outputDir, 'thumbs');

  await fs.mkdir(photosDir, { recursive: true });
  await fs.mkdir(thumbsDir, { recursive: true });

  // Find image files in source directory
  const files = await fs.readdir(sourceDir);
  const imageFiles = files
    .filter(f => /\.(jpg|jpeg|png|webp|tif|tiff|heic)$/i.test(f))
    .sort();

  if (imageFiles.length === 0) {
    throw new Error(`No image files found in ${sourceDir}`);
  }

  console.log(`  Found ${imageFiles.length} photos to process`);

  const photos = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const inputPath = path.join(sourceDir, file);
    const num = String(i + 1).padStart(3, '0');
    const baseName = `photo-${num}`;

    console.log(`  Processing ${file} → ${baseName}`);

    const metadata = await sharp(inputPath).metadata();

    // Full-size WebP
    await sharp(inputPath)
      .resize(FULL_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(photosDir, `${baseName}.webp`));

    // Full-size JPG
    await sharp(inputPath)
      .resize(FULL_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: JPG_QUALITY, progressive: true })
      .toFile(path.join(photosDir, `${baseName}.jpg`));

    // Thumbnail WebP
    await sharp(inputPath)
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(thumbsDir, `${baseName}.webp`));

    // Thumbnail JPG
    await sharp(inputPath)
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: JPG_QUALITY, progressive: true })
      .toFile(path.join(thumbsDir, `${baseName}.jpg`));

    // Get processed file sizes
    const fullStats = await fs.stat(path.join(photosDir, `${baseName}.webp`));
    const thumbStats = await fs.stat(path.join(thumbsDir, `${baseName}.webp`));

    photos.push({
      id: baseName,
      original: file,
      width: metadata.width,
      height: metadata.height,
      webp: `photos/${baseName}.webp`,
      jpg: `photos/${baseName}.jpg`,
      thumbWebp: `thumbs/${baseName}.webp`,
      thumbJpg: `thumbs/${baseName}.jpg`,
      sizeKB: Math.round(fullStats.size / 1024),
      thumbSizeKB: Math.round(thumbStats.size / 1024)
    });

    console.log(`    → ${Math.round(fullStats.size / 1024)}KB (full) + ${Math.round(thumbStats.size / 1024)}KB (thumb)`);
  }

  return photos;
}

/**
 * Generate an Open Graph image (1200x630) from the first/best photo.
 * Adds a dark gradient overlay with text.
 */
export async function generateOGImage(sourcePhoto, outputPath, { title, subtitle, date }) {
  // Create the gradient + text overlay as SVG
  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0);"/>
          <stop offset="50%" style="stop-color:rgba(0,0,0,0.3);"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.85);"/>
        </linearGradient>
      </defs>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#grad)"/>
      <text x="60" y="${OG_HEIGHT - 120}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="bold" fill="white">${escapeXml(title)}</text>
      <text x="60" y="${OG_HEIGHT - 70}" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#00D4FF">${escapeXml(subtitle)}</text>
      <text x="${OG_WIDTH - 60}" y="${OG_HEIGHT - 70}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#888888" text-anchor="end">${escapeXml(date)}</text>
      <text x="${OG_WIDTH - 60}" y="50" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="rgba(255,255,255,0.7)" text-anchor="end">atacamadarksky.cl</text>
    </svg>`;

  await sharp(sourcePhoto)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'center' })
    .composite([{
      input: Buffer.from(svg),
      top: 0,
      left: 0
    }])
    .jpeg({ quality: 90, progressive: true })
    .toFile(outputPath);

  const stats = await fs.stat(outputPath);
  console.log(`  OG image: ${Math.round(stats.size / 1024)}KB`);
}

/**
 * Generate an Instagram card (1080x1080) from a photo.
 */
export async function generateInstagramCard(sourcePhoto, outputPath, { title, date, bortle }) {
  const SIZE = 1080;

  const svg = `
    <svg width="${SIZE}" height="${SIZE}">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0);"/>
          <stop offset="60%" style="stop-color:rgba(0,0,0,0.2);"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.9);"/>
        </linearGradient>
      </defs>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#grad)"/>
      <rect x="40" y="40" width="140" height="36" rx="18" fill="rgba(0,212,255,0.9)"/>
      <text x="110" y="64" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">Bortle ${bortle}</text>
      <text x="54" y="${SIZE - 100}" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="white">${escapeXml(title)}</text>
      <text x="54" y="${SIZE - 60}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#00D4FF">${escapeXml(date)}</text>
      <text x="${SIZE - 54}" y="${SIZE - 60}" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="end">atacamadarksky.cl</text>
    </svg>`;

  await sharp(sourcePhoto)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'center' })
    .composite([{
      input: Buffer.from(svg),
      top: 0,
      left: 0
    }])
    .jpeg({ quality: 92, progressive: true })
    .toFile(outputPath);

  const stats = await fs.stat(outputPath);
  console.log(`  Instagram card: ${Math.round(stats.size / 1024)}KB`);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
