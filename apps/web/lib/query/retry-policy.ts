/**
 * Phase 3E: preview-scoped retry policy.
 *
 * Subcategory preview fan-out legitimately hits the shared search throttle
 * under load; retrying those throttled (429) previews once doubles the
 * traffic without ever succeeding inside the same window. This predicate
 * disables retry for HTTP 429 ONLY, preserving the global retry:1 behavior
 * for every other transient failure. Applied exclusively at subcategory
 * preview call sites — final searches keep the global default.
 */
export function isHttp429(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const withResponse = error as { response?: { status?: unknown } };
  const direct = error as { status?: unknown };
  const status = withResponse.response?.status ?? direct.status;
  return status === 429;
}

export function retryExcept429(failureCount: number, error: unknown): boolean {
  if (isHttp429(error)) return false;
  return failureCount < 1;
}
