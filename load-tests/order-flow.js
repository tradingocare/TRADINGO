import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const orderCreateTrend = new Trend('order_create_time');
const orderListTrend = new Trend('order_list_time');
const orderUpdateTrend = new Trend('order_status_update_time');
const paymentTrend = new Trend('payment_init_time');
const disputeTrend = new Trend('dispute_create_time');
const errorRate = new Rate('order_errors');

export const options = {
  thresholds: {
    order_errors: ['rate<0.03'],
    order_create_time: ['p(95)<3000'],
    payment_init_time: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';
const BUYER_TOKEN = __ENV.BUYER_TOKEN || '';
const SELLER_TOKEN = __ENV.SELLER_TOKEN || '';

export default function () {
  const role = Math.random();

  if (role < 0.4 && BUYER_TOKEN) {
    group('buyer: create order', () => {
      const res = http.post(`${BASE_URL}/orders`, JSON.stringify({
        quoteId: `quote-${Math.floor(Math.random() * 500) + 1}`,
        quantity: Math.floor(Math.random() * 100) + 1,
        shippingAddress: '123 Trade St, Mumbai',
      }), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BUYER_TOKEN}`,
        },
      });

      orderCreateTrend.add(res.timings.duration);
      errorRate.add(res.status !== 201);
      check(res, { 'order created': (r) => r.status === 201 });
    });

    group('buyer: initiate payment', () => {
      const res = http.post(`${BASE_URL}/payments/initiate`, JSON.stringify({
        orderId: `order-${Math.floor(Math.random() * 500) + 1}`,
        method: 'razorpay',
      }), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BUYER_TOKEN}`,
        },
      });

      paymentTrend.add(res.timings.duration);
      check(res, { 'payment initiated': (r) => r.status === 200 || r.status === 201 });
    });
  }

  if (role >= 0.4 && role < 0.7 && SELLER_TOKEN) {
    group('seller: list orders', () => {
      const res = http.get(`${BASE_URL}/orders?seller=true&page=1&limit=20`, {
        headers: { Authorization: `Bearer ${SELLER_TOKEN}` },
      });
      orderListTrend.add(res.timings.duration);
      check(res, { 'orders listed': (r) => r.status === 200 });
    });

    group('seller: update order status', () => {
      const res = http.patch(`${BASE_URL}/orders/order-${Math.floor(Math.random() * 500) + 1}`, JSON.stringify({
        status: 'confirmed',
      }), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SELLER_TOKEN}`,
        },
      });

      orderUpdateTrend.add(res.timings.duration);
      check(res, { 'order updated': (r) => r.status === 200 });
    });
  }

  if (role >= 0.7) {
    group('create dispute', () => {
      const res = http.post(`${BASE_URL}/disputes`, JSON.stringify({
        orderId: `order-${Math.floor(Math.random() * 500) + 1}`,
        reason: 'Quality issue',
        description: 'Products do not match specification',
      }), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Math.random() > 0.5 ? BUYER_TOKEN : SELLER_TOKEN}`,
        },
      });

      disputeTrend.add(res.timings.duration);
      check(res, { 'dispute created': (r) => r.status === 201 });
    });
  }

  sleep(Math.random() * 3 + 1);
}
