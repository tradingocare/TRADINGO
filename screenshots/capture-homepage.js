const pwPath = require('path').resolve(__dirname, '..', 'node_modules', '.pnpm', 'playwright@1.61.0', 'node_modules', 'playwright');
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(10000);
  const text = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  // Check if error boundary is shown
  if (text.includes('Something went wrong') || text.includes('Error') && text.includes('Error ID')) {
    console.log('ERROR DETECTED on homepage');
  } else {
    console.log('Homepage loaded OK - no error boundary detected');
  }
  console.log(text);
  await page.screenshot({ path: 'E:/tradingo/screenshots/homepage-fixed.png', fullPage: true });
  await browser.close();
  console.log('Done.');
})();
