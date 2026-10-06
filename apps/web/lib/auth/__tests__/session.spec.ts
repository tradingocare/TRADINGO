/**
 * R3 — Auth State Convergence: canonical session writer spec.
 * Proves: token write, userRole cookie write, 24h maxAge, cleanup,
 * idempotency, role-only refresh — with exact storage keys preserved.
 * Behavior-based (no module-internal spies): every assertion checks the
 * observable storage state after invoking the canonical writer.
 */

import { persistSession, persistSessionRole, clearSession } from '../session';
import { getAccessToken } from '@/lib/auth';

const cookieStore = {
  map: new Map<string, string>(),
  raw: new Map<string, string>(),
  get(): string {
    return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  },
  set(value: string) {
    const [pair] = value.split(';');
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1);
    if (value.includes('max-age=0')) {
      this.map.delete(name);
      this.raw.delete(name);
    } else {
      this.map.set(name, val);
      this.raw.set(name, value);
    }
  },
};

beforeAll(() => {
  Object.defineProperty(document, 'cookie', {
    get: cookieStore.get.bind(cookieStore),
    set: cookieStore.set.bind(cookieStore),
    configurable: true,
  });
});

beforeEach(() => {
  cookieStore.map.clear();
  cookieStore.raw.clear();
  window.localStorage.clear();
});

const user = { role: 'SELLER' };
const TOKEN_A = 'redacted-access-token-A';
const TOKEN_B = 'redacted-access-token-B';

describe('persistSession (auth-state write convergence)', () => {
  it('writes the token through the canonical lib/auth localStorage writer', () => {
    persistSession({ user, accessToken: TOKEN_A });
    expect(getAccessToken()).toBe(TOKEN_A);
    expect(localStorage.getItem('accessToken')).toBe(TOKEN_A);
  });

  it('writes userRole to localStorage under the existing key', () => {
    persistSession({ user, accessToken: TOKEN_A });
    expect(localStorage.getItem('userRole')).toBe('SELLER');
  });

  it('writes userRole + accessToken cookies with the founder-locked 24-hour maxAge', () => {
    persistSession({ user, accessToken: TOKEN_A });
    expect(cookieStore.map.get('userRole')).toBe('SELLER');
    expect(cookieStore.map.get('accessToken')).toBe(TOKEN_A);
    // Exact founder-locked lifetime on every auth cookie written:
    const rawWrites = [...cookieStore.raw.values()];
    expect(rawWrites.length).toBe(2);
    rawWrites.forEach((raw) => {
      expect(raw).toContain('max-age=86400'); // 24h = 86400s exactly
    });
  });

  it('preserves existing cookie policy attributes (path, SameSite=Lax)', () => {
    persistSession({ user, accessToken: TOKEN_A });
    [...cookieStore.raw.values()].forEach((raw) => {
      expect(raw).toContain('path=/');
      expect(raw).toContain('SameSite=Lax');
    });
  });

  it('is idempotent — repeated invocation writes the same values', () => {
    persistSession({ user, accessToken: TOKEN_A });
    persistSession({ user, accessToken: TOKEN_A });
    expect(cookieStore.map.get('userRole')).toBe('SELLER');
    expect(localStorage.getItem('accessToken')).toBe(TOKEN_A);
  });

  it('overwrites a previous session (re-login / token rotation)', () => {
    persistSession({ user, accessToken: TOKEN_A });
    persistSession({ user: { role: 'BUYER' }, accessToken: TOKEN_B });
    expect(cookieStore.map.get('userRole')).toBe('BUYER');
    expect(localStorage.getItem('accessToken')).toBe(TOKEN_B);
  });

  it('skips the accessToken cookie when explicitly disabled', () => {
    persistSession({ user, accessToken: TOKEN_A, persistAccessTokenCookie: false });
    expect(cookieStore.map.has('accessToken')).toBe(false);
    expect(localStorage.getItem('accessToken')).toBe(TOKEN_A);
  });

  it('is a no-op on the server (window undefined guard)', () => {
    const g = globalThis as Record<string, unknown>;
    const origWindow = g.window;
    g.window = undefined;
    expect(() => {
      persistSession({ user, accessToken: TOKEN_A });
      persistSessionRole('ADMIN');
      clearSession();
    }).not.toThrow();
    g.window = origWindow;
  });
});

describe('persistSessionRole (role synchronization)', () => {
  it('updates the userRole surfaces without touching the token', () => {
    localStorage.setItem('accessToken', TOKEN_A);
    persistSessionRole('ADMIN');
    expect(localStorage.getItem('userRole')).toBe('ADMIN');
    expect(cookieStore.map.get('userRole')).toBe('ADMIN');
    expect(localStorage.getItem('accessToken')).toBe(TOKEN_A); // token untouched
  });
});

describe('clearSession (cleanup convergence)', () => {
  it('removes tokens via the existing clearTokens writer', () => {
    localStorage.setItem('accessToken', TOKEN_A);
    localStorage.setItem('refreshToken', 'redacted-refresh-token');
    clearSession();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('removes userRole + rememberMe from localStorage', () => {
    localStorage.setItem('userRole', 'SELLER');
    localStorage.setItem('rememberMe', 'true');
    clearSession();
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(localStorage.getItem('rememberMe')).toBeNull();
  });

  it('expires the userRole + accessToken cookies (max-age=0) — fixes stale-cookie logout', () => {
    persistSession({ user, accessToken: TOKEN_A });
    expect(cookieStore.map.has('userRole')).toBe(true);
    expect(cookieStore.map.has('accessToken')).toBe(true);
    clearSession();
    expect(cookieStore.map.has('userRole')).toBe(false);
    expect(cookieStore.map.has('accessToken')).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('is safe to invoke repeatedly (idempotent cleanup)', () => {
    clearSession();
    clearSession();
    expect(cookieStore.map.size).toBe(0);
  });
});

describe('convergence invariants (storage policy)', () => {
  it('uses exactly the existing key/cookie names — no renames, no new mediums', () => {
    persistSession({ user, accessToken: TOKEN_A });
    expect(localStorage.getItem('userRole')).toBe('SELLER');
    expect([...cookieStore.map.keys()].sort()).toEqual(['accessToken', 'userRole']);
    // no sessionStorage usage anywhere:
    expect(sessionStorage.length).toBe(0);
  });

  it('never adds a new token copy — one localStorage key, pre-existing cookie hint', () => {
    persistSession({ user, accessToken: TOKEN_A });
    // The only persisted token surfaces are the canonical localStorage key
    // and the pre-existing routing cookie written by every login site pre-R3.
    expect([...cookieStore.map.keys()].sort()).toEqual(['accessToken', 'userRole']);
  });
});
