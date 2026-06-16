import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const productLoadTrend = new Trend('product_load_time');
const searchTrend = new Trend('search_response_time');
const categoryTrend = new Trend('category_load_time');
const errorRate = new Rate('marketplace_errors');

export const options = {
  thresholds: {
    marketplace_errors: ['rate<0.02'],
    product_load_time: ['p(95)<2000'],
    search_response_time: ['p(95)<1500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  group('browse products', () => {
    const prodRes = http.get(`${BASE_URL}/products`, {
      tags: { page: 'products' },
    });
    productLoadTrend.add(prodRes.timings.duration);
    errorRate.add(prodRes.status !== 200);
    check(prodRes, { 'products page ok': (r) => r.status === 200 });
  });

  group('search products', () => {
    const queries = ['steel', 'iron', 'copper', 'aluminum', 'zinc'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const searchRes = http.get(`${BASE_URL}/search?q=${q}&page=1&limit=20`);
    searchTrend.add(searchRes.timings.duration);
    errorRate.add(searchRes.status !== 200);
    check(searchRes, { 'search results ok': (r) => r.status === 200 });
  });

  group('browse categories', () => {
    const catRes = http.get(`${BASE_URL}/categories`);
    categoryTrend.add(catRes.timings.duration);
    errorRate.add(catRes.status !== 200);
    check(catRes, { 'categories ok': (r) => r.status === 200 });
  });

  group('view product detail', () => {
    const slugs = ['steel-bars-101', 'copper-wire-202', 'aluminum-sheets-303'];
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    const detailRes = http.get(`${BASE_URL}/products/${slug}`);
    check(detailRes, { 'product detail ok': (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 0.5);
}
