import { test, expect, request, APIRequestContext } from '@playwright/test';
import { cachedAuthFor } from '../helpers/global-setup';

/**
 * Tier-B/C purchase journeys — server contract half.
 *
 * Proves, against the live API with zero mocks, that the subscription
 * gateway order derives its charge exclusively from the persisted plan
 * row (tier column x duration): the request carries planId/planTier/
 * duration/gateway and NO amount, and the server-created order amount
 * equals the canonical calculation read back from the plans endpoint
 * (never a hardcoded price table).
 *
 * Tier-B = 2-year term on Trade Smart; Tier-C = 3-year term on Trade Plus.
 * Activation/verify paths are covered by existing unit contract tests;
 * completing a real Razorpay payment is out of scope (no real money).
 * If the environment has no Razorpay test credentials the gateway client
 * is uninitialized and these tests skip with an explicit reason instead
 * of failing on infrastructure.
 *
 * Requires the local E2E stack (API :3001 + seeded DB with plans; the
 * committed e2e-seed plants the six locked plans). No production use.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

let api: APIRequestContext;
let sellerToken = '';

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: API_URL });
  const auth = await cachedAuthFor('vendor');
  sellerToken = auth.accessToken;
});

test.afterAll(async () => {
  await api.dispose();
});

interface PlanRow {
  planId: string;
  pricePlanA: number;
  pricePlanB: number;
  pricePlanC: number;
}

async function livePlans(): Promise<PlanRow[]> {
  const res = await api.get('/membership/plans');
  expect(res.status()).toBe(200);
  const body = await res.json();
  const list = (body.data || body) as PlanRow[];
  expect(Array.isArray(list)).toBe(true);
  return list;
}

async function postGatewayOrder(dto: Record<string, unknown>) {
  const res = await api.post('/payment/razorpay/order', {
    headers: { Authorization: `Bearer ${sellerToken}` },
    data: dto,
  });
  if (res.status() === 500) {
    const text = await res.text().catch(() => '');
    if (/not initialized/i.test(text)) {
      test.skip(true, 'Razorpay test credentials not configured in this environment (gateway client uninitialized)');
    }
  }
  return res;
}

test.describe('Tier-B/C gateway order contracts (live server calculation)', () => {
  test('Tier-B: Trade Smart 2-year charge equals pricePlanB x 2 with no client amount', async () => {
    const plans = await livePlans();
    const smart = plans.find((p) => p.planId === 'trade_smart');
    expect(smart).toBeDefined();
    const expectedPaise = smart!.pricePlanB * 2 * 100;

    // The request carries identity + term only — amount cannot be supplied.
    const dto = { planId: 'trade_smart', planTier: 'B', duration: 2, gateway: 'RAZORPAY' };
    expect(dto).not.toHaveProperty('amount');

    const res = await postGatewayOrder(dto);
    expect(res.status()).toBe(201);
    const body = await res.json();
    const order = body.data || body;
    expect(order.amount).toBe(expectedPaise);
    expect(order.currency).toBe('INR');
    expect(typeof order.gatewayOrderId).toBe('string');
  });

  test('Tier-C: Trade Plus 3-year charge equals pricePlanC x 3 with no client amount', async () => {
    const plans = await livePlans();
    const plus = plans.find((p) => p.planId === 'trade_plus');
    expect(plus).toBeDefined();
    const expectedPaise = plus!.pricePlanC * 3 * 100;

    const dto = { planId: 'trade_plus', planTier: 'C', duration: 3, gateway: 'RAZORPAY' };
    expect(dto).not.toHaveProperty('amount');

    const res = await postGatewayOrder(dto);
    expect(res.status()).toBe(201);
    const body = await res.json();
    const order = body.data || body;
    expect(order.amount).toBe(expectedPaise);
    expect(order.currency).toBe('INR');
    expect(typeof order.gatewayOrderId).toBe('string');
  });

  test('repeat gateway order reuses the pending payment (no duplicate charge)', async () => {
    const dto = { planId: 'trade_smart', planTier: 'B', duration: 2, gateway: 'RAZORPAY' };
    const first = await postGatewayOrder(dto);
    expect(first.status()).toBe(201);
    const second = await postGatewayOrder(dto);
    expect(second.status()).toBe(201);
    const firstBody = await first.json();
    const secondBody = await second.json();
    const firstOrder = firstBody.data || firstBody;
    const secondOrder = secondBody.data || secondBody;
    expect(secondOrder.gatewayOrderId).toBe(firstOrder.gatewayOrderId);
  });
});
