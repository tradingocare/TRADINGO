import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('stress_errors');
const responseTime = new Trend('stress_response_time');

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '5m', target: 2000 },
    { duration: '2m', target: 5000 },
    { duration: '5m', target: 5000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    stress_errors: ['rate<0.08'],
    stress_response_time: ['p(95)<10000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const path = [
    '/products',
    '/categories',
    '/search?q=steel',
    '/trading',
    '/for-sellers',
    '/for-buyers',
  ][Math.floor(Math.random() * 6)];

  const res = http.get(`${BASE_URL}${path}`, {
    tags: { path, stress: 'true' },
  });

  responseTime.add(res.timings.duration);
  errorRate.add(res.status >= 500);

  check(res, {
    'status < 500': (r) => r.status < 500,
    'duration < 10s': (r) => r.timings.duration < 10000,
  });

  sleep(Math.random() * 0.5 + 0.1);
}
