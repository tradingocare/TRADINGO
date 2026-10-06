import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LoginClient from '@/app/(auth)/login/LoginClient';

// R3C-R1C: GoStart Create Account CTA must target the canonical buyer
// registration (/register/buyer), preserving a validated vendor context.

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === 'next' ? SEARCH_NEXT : null) }),
}));

let SEARCH_NEXT: string | null = null;

jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  completeSocialLogin: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: null }),
}));

jest.mock('@/hooks/use-oauth-providers', () => ({
  __esModule: true,
  useOAuthProviders: () => ({ providers: {} }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/components/auth/turnstile-widget', () => ({
  __esModule: true,
  TurnstileWidget: () => null,
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, { get: (_t: any, tag: string) => (props: any) => React.createElement(tag, props) }),
    AnimatePresence: ({ children }: any) => children,
  };
});

beforeEach(() => {
  SEARCH_NEXT = null;
});

afterEach(() => {
  cleanup();
});

describe('LoginClient GoStart CTA (R3C-R1C)', () => {
  it('routes Create Account to /register/buyer when no context exists', () => {
    render(<LoginClient />);

    expect(screen.getByText('Create Account').closest('a')).toHaveAttribute('href', '/register/buyer');
  });

  it('preserves a validated vendor context on Create Account', () => {
    SEARCH_NEXT = '/register/vendor?planId=trade_smart&tier=B';
    render(<LoginClient />);

    expect(screen.getByText('Create Account').closest('a')).toHaveAttribute(
      'href',
      '/register/vendor?planId=trade_smart&tier=B',
    );
  });

  it('falls back to /register/buyer for a hostile next value', () => {
    SEARCH_NEXT = 'https://evil.example/register/vendor';
    render(<LoginClient />);

    expect(screen.getByText('Create Account').closest('a')).toHaveAttribute('href', '/register/buyer');
  });
});

describe('LoginClient public role stand (Founder: Buyer | Seller only)', () => {
  it('shows exactly Buyer and Seller tabs, never Admin/RM', () => {
    render(<LoginClient />);

    // jsdom renders both responsive label spans, so assert on roles + copy.
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(screen.getByRole('radiogroup', { name: 'Login account type' })).toBeInTheDocument();
    expect(screen.queryByText('Admin / RM')).toBeNull();
    expect(screen.queryByText('Restricted Access')).toBeNull();
  });

  it('marks the selected role and switches heading on Seller', async () => {
    render(<LoginClient />);

    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
    // Heading copy appears in both the brand panel and the card.
    expect(screen.getAllByText('Sign in as Buyer')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('radio')[1]);

    const updated = screen.getAllByRole('radio');
    expect(updated[0]).toHaveAttribute('aria-checked', 'false');
    expect(updated[1]).toHaveAttribute('aria-checked', 'true');
    expect(await screen.findAllByText('Sign in as Seller')).toHaveLength(2);
    expect(screen.getByText(/Seller Login ID = PAN Number/)).toBeInTheDocument();
    expect(screen.queryAllByText('Sign in as Buyer')).toHaveLength(0);
  });

  it('contains no fabricated statistics or placeholder glyphs', () => {
    const { container } = render(<LoginClient />);
    const text = container.textContent || '';

    expect(text).not.toMatch(/33,600/);
    expect(text).not.toMatch(/5L\+/);
    expect(text).not.toMatch(/100%/);
    expect(text).not.toMatch(/\?\?/);
  });
});
