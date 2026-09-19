/**
 * TEMPORARY CI-04D diagnostic-only network forensics.
 *
 * Attaches redacted request/response observers to a Playwright page and
 * flushes one JSON file per page to `forensics/` when the page closes.
 *
 * SAFETY CONTRACT (do not weaken without founder approval):
 * - NEVER reads Authorization headers, cookies, tokens, or passwords.
 * - NEVER reads request bodies (the login POST body carries credentials).
 * - Response bodies are read ONLY for the non-auth target endpoints below,
 *   capped at 32 KB, and reduced to safe metadata (top-level keys, array
 *   lengths, totals, first-item slug). Auth endpoints contribute status
 *   and timing only.
 * - Console/page errors are truncated and capped.
 *
 * Revert together with the CI-04D workflow instrumentation once the
 * authenticated empty-UI root cause is proven.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Page, Request, Response } from '@playwright/test';

const TARGET_ENDPOINTS = [
  '/api/v1/search/products',
  '/api/v1/product-locations/seller',
  '/api/v1/companies/my-company',
  '/api/v1/categories',
];

const OUT_DIR = 'forensics';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_ENTRIES = 500;
const MAX_CONSOLE = 30;
const MAX_TEXT = 300;

let fileCounter = 0;

interface TargetEntry {
  endpoint: string;
  method: string;
  status: number | null;
  durationMs: number | null;
  failureReason: string | null;
  resourceType: string;
  responseMeta: Record<string, unknown> | null;
}

interface FailedRequest {
  method: string;
  path: string;
  resourceType: string;
  failureReason: string;
}

interface ForensicsReport {
  label: string;
  startedAt: string;
  finishedAt: string;
  totals: { requests: number; failed: number };
  targets: TargetEntry[];
  failedRequests: FailedRequest[];
  consoleErrors: string[];
  pageErrors: string[];
}

function endpointOf(url: string): string | null {
  try {
    const pathOnly = new URL(url).pathname;
    return TARGET_ENDPOINTS.find((t) => pathOnly === t || pathOnly.startsWith(t + '/')) ?? null;
  } catch {
    return null;
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.slice(0, 120);
  }
}

function summarizeJson(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return { isArray: true, length: parsed.length };
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const meta: Record<string, unknown> = { topKeys: Object.keys(obj).slice(0, 20) };
      for (const key of ['results', 'hits', 'data', 'items']) {
        const val = obj[key];
        if (Array.isArray(val)) {
          meta[`${key}Length`] = val.length;
          const first = val[0] as Record<string, unknown> | undefined;
          if (first && typeof first === 'object') {
            if (typeof first.slug === 'string') meta.firstSlug = first.slug;
            if (typeof first.name === 'string') meta.firstName = String(first.name).slice(0, 120);
          }
        }
      }
      if (typeof obj.total === 'number') meta.total = obj.total;
      const metaObj = (obj.meta ?? obj.pagination) as Record<string, unknown> | undefined;
      if (metaObj && typeof metaObj === 'object' && typeof metaObj.total === 'number') {
        meta.pageTotal = metaObj.total;
      }
      return meta;
    }
    return { scalar: true };
  } catch {
    return null;
  }
}

function sanitizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9-_]+/g, '_').slice(0, 80) || 'page';
}

/**
 * Attach redacted network observers. Safe to call once per page; test
 * assertions and application behavior are untouched.
 */
export function attachNetworkForensics(page: Page, label: string): void {
  const startedAt = new Date().toISOString();
  const started = new Map<Request, number>();
  let requestCount = 0;
  let failedCount = 0;
  const targets: TargetEntry[] = [];
  const failedRequests: FailedRequest[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  let flushed = false;

  const flush = () => {
    if (flushed) return;
    flushed = true;
    const report: ForensicsReport = {
      label,
      startedAt,
      finishedAt: new Date().toISOString(),
      totals: { requests: requestCount, failed: failedCount },
      targets: targets.slice(0, MAX_ENTRIES),
      failedRequests: failedRequests.slice(0, MAX_ENTRIES),
      consoleErrors: consoleErrors.slice(0, MAX_CONSOLE),
      pageErrors: pageErrors.slice(0, MAX_CONSOLE),
    };
    try {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fileCounter += 1;
      const file = path.join(OUT_DIR, `${sanitizeLabel(label)}-${process.pid}-${fileCounter}.json`);
      fs.writeFileSync(file, JSON.stringify(report, null, 2));
    } catch {
      // Forensics must never fail a test.
    }
  };

  page.on('request', (req) => {
    requestCount += 1;
    started.set(req, Date.now());
  });

  page.on('response', (res: Response) => {
    const req = res.request();
    const start = started.get(req);
    started.delete(req);
    const durationMs = start != null ? Date.now() - start : null;
    const endpoint = endpointOf(req.url());
    if (!endpoint) return;
    const entry: TargetEntry = {
      endpoint,
      method: req.method(),
      status: res.status(),
      durationMs,
      failureReason: null,
      resourceType: req.resourceType(),
      responseMeta: null,
    };
    targets.push(entry);
    if (targets.length > MAX_ENTRIES) return;
    const contentType = (res.headers()['content-type'] || '').toLowerCase();
    if (!contentType.includes('json')) return;
    res
      .text()
      .then((text) => {
        entry.responseMeta = summarizeJson(text.slice(0, MAX_BODY_BYTES));
      })
      .catch(() => {
        entry.responseMeta = { unreadable: true };
      });
  });

  page.on('requestfailed', (req) => {
    failedCount += 1;
    const failure = req.failure()?.errorText || 'unknown';
    failedRequests.push({
      method: req.method(),
      path: pathOf(req.url()),
      resourceType: req.resourceType(),
      failureReason: failure.slice(0, MAX_TEXT),
    });
    const endpoint = endpointOf(req.url());
    if (endpoint) {
      const start = started.get(req);
      targets.push({
        endpoint,
        method: req.method(),
        status: null,
        durationMs: start != null ? Date.now() - start : null,
        failureReason: failure.slice(0, MAX_TEXT),
        resourceType: req.resourceType(),
        responseMeta: null,
      });
    }
    started.delete(req);
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    if (consoleErrors.length >= MAX_CONSOLE) return;
    consoleErrors.push(`[${msg.type()}] ${msg.text().slice(0, MAX_TEXT)}`);
  });

  page.on('pageerror', (err) => {
    if (pageErrors.length >= MAX_CONSOLE) return;
    pageErrors.push(String(err && (err as Error).message ? (err as Error).message : err).slice(0, MAX_TEXT));
  });

  page.on('close', flush);
}
