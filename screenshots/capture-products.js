const pwPath = require('path').resolve(__dirname, '..', 'node_modules', '.pnpm', 'playwright@1.61.0', 'node_modules', 'playwright');
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  console.log('Navigating to /products...');
  await page.goto('http://localhost:3000/products', { waitUntil: 'load', timeout: 30000 });
  console.log('Page loaded, waiting 10s for JS hydration...');
  await page.waitForTimeout(10000);
  const text = await page.evaluate(() => document.body.innerText.substring(0, 5000));
  console.log('=== PAGE TEXT ===');
  console.log(text);
  await page.screenshot({ path: 'E:/tradingo/screenshots/products-after-fix.png', fullPage: true });
  console.log('=== SCREENSHOT SAVED ===');
  await browser.close();
})();
