import { redirect } from 'next/navigation';

/**
 * P1-02 Part 4 — legacy chat route retired.
 * Compatibility redirect (role-correct): /seller/chat → /seller/inbox.
 * The legacy page fetched the dead /chat/* API base; the canonical seller
 * messaging surface is the Communication-Hub-backed inbox.
 */
export default function SellerChatPage() {
  redirect('/seller/inbox');
}
