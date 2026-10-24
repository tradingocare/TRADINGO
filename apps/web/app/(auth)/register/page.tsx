import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDashboardForRole } from '@/lib/auth/redirects';

// R3C-R1C canonicalization: /register has NO standalone product purpose.
// Compatibility redirect — buyer traffic lands on the canonical buyer
// registration; logged-in users keep the pre-existing F-02 dashboard bounce.
// Preserved (not deleted) so old links, bookmarks and middleware references
// keep working. Seller activation lives in the GoLive journey (/golive).
// Part 2A: the original query string is carried forward to the fixed
// same-origin destination (e.g. /register?ref=CODE →
// /register/buyer?ref=CODE). Only query pairs are forwarded — the path stays
// the canonical constant, so no external/protocol-relative redirect is
// possible. Nothing here is consumed or interpreted (no referral logic).
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();
  const role = jar.get('userRole')?.value ?? '';
  const token = jar.get('accessToken')?.value ?? '';
  if (role && token) {
    redirect(getDashboardForRole(role));
  }
  const params = new URLSearchParams();
  const sp = await searchParams;
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined) params.append(key, v);
      }
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  const qs = params.toString();
  redirect(qs ? `/register/buyer?${qs}` : '/register/buyer');
}
