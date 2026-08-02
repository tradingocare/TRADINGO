// TRADINGO Stress Test — k6
// Finds the breaking point of the API under escalating load
// Usage: k6 run stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { target: 50, duration: '2m' },
    { target: 100, duration: '2m' },
    { target: 200, duration: '2m' },
    { target: 500, duration: '3m' },
    { target: 1000, duration: '3m' },
    { target: 0, duration: '2m' },
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export default function () {
  const endpoints = [
    `${BASE_URL}/health`,
    `${BASE_URL}/live`,
    `${BASE_URL}/ready`,
    `${BASE_URL}/categories`,
    `${BASE_URL}/industries`,
    `${BASE_URL}/products?limit=20`,
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const resp = http.get(endpoint);
  check(resp, { 'endpoint ok': (r) => r.status < 500 });

  sleep(Math.random() * 2 + 0.5);
}
