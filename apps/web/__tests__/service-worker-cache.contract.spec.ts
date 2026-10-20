import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Service Worker cache/offline behaviour contract.
 *
 * These assertions exercise the real `apps/web/public/sw.js` source in a
 * sandboxed runtime (mocked `self` / `caches` / `fetch`), so they verify the
 * shipped logic rather than a restatement of it.
 *
 * Invariants covered:
 *  - a single current cache name, with every older cache evicted on activate
 *  - `/_next/static/**` served from cache ONLY when the cached response is
 *    explicitly immutable; otherwise the network is used and the cache updated
 *  - HTML navigations are network-first, falling back to the cached page and
 *    then to the offline page
 *  - brand assets (/logo/, /icons/) stay cache-first
 *  - cross-origin requests are never intercepted
 */

const cwd = process.cwd();
const web = existsSync(join(cwd, 'app', 'page.tsx')) ? cwd : join(cwd, 'apps', 'web');
const source = readFileSync(join(web, 'public', 'sw.js'), 'utf8');

const ORIGIN = 'https://tradingo.test';

type Listener = (event: any) => void;

interface Harness {
  listeners: Record<string, Listener>;
  caches: Map<string, Map<string, any>>;
  cachesMock: any;
  deleted: string[];
  opened: string[];
  fetchMock: jest.Mock;
  cacheNames(): string[];
}

function makeCache(name: string, store: Map<string, Map<string, any>>) {
  const key = (r: any) => (typeof r === 'string' ? r : r.url);
  return {
    addAll: jest.fn(async (urls: string[]) => {
      const m = store.get(name)!;
      urls.forEach((u) => m.set(u, { url: u, ok: true, type: 'basic' }));
    }),
    put: jest.fn(async (req: any, res: any) => {
      const m = store.get(name)!;
      m.set(key(req), res);
    }),
    match: jest.fn(async (req: any) => store.get(name)!.get(key(req))),
    keys: jest.fn(async () => Array.from(store.get(name)!.keys())),
  };
}

function load(): Harness {
  const listeners: Record<string, Listener> = {};
  const caches = new Map<string, Map<string, any>>();
  const deleted: string[] = [];
  const opened: string[] = [];
  const fetchMock = jest.fn();

  const cachesMock: any = {
    open: jest.fn(async (name: string) => {
      opened.push(name);
      if (!caches.has(name)) caches.set(name, new Map());
      return makeCache(name, caches);
    }),
    keys: jest.fn(async () => Array.from(caches.keys())),
    delete: jest.fn(async (name: string) => {
      deleted.push(name);
      return caches.delete(name);
    }),
    match: jest.fn(async (req: any) => {
      const key = typeof req === 'string' ? req : req.url;
      for (const m of caches.values()) {
        const hit = m.get(key);
        if (hit) return hit;
      }
      return undefined;
    }),
  };

  const selfMock: any = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, handler: Listener) => {
      listeners[type] = handler;
    },
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
    registration: { showNotification: jest.fn() },
  };

  // eslint-disable-next-line no-new-func
  const run = new Function('self', 'caches', 'fetch', 'Response', 'URL', source);
  const ResponseStub =
    typeof Response !== 'undefined'
      ? Response
      : class {
          constructor(public body?: unknown, public init?: unknown) {}
        };
  run(selfMock, cachesMock, fetchMock, ResponseStub, URL);

  return {
    listeners,
    caches,
    cachesMock,
    deleted,
    opened,
    fetchMock,
    cacheNames: () => Array.from(caches.keys()),
  };
}

function makeEvent(extra: Record<string, any> = {}) {
  let responded: any = null;
  let respondedSet = false;
  return {
    request: undefined as any,
    waitUntil: (p: any) => p,
    respondWith: (p: any) => {
      responded = p;
      respondedSet = true;
    },
    get responded() {
      return responded;
    },
    get respondedSet() {
      return respondedSet;
    },
    ...extra,
  };
}

const navRequest = (url: string) => ({
  url,
  method: 'GET',
  mode: 'navigate',
  headers: { get: () => null },
});

const assetRequest = (url: string) => ({
  url,
  method: 'GET',
  mode: 'no-cors',
  headers: { get: () => null },
});

describe('service worker cache and offline contract', () => {
  it('uses a single current cache name', () => {
    expect(source).toMatch(/const CACHE_NAME = 'tradingo-v9';/);
  });

  it('installs the static brand assets and the offline page into the current cache', async () => {
    const h = load();
    const event = makeEvent();
    h.listeners['install'](event);
    await event.waitUntil(Promise.resolve());
    await new Promise((r) => setTimeout(r, 0));

    const cached = Array.from(h.caches.get('tradingo-v9')!.keys());
    expect(cached).toEqual(
      expect.arrayContaining([
        '/offline',
        '/logo/trdn5.png',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ]),
    );
  });

  it('evicts every older cache on activate, keeping only the current one', async () => {
    const h = load();
    h.caches.set('tradingo-v8', new Map());
    h.caches.set('tradingo-v7', new Map());
    h.caches.set('tradingo-v9', new Map());

    const event = makeEvent();
    h.listeners['activate'](event);
    await new Promise((r) => setTimeout(r, 0));

    expect(h.deleted).toEqual(expect.arrayContaining(['tradingo-v8', 'tradingo-v7']));
    expect(h.deleted).not.toContain('tradingo-v9');
  });

  it('serves an immutable build chunk from cache', async () => {
    const h = load();
    const req = assetRequest(`${ORIGIN}/_next/static/chunks/a.js`);
    const immutable = {
      url: req.url,
      headers: { get: (n: string) => (n === 'cache-control' ? 'public, max-age=31536000, immutable' : null) },
    };
    await h.cachesMock.open('tradingo-v9');
    h.caches.get('tradingo-v9')!.set(req.url, immutable);

    const event = makeEvent({ request: req });
    h.listeners['fetch'](event);
    const result = await event.responded;

    expect(result).toBe(immutable);
    expect(h.fetchMock).not.toHaveBeenCalled();
  });

  it('revalidates a non-immutable build asset over the network instead of serving it stale', async () => {
    const h = load();
    const req = assetRequest(`${ORIGIN}/_next/static/css/app.css`);
    const stale = {
      url: req.url,
      headers: { get: (n: string) => (n === 'cache-control' ? 'no-cache, must-revalidate' : null) },
    };
    await h.cachesMock.open('tradingo-v9');
    h.caches.get('tradingo-v9')!.set(req.url, stale);

    const fresh = { ok: true, type: 'basic', clone: () => fresh };
    h.fetchMock.mockResolvedValue(fresh);

    const event = makeEvent({ request: req });
    h.listeners['fetch'](event);
    const result = await event.responded;

    expect(h.fetchMock).toHaveBeenCalled();
    expect(result).toBe(fresh);
    expect(result).not.toBe(stale);
  });

  it('serves navigations from the network first and caches a successful response', async () => {
    const h = load();
    const req = navRequest(`${ORIGIN}/product`);
    const fresh = { ok: true, type: 'basic', clone: () => fresh };
    h.fetchMock.mockResolvedValue(fresh);

    const event = makeEvent({ request: req });
    h.listeners['fetch'](event);
    const result = await event.responded;

    expect(h.fetchMock).toHaveBeenCalledWith(req);
    expect(result).toBe(fresh);
  });

  it('falls back to the offline page when a navigation fails while offline', async () => {
    const h = load();
    const req = navRequest(`${ORIGIN}/product`);
    h.fetchMock.mockRejectedValue(new Error('offline'));

    const offline = { url: `${ORIGIN}/offline`, ok: true, headers: { get: () => null } };
    await h.cachesMock.open('tradingo-v9');
    h.caches.get('tradingo-v9')!.set('/offline', offline);

    const event = makeEvent({ request: req });
    h.listeners['fetch'](event);
    const result = await event.responded;

    expect(h.fetchMock).toHaveBeenCalled();
    expect(result).toBe(offline);
  });

  it('keeps brand assets cache-first', async () => {
    const h = load();
    const req = assetRequest(`${ORIGIN}/logo/trdn5.png`);
    const cached = { url: req.url, headers: { get: () => null } };
    await h.cachesMock.open('tradingo-v9');
    h.caches.get('tradingo-v9')!.set(req.url, cached);

    const event = makeEvent({ request: req });
    h.listeners['fetch'](event);
    const result = await event.responded;

    expect(result).toBe(cached);
    expect(h.fetchMock).not.toHaveBeenCalled();
  });

  it('never intercepts cross-origin requests', () => {
    const h = load();
    const req = assetRequest('https://api.example.test/v1/health');
    const event = makeEvent({ request: req });
    h.listeners['fetch'](event);
    expect(event.respondedSet).toBe(false);
  });
});
