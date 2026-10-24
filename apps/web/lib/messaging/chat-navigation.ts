import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuthStore } from '@/store/auth-store';
import { communicationApi } from '@/lib/api/communication';
import { toast } from '@/components/ui/use-toast';

export interface OpenChatInput {
  router: AppRouterInstance;
  /** Target seller company id (slug accepted as fallback by the API). */
  companyId: string;
  /** Optional product context — preserved, never fabricated. */
  productId?: string;
  /** Optional display title (real product/company name at the call-site). */
  title?: string;
  /** Optional post-login return target (R6). Defaults to the current page. */
  returnUrl?: string;
}

export function inboxListPath(role: string | undefined): string {
  return role === 'SELLER' ? '/seller/inbox' : '/buyer/inbox';
}

export function inboxThreadPath(role: string | undefined, conversationId: string): string {
  return `${inboxListPath(role)}/${conversationId}`;
}

// In-flight dedupe: concurrent Chat clicks for the same context share one
// open-or-create call, so double-clicks cannot spawn duplicate threads.
const inflight = new Map<string, Promise<{ id: string }>>();

/**
 * P1-02 Part 1 — canonical contact entry point.
 * Chat CTA → open-or-create thread (server resolves participants) →
 * role-aware inbox thread. Unauthenticated callers go through the existing
 * canonical login flow (call-sites keep their requireAuth wrapper; this is
 * a second safety net). Failures toast — never a dead-end, never /messages.
 */
export async function openChat({ router, companyId, productId, title, returnUrl }: OpenChatInput): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) {
    // R6: preserve where the caller wanted to chat from so a successful
    // login returns them to that page instead of the role dashboard.
    const current = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?next=${encodeURIComponent(returnUrl || current)}`);
    return;
  }

  // No legitimate target: fall back to the safe inbox list rather than
  // manufacturing IDs or navigating to a dead route.
  if (!companyId) {
    router.push(inboxListPath(user.role));
    return;
  }

  const key = `${user.id}:${companyId}:${productId ?? ''}`;
  let pending = inflight.get(key);
  if (!pending) {
    pending = communicationApi.conversations.open({ companyId, productId, title });
    inflight.set(key, pending);
  }
  try {
    const conversation = await pending;
    router.push(inboxThreadPath(user.role, conversation.id));
  } catch {
    toast({ title: 'Chat shuru nahi ho paya, phir try karein', variant: 'destructive' });
  } finally {
    if (inflight.get(key) === pending) inflight.delete(key);
  }
}
