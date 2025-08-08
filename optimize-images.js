const sharp = require('sharp');
const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const IMAGES_DIR = './images';
const OUTPUT_DIR = './images/optimized';
const QUALITY = 85;
const WEBP_QUALITY = 80;

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1200,
  large: 1920
};

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function getImageFiles() {
  const files = await fs.readdir(IMAGES_DIR);
  return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
}

async function optimizeImage(inputPath, outputPath, width = null, quality = QUALITY) {
  let processor = sharp(inputPath);
  
  if (width) {
    processor = processor.resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }
  
  await processor
    .jpeg({ quality, progressive: true })
    .toFile(outputPath);
}

async function convertToWebP(inputPath, outputPath, width = null) {
  let processor = sharp(inputPath);
  
  if (width) {
    processor = processor.resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }
  
  await processor
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);
}

async function processImages() {
  console.log('🖼️  Starting image optimization...\n');
  
  // Ensure output directory exists
  await ensureDir(OUTPUT_DIR);
  
  const imageFiles = await getImageFiles();
  console.log(`Found ${imageFiles.length} images to process\n`);
  
  for (const file of imageFiles) {
    const inputPath = path.join(IMAGES_DIR, file);
    const baseName = path.parse(file).name;
    const ext = path.parse(file).ext;
    
    console.log(`Processing: ${file}`);
    
    try {
      // Get original image info
      const metadata = await sharp(inputPath).metadata();
      console.log(`  Original: ${metadata.width}x${metadata.height} (${Math.round(metadata.size / 1024)}KB)`);
      
      // Generate responsive variants
      for (const [breakpoint, width] of Object.entries(BREAKPOINTS)) {
        // Skip if original is smaller than breakpoint
        if (metadata.width < width) continue;
        
        const optimizedJpg = path.join(OUTPUT_DIR, `${baseName}-${breakpoint}${ext}`);
        const webpFile = path.join(OUTPUT_DIR, `${baseName}-${breakpoint}.webp`);
        
        // Create optimized JPEG
        await optimizeImage(inputPath, optimizedJpg, width);
        
        // Create WebP version
        await convertToWebP(inputPath, webpFile, width);
        
        // Get file sizes
        const jpgStats = await fs.stat(optimizedJpg);
        const webpStats = await fs.stat(webpFile);
        
        console.log(`  ${breakpoint}: ${Math.round(jpgStats.size / 1024)}KB (JPEG), ${Math.round(webpStats.size / 1024)}KB (WebP)`);
      }
      
      // Also create optimized original size versions
      const originalOptimized = path.join(OUTPUT_DIR, `${baseName}-original${ext}`);
      const originalWebp = path.join(OUTPUT_DIR, `${baseName}-original.webp`);
      
      await optimizeImage(inputPath, originalOptimized);
      await convertToWebP(inputPath, originalWebp);
      
      const originalJpgStats = await fs.stat(originalOptimized);
      const originalWebpStats = await fs.stat(originalWebp);
      
      console.log(`  original: ${Math.round(originalJpgStats.size / 1024)}KB (JPEG), ${Math.round(originalWebpStats.size / 1024)}KB (WebP)`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
    }
    
    console.log('');
  }
  
  console.log('✅ Image optimization complete!');
  console.log(`📁 Optimized images saved to: ${OUTPUT_DIR}`);
}

// Generate picture element helper function
function generatePictureElement(imageName, alt, className = '', loading = 'lazy') {
  const baseName = path.parse(imageName).name;
  
  return `
<picture class="${className}">
  <!-- WebP sources -->
  <source media="(max-width: 480px)" srcset="images/optimized/${baseName}-mobile.webp" type="image/webp">
  <source media="(max-width: 768px)" srcset="images/optimized/${baseName}-tablet.webp" type="image/webp">
  <source media="(max-width: 1200px)" srcset="images/optimized/${baseName}-desktop.webp" type="image/webp">
  <source srcset="images/optimized/${baseName}-large.webp" type="image/webp">
  
  <!-- JPEG fallbacks -->
  <source media="(max-width: 480px)" srcset="images/optimized/${baseName}-mobile.jpg">
  <source media="(max-width: 768px)" srcset="images/optimized/${baseName}-tablet.jpg">
  <source media="(max-width: 1200px)" srcset="images/optimized/${baseName}-desktop.jpg">
  
  <!-- Fallback img -->
  <img src="images/optimized/${baseName}-original.jpg" alt="${alt}" loading="${loading}">
</picture>`.trim();
}

// Run the optimization
if (require.main === module) {
  processImages().catch(console.error);
}

module.exports = {
  processImages,
  generatePictureElement
};