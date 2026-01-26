const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });

    // Desktop
    console.log('Taking desktop screenshots...');
    const desktopContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('https://atacamadarksky.com', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);

    await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'desktop-full.png'),
        fullPage: true
    });
    console.log('Saved: desktop-full.png');

    // Scroll to tours section and take screenshot
    await desktopPage.evaluate(() => {
        document.querySelector('#tours').scrollIntoView({ behavior: 'instant' });
    });
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'desktop-tours.png')
    });
    console.log('Saved: desktop-tours.png');

    await desktopContext.close();

    // Mobile
    console.log('Taking mobile screenshots...');
    const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('https://atacamadarksky.com', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    await mobilePage.screenshot({
        path: path.join(screenshotsDir, 'mobile-full.png'),
        fullPage: true
    });
    console.log('Saved: mobile-full.png');

    // Scroll to tours section
    await mobilePage.evaluate(() => {
        document.querySelector('#tours').scrollIntoView({ behavior: 'instant' });
    });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
        path: path.join(screenshotsDir, 'mobile-tours.png')
    });
    console.log('Saved: mobile-tours.png');

    await mobileContext.close();
    await browser.close();

    console.log('All screenshots saved to screenshots/ directory');
}

takeScreenshots().catch(console.error);
