const pwPath = require('path').resolve(__dirname, '..', 'node_modules', '.pnpm', 'playwright@1.61.0', 'node_modules', 'playwright');
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', err => console.log(`PAGE_ERROR: ${err.message}`));
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(8000);
  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes('Something went wrong')) {
    console.log('ERROR BOUNDARY DETECTED');
  } else {
    console.log('OK — no error boundary');
  }
  const hasHubSection = text.includes('Cities Covered') || text.includes('India');
  console.log(`IndiaHubs section rendered: ${hasHubSection}`);
  await page.screenshot({ path: 'E:/tradingo/screenshots/homepage-after-restart.png', fullPage: true });
  await browser.close();
  console.log('Done.');
})();
