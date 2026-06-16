import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const spikeErrorRate = new Rate('spike_errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 5000 },
    { duration: '2m', target: 10000 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 1000 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    spike_errors: ['rate<0.05'],
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const endpoints = [
  { url: '/', method: 'GET' },
  { url: '/products', method: 'GET' },
  { url: '/categories', method: 'GET' },
  { url: '/search?q=steel', method: 'GET' },
  { url: '/login', method: 'GET' },
  { url: '/trading', method: 'GET' },
  { url: '/api/auth/me', method: 'GET' },
];

export default function () {
  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const tags = { endpoint: ep.url, method: ep.method };

  const res = http.request(ep.method, `${BASE_URL}${ep.url}`, null, { tags });

  spikeErrorRate.add(res.status >= 500);

  check(res, {
    'status ok': (r) => r.status < 500,
    'response time ok': (r) => r.timings.duration < 8000,
  });

  sleep(Math.random() * 1);
}
