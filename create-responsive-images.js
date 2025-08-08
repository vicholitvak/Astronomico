const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Configuration based on PageSpeed Insights analysis
const IMAGES_DIR = './images';
const OUTPUT_DIR = './images/responsive';
const WEBP_QUALITY = 75; // Reduced for better compression
const JPEG_QUALITY = 80;

// Actual display dimensions from PageSpeed analysis
const IMAGE_SIZES = {
  // Tour card images (380x380 display)
  'regular3-2': [380, 760], // 1x, 2x
  'fotografico': [444, 888], // 1x, 2x (444x250 display)
  'privado1': [380, 760], // 1x, 2x
  'ejecutivo': [380, 760], // 1x, 2x
  '_DSC1725': [380, 760], // 1x, 2x (380x294 display)
  
  // eVscope gallery images (253x190 display)
  'eVscope2-20250418-015040': [253, 506], // 1x, 2x
  'eVscope2-20250520-005028': [253, 506], // 1x, 2x  
  'eVscope2-20250525-021351': [253, 506], // 1x, 2x
  'eVscope2-20250629-012206': [253, 506], // 1x, 2x
  'eVscope2-20250629-013307': [253, 506], // 1x, 2x
  'eVscope2-20250629-013312': [253, 506], // 1x, 2x
  'eVscope2-20250719-001348': [253, 506], // 1x, 2x
  'eVscope2-20250803-004143': [253, 506], // 1x, 2x
  'eVscope2-20250803-004145': [253, 506], // 1x, 2x
  'eVscope2-20250803-032904': [253, 506], // 1x, 2x
  'eVscope2-20250803-034840': [253, 506], // 1x, 2x
  
  // Logo (40x40 display)
  'Nightskylogo': [40, 80], // 1x, 2x
  
  // Profile image
  'me2': [400, 800] // 1x, 2x
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
  return files.filter(file => 
    /\.(jpg|jpeg|png)$/i.test(file) && 
    !file.includes('backup') &&
    !file.includes('hero') // Keep hero images as-is
  );
}

async function createResponsiveVariants(inputFile) {
  const inputPath = path.join(IMAGES_DIR, inputFile);
  const baseName = path.parse(inputFile).name;
  const ext = path.parse(inputFile).ext;
  
  console.log(`\nProcessing: ${inputFile}`);
  
  const sizes = IMAGE_SIZES[baseName];
  if (!sizes) {
    console.log(`  ⏭️  Skipped (no size config)`);
    return;
  }

  try {
    const metadata = await sharp(inputPath).metadata();
    console.log(`  📏 Original: ${metadata.width}x${metadata.height} (${Math.round(metadata.size / 1024)}KB)`);
    
    const [size1x, size2x] = sizes;
    
    // Create 1x version (WebP)
    const webp1x = path.join(OUTPUT_DIR, `${baseName}-1x.webp`);
    await sharp(inputPath)
      .resize(size1x, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(webp1x);
    
    // Create 2x version (WebP) 
    const webp2x = path.join(OUTPUT_DIR, `${baseName}-2x.webp`);
    await sharp(inputPath)
      .resize(size2x, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(webp2x);
    
    // Create 1x fallback (JPEG)
    const jpeg1x = path.join(OUTPUT_DIR, `${baseName}-1x.jpg`);
    await sharp(inputPath)
      .resize(size1x, null, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toFile(jpeg1x);
      
    // Get file sizes
    const webp1xSize = Math.round((await fs.stat(webp1x)).size / 1024);
    const webp2xSize = Math.round((await fs.stat(webp2x)).size / 1024);
    const jpeg1xSize = Math.round((await fs.stat(jpeg1x)).size / 1024);
    const originalSize = Math.round(metadata.size / 1024);
    
    console.log(`  ✅ 1x: ${webp1xSize}KB (WebP), ${jpeg1xSize}KB (JPEG)`);
    console.log(`  ✅ 2x: ${webp2xSize}KB (WebP)`);
    
    const totalSavings = Math.round((1 - webp1xSize / originalSize) * 100);
    console.log(`  💾 Savings: ${totalSavings}% (${originalSize - webp1xSize}KB saved with 1x WebP)`);
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
}

async function generateResponsiveImages() {
  console.log('🖼️  Creating responsive images for actual display dimensions...\n');
  
  await ensureDir(OUTPUT_DIR);
  
  const imageFiles = await getImageFiles();
  console.log(`Found ${imageFiles.length} images to process\n`);
  
  for (const file of imageFiles) {
    await createResponsiveVariants(file);
  }
  
  console.log('\n✅ Responsive image generation complete!');
  console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Update HTML with srcset attributes');
  console.log('   2. Use sizes attribute for proper selection');
  console.log('   3. Test responsive loading behavior');
}

// Generate srcset helper
function generateSrcSet(imageName, className = '', loading = 'lazy') {
  const baseName = path.parse(imageName).name;
  
  if (!IMAGE_SIZES[baseName]) {
    return `<img src="images/${imageName}" alt="Image" loading="${loading}" class="${className}">`;
  }
  
  const [size1x, size2x] = IMAGE_SIZES[baseName];
  
  return `
<picture class="${className}">
  <source srcset="images/responsive/${baseName}-1x.webp 1x, images/responsive/${baseName}-2x.webp 2x" type="image/webp">
  <img src="images/responsive/${baseName}-1x.jpg" 
       srcset="images/responsive/${baseName}-1x.jpg 1x, images/responsive/${baseName}-2x.jpg 2x"
       alt="Responsive image" 
       loading="${loading}"
       width="${size1x}"
       height="auto">
</picture>`.trim();
}

// Export display size mapping for easy reference
const DISPLAY_DIMENSIONS = {
  'regular3-2': '380x380 (tour card)',
  'fotografico': '444x250 (tour card)', 
  'privado1': '380x346 (tour card)',
  'ejecutivo': '380x380 (tour card)',
  '_DSC1725': '380x294 (tour card)',
  'eVscope2-*': '253x190 (gallery)',
  'Nightskylogo': '40x40 (logo)',
  'me2': '400x400 (profile)'
};

console.log('\n📋 Display dimensions mapping:');
Object.entries(DISPLAY_DIMENSIONS).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

if (require.main === module) {
  generateResponsiveImages().catch(console.error);
}

module.exports = {
  generateResponsiveImages,
  generateSrcSet,
  IMAGE_SIZES,
  DISPLAY_DIMENSIONS
};