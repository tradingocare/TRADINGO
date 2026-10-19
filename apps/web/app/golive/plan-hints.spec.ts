import {
  normalizePlanHints,
  validateEntryHints,
  validatePlanHints,
} from '@/app/golive/plan-hints'

const PLANS = [
  'trade_start',
  'trade_smart',
  'trade_plus',
  'trade_pro',
  'trade_premium',
  'trade_elite',
].map((planId) => ({ planId }))

const fetchMock = jest.fn()

function mockPlanResponse(response: unknown) {
  fetchMock.mockResolvedValue(response)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch
  mockPlanResponse({
    ok: true,
    json: () => Promise.resolve(PLANS),
  })
})

describe('normalizePlanHints', () => {
  it('keeps known scalar hints and drops empty values', () => {
    expect(
      normalizePlanHints({ planId: 'trade_smart', tier: 'B', next: '/seller/dashboard' }),
    ).toEqual({ planId: 'trade_smart', tier: 'B' })
    expect(normalizePlanHints({ planId: '', tier: '' })).toEqual({
      planId: undefined,
      tier: undefined,
    })
  })

  it('takes the first value from repeated query parameters', () => {
    expect(normalizePlanHints({ planId: ['trade_plus', 'trade_elite'], tier: ['C', 'A'] })).toEqual({
      planId: 'trade_plus',
      tier: 'C',
    })
  })
})

describe('validatePlanHints', () => {
  it('accepts absent and valid hints', () => {
    expect(validatePlanHints({}, PLANS)).toBeNull()
    expect(validatePlanHints({ planId: 'trade_smart', tier: 'B' }, PLANS)).toBeNull()
    expect(validatePlanHints({ tier: 'a' }, PLANS)).toBeNull()
  })

  it('rejects unknown plans and packages without substitution', () => {
    expect(validatePlanHints({ planId: 'trade_unknown' }, PLANS)).toContain('trade_unknown')
    expect(validatePlanHints({ planId: 'trade_smart', tier: 'Z' }, PLANS)).toContain('Z')
  })
})

describe('validateEntryHints', () => {
  it('skips the plan lookup when no hints are supplied', async () => {
    await expect(validateEntryHints({})).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates against an enveloped API response', async () => {
    mockPlanResponse({
      ok: true,
      json: () => Promise.resolve({ data: PLANS }),
    })

    await expect(validateEntryHints({ planId: 'trade_plus', tier: 'C' })).resolves.toBeNull()
  })

  it('fails open when the plan endpoint is unavailable', async () => {
    mockPlanResponse({ ok: false })

    await expect(validateEntryHints({ planId: 'trade_plus', tier: 'C' })).resolves.toBeNull()
  })

  it('fails open on network errors', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    await expect(validateEntryHints({ planId: 'trade_plus', tier: 'C' })).resolves.toBeNull()
  })
})
