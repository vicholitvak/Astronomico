const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const IMAGES_DIR = './images';
const BACKUP_DIR = './images/backup';
const QUALITY = 85;

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function getImageFiles() {
  const files = await fs.readdir(IMAGES_DIR);
  return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('backup'));
}

async function createBackup(file) {
  const sourcePath = path.join(IMAGES_DIR, file);
  const backupPath = path.join(BACKUP_DIR, file);
  
  await fs.copyFile(sourcePath, backupPath);
  console.log(`  ✓ Backed up: ${file}`);
}

async function optimizeInPlace(file) {
  const filePath = path.join(IMAGES_DIR, file);
  const tempPath = path.join(IMAGES_DIR, `temp_${file}`);
  const webpPath = path.join(IMAGES_DIR, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
  
  try {
    // Get original size
    const originalStats = await fs.stat(filePath);
    const originalSize = Math.round(originalStats.size / 1024);
    
    // Create optimized JPEG/PNG (in temp file first)
    await sharp(filePath)
      .jpeg({ quality: QUALITY, progressive: true })
      .toFile(tempPath);
    
    // Create WebP version
    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(webpPath);
    
    // Replace original with optimized version
    await fs.unlink(filePath);
    await fs.rename(tempPath, filePath);
    
    // Get new sizes
    const optimizedStats = await fs.stat(filePath);
    const webpStats = await fs.stat(webpPath);
    const optimizedSize = Math.round(optimizedStats.size / 1024);
    const webpSize = Math.round(webpStats.size / 1024);
    
    const jpegSavings = Math.round((1 - optimizedSize / originalSize) * 100);
    const webpSavings = Math.round((1 - webpSize / originalSize) * 100);
    
    console.log(`  ✓ ${file}: ${originalSize}KB → ${optimizedSize}KB (${jpegSavings}% saved) + ${webpSize}KB WebP (${webpSavings}% saved)`);
    
  } catch (error) {
    console.error(`  ❌ Error optimizing ${file}:`, error.message);
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {}
  }
}

async function optimizeImages() {
  console.log('🖼️  Starting in-place image optimization...\n');
  
  // Ensure backup directory exists
  await ensureDir(BACKUP_DIR);
  
  const imageFiles = await getImageFiles();
  console.log(`Found ${imageFiles.length} images to optimize\n`);
  
  console.log('📦 Creating backups...');
  for (const file of imageFiles) {
    await createBackup(file);
  }
  
  console.log('\n🔧 Optimizing images...');
  for (const file of imageFiles) {
    await optimizeInPlace(file);
  }
  
  console.log('\n✅ In-place optimization complete!');
  console.log(`📁 Original images backed up to: ${BACKUP_DIR}`);
  console.log('📁 WebP versions created alongside JPEG files');
  console.log('\n💡 Next steps:');
  console.log('   1. Update HTML to use <picture> elements with WebP + JPEG fallbacks');
  console.log('   2. Test image loading across different browsers');
}

// Run optimization
if (require.main === module) {
  optimizeImages().catch(console.error);
}

module.exports = { optimizeImages };