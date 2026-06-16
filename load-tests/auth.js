import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const loginTrend = new Trend('login_duration');
const refreshTrend = new Trend('token_refresh_duration');
const errorRate = new Rate('auth_errors');

export const options = {
  thresholds: {
    auth_errors: ['rate<0.05'],
    login_duration: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';

const users = [
  { email: 'seller1@test.com', password: 'Test@123', role: 'SELLER' },
  { email: 'buyer1@test.com', password: 'Test@123', role: 'BUYER' },
  { email: 'admin1@test.com', password: 'Test@123', role: 'ADMIN' },
];

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), { headers: { 'Content-Type': 'application/json' } });

  loginTrend.add(loginRes.timings.duration);
  errorRate.add(loginRes.status !== 200);

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
    'has refresh token': (r) => r.json('refreshToken') !== undefined,
  });

  if (loginRes.status === 200) {
    const accessToken = loginRes.json('accessToken');

    const meRes = http.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    check(meRes, {
      'profile fetch ok': (r) => r.status === 200,
      'correct role returned': (r) => r.json('user.role') === user.role,
    });

    const refreshRes = http.post(`${BASE_URL}/auth/refresh`, JSON.stringify({
      refreshToken: loginRes.json('refreshToken'),
    }), { headers: { 'Content-Type': 'application/json' } });

    refreshTrend.add(refreshRes.timings.duration);
    check(refreshRes, {
      'token refresh ok': (r) => r.status === 200,
      'new access token': (r) => r.json('accessToken') !== undefined,
    });
  }

  sleep(Math.random() * 3 + 1);
}
