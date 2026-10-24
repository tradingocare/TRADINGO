import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSellerEntryTarget } from '@/lib/auth/redirects'
import InvalidPlanContext from './invalid-plan-context'
import { normalizePlanHints, validateEntryHints } from './plan-hints'

export const metadata: Metadata = {
  title: 'Go Live - Start Selling on TRADINGO',
  description:
    'Activate your seller business on TRADINGO. New sellers register, existing buyers upgrade with the same account.',
}

export default async function GoLivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const hints = normalizePlanHints(await searchParams)
  const entryError = await validateEntryHints(hints)
  if (entryError) return <InvalidPlanContext error={entryError} />

  const params = new URLSearchParams()
  if (hints.planId) params.set('planId', hints.planId)
  if (hints.tier) params.set('tier', hints.tier)
  const query = params.toString()
  const withContext = (path: string) => (query ? `${path}?${query}` : path)

  const role = (await cookies()).get('userRole')?.value ?? ''
  if (!role) redirect(withContext('/register/vendor'))

  const target = getSellerEntryTarget(role)
  redirect(target.startsWith('/register/') ? withContext(target) : target)
}
