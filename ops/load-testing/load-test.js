// TRADINGO Load Test — k6
// Simulates 100/500 concurrent users executing typical buyer marketplace flows
// Usage: k6 run load-test.js --env VUS=100 --env DURATION=5m
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const failures = new Rate('request_failures');
const apiLatency = new Trend('api_latency');

export const options = {
  stages: [
    { target: __ENV.VUS || 100, duration: '1m' },
    { target: __ENV.VUS || 100, duration: '3m' },
    { target: 0, duration: '1m' },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    request_failures: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export default function () {
  group('browse marketplace', () => {
    const categories = http.get(`${BASE_URL}/categories`).json();
    failures.add(categories.status !== 200);
    apiLatency.add(categories.timings.duration);
    check(categories, { 'categories loaded': (r) => r.status === 200 });

    const categorySlug = categories.body?.[0]?.slug || 'electronics';
    const products = http.get(`${BASE_URL}/products?category=${categorySlug}&limit=20`);
    failures.add(products.status !== 200);
    apiLatency.add(products.timings.duration);
    check(products, { 'products loaded': (r) => r.status === 200 });

    sleep(1);
  });

  group('search', () => {
    const search = http.get(`${BASE_URL}/products/search?q=laptop&limit=10`);
    failures.add(search.status !== 200);
    check(search, { 'search results': (r) => r.status === 200 });

    const supplierSearch = http.get(`${BASE_URL}/companies?search=supplier&limit=10`);
    failures.add(supplierSearch.status !== 200);
    check(supplierSearch, { 'supplier search': (r) => r.status === 200 });

    sleep(2);
  });

  group('view product detail', () => {
    const productResp = http.get(`${BASE_URL}/products?limit=1`);
    if (productResp.status === 200) {
      const productId = productResp.body?.[0]?.id || '1';
      const detail = http.get(`${BASE_URL}/products/${productId}`);
      failures.add(detail.status !== 200);
      check(detail, { 'product detail': (r) => r.status === 200 });
    }
    sleep(1);
  });
}
