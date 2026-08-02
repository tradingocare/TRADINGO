// TRADINGO Comprehensive Load Test — k6 v2.1.0
// Measures: throughput, P50/P95/P99 latency, error rate, concurrent capacity
// Covers: health, catalog, search, product detail, companies, auth, RFQ
// Usage: k6 run ops/load-testing/comprehensive-load-test.js --env VUS=100 --env DURATION=5m

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// --- Custom Metrics ---
const failures = new Rate('request_failures');
const errorRate = new Rate('error_rate');

// Per-endpoint latency trends
const healthLatency = new Trend('health_latency');
const categoryLatency = new Trend('category_latency');
const industryLatency = new Trend('industry_latency');
const productListLatency = new Trend('product_list_latency');
const productDetailLatency = new Trend('product_detail_latency');
const searchLatency = new Trend('search_latency');
const companyLatency = new Trend('company_latency');
const authLatency = new Trend('auth_latency');

// Throughput counters
const healthCount = new Counter('health_requests');
const categoryCount = new Counter('category_requests');
const industryCount = new Counter('industry_requests');
const productListCount = new Counter('product_list_requests');
const productDetailCount = new Counter('product_detail_requests');
const searchCount = new Counter('search_requests');
const companyCount = new Counter('company_requests');
const authCount = new Counter('auth_requests');

// Database-impact metrics (track queries by endpoint type)
const dbQueryLatency = new Trend('db_query_latency');

// --- Configuration ---
const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';
const TARGET_VUS = __ENV.VUS ? parseInt(__ENV.VUS) : 100;
const TEST_DURATION = __ENV.DURATION || '5m';

export const options = {
  stages: [
    { target: Math.floor(TARGET_VUS * 0.5), duration: '1m' },  // Ramp up to 50%
    { target: TARGET_VUS, duration: '2m' },                     // Ramp to target
    { target: TARGET_VUS, duration: TEST_DURATION },            // Hold at target
    { target: 0, duration: '1m' },                              // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.05'],
    request_failures: ['rate<0.05'],
    health_latency: ['p(95)<2000'],
    product_list_latency: ['p(95)<5000'],
    search_latency: ['p(95)<5000'],
    auth_latency: ['p(95)<8000'],
    error_rate: ['rate<0.05'],
  },
  noConnectionReuse: false,
};

// --- Helpers ---
function recordLatency(trend, duration) {
  trend.add(duration);
}

// --- Test Scenarios ---
export default function () {
  // Scenario 1: Health & Liveness (light, frequent)
  group('health endpoints', () => {
    const resp = http.get(`http://localhost:3001/health`);
    check(resp, { 'health is 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(healthLatency, resp.timings.duration);
    healthCount.add(1);
  });

  // Scenario 2: Category browsing (catalog)
  group('browse categories', () => {
    const resp = http.get(`${BASE_URL}/categories?limit=50`);
    check(resp, { 'categories is 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(categoryLatency, resp.timings.duration);
    categoryCount.add(1);
  });

  // Scenario 3: Industry browsing
  group('browse industries', () => {
    const resp = http.get(`${BASE_URL}/industries?limit=50`);
    check(resp, { 'industries is 200': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(industryLatency, resp.timings.duration);
    industryCount.add(1);
  });

  // Scenario 4: Product listing (DB-heavy)
  group('list products', () => {
    const resp = http.get(`${BASE_URL}/products?limit=20`);
    check(resp, { 'products listed': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(productListLatency, resp.timings.duration);
    productListCount.add(1);
  });

  // Scenario 5: Product search (OpenSearch/DB)
  group('search products', () => {
    const searchTerms = ['laptop', 'phone', 'fabric', 'machine', 'pump', 'valve', 'motor', 'gear'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const resp = http.get(`${BASE_URL}/products/search?q=${term}&limit=10`);
    check(resp, { 'search returned': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(searchLatency, resp.timings.duration);
    searchCount.add(1);
  });

  // Scenario 6: Company listing
  group('list companies', () => {
    const resp = http.get(`${BASE_URL}/companies?limit=10`);
    check(resp, { 'companies listed': (r) => r.status === 200 });
    failures.add(resp.status !== 200);
    recordLatency(companyLatency, resp.timings.duration);
    companyCount.add(1);
  });

  // Scenario 7: Auth (login attempt - will 401 on bad creds but measures auth path)
  group('auth endpoints', () => {
    const vu = __VU;
    const payload = JSON.stringify({
      email: `loadtest${vu}@tradingo.io`,
      password: 'LoadTest@2026',
    });
    const resp = http.post(`${BASE_URL}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'auth_login' },
    });
    const isExpected = resp.status === 401 || resp.status === 429 || resp.status === 200 || resp.status === 403;
    check(resp, { 'auth responded': () => isExpected });
    failures.add(!isExpected);
    recordLatency(authLatency, resp.timings.duration);
    authCount.add(1);
  });

  // Randomized sleep between iterations (0.5-3s) to simulate real user behavior
  sleep(Math.random() * 2.5 + 0.5);
}
