export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 50,
  VIEWER: 10,
};

export const ROUTE_PREFIXES = {
  SELLER: '/seller',
  BUYER: '/buyer',
  ADMIN: '/admin',
} as const;

export const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'] as const;

const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];
const MANAGER_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as Role);
}

export function isManagerRole(role: string): boolean {
  return MANAGER_ROLES.includes(role as Role);
}

export function hasMinimumRole(userRole: string, minimumRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= requiredLevel;
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

export function getRouteRole(pathname: string): 'seller' | 'buyer' | 'admin' | null {
  if (pathname.startsWith(ROUTE_PREFIXES.SELLER)) return 'seller';
  if (pathname.startsWith(ROUTE_PREFIXES.BUYER)) return 'buyer';
  if (pathname.startsWith(ROUTE_PREFIXES.ADMIN)) return 'admin';
  return null;
}

export function isRouteProtected(pathname: string): boolean {
  return getRouteRole(pathname) !== null;
}
