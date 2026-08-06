import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const BUYER = {
  email: process.env.E2E_BUYER_EMAIL || 'e2e-buyer@tradingo.com',
  password: process.env.E2E_BUYER_PASSWORD || 'TestBuyer@123',
  roleKey: 'buyer',
  identifier: process.env.E2E_BUYER_EMAIL || 'e2e-buyer@tradingo.com',
};
const SELLER = {
  email: process.env.E2E_SELLER_EMAIL || 'e2e-seller@tradingo.com',
  password: process.env.E2E_SELLER_PASSWORD || 'TestSeller@123',
  roleKey: 'vendor',
  identifier: 'AABCE1234E',
};
const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com',
  password: process.env.E2E_ADMIN_PASSWORD || 'TestAdmin@123',
  roleKey: 'admin',
  identifier: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tradingo.com',
};

const CACHE_FILE = path.join(os.tmpdir(), 'tradingo-e2e-auth.json');

export interface CachedAuth {
  accessToken: string;
  refreshToken: string;
  userRole: string;
}

export async function cachedAuthFor(roleKey: string): Promise<CachedAuth> {
  const cache = loadCache();
  const entry = cache[roleKey];
  if (!entry) {
    throw new Error(
      `No cached auth for role "${roleKey}". global-setup must run before tests (cache: ${CACHE_FILE})`,
    );
  }
  return entry;
}

export function authCacheFile(): string {
  return CACHE_FILE;
}

function loadCache(): Record<string, CachedAuth> {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

async function loginOnce(user: typeof BUYER): Promise<CachedAuth> {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Non-empty Authorization header short-circuits the CSRF preHandler
      // (fastify csrf-protection skips requests with an auth header).
      Authorization: 'Bearer e2e-preflight',
    },
    body: JSON.stringify({
      identifier: user.identifier,
      password: user.password,
      role: user.roleKey,
      rememberMe: true,
    }),
  });

  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    throw new Error(
      `global-setup login failed for ${user.roleKey}: ${loginRes.status} ${JSON.stringify(loginBody)}`,
    );
  }

  const data = loginBody.data || loginBody;
  const accessToken: string = data.accessToken;
  const refreshToken: string = data.refreshToken;
  if (!accessToken || !refreshToken) {
    throw new Error(`global-setup login for ${user.roleKey} returned no tokens: ${JSON.stringify(loginBody)}`);
  }

  const meRes = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meBody = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    throw new Error(
      `global-setup /users/me failed for ${user.roleKey}: ${meRes.status} ${JSON.stringify(meBody)}`,
    );
  }

  const meData = meBody.data || meBody;
  const userRole: string = meData.user?.role || user.roleKey;

  return { accessToken, refreshToken, userRole };
}

async function globalSetup(_config: FullConfig) {
  console.log('Starting E2E test suite...');
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`API URL: ${API_URL}`);

  const cache: Record<string, CachedAuth> = {};
  for (const user of [BUYER, SELLER, ADMIN]) {
    cache[user.roleKey] = await loginOnce(user);
    console.log(`global-setup: authenticated ${user.roleKey} (${user.email})`);
  }

  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`global-setup: auth cache written to ${CACHE_FILE}`);
}

export default globalSetup;
