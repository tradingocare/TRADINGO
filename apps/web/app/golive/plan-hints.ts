import type { PlanTierId } from '@/app/plans/PlansPageClient'

export interface PlanHints {
  planId?: string
  tier?: string
}

const PLAN_TIERS: PlanTierId[] = ['A', 'B', 'C']

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function normalizePlanHints(
  params: Record<string, string | string[] | undefined>,
): PlanHints {
  const planId = firstValue(params.planId)
  const tier = firstValue(params.tier)
  return {
    planId: planId === '' ? undefined : planId,
    tier: tier === '' ? undefined : tier,
  }
}

export function validatePlanHints(
  hints: PlanHints,
  plans: { planId: string }[],
): string | null {
  if (hints.planId !== undefined && !plans.some((plan) => plan.planId === hints.planId)) {
    return `Unknown plan "${hints.planId}". Please choose a plan from /plans.`
  }

  if (hints.tier !== undefined) {
    const tier = hints.tier.toUpperCase()
    if (!PLAN_TIERS.includes(tier as PlanTierId)) {
      return `Unknown package "${hints.tier}". Choose PLAN A, B or C.`
    }
  }

  return null
}

export async function validateEntryHints(hints: PlanHints): Promise<string | null> {
  if (hints.planId === undefined && hints.tier === undefined) return null

  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
    const response = await fetch(`${base}/membership/plans`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return null

    const body = await response.json()
    const plans = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []
    return validatePlanHints(hints, plans)
  } catch {
    return null
  }
}
