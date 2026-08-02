// TRADINGO Comprehensive Stress Test — k6 v2.1.0
// Escalating load: 10 → 50 → 100 → 200 → 500 → 1000 VUs
// Finds breaking point and measures degradation
// Usage: k6 run ops/load-testing/comprehensive-stress-test.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const failures = new Rate('request_failures');

// Per-endpoint trends
const healthLatency = new Trend('health_latency');
const categoryLatency = new Trend('category_latency');
const searchLatency = new Trend('search_latency');
const productListLatency = new Trend('product_list_latency');
const errorRate = new Rate('error_rate');

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export const options = {
  stages: [
    { target: 10, duration: '1m' },
    { target: 50, duration: '2m' },
    { target: 100, duration: '2m' },
    { target: 200, duration: '3m' },
    { target: 500, duration: '3m' },
    { target: 1000, duration: '3m' },
    { target: 0, duration: '2m' },
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'],
    http_req_failed: ['rate<0.15'],
    request_failures: ['rate<0.10'],
  },
};

export default function () {
  const scenario = Math.random();

  // Health endpoint (lightest)
  if (scenario < 0.15) {
    const resp = http.get(`${BASE_URL}/health`);
    check(resp, { 'health 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(healthLatency, resp.timings.duration);
  }

  // Category listing
  if (scenario >= 0.15 && scenario < 0.35) {
    const resp = http.get(`${BASE_URL}/categories?limit=50`);
    check(resp, { 'categories 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(categoryLatency, resp.timings.duration);
  }

  // Product listing (DB-heavy)
  if (scenario >= 0.35 && scenario < 0.55) {
    const resp = http.get(`${BASE_URL}/products?limit=20`);
    check(resp, { 'products 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(productListLatency, resp.timings.duration);
  }

  // Product search
  if (scenario >= 0.55 && scenario < 0.75) {
    const terms = ['laptop', 'phone', 'machine', 'pump', 'valve', 'motor', 'gear', 'fabric'];
    const term = terms[Math.floor(Math.random() * terms.length)];
    const resp = http.get(`${BASE_URL}/products/search?q=${term}&limit=10`);
    check(resp, { 'search 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(searchLatency, resp.timings.duration);
  }

  // Industries
  if (scenario >= 0.75) {
    const resp = http.get(`${BASE_URL}/industries?limit=50`);
    check(resp, { 'industries 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
  }

  sleep(Math.random() * 1.5 + 0.3);
}

function recordLatency(trend, duration) {
  trend.add(duration);
}
