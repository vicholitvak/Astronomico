const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Aggressive optimization for hero images
const HERO_OPTIMIZATION = {
  mobile: {
    width: 480,
    webpQuality: 70,  // Reduced from 80
    jpegQuality: 75   // Reduced from 85
  },
  tablet: {
    width: 768,
    webpQuality: 65,  // Aggressively reduced
    jpegQuality: 70   // Aggressively reduced
  },
  desktop: {
    width: 1200,
    webpQuality: 75,  // Slightly reduced
    jpegQuality: 80   // Slightly reduced
  }
};

async function optimizeHeroImages() {
  console.log('🖼️  Aggressively optimizing hero images...\n');
  
  const inputFile = 'images/hero1.jpg'; // Use original as source
  const outputDir = 'images/optimized';
  
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    const metadata = await sharp(inputFile).metadata();
    console.log(`📏 Original hero image: ${metadata.width}x${metadata.height} (${Math.round(metadata.size / 1024)}KB)\n`);
    
    for (const [breakpoint, config] of Object.entries(HERO_OPTIMIZATION)) {
      console.log(`Processing ${breakpoint} (${config.width}px width)...`);
      
      // WebP version
      const webpPath = path.join(outputDir, `hero1-${breakpoint}.webp`);
      await sharp(inputFile)
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ 
          quality: config.webpQuality,
          effort: 6,  // Maximum compression effort
          nearLossless: false
        })
        .toFile(webpPath);
      
      // JPEG fallback
      const jpegPath = path.join(outputDir, `hero1-${breakpoint}.jpg`);
      await sharp(inputFile)
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ 
          quality: config.jpegQuality,
          progressive: true,
          mozjpeg: true
        })
        .toFile(jpegPath);
      
      // Get file sizes
      const webpStats = await fs.stat(webpPath);
      const jpegStats = await fs.stat(jpegPath);
      const webpSize = Math.round(webpStats.size / 1024);
      const jpegSize = Math.round(jpegStats.size / 1024);
      
      console.log(`  ✅ WebP: ${webpSize}KB (quality: ${config.webpQuality})`);
      console.log(`  ✅ JPEG: ${jpegSize}KB (quality: ${config.jpegQuality})`);
      
      // Calculate savings
      const originalSize = Math.round(metadata.size / 1024);
      const savings = Math.round((1 - webpSize / originalSize) * 100);
      console.log(`  💾 ${savings}% smaller than original\n`);
    }
    
    console.log('🎉 Hero image optimization complete!');
    console.log('📁 Optimized files saved to images/optimized/');
    
  } catch (error) {
    console.error('❌ Error optimizing hero images:', error);
  }
}

// Also optimize other critical images
async function optimizeCriticalImages() {
  console.log('\n🖼️  Optimizing other critical images...\n');
  
  const criticalImages = [
    'images/regular3-2.jpg',
    'images/fotografico.jpg',
    'images/privado1.jpg',
    'images/ejecutivo.jpg',
    'images/_DSC1725.jpg'
  ];
  
  for (const imagePath of criticalImages) {
    try {
      const baseName = path.parse(imagePath).name;
      const outputDir = 'images/responsive';
      
      await fs.mkdir(outputDir, { recursive: true });
      
      const metadata = await sharp(imagePath).metadata();
      console.log(`Processing ${baseName}...`);
      
      // Create 1x WebP (for standard displays)
      const webp1x = path.join(outputDir, `${baseName}-1x.webp`);
      await sharp(imagePath)
        .resize(380, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ 
          quality: 70,  // Reduced quality
          effort: 6     // Maximum compression
        })
        .toFile(webp1x);
      
      // Create 1x JPEG fallback
      const jpeg1x = path.join(outputDir, `${baseName}-1x.jpg`);
      await sharp(imagePath)
        .resize(380, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ 
          quality: 75,
          progressive: true,
          mozjpeg: true
        })
        .toFile(jpeg1x);
      
      const webpSize = Math.round((await fs.stat(webp1x)).size / 1024);
      const jpegSize = Math.round((await fs.stat(jpeg1x)).size / 1024);
      const originalSize = Math.round(metadata.size / 1024);
      
      console.log(`  ✅ 1x WebP: ${webpSize}KB, JPEG: ${jpegSize}KB`);
      console.log(`  💾 ${Math.round((1 - webpSize / originalSize) * 100)}% smaller\n`);
      
    } catch (error) {
      console.error(`❌ Error optimizing ${imagePath}:`, error.message);
    }
  }
}

// Run optimizations
async function main() {
  await optimizeHeroImages();
  await optimizeCriticalImages();
  console.log('\n🎯 All optimizations complete!');
}

main().catch(console.error);
