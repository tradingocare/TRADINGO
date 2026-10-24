import GoLivePage from '@/app/golive/page'

const cookiesGet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: (...args: unknown[]) => cookiesGet(...args) }),
}))

const redirectMock = jest.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
jest.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}))

jest.mock('@/app/golive/invalid-plan-context', () => ({
  __esModule: true,
  default: ({ error }: { error: string }) => <div data-testid="invalid-plan">{error}</div>,
}))

import { cleanup, render, screen } from '@testing-library/react'

const PLANS = [
  'trade_start',
  'trade_smart',
  'trade_plus',
  'trade_pro',
  'trade_premium',
  'trade_elite',
].map((planId) => ({ planId }))

const fetchMock = jest.fn()

function mockPlansResponse(plans: unknown = PLANS) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(plans),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  cookiesGet.mockReturnValue(undefined)
  ;(globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch
  mockPlansResponse()
})

afterEach(cleanup)

describe('/golive entry', () => {
  it('routes guests to the vendor wizard with plan context', async () => {
    await expect(
      GoLivePage({ searchParams: Promise.resolve({ planId: 'trade_smart', tier: 'B' }) }),
    ).rejects.toThrow('REDIRECT:/register/vendor?planId=trade_smart&tier=B')
  })

  it('routes guests without context to the bare vendor entry', async () => {
    await expect(GoLivePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'REDIRECT:/register/vendor',
    )
  })

  it('routes buyers to existing-mode onboarding with plan context', async () => {
    cookiesGet.mockReturnValue({ value: 'BUYER' })

    await expect(
      GoLivePage({ searchParams: Promise.resolve({ planId: 'trade_elite', tier: 'C' }) }),
    ).rejects.toThrow('REDIRECT:/register/vendor-onboarding?planId=trade_elite&tier=C')
  })

  it('routes sellers to their dashboard without registration context', async () => {
    cookiesGet.mockReturnValue({ value: 'SELLER' })

    await expect(
      GoLivePage({ searchParams: Promise.resolve({ planId: 'trade_smart', tier: 'B' }) }),
    ).rejects.toThrow('REDIRECT:/seller/dashboard')
  })

  it('routes managers to the seller dashboard', async () => {
    cookiesGet.mockReturnValue({ value: 'MANAGER' })

    await expect(GoLivePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'REDIRECT:/seller/dashboard',
    )
  })

  it('routes admins to the admin dashboard', async () => {
    cookiesGet.mockReturnValue({ value: 'ADMIN' })

    await expect(GoLivePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'REDIRECT:/admin/dashboard',
    )
  })

  it('routes viewers to the buyer dashboard', async () => {
    cookiesGet.mockReturnValue({ value: 'VIEWER' })

    await expect(GoLivePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'REDIRECT:/buyer/dashboard',
    )
  })

  it('rejects an unknown plan instead of routing', async () => {
    render(
      await GoLivePage({
        searchParams: Promise.resolve({ planId: 'no-such-plan', tier: 'B' }),
      }),
    )

    expect(screen.getByTestId('invalid-plan')).toBeInTheDocument()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown package tier instead of routing', async () => {
    render(
      await GoLivePage({
        searchParams: Promise.resolve({ planId: 'trade_smart', tier: 'Z' }),
      }),
    )

    expect(screen.getByTestId('invalid-plan')).toHaveTextContent('Unknown package')
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('drops unknown query parameters before redirecting', async () => {
    await expect(
      GoLivePage({
        searchParams: Promise.resolve({
          planId: 'trade_smart',
          tier: 'B',
          next: 'https://evil.example',
        }),
      }),
    ).rejects.toThrow('REDIRECT:/register/vendor?planId=trade_smart&tier=B')
  })

  it('fails open to the vendor entry when plan validation is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('network unavailable'))

    await expect(
      GoLivePage({ searchParams: Promise.resolve({ planId: 'trade_smart', tier: 'B' }) }),
    ).rejects.toThrow('REDIRECT:/register/vendor?planId=trade_smart&tier=B')
  })
})
