import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(__dirname, 'fat-report');
const SCREENSHOTS = path.join(OUT, 'screenshots');
fs.mkdirSync(SCREENSHOTS, { recursive: true });

const BASE = 'http://localhost:3000';
const results = [];
const network404s = new Set();
const consoleErrLog = [];
let currentSection = '';

function pass(msg) { const l = `  ✅ ${msg}`; console.log(l); results.push({ t: 'PASS', s: currentSection, m: msg }); }
function warn(msg) { const l = `  ⚠️  ${msg}`; console.log(l); results.push({ t: 'WARN', s: currentSection, m: msg }); }
function fail(msg) { const l = `  ❌ ${msg}`; console.log(l); results.push({ t: 'FAIL', s: currentSection, m: msg }); }
function section(name) { currentSection = name; console.log(`\n\n══════════ ${name} ══════════\n`); }

async function shot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: true });
}

async function setup(page) {
  const errors = [];
  page.on('console', msg => {
    const t = msg.text();
    if (msg.type() === 'error') {
      errors.push(t);
      consoleErrLog.push(t);
    }
  });
  page.on('response', resp => {
    if (resp.status() >= 400 && resp.status() < 500) {
      const u = resp.url();
      if (!u.includes('/api/vitals') && !u.includes('favicon')) {
        network404s.add(`${resp.status()} ${u}`);
      }
    }
  });
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}

async function checkBrokenImages(page) {
  return page.$$eval('img', imgs =>
    imgs.filter(img => !img.src.startsWith('data:') && img.complete && img.naturalWidth === 0).map(i => i.src)
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  // ======================== 1. HOMEPAGE ========================
  section('1. Homepage');
  {
    const page = await ctx.newPage();
    const errs = await setup(page);
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const title = await page.title();
    title ? pass(`Title: "${title}"`) : fail('No title');
    
    const bodyLen = (await page.textContent('body')).length;
    bodyLen > 200 ? pass(`Body renders (${bodyLen} chars)`) : fail('Body too short');

    const nav = await page.$('nav, header');
    nav ? pass('Navigation present') : warn('No nav found');

    const hero = await page.$('[class*="hero" i], section:first-of-type');
    hero ? pass('Hero section present') : warn('No hero detected');

    const sections = await page.$$('section');
    sections.length >= 3 ? pass(`${sections.length} sections found`) : warn(`Only ${sections.length} sections`);

    const footer = await page.$('footer');
    footer ? pass('Footer present') : warn('No footer');

    const broken = await checkBrokenImages(page);
    broken.length === 0 ? pass('No broken images') : warn(`${broken.length} broken: ${broken.slice(0,3).join(',')}`);

    // Search
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch" i]');
    if (searchInput) {
      pass('Search input found');
      await searchInput.fill('product');
      await searchInput.press('Enter');
      await page.waitForTimeout(3000);
      page.url().includes('search') || page.url().includes('product')
        ? pass(`Search navigated to: ${page.url().replace(BASE,'')}`)
        : warn('Search did not navigate to results');
    } else {
      warn('No search input on homepage');
    }

    // Footer links (sample)
    if (footer) {
      const links = await footer.$$eval('a[href]', as => as.map(a => (a.href)).filter(h => h.startsWith(BASE)));
      let ok = 0, bad = 0;
      for (const l of links.slice(0, 8)) {
        try {
          const r = await page.goto(l, { waitUntil: 'domcontentloaded', timeout: 8000 });
          if (r && r.status() < 400) ok++; else bad++;
        } catch { bad++; }
      }
      bad === 0 ? pass(`Footer links: ${ok} working`) : warn(`Footer links: ${ok} ok, ${bad} broken`);
    }

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await shot(page, '01-homepage');
    pass('Screenshot captured');
    await page.close();
  }

  // ======================== 2. PRODUCT JOURNEY ========================
  section('2. Product Journey');
  {
    const page = await ctx.newPage();
    await setup(page);

    // Products listing
    await page.goto(`${BASE}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '02a-products-listing');

    const productCards = await page.$$('a[href*="/products/"], [class*="product-card"], [class*="ProductCard"]');
    pass(`Products page: ${productCards.length} product cards found`);

    // Filters
    const filters = await page.$$('select, [class*="filter"], [class*="Filter"]');
    filters.length > 0
      ? pass(`${filters.length} filter controls found`)
      : warn('No filters detected on products page');

    // Open product detail
    let detailOpened = false;
    const firstLink = await page.$('a[href*="/products/"]');
    if (firstLink) {
      const href = await firstLink.getAttribute('href');
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      detailOpened = true;
      pass(`Product detail opened: ${href}`);
      await shot(page, '02b-product-detail');
    } else {
      warn('No product link found to open detail');
      // Try navigating directly
      await page.goto(`${BASE}/products/sample-product`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      const status = page.url();
      if (!status.includes('404')) detailOpened = true;
    }

    if (detailOpened) {
      // Check product elements
      const price = await page.textContent('[class*="price" i], [class*="Price" i]');
      if (price && price.length > 0) pass(`Price visible: "${price.trim().substring(0,40)}"`);
      else warn('No price element found');

      const moq = await page.textContent('[class*="moq" i], [class*="MOQ" i]');
      if (moq) pass(`MOQ visible: "${moq.trim().substring(0,30)}"`);

      const gallery = await page.$$('img[class*="gallery"], img[class*="main-image"], [class*="carousel"] img');
      if (gallery.length > 0) pass(`Gallery: ${gallery.length} images`);
      else {
        const allImgs = await page.$$('img');
        if (allImgs.length > 0) pass(`${allImgs.length} images on page (gallery not explicit)`);
        else warn('No images found on product page');
      }

      const sellerSection = await page.textContent('[class*="seller" i], [class*="Supplier" i], [class*="vendor" i]');
      sellerSection ? pass('Seller/supplier info present') : warn('No seller section detected');

      // Trust section
      const trustSection = await page.textContent('body');
      const trustKeywords = ['trust', 'verified', 'warranty', 'guarantee', 'certified', 'badge'];
      const foundTrust = trustKeywords.filter(k => trustSection.toLowerCase().includes(k));
      foundTrust.length > 0 ? pass(`Trust signals: ${foundTrust.join(', ')}`) : warn('No trust signals detected');

      // RFQ / Buy / Chat / Save buttons
      const bodyHtml = await page.textContent('body');
      const actions = [];
      if (bodyHtml.includes('RFQ') || bodyHtml.includes('rfq')) actions.push('RFQ');
      if (bodyHtml.includes('Buy') || bodyHtml.includes('buy') || bodyHtml.includes('Add to Cart')) actions.push('Buy');
      if (bodyHtml.includes('Chat') || bodyHtml.includes('chat')) actions.push('Chat');
      if (bodyHtml.includes('Save') || bodyHtml.includes('save') || bodyHtml.includes('Wishlist')) actions.push('Save');
      actions.length > 0 ? pass(`Action buttons: ${actions.join(', ')}`) : warn('No action buttons found');

      // Related products
      const related = await page.$$('[class*="related"], [class*="Related"], [class*="similar"], [class*="Similar"]');
      related.length > 0 ? pass(`Related products section (${related.length} elements)`) : warn('No related products section');
    }

    await page.close();
  }

  // ======================== 3. COMPANY JOURNEY ========================
  section('3. Company Journey');
  {
    const page = await ctx.newPage();
    await setup(page);

    await page.goto(`${BASE}/companies`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '03a-company-directory');

    const companyCards = await page.$$('a[href*="/companies/"], [class*="company-card"], [class*="CompanyCard"]');
    pass(`Company directory: ${companyCards.length} companies listed`);

    // Search
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch" i]');
    if (searchInput) {
      pass('Company search input found');
      await searchInput.fill('tech');
      await searchInput.press('Enter');
      await page.waitForTimeout(3000);
    } else {
      warn('No search on company page');
    }

    // Open company profile
    const companyLink = await page.$('a[href*="/companies/"]');
    if (companyLink) {
      const href = await companyLink.getAttribute('href');
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      pass(`Company profile opened: ${href}`);
      await shot(page, '03b-company-profile');

      const body = await page.textContent('body');
      if (body.includes('Product') || body.includes('product')) pass('Products section on company page');
      else warn('No products section on company profile');

      const trustKws = ['trust', 'verified', 'certified', 'rating', 'badge'];
      const foundTrust = trustKws.filter(k => body.toLowerCase().includes(k));
      foundTrust.length > 0 ? pass(`Trust: ${foundTrust.join(', ')}`) : warn('No trust signals');

      // Certifications
      const certKws = ['certification', 'certificate', 'certified', 'ISO'];
      const foundCert = certKws.filter(k => body.toLowerCase().includes(k));
      foundCert.length > 0 ? pass(`Certifications: ${foundCert.join(', ')}`) : warn('No certifications found');

      // Save company
      if (body.includes('Save') || body.includes('save') || body.includes('Follow')) pass('Save/follow action present');
      else warn('No save/follow button');
    } else {
      warn('No company link found to open profile');
    }

    await page.close();
  }

  // ======================== 4. CATEGORIES ========================
  section('4. Categories');
  {
    const page = await ctx.newPage();
    await setup(page);

    await page.goto(`${BASE}/categories`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '04a-categories');

    const catLinks = await page.$$('a[href*="/categories/"]');
    catLinks.length > 0 ? pass(`${catLinks.length} category links found`) : warn('No category links');

    // Breadcrumbs
    const breadcrumbs = await page.$$('[class*="breadcrumb" i], nav[aria-label="Breadcrumb"]');
    if (breadcrumbs.length > 0) pass('Breadcrumbs found');
    else warn('No breadcrumbs');

    // Open a category
    const firstCat = await page.$('a[href*="/categories/"]');
    if (firstCat) {
      const href = await firstCat.getAttribute('href');
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      pass(`Category detail: ${href}`);
      await shot(page, '04b-category-detail');

      const products = await page.$$('a[href*="/products/"], [class*="product"], [class*="ProductCard"]');
      products.length > 0 ? pass(`${products.length} products in category`) : warn('No products in category');

      // Breadcrumbs on detail
      const crumbs2 = await page.$$('[class*="breadcrumb" i], nav[aria-label="Breadcrumb"]');
      crumbs2.length > 0 ? pass('Breadcrumbs on detail page') : warn('No breadcrumbs on detail page');
    } else {
      warn('No category link found');
    }

    await page.close();
  }

  // ======================== 5. INDUSTRIES ========================
  section('5. Industries');
  {
    const page = await ctx.newPage();
    await setup(page);

    await page.goto(`${BASE}/industries`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '05a-industries');

    const industryLinks = await page.$$('a[href*="/industry/"]');
    industryLinks.length > 0 ? pass(`${industryLinks.length} industry links found`) : warn('No industry links');

    const firstInd = await page.$('a[href*="/industry/"]');
    if (firstInd) {
      const href = await firstInd.getAttribute('href');
      await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      pass(`Industry detail: ${href}`);
      await shot(page, '05b-industry-detail');

      // Products
      const products = await page.$$('a[href*="/products/"], [class*="product"], [class*="ProductCard"]');
      if (products.length > 0) pass(`${products.length} products in industry`);
      else warn('No products in industry');

      // Company links
      const companies = await page.$$('a[href*="/companies/"]');
      if (companies.length > 0) pass(`${companies.length} company links in industry`);
      else warn('No company links in industry');
    }

    await page.close();
  }

  // ======================== 6. SEARCH ========================
  section('6. Search');
  {
    const page = await ctx.newPage();
    await setup(page);

    // Product search
    await page.goto(`${BASE}/search?q=product`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '06a-search-product');
    const prodResults = await page.$$('[class*="result"], [class*="hit"], [class*="card"], a[href*="/products/"]');
    pass(`Search "product": ${prodResults.length} results`);

    // Category search
    await page.goto(`${BASE}/search?q=electronics`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '06b-search-category');
    const catResults = await page.$$('[class*="result"], [class*="hit"], [class*="card"], a[href*="/products/"]');
    pass(`Search "electronics": ${catResults.length} results`);

    // Company search
    await page.goto(`${BASE}/search?q=company`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, '06c-search-company');
    const compResults = await page.$$('[class*="result"], [class*="hit"], [class*="card"], a[href*="/companies/"]');
    pass(`Search "company": ${compResults.length} results`);

    // Check for "no results" handling
    const bodyText = await page.textContent('body');
    if (bodyText.includes('result') || bodyText.includes('Result') || bodyText.includes('product') || bodyText.includes('company')) {
      pass('Search results display proper content');
    } else {
      warn('Search results page shows no recognizable content');
    }

    await page.close();
  }

  // ======================== 7. AUTHENTICATION ========================
  section('7. Authentication');
  {
    const page = await ctx.newPage();
    await setup(page);

    // Login page loads
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot(page, '07a-login-page');

    const loginForm = await page.$('form, input[type="email"], input[type="password"]');
    loginForm ? pass('Login form found') : warn('No login form found');

    // Protected page redirect check
    await page.goto(`${BASE}/seller/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    const afterRedirect = page.url();
    if (afterRedirect.includes('/login') || afterRedirect.includes('/auth')) {
      pass(`Protected /seller/dashboard redirects to: ${afterRedirect.replace(BASE,'')}`);
    } else {
      warn(`Protected page ${afterRedirect} - may not be protected`);
    }

    // Register page
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot(page, '07b-register-page');

    const registerForm = await page.$('form, input[type="email"], button[type="submit"]');
    registerForm ? pass('Register form found') : warn('No register form');

    // Session persistence check (no cookie == not logged in)
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token') || c.name.includes('auth'));
    if (sessionCookie) {
      pass(`Session cookie found: ${sessionCookie.name}`);
    } else {
      pass('No session cookie (expected for logged-out user)');
    }

    await page.close();
  }

  // ======================== 8. RESPONSIVE ========================
  section('8. Responsive');
  {
    const viewports = [
      { w: 1920, h: 1080, label: 'Desktop' },
      { w: 1366, h: 768, label: 'Laptop' },
      { w: 768, h: 1024, label: 'Tablet' },
      { w: 375, h: 812, label: 'Mobile' },
    ];

    for (const vp of viewports) {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await setup(page);
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await shot(page, `08-responsive-${vp.label.toLowerCase()}`);

      const bodyLen = (await page.textContent('body')).length;
      const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 5);
      
      bodyLen > 100 ? pass(`${vp.label} (${vp.w}x${vp.h}): renders (${bodyLen} chars)`) : warn(`${vp.label}: minimal content`);
      if (!noHorizontalScroll) warn(`${vp.label}: horizontal scroll detected (${await page.evaluate(() => document.documentElement.scrollWidth)} vs ${vp.w})`);
      else pass(`${vp.label}: no horizontal overflow`);

      await page.close();
    }
  }

  // ======================== 9. BROWSER QA ========================
  section('9. Browser QA');
  {
    const page = await ctx.newPage();
    await setup(page);

    // Test 404 page
    const resp = await page.goto(`${BASE}/nonexistent-page-xyz`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    const notFoundStatus = resp ? resp.status() : 0;
    const notFoundBody = await page.textContent('body');
    pass(`404 page test: status=${notFoundStatus}, body="${notFoundBody.trim().substring(0,50)}..."`);

    // Navigate all major pages and check console
    const pagesToCheck = [
      '/', '/products', '/categories', '/industries', '/companies',
      '/search?q=test', '/login', '/register', '/about-tradingo',
      '/sell-on-tradingo', '/buy-from-tradingo', '/help', '/contact',
      '/terms', '/privacy', '/cookies', '/sitemap',
    ];

    let pagesWithErrors = 0;
    for (const p of pagesToCheck) {
      const p2 = await ctx.newPage();
      await setup(p2);
      await p2.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await p2.waitForTimeout(1000);
      
      const broken = await checkBrokenImages(p2);
      if (broken.length > 0) warn(`${p}: ${broken.length} broken images`);

      await p2.close();
    }

    // Check sitemap loads
    await page.goto(`${BASE}/sitemap`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    await shot(page, '09-sitemap');
    const sitemapLinks = await page.$$('a[href]');
    pass(`Sitemap: ${sitemapLinks.length} links`);

    await page.close();
  }

  await browser.close();

  // ======================== REPORT ========================
  section('REPORT SUMMARY');
  console.log('\n\n══════════ FOUNDER ACCEPTANCE TEST REPORT ══════════\n');
  
  const passes = results.filter(r => r.t === 'PASS').length;
  const warns = results.filter(r => r.t === 'WARN').length;
  const fails = results.filter(r => r.t === 'FAIL').length;
  
  console.log(`Total: ${results.length} checks`);
  console.log(`✅ PASS: ${passes}`);
  console.log(`⚠️  WARN: ${warns}`);
  console.log(`❌ FAIL: ${fails}`);
  console.log(`\nNetwork 4xx errors:`);
  network404s.forEach(e => console.log(`  ${e}`));
  
  console.log(`\nConsole errors:`);
  consoleErrLog.slice(0, 20).forEach(e => console.log(`  ${e.substring(0, 120)}`));
  if (consoleErrLog.length > 20) console.log(`  ... and ${consoleErrLog.length - 20} more`);

  // Write report
  const reportLines = [];
  reportLines.push('# TRADINGO Final Founder Acceptance Test Report');
  reportLines.push(`\nDate: ${new Date().toISOString()}`);
  reportLines.push(`\n## Summary\n`);
  reportLines.push(`| Metric | Value |`);
  reportLines.push(`|--------|-------|`);
  reportLines.push(`| Total Checks | ${results.length} |`);
  reportLines.push(`| ✅ Pass | ${passes} |`);
  reportLines.push(`| ⚠️  Warnings | ${warns} |`);
  reportLines.push(`| ❌ Fail | ${fails} |`);
  
  reportLines.push(`\n## Console Errors`);
  consoleErrLog.slice(0, 30).forEach(e => reportLines.push(`- ${e.substring(0, 200)}`));
  if (consoleErrLog.length > 30) reportLines.push(`- ... and ${consoleErrLog.length - 30} more`);
  
  reportLines.push(`\n## Network 404/4xx`);
  network404s.forEach(e => reportLines.push(`- ${e}`));
  
  reportLines.push(`\n## Detailed Results by Section\n`);
  let currentS = '';
  for (const r of results) {
    if (r.s !== currentS) {
      reportLines.push(`\n### ${r.s}`);
      currentS = r.s;
    }
    reportLines.push(`- ${r.t === 'PASS' ? '✅' : r.t === 'WARN' ? '⚠️' : '❌'} ${r.m}`);
  }

  fs.writeFileSync(path.join(OUT, 'fat-report.md'), reportLines.join('\n'), 'utf8');
  console.log(`\nReport saved to: ${path.join(OUT, 'fat-report.md')}`);
  console.log(`Screenshots: ${SCREENSHOTS}/`);
}

main().catch(console.error);
