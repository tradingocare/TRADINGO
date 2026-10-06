import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AdminLoginClient from '@/app/admin/login/AdminLoginClient';
import apiClient from '@/lib/api/client';
import { setAccessToken } from '@/lib/auth';
import { persistSession } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';

// Factories run at require-time (before module-body consts), so
// they create jest.fn()s inline. Tests reach them through the
// imported (mocked) bindings below; hooks are mocked as fns and
// given per-test return values in beforeEach.
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  setAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock('@/lib/auth/session', () => ({
  persistSession: jest.fn(),
  persistSessionRole: jest.fn(),
  clearSession: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
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

const mockPost = apiClient.post as jest.Mock;
const mockSetToken = setAccessToken as jest.Mock;
const mockPersist = persistSession as jest.Mock;
const mockPush = jest.fn();
const mockSetAuth = jest.fn();

let mockSearchNext: string | null = null;

const ADMIN_USER = { id: 'u-1', email: 'admin@tradingo.in', name: 'Aryan Admin', role: 'ADMIN' };
const TOKEN = 'admin-access-token';

function fillForm(id: string, pass: string) {
  fireEvent.change(screen.getByLabelText(/employee email|admin id/i), { target: { value: id } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: pass } });
}

beforeEach(() => {
  mockSearchNext = null;
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush, replace: jest.fn(), back: jest.fn(), prefetch: jest.fn(),
  });
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (k: string) => (k === 'next' ? mockSearchNext : null),
  });
  (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null, setAuth: mockSetAuth });
  mockPush.mockClear();
  mockPost.mockClear();
  mockSetAuth.mockClear();
  mockPersist.mockClear();
  mockSetToken.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('AdminLoginClient (dedicated admin authentication surface)', () => {
  it('renders the admin sign-in form with no role selector', () => {
    render(<AdminLoginClient />);

    expect(screen.getByRole('heading', { name: /admin sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/employee email|admin id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    // Dedicated surface: the page itself IS the admin auth — no role tabs.
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByText('Sign in as Buyer')).toBeNull();
    expect(screen.queryByText('Sign in as Seller')).toBeNull();
  });

  it('requires identifier and password before submitting', () => {
    render(<AdminLoginClient />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/please enter your admin id and password/i)).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('posts to /auth/login with role admin', async () => {
    mockPost.mockResolvedValueOnce({ data: { user: ADMIN_USER, accessToken: TOKEN } });
    render(<AdminLoginClient />);

    fillForm('admin@tradingo.in', 'Sup3rSecret!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    expect(mockPost).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
      identifier: 'ADMIN@TRADINGO.IN',
      password: 'Sup3rSecret!',
      role: 'admin',
      rememberMe: false,
      turnstileToken: '',
    }));
  });

  it('persists the session and redirects admins to /admin/dashboard', async () => {
    mockPost.mockResolvedValueOnce({ data: { user: ADMIN_USER, accessToken: TOKEN } });
    render(<AdminLoginClient />);

    fillForm('admin@tradingo.in', 'Sup3rSecret!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
    expect(mockSetAuth).toHaveBeenCalledWith(ADMIN_USER, TOKEN);
    expect(mockSetToken).toHaveBeenCalledWith(TOKEN);
    expect(mockPersist).toHaveBeenCalledWith({ user: ADMIN_USER, accessToken: TOKEN });
  });

  it('honors a safe admin next target after login', async () => {
    mockSearchNext = '/admin/campaigns';
    mockPost.mockResolvedValueOnce({ data: { user: ADMIN_USER, accessToken: TOKEN } });
    render(<AdminLoginClient />);

    fillForm('admin@tradingo.in', 'Sup3rSecret!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/campaigns'));
  });

  it('refuses an open-redirect next target (falls back to the admin dashboard)', async () => {
    mockSearchNext = 'https://evil.example.com/admin/dashboard';
    mockPost.mockResolvedValueOnce({ data: { user: ADMIN_USER, accessToken: TOKEN } });
    render(<AdminLoginClient />);

    fillForm('admin@tradingo.in', 'Sup3rSecret!');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
  });

  it('surfaces a password failure without persisting anything', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Incorrect password' } } });
    render(<AdminLoginClient />);

    fillForm('admin@tradingo.in', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPersist).not.toHaveBeenCalled();
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  it('denies non-admin credentials with a clear error', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'This account is not a admin account' } } });
    render(<AdminLoginClient />);

    fillForm('buyer@tradingo.in', 'buyerpass');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/admin credentials required/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
