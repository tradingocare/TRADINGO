const pwPath = require('path').resolve(__dirname, '..', 'node_modules', '.pnpm', 'playwright@1.61.0', 'node_modules', 'playwright');
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Product detail page
  console.log('=== PRODUCT DETAIL PAGE ===');
  await page.goto('http://localhost:3000/products/arduino-mega-2560-r3-1784561335498', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(8000);
  const detailText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log(detailText);
  await page.screenshot({ path: 'E:/tradingo/screenshots/product-detail.png', fullPage: true });
  console.log('Detail screenshot saved.');
  
  // Products listing page
  console.log('\n=== PRODUCTS LISTING PAGE ===');
  await page.goto('http://localhost:3000/products', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'E:/tradingo/screenshots/products-listing.png', fullPage: true });
  console.log('Listing screenshot saved.');
  
  await browser.close();
  console.log('Done.');
})();
