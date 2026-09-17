import { URL } from 'url';

export function redirectToLogin(requestUrl: string, preservePath = true): string {
  if (!preservePath) return '/login';
  const url = new URL(requestUrl, 'http://localhost');
  const next = url.pathname + url.search;
  return `/login?next=${encodeURIComponent(next)}`;
}

export function getRoleFromCookie(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.match(/(?:^|;\s*)userRole=([^;]*)/)?.[1] ?? '';
}

export function getDashboardForRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
    case 'SELLER':
      return '/seller/dashboard';
    case 'BUYER':
    case 'VIEWER':
      return '/buyer/dashboard';
    default:
      return '/buyer/dashboard';
  }
}

export function getDefaultRedirect(role: string): string {
  return getDashboardForRole(role);
}

export function getSellerEntryTarget(role: string = getRoleFromCookie()): string {
  switch (role) {
    case 'SELLER':
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'MANAGER':
      return getDashboardForRole(role);
    case 'BUYER':
      return '/register/vendor-onboarding';
    case 'VIEWER':
      return '/buyer/dashboard';
    default:
      return '/register/vendor';
  }
}

export function isRedirectLoop(destination: string, currentPath: string): boolean {
  const dest = destination.split('?')[0];
  const curr = currentPath.split('?')[0];
  return dest === curr;
}
