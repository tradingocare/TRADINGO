/**
 * FRONTEND_URL carries the browser origins that are allowed to talk to the API.
 * It is configured as a COMMA-SEPARATED LIST (docker-compose sets
 * `http://localhost:3000,http://localhost:3116`) so that several local
 * front-ends (founder checkout on :3000, worktree dev server on :3116) can
 * share one API.
 *
 * Every consumer must therefore read it as a LIST, never as a single string:
 *  - CORS must echo the requesting origin when it is in the allowlist.
 *    Passing the raw string made Nest emit `Access-Control-Allow-Origin:
 *    http://localhost:3000,http://localhost:3116`, which no browser origin
 *    ever matches — every cross-origin call was blocked.
 *  - The CSRF pre-handler must treat EVERY allowlisted origin as trusted.
 *  - URL builders (verification links, social-login redirect) must use the
 *    FIRST entry as the canonical public origin; `new URL(path, list)` throws.
 */

export const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

/** Normalises an origin: trims whitespace and drops trailing slashes. */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/** Parses FRONTEND_URL into a de-duplicated list of allowed origins. */
export function getFrontendOrigins(raw?: string | null): string[] {
  const source = raw ?? process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_ORIGIN;
  const origins = String(source)
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => origin.length > 0);
  if (origins.length === 0) return [DEFAULT_FRONTEND_ORIGIN];
  return Array.from(new Set(origins));
}

/** The canonical public origin — used when building absolute URLs. */
export function getPrimaryFrontendOrigin(raw?: string | null): string {
  return getFrontendOrigins(raw)[0];
}

/** True when the given browser origin is allowlisted. */
export function isAllowedFrontendOrigin(
  origin: string | undefined | null,
  raw?: string | null,
): boolean {
  if (!origin) return false;
  return getFrontendOrigins(raw).includes(normalizeOrigin(origin));
}
