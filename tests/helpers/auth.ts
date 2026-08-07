import { Page } from '@playwright/test';
import { cachedAuthFor } from './global-setup';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  roleKey?: 'buyer' | 'vendor' | 'admin';
  identifier?: string;
}

export const BUYER_USER: TestUser = {
  email: process.env.E2E_BUYER_EMAIL || 'e2e-buyer@tradingo.com',
  password: process.env.E2E_BUYER_PASSWORD || 'TestBuyer@123',
  name: 'E2E Buyer',
  roleKey: 'buyer',
};

export const SELLER_USER: TestUser = {
  email: process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com',
  password: process.env.E2E_SELLER_PASSWORD || 'TestSeller@123',
  name: 'E2E Seller',
  roleKey: 'vendor',
  identifier: 'AABCE1234E',
};

export const ADMIN_USER: TestUser = {
  email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123',
  name: 'E2E Admin',
  roleKey: 'admin',
};

const ROLE_DASHBOARD: Record<string, string> = {
  buyer: '/buyer/dashboard',
  vendor: '/seller/dashboard',
  admin: '/admin/dashboard',
};

type InitScriptHandle = { dispose?: () => Promise<void> };

const initScripts = new WeakMap<Page, InitScriptHandle>();

function resolveRoleKey(user: TestUser): 'buyer' | 'vendor' | 'admin' {
  if (user.roleKey) return user.roleKey;
  if (user.email === ADMIN_USER.email) return 'admin';
  if (user.email === SELLER_USER.email) return 'vendor';
  return 'buyer';
}

/**
 * Authenticates by injecting pre-fetched tokens from global-setup into
 * localStorage (accessToken / refreshToken / userRole) before the app scripts
 * run. No UI login, no /auth/login call from tests — avoids the 5/min rate
 * limit on POST /auth/login.
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  const roleKey = resolveRoleKey(user);
  const auth = await cachedAuthFor(roleKey);

  // The Next.js proxy (middleware-utils.ts) verifies the accessToken COOKIE
  // server-side on every /seller|/buyer|/admin navigation. Cookies set from
  // page JS run too late (proxy already decided), so they must be attached at
  // the context level, where they are sent with the request.
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: auth.accessToken,
      url: 'http://localhost:3000',
      path: '/',
      sameSite: 'Lax',
    },
    {
      name: 'userRole',
      value: auth.userRole,
      url: 'http://localhost:3000',
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  // The SPA reads tokens from localStorage - keep injecting on every
  // navigation so client-side API calls carry the Authorization header.
  const script = (a: { accessToken: string; refreshToken: string; userRole: string }) => {
    localStorage.setItem('accessToken', a.accessToken);
    localStorage.setItem('refreshToken', a.refreshToken);
    localStorage.setItem('userRole', a.userRole);
    document.cookie = `userRole=${a.userRole}; path=/; max-age=86400; SameSite=Lax`;
  };

  const handle = (await page.addInitScript(script, auth)) as unknown as InitScriptHandle;
  initScripts.set(page, handle);

  await page.goto(ROLE_DASHBOARD[roleKey]);
  await page.waitForLoadState('load');

  // Fast self-check: the app must see the injected token or the dashboard will
  // bounce us back to /login.
  const got = await page.evaluate(() => localStorage.getItem('accessToken') ?? '');
  if (!got) {
    throw new Error(`loginAs(${roleKey}): accessToken not present in localStorage after navigation to ${ROLE_DASHBOARD[roleKey]}`);
  }
}

export async function logout(page: Page): Promise<void> {
  const handle = initScripts.get(page);
  if (handle) {
    try {
      await handle.dispose?.();
    } catch {
      // context may already be closed — ignore
    }
    initScripts.delete(page);
  }
  await page.goto('/login');
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}