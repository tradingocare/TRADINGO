import { URL } from 'url';

export function redirectToLogin(requestUrl: string, preservePath = true): string {
  if (!preservePath) return '/login';
  const url = new URL(requestUrl, 'http://localhost');
  const next = url.pathname + url.search;
  return `/login?next=${encodeURIComponent(next)}`;
}

export function getDashboardForRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
    case 'SELLER':
    case 'VIEWER':
      return '/seller/dashboard';
    case 'BUYER':
      return '/buyer/dashboard';
    default:
      return '/seller/dashboard';
  }
}

export function getDefaultRedirect(role: string): string {
  return getDashboardForRole(role);
}

export function isRedirectLoop(destination: string, currentPath: string): boolean {
  const dest = destination.split('?')[0];
  const curr = currentPath.split('?')[0];
  return dest === curr;
}
