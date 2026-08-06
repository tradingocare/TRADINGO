import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('E:/tradingo/node_modules/.pnpm/playwright@1.61.0/node_modules/playwright');
import fs from 'fs';
import path from 'path';

const OUT = path.join('E:/tradingo/apps/web/fat-report/products-audit');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3000';
const lines = [];
const network = [];
const consoleErrs = [];

function log(msg) { console.log(msg); lines.push(msg); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  page.on('console', m => {
    if (m.type() === 'error') consoleErrs.push(m.text());
  });
  page.on('pageerror', e => consoleErrs.push(`PAGEERROR: ${e.message}`));
  page.on('requestfailed', r => network.push(`FAILED ${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', r => {
    if (r.status() >= 400) {
      let m = '?';
      try { m = r.request().method(); } catch {}
      network.push(`${r.status()} ${m} ${r.url()}`);
    }
  });

  // ── 1. INITIAL LOAD ──
  log('=== 1. INITIAL LOAD /products ===');
  const resp = await page.goto(`${BASE}/products`, { waitUntil: 'networkidle', timeout: 30000 });
  log(`HTTP status: ${resp.status()}`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '01-initial-load.png'), fullPage: true });

  const body = await page.textContent('body');
  log(`Body length: ${body.length} chars`);
  log(`Has "No results found": ${body.includes('No results found')}`);
  log(`Has "results": ${body.includes('results')}`);

  const resultCount = await page.evaluate(() => {
    const matches = document.body.innerText.match(/([\d,]+)\s*results?/);
    return matches ? matches[1] : null;
  });
  log(`Result count text: ${resultCount}`);

  // Product cards rendered
  const cardLinks = await page.$$eval('a[href*="/products/"]', as => as.length);
  log(`Product links on page: ${cardLinks}`);

  // Price display check
  const priceTexts = await page.$$eval('[class*="stack-card"] [class*="text-primary"], [class*="UnifiedProductCard"]', els => els.map(e => e.textContent).slice(0, 8));
  log(`Sample card texts: ${JSON.stringify(priceTexts)}`);

  // Any "Rs undefined" bug
  const undefinedPrice = body.includes('Rs undefined') || body.includes('Rs NaN') || body.includes('undefined/');
  log(`"Rs undefined" bug present: ${undefinedPrice}`);

  // Check what API calls happened
  log(`\nNetwork 4xx/5xx: ${network.length}`);
  network.forEach(n => log(`  ${n}`));

  // ── 2. SORT BY DROPDOWN TEST ──
  log('\n=== 2. SORT DROPDOWN (Top Rated) ===');
  const select = await page.$('select');
  if (select) {
    const options = await page.$$eval('select option', os => os.map(o => `${o.value}=${o.textContent}`));
    log(`Sort options: ${JSON.stringify(options)}`);
    await select.selectOption('rating');
    await page.waitForTimeout(3000);
    const body2 = await page.textContent('body');
    const err2 = body2.includes('No results found');
    log(`After sort=rating → "No results found": ${err2}`);
    await page.screenshot({ path: path.join(OUT, '02-sort-rating.png'), fullPage: true });
    network.length = 0;
    // check 400
    page.once('response', r => { if (r.status() >= 400) log(`  sort response: ${r.status()} ${r.url()}`); });
  }

  // ── 3. VERIFIED FILTER TEST ──
  log('\n=== 3. VERIFIED ONLY FILTER ===');
  await page.goto(`${BASE}/products`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const verifiedLabel = await page.$('text=Verified Only');
  if (verifiedLabel) {
    await verifiedLabel.click();
    await page.waitForTimeout(3000);
    const body3 = await page.textContent('body');
    log(`After verified filter → "No results found": ${body3.includes('No results found')}`);
    const url3 = page.url();
    log(`URL: ${url3.replace(BASE, '')}`);
  }

  // ── 4. SEARCH QUERY TEST ──
  log('\n=== 4. SEARCH "product" ===');
  await page.goto(`${BASE}/products?q=product`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  const body4 = await page.textContent('body');
  log(`Search q=product → results count text: ${body4.match(/([\d,]+)\s*results?/)?.[1]}`);
  const productLinks4 = await page.$$eval('a[href*="/products/"]', as => as.length);
  log(`Product links: ${productLinks4}`);
  await page.screenshot({ path: path.join(OUT, '04-search-product.png'), fullPage: true });

  // ── 5. PRICE RANGE FILTER TEST ──
  log('\n=== 5. PRICE RANGE FILTER ===');
  await page.goto(`${BASE}/products`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  // open price section
  const priceSection = await page.$('text=Price Range');
  if (priceSection) {
    await priceSection.click();
    await page.waitForTimeout(500);
    const inputs = await page.$$('input[type="number"]');
    log(`Price inputs found: ${inputs.length}`);
    if (inputs.length >= 2) {
      await inputs[0].fill('1000');
      await inputs[1].fill('5000');
      await page.waitForTimeout(3000);
      const body5 = await page.textContent('body');
      const url5 = page.url();
      log(`After price filter URL: ${url5.replace(BASE, '')}`);
      log(`No results: ${body5.includes('No results found')}`);
    }
  }

  // ── 6. PAGINATION ──
  log('\n=== 6. PAGINATION ===');
  await page.goto(`${BASE}/products?page=2`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  const body6 = await page.textContent('body');
  log(`Page 2 → results: ${body6.match(/([\d,]+)\s*results?/)?.[1]}, no-results: ${body6.includes('No results found')}`);

  // ── 7. CONSOLE ERRORS ──
  log('\n=== 7. CONSOLE ERRORS ===');
  log(`Total console errors: ${consoleErrs.length}`);
  consoleErrs.slice(0, 15).forEach(e => log(`  ${e.substring(0, 200)}`));

  // ── 8. BROKEN IMAGES ──
  log('\n=== 8. BROKEN IMAGES ===');
  const broken = await page.$$eval('img', imgs =>
    imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src).slice(0, 10)
  );
  log(`Broken images: ${broken.length}`);
  broken.forEach(b => log(`  ${b}`));

  // ── 9. AUTOSUGGEST TEST ──
  log('\n=== 9. AUTOCOMPLETE ===');
  const searchInput = await page.$('input[placeholder*="earch" i]');
  if (searchInput) {
    await searchInput.fill('mo');
    await page.waitForTimeout(1200);
    const sugg = await page.$$('[class*="suggestion"], [class*="absolute"] [class*="text-"]');
    const suggText = await page.evaluate(() => {
      const els = document.querySelectorAll('.absolute button');
      return Array.from(els).slice(0, 5).map(b => b.textContent);
    });
    log(`Suggestion buttons: ${JSON.stringify(suggText)}`);
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT, 'audit-log.txt'), lines.join('\n') + '\n\nNETWORK:\n' + network.join('\n'), 'utf8');
}

main().catch(e => { console.error(e); process.exit(1); });
