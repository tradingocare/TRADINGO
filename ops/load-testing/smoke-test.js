// TRADINGO Smoke Test — k6
// Validates that critical endpoints respond correctly under minimal load
// Usage: k6 run smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export default function () {
  // Health check
  const healthResp = http.get(`${BASE_URL}/health`);
  check(healthResp, {
    'health status is 200': (r) => r.status === 200,
    'health response body': (r) => r.body.includes('status'),
  });

  // Liveness
  const liveResp = http.get(`${BASE_URL}/live`);
  check(liveResp, {
    'liveness is 200': (r) => r.status === 200,
  });

  // Readiness
  const readyResp = http.get(`${BASE_URL}/ready`);
  check(readyResp, {
    'readiness is 200': (r) => r.status === 200,
  });

  // Public categories
  const categoriesResp = http.get(`${BASE_URL}/categories`);
  check(categoriesResp, {
    'categories is 200': (r) => r.status === 200,
  });

  // Public industries
  const industriesResp = http.get(`${BASE_URL}/industries`);
  check(industriesResp, {
    'industries is 200': (r) => r.status === 200,
  });

  sleep(1);
}
