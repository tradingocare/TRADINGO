// TRADINGO Auth Load Test — k6
// Tests authentication endpoints under concurrent load
// Usage: k6 run auth-load-test.js --env VUS=50
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { target: __ENV.VUS || 50, duration: '30s' },
    { target: __ENV.VUS || 50, duration: '2m' },
    { target: 0, duration: '30s' },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export default function () {
  // Login attempt
  const loginPayload = JSON.stringify({
    email: `loadtest${__VU}@tradingo.com`,
    password: 'TestLoad@123',
  });
  const login = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(login, { 'login responded': (r) => r.status < 500 });

  // Forgot password
  const forgotPayload = JSON.stringify({
    email: `loadtest${__VU}@tradingo.com`,
  });
  const forgot = http.post(`${BASE_URL}/auth/forgot-password`, forgotPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(forgot, { 'forgot password responded': (r) => r.status < 500 });

  sleep(3);
}
