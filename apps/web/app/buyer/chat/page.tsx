import { redirect } from 'next/navigation';

/**
 * P1-02 Part 4 — legacy chat route retired.
 * Compatibility redirect (role-correct): /buyer/chat → /buyer/inbox.
 * The legacy page fetched the dead /chat/* API base; the canonical buyer
 * messaging surface is the Communication-Hub-backed inbox.
 */
export default function BuyerChatPage() {
  redirect('/buyer/inbox');
}
