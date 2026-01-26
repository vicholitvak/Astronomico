import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function captureScreenshots() {
    const browser = await chromium.launch({ headless: true });

    // Desktop viewport
    console.log('=== DESKTOP SCREENSHOTS ===');
    const desktopContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        locale: 'es-CL'
    });
    const desktopPage = await desktopContext.newPage();

    // Use the live site
    await desktopPage.goto('https://atacamadarksky.com');
    await desktopPage.waitForLoadState('networkidle');
    await desktopPage.waitForTimeout(1000);

    // Full page screenshot desktop
    await desktopPage.screenshot({
        path: 'screenshots/desktop-full.png',
        fullPage: true
    });
    console.log('Saved: screenshots/desktop-full.png');

    // Screenshot of tours section specifically
    await desktopPage.locator('#tours').scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
        path: 'screenshots/desktop-tours.png'
    });
    console.log('Saved: screenshots/desktop-tours.png');

    // Get the actual HTML structure of tours section
    console.log('\n=== TOURS SECTION HTML STRUCTURE ===');
    const toursHTML = await desktopPage.locator('#tours').innerHTML();
    console.log('Tours section classes and structure:');

    // Count tour cards
    const tourCards = await desktopPage.locator('.tour-card').count();
    console.log(`Number of tour cards: ${tourCards}`);

    // Check tour grid structure
    const tourGrid = await desktopPage.locator('.tour-grid, .tours-grid').count();
    console.log(`Tour grid elements: ${tourGrid}`);

    // Get computed styles
    const toursSection = await desktopPage.locator('#tours');
    const toursSectionBox = await toursSection.boundingBox();
    console.log(`Tours section dimensions: ${toursSectionBox?.width}x${toursSectionBox?.height}`);

    // Check each tour card
    const cards = await desktopPage.locator('.tour-card').all();
    for (let i = 0; i < cards.length; i++) {
        const box = await cards[i].boundingBox();
        const classes = await cards[i].getAttribute('class');
        console.log(`Card ${i+1}: ${box?.width}x${box?.height} - classes: ${classes}`);
    }

    await desktopContext.close();

    // Mobile viewport
    console.log('\n=== MOBILE SCREENSHOTS ===');
    const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        locale: 'es-CL',
        isMobile: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('https://atacamadarksky.com');
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.waitForTimeout(1000);

    // Full page screenshot mobile
    await mobilePage.screenshot({
        path: 'screenshots/mobile-full.png',
        fullPage: true
    });
    console.log('Saved: screenshots/mobile-full.png');

    // Tours section mobile
    await mobilePage.locator('#tours').scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
        path: 'screenshots/mobile-tours.png'
    });
    console.log('Saved: screenshots/mobile-tours.png');

    // Mobile card dimensions
    const mobileCards = await mobilePage.locator('.tour-card').all();
    console.log('\nMobile card dimensions:');
    for (let i = 0; i < mobileCards.length; i++) {
        const box = await mobileCards[i].boundingBox();
        console.log(`Card ${i+1}: ${box?.width}x${box?.height}`);
    }

    await mobileContext.close();

    // Tablet viewport
    console.log('\n=== TABLET SCREENSHOTS ===');
    const tabletContext = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        locale: 'es-CL'
    });
    const tabletPage = await tabletContext.newPage();

    await tabletPage.goto('https://atacamadarksky.com');
    await tabletPage.waitForLoadState('networkidle');
    await tabletPage.waitForTimeout(1000);

    await tabletPage.locator('#tours').scrollIntoViewIfNeeded();
    await tabletPage.waitForTimeout(500);
    await tabletPage.screenshot({
        path: 'screenshots/tablet-tours.png'
    });
    console.log('Saved: screenshots/tablet-tours.png');

    await tabletContext.close();

    await browser.close();
    console.log('\n=== SCREENSHOT CAPTURE COMPLETE ===');
}

// Create screenshots directory
import { mkdirSync } from 'fs';
try {
    mkdirSync('screenshots', { recursive: true });
} catch (e) {}

captureScreenshots().catch(console.error);
