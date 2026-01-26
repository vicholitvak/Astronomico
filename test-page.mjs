import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPage() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        locale: 'es-CL'
    });
    const page = await context.newPage();

    console.log('Opening page...');

    // Open local file
    const filePath = join(__dirname, 'index.html');
    await page.goto(`file://${filePath}`);

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    console.log('\n=== PAGE TITLE ===');
    console.log(await page.title());

    console.log('\n=== TOURS SECTION ===');

    // Check tours section header
    const toursTitle = await page.locator('#tours .section-header h2').textContent();
    console.log('Tours title:', toursTitle);

    // Count tour cards
    const tourCards = await page.locator('.tour-card').count();
    console.log('Tour cards count:', tourCards);

    // Check if hero tour exists
    const heroTour = await page.locator('.tour-hero').count();
    console.log('Hero tour exists:', heroTour > 0);

    // Get tour hero title and price
    if (heroTour > 0) {
        const heroTitle = await page.locator('.tour-hero h3').textContent();
        const heroPrice = await page.locator('.tour-hero .price-amount').textContent();
        const heroPriceNote = await page.locator('.tour-hero .price-note').textContent();
        console.log('Hero tour title:', heroTitle);
        console.log('Hero tour price:', heroPrice);
        console.log('Hero tour price note:', heroPriceNote);
    }

    console.log('\n=== PAYMENT BUTTONS ===');

    // Check payment buttons
    const mpButton = await page.locator('.tour-hero .btn-mercadopago').count();
    const wiseButton = await page.locator('.tour-hero .btn-wise').count();
    console.log('MercadoPago button exists:', mpButton > 0);
    console.log('Wise button exists:', wiseButton > 0);

    if (mpButton > 0) {
        const mpText = await page.locator('.tour-hero .btn-mercadopago').textContent();
        console.log('MercadoPago button text:', mpText.trim());
    }

    if (wiseButton > 0) {
        const wiseText = await page.locator('.tour-hero .btn-wise').textContent();
        console.log('Wise button text:', wiseText.trim());
    }

    console.log('\n=== FAQ PRICING SECTION ===');

    // Check FAQ pricing - click to expand
    const faqPricing = page.locator('.faq-item:has-text("precios")');
    if (await faqPricing.count() > 0) {
        await faqPricing.locator('button').click();
        await page.waitForTimeout(300);
        const pricingContent = await faqPricing.locator('.faq-answer').textContent();
        console.log('Pricing FAQ content (truncated):', pricingContent.substring(0, 300) + '...');
    }

    console.log('\n=== TAKING SCREENSHOTS ===');

    // Screenshot of tours section
    await page.locator('#tours').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-tours.png', fullPage: false });
    console.log('Saved: screenshot-tours.png');

    // Test Wise modal
    console.log('\n=== TESTING WISE MODAL ===');
    const wiseBtn = page.locator('.tour-hero .btn-wise');
    if (await wiseBtn.count() > 0) {
        await wiseBtn.click();
        await page.waitForTimeout(500);

        const wiseModal = await page.locator('#wise-payment-modal').count();
        console.log('Wise modal opened:', wiseModal > 0);

        if (wiseModal > 0) {
            await page.screenshot({ path: 'screenshot-wise-modal.png' });
            console.log('Saved: screenshot-wise-modal.png');

            // Check EUR details
            const eurIban = await page.locator('#wise-eur-details .value').first().textContent();
            console.log('EUR IBAN shown:', eurIban.trim());
        }
    }

    // Test language switch to English
    console.log('\n=== TESTING ENGLISH TRANSLATION ===');
    await page.locator('.modal-close').click().catch(() => {});
    await page.waitForTimeout(300);

    // Find language switcher
    const langBtn = page.locator('.lang-btn[data-lang="en"], .language-selector button:has-text("EN")');
    if (await langBtn.count() > 0) {
        await langBtn.first().click();
        await page.waitForTimeout(500);

        const toursTitleEn = await page.locator('#tours .section-header h2').textContent();
        console.log('Tours title (EN):', toursTitleEn);

        const heroPriceNoteEn = await page.locator('.tour-hero .price-note').textContent();
        console.log('Price note (EN):', heroPriceNoteEn);

        await page.screenshot({ path: 'screenshot-tours-en.png' });
        console.log('Saved: screenshot-tours-en.png');
    } else {
        console.log('Language switcher not found or not clickable');
    }

    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testPage().catch(console.error);
