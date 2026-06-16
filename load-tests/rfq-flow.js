import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const rfqCreateTrend = new Trend('rfq_create_time');
const rfqListTrend = new Trend('rfq_list_time');
const quoteSubmitTrend = new Trend('quote_submit_time');
const errorRate = new Rate('rfq_errors');

export const options = {
  thresholds: {
    rfq_errors: ['rate<0.03'],
    rfq_create_time: ['p(95)<3000'],
    quote_submit_time: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';

const SELLER_TOKEN = __ENV.SELLER_TOKEN || '';
const BUYER_TOKEN = __ENV.BUYER_TOKEN || '';

export default function () {
  const isBuyer = Math.random() > 0.5;

  if (isBuyer && BUYER_TOKEN) {
    group('buyer: create RFQ', () => {
      const payload = {
        productName: `Test Product ${__VU}-${__ITER}`,
        description: 'Load test RFQ',
        quantity: Math.floor(Math.random() * 1000) + 10,
        unit: 'kg',
        budget: Math.random() * 50000 + 1000,
        city: 'Mumbai',
      };

      const res = http.post(`${BASE_URL}/rfqs`, JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BUYER_TOKEN}`,
        },
      });

      rfqCreateTrend.add(res.timings.duration);
      errorRate.add(res.status !== 201);
      check(res, { 'rfq created': (r) => r.status === 201 });
    });
  }

  if (!isBuyer && SELLER_TOKEN) {
    group('seller: list RFQs', () => {
      const res = http.get(`${BASE_URL}/rfqs?status=open&page=1&limit=20`, {
        headers: { Authorization: `Bearer ${SELLER_TOKEN}` },
      });
      rfqListTrend.add(res.timings.duration);
      check(res, { 'rfq list ok': (r) => r.status === 200 });
    });

    group('seller: submit quote', () => {
      const rfqId = 'test-rfq-id';
      const payload = {
        amount: Math.random() * 40000 + 1000,
        deliveryDays: Math.floor(Math.random() * 30) + 5,
        validityDate: '2026-07-15',
        notes: 'Competitive pricing',
      };

      const res = http.post(`${BASE_URL}/rfqs/${rfqId}/quotes`, JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SELLER_TOKEN}`,
        },
      });

      quoteSubmitTrend.add(res.timings.duration);
      errorRate.add(res.status !== 201);
      check(res, { 'quote submitted': (r) => r.status === 201 });
    });
  }

  sleep(Math.random() * 4 + 2);
}
