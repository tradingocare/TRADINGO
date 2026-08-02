const pwPath = require('path').resolve(__dirname, '..', 'node_modules', '.pnpm', 'playwright@1.61.0', 'node_modules', 'playwright');
const { chromium } = require(pwPath);

const PAGES = [
  { name: 'homepage',           url: '/' },
  { name: 'product-listing',    url: '/products' },
  { name: 'product-detail',     url: '/products/arduino-mega-2560-r3-1784561335498' },
  { name: 'categories',         url: '/categories' },
  { name: 'category-detail',    url: '/categories/electronics' },
  { name: 'industries',         url: '/industries' },
  { name: 'industry-detail',    url: '/industries/automotive' },
  { name: 'search',             url: '/search?q=pcb' },
  { name: 'company-directory',  url: '/companies' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pageDef of PAGES) {
    console.log(`\n=== ${pageDef.name} ===`);
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    const networkErrors = [];

    page.on('pageerror', err => errors.push(err.message));
    page.on('response', resp => {
      if (!resp.ok() && resp.status() >= 400) {
        networkErrors.push(`${resp.status()} ${resp.url().substring(0, 120)}`);
      }
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`[console.${msg.type()}] ${msg.text().substring(0, 200)}`);
      }
    });

    try {
      await page.goto(`http://localhost:3000${pageDef.url}`, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(7000);
    } catch (e) {
      errors.push(`NAVIGATION_TIMEOUT: ${e.message.substring(0, 100)}`);
    }

    const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    const hasErrorBoundary = text.includes('Something went wrong');
    const has404 = text.includes('404') || text.includes('This page could not be found');
    const hasNotFound = text.includes('Not Found');

    const result = {
      page: pageDef.name,
      url: pageDef.url,
      ok: !hasErrorBoundary && !has404 && !hasNotFound,
      errorBoundary: hasErrorBoundary,
      notFound: hasNotFound || has404,
      errors: errors.slice(0, 5),
      networkErrors: networkErrors.filter(e => !e.includes('favicon') && !e.includes('.svg') && !e.includes('fonts.googleapis')).slice(0, 5),
    };

    console.log(`  OK: ${result.ok}  |  Errors: ${errors.length}  |  Network: ${networkErrors.length}`);
    if (hasErrorBoundary) console.log(`  !! ERROR BOUNDARY`);
    if (hasNotFound) console.log(`  !! 404/NOT FOUND`);

    await page.screenshot({ path: `E:/tradingo/screenshots/audit-${pageDef.name}.png`, fullPage: true });

    results.push(result);
    await page.close();
  }

  console.log('\n========== SUMMARY ==========');
  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.page}: ${r.ok ? 'PASS' : 'FAIL'}${r.errorBoundary ? ' (ERROR BOUNDARY)' : ''}${r.notFound ? ' (NOT FOUND)' : ''}`);
    if (!r.ok) {
      r.errors.forEach(e => console.log(`     Error: ${e}`));
      r.networkErrors.forEach(e => console.log(`     Network: ${e}`));
    }
  }

  await browser.close();
  console.log('\nDone.');
})();
