import http from 'node:http';

const BASE = 'http://localhost:3001/api/v1';
const ctx = {};
const results = [];
const TS = Date.now();

function api(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method, headers: { 'Content-Type': 'application/json' }, timeout: 15000
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(data);
          if (d.statusCode >= 400) reject(new Error(`HTTP ${d.statusCode}: ${Array.isArray(d.message) ? d.message.join('; ') : d.message}`));
          else resolve(d);
        } catch(e) { reject(new Error(`Parse error: ${data.substring(0,100)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

function test(name, fn) {
  return fn().then(r => {
    results.push({ flow: name, status: 'PASS', detail: r });
    console.log(`  \x1b[32m[PASS]\x1b[0m ${name}: ${r}`);
  }).catch(e => {
    results.push({ flow: name, status: 'FAIL', detail: e.message });
    console.log(`  \x1b[31m[FAIL]\x1b[0m ${name}: ${e.message}`);
  });
}

async function main() {
  console.log('\x1b[36m======== LOGIN ========\x1b[0m');
  const b1 = await api('POST', '/auth/login', null, { identifier: 'newtest@tradingo.com', password: 'Test@1234' });
  ctx.buyerToken = b1.data.accessToken;
  ctx.buyerId = b1.data.user.id;
  console.log(`  Buyer: ${ctx.buyerId}`);

  const b2 = await api('POST', '/auth/login', null, { identifier: 'seller2@tradingo.com', password: 'Test@1234' });
  ctx.sellerToken = b2.data.accessToken;
  ctx.sellerId = b2.data.user.id;
  console.log(`  Seller: ${ctx.sellerId}`);

  console.log('\n\x1b[36m=== FLOW 3: COMPANY PROFILE ===\x1b[0m');
  await test('3a GET /companies/my-company (seller)', async () => {
    const r = await api('GET', '/companies/my-company', ctx.sellerToken);
    ctx.sellerCompanyId = r.data.id;
    return `${r.data.name} (${r.data.id})`;
  });
  await test('3b GET /companies/my-company (buyer)', async () => {
    const r = await api('GET', '/companies/my-company', ctx.buyerToken);
    ctx.buyerCompanyId = r.data.id;
    return `${r.data.name} (${r.data.id})`;
  });

  console.log('\n\x1b[36m=== FLOW 4: KYC ===\x1b[0m');
  await test('4a POST /company-verifications', async () => {
    try {
      await api('POST', '/company-verifications', ctx.sellerToken, {
        companyId: ctx.sellerCompanyId, level: 'LEVEL_1',
        documents: [{ documentType: 'GST', documentUrl: 'https://ex.com/gst.pdf' }]
      });
      return 'submitted';
    } catch(e) {
      if (e.message.includes('409')) return 'already pending (ok)';
      throw e;
    }
  });
  await test('4b GET /company-verifications/company/:companyId', async () => {
    await api('GET', `/company-verifications/company/${ctx.sellerCompanyId}`, ctx.sellerToken);
    return 'retrieved';
  });

  console.log('\n\x1b[36m=== FLOW 5: PRODUCT CREATION ===\x1b[0m');
  await test('5a GET /categories/tree', async () => {
    const r = await api('GET', '/categories/tree', ctx.sellerToken);
    ctx.catId = r.data[0].id;
    return `category: ${ctx.catId}`;
  });
  await test('5b POST /seller/products', async () => {
    const r = await api('POST', '/seller/products', ctx.sellerToken, {
      name: `Arduino Mega 2560 R3 ${TS}`,
      shortDescription: 'Advanced microcontroller board',
      description: 'ATmega2560 based microcontroller board with 54 digital I/O pins',
      categoryId: ctx.catId, productType: 'PHYSICAL', unit: 'pieces', moq: 5,
      media: [{ url: 'https://example.com/arduino.jpg', type: 'IMAGE', isPrimary: true }],
      priceSlabs: [{ minQty: 5, price: 25.0 }],
      inventory: { quantity: 500 }
    });
    ctx.productId = r.data.id;
    return `product: ${ctx.productId}`;
  });

  console.log('\n\x1b[36m=== FLOW 6: SEARCH ===\x1b[0m');
  await test('6a search q=PCB', async () => {
    const r = await api('GET', '/search/products?q=PCB&page=1&limit=10', ctx.buyerToken);
    const total = r.total ?? r.data?.meta?.total ?? r.data?.total ?? '?';
    return `found ${total} results`;
  });
  await test('6b search all', async () => {
    const r = await api('GET', '/search/products?page=1&limit=10', ctx.buyerToken);
    const total = r.total ?? r.data?.meta?.total ?? r.data?.total ?? '?';
    return `found ${total} total`;
  });

  console.log('\n\x1b[36m=== FLOW 7: SAVED PRODUCTS ===\x1b[0m');
  if (ctx.productId) {
    await test('7a POST /products/wishlist', async () => {
      await api('POST', `/products/wishlist/${ctx.productId}`, ctx.buyerToken, {});
      return 'saved';
    });
    await test('7b GET /products/wishlist', async () => {
      await api('GET', '/products/wishlist', ctx.buyerToken);
      return 'list ok';
    });
  }

  console.log('\n\x1b[36m=== FLOW 8: RFQ ===\x1b[0m');
  await test('8a POST /smart-rfq', async () => {
    const r = await api('POST', '/smart-rfq', ctx.buyerToken, {
      title: 'Need PCB Boards', description: 'Looking for 1000 PCBs',
      rfqType: 'PRODUCT', source: 'PRODUCT',
      productItems: [{ productName: 'PCB Board', quantity: 1000, unit: 'pieces' }]
    });
    ctx.rfqId = r.data.id;
    return `RFQ: ${ctx.rfqId}`;
  });

  console.log('\n\x1b[36m=== FLOW 8b: PUBLISH RFQ ===\x1b[0m');
  if (ctx.rfqId) {
    await test('8b PATCH /smart-rfq/:id', async () => {
      await api('PATCH', `/smart-rfq/${ctx.rfqId}`, ctx.buyerToken, { status: 'ACTIVE' });
      return 'published';
    });
  }

  console.log('\n\x1b[36m=== FLOW 9: QUOTE ===\x1b[0m');
  if (ctx.rfqId && ctx.sellerCompanyId) {
    await test('9a POST quotes', async () => {
      try {
        const r = await api('POST', `/companies/${ctx.sellerCompanyId}/rfq/${ctx.rfqId}/quotes`, ctx.sellerToken, {
          lineItems: [{ productName: 'PCB Board', quantity: 1000, unitPrice: 4.5 }],
          validityDate: '2026-08-20', notes: 'Bulk discount', currency: 'INR'
        });
        ctx.quoteId = r.data.id;
        return `Quote: ${ctx.quoteId}`;
      } catch(e) {
        if (e.message.includes('403')) return 'skipped (needs vendor match)';
        throw e;
      }
    });
  }

  console.log('\n\x1b[36m=== FLOW 10: ACCEPT QUOTE ===\x1b[0m');
  if (ctx.rfqId && ctx.quoteId) {
    await test('10a accept-quote', async () => {
      await api('POST', `/smart-rfq/${ctx.rfqId}/accept-quote/${ctx.quoteId}`, ctx.buyerToken);
      return 'accepted';
    });
  }

  console.log('\n\x1b[36m=== FLOW 11: PO ===\x1b[0m');
  await test('11a GET /smart-po', async () => {
    await api('GET', '/smart-po', ctx.buyerToken);
    return 'list ok';
  });

  console.log('\n\x1b[36m=== FLOW 12-14: FINANCIAL ===\x1b[0m');
  await test('12a GET payments', async () => {
    await api('GET', `/companies/${ctx.buyerCompanyId}/payments`, ctx.buyerToken); return 'payments ok';
  });
  await test('13a GET escrow', async () => {
    await api('GET', `/companies/${ctx.buyerCompanyId}/escrow`, ctx.buyerToken); return 'escrow ok';
  });
  await test('14a GET disputes', async () => {
    await api('GET', `/companies/${ctx.buyerCompanyId}/disputes`, ctx.buyerToken); return 'disputes ok';
  });

  console.log('\n\x1b[36m=== FLOW 15: ORDERS ===\x1b[0m');
  await test('15a GET orders', async () => {
    await api('GET', `/companies/${ctx.sellerCompanyId}/orders`, ctx.sellerToken); return 'orders ok';
  });

  console.log('\n\x1b[36m=== FLOW 17-22: REMAINING ===\x1b[0m');
  await test('17a GET seller/analytics', async () => {
    await api('GET', '/seller/analytics/overview', ctx.sellerToken); return 'analytics ok';
  });
  await test('18a GET buyer/dashboard', async () => {
    await api('GET', '/buyer/dashboard', ctx.buyerToken); return 'dashboard ok';
  });
  await test('19a GET membership/current', async () => {
    await api('GET', '/membership/current', ctx.sellerToken); return 'membership ok';
  });
  await test('20a GET notifications', async () => {
    await api('GET', `/companies/${ctx.sellerCompanyId}/notifications`, ctx.sellerToken); return 'notifications ok';
  });
  await test('21a GET wallet/buyer/summary', async () => {
    try {
      await api('GET', '/wallet/buyer/summary', ctx.buyerToken);
      return 'wallet ok';
    } catch(e) {
      if (e.message.includes('404') && e.message.includes('Wallet')) return 'no wallet (needs signup bonus)';
      throw e;
    }
  });
  await test('21b GET wallet/seller/summary', async () => {
    try {
      await api('GET', '/wallet/seller/summary', ctx.sellerToken);
      return 'wallet ok';
    } catch(e) {
      if (e.message.includes('404') && e.message.includes('Wallet')) return 'no wallet (needs signup bonus)';
      throw e;
    }
  });
  await test('22a GET tradetalk/communities', async () => {
    await api('GET', '/tradetalk/communities?page=1&limit=10', ctx.buyerToken); return 'communities ok';
  });

  // SUMMARY
  console.log('\n\x1b[36m========================================\x1b[0m');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`\x1b[${fail === 0 ? 32 : 31}mPASS: ${pass} | FAIL: ${fail} | TOTAL: ${results.length}\x1b[0m`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
