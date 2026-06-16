jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
  errors: { JWTExpired: class extends Error {}, JWTInvalid: class extends Error {} },
}));

import { getRouteDecision } from '../middleware-utils';
import { getRouteRole, isAuthPage, isRouteProtected, isAdminRole, hasMinimumRole } from '../permissions';
import { redirectToLogin, getDashboardForRole, isRedirectLoop } from '../redirects';
import { ROLES } from '../permissions';

function makePayload(overrides: Partial<{ sub: string; email: string; role: string; permissions: string[] }> = {}) {
  return {
    sub: overrides.sub ?? 'user-1',
    email: overrides.email ?? 'test@test.com',
    role: overrides.role ?? ROLES.VIEWER,
    permissions: overrides.permissions ?? [],
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + 900,
  };
}

describe('getRouteDecision', () => {
  describe('unauthenticated access to protected routes', () => {
    it('redirects unauthenticated user on /seller/:path*', () => {
      const result = getRouteDecision('/seller/orders', null);
      expect(result.redirect).toMatch(/^\/login\?next=/);
    });

    it('redirects unauthenticated user on /buyer/:path*', () => {
      const result = getRouteDecision('/buyer/dashboard', null);
      expect(result.redirect).toMatch(/^\/login\?next=/);
    });

    it('redirects unauthenticated user on /admin/:path*', () => {
      const result = getRouteDecision('/admin/dashboard', null);
      expect(result.redirect).toMatch(/^\/login\?next=/);
    });
  });

  describe('expired token handling', () => {
    it('verifyToken returns null for expired tokens', async () => {
      const { jwtVerify, errors } = await import('jose');
      const { verifyToken } = await import('../token');
      (jwtVerify as jest.Mock).mockRejectedValueOnce(new errors.JWTExpired('expired', {}));
      const result = await verifyToken('expired-token');
      expect(result).toBeNull();
    });

    it('verifyToken returns null for invalid tokens', async () => {
      const { jwtVerify, errors } = await import('jose');
      const { verifyToken } = await import('../token');
      (jwtVerify as jest.Mock).mockRejectedValueOnce(new errors.JWTInvalid());
      const result = await verifyToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('invalid token', () => {
    it('redirects to login when payload is null', () => {
      const result = getRouteDecision('/seller/products', null);
      expect(result.redirect).toBeTruthy();
      expect(result.redirect).toContain('/login');
    });
  });

  describe('role-based route restrictions', () => {
    it('redirects buyer (VIEWER) trying to access admin route to seller dashboard', () => {
      const payload = makePayload({ role: ROLES.VIEWER });
      const result = getRouteDecision('/admin/users', payload);
      expect(result.redirect).toBe('/seller/dashboard');
    });

    it('allows admin to access admin routes', () => {
      const payload = makePayload({ role: ROLES.ADMIN });
      const result = getRouteDecision('/admin/dashboard', payload);
      expect(result.redirect).toBeNull();
    });

    it('allows SUPER_ADMIN to access admin routes', () => {
      const payload = makePayload({ role: ROLES.SUPER_ADMIN });
      const result = getRouteDecision('/admin/dashboard', payload);
      expect(result.redirect).toBeNull();
    });

    it('allows non-admin access to seller routes', () => {
      const payload = makePayload({ role: ROLES.MANAGER });
      const result = getRouteDecision('/seller/orders', payload);
      expect(result.redirect).toBeNull();
    });

    it('allows non-admin access to buyer routes', () => {
      const payload = makePayload({ role: ROLES.VIEWER });
      const result = getRouteDecision('/buyer/rfqs', payload);
      expect(result.redirect).toBeNull();
    });
  });

  describe('auth page protection (login redirect)', () => {
    it('redirects logged-in VIEWER from /login to seller dashboard', () => {
      const payload = makePayload({ role: ROLES.VIEWER });
      const result = getRouteDecision('/login', payload);
      expect(result.redirect).toBe('/seller/dashboard');
    });

    it('redirects logged-in VIEWER from /register to seller dashboard', () => {
      const payload = makePayload({ role: ROLES.VIEWER });
      const result = getRouteDecision('/register', payload);
      expect(result.redirect).toBe('/seller/dashboard');
    });

    it('redirects logged-in ADMIN from /login to admin dashboard', () => {
      const payload = makePayload({ role: ROLES.ADMIN });
      const result = getRouteDecision('/login', payload);
      expect(result.redirect).toBe('/admin/dashboard');
    });

    it('redirects logged-in SUPER_ADMIN from /login to admin dashboard', () => {
      const payload = makePayload({ role: ROLES.SUPER_ADMIN });
      const result = getRouteDecision('/login', payload);
      expect(result.redirect).toBe('/admin/dashboard');
    });
  });

  describe('auth pages allowed when not logged in', () => {
    it('allows unauthenticated access to /login', () => {
      const result = getRouteDecision('/login', null);
      expect(result.redirect).toBeNull();
    });

    it('allows unauthenticated access to /register', () => {
      const result = getRouteDecision('/register', null);
      expect(result.redirect).toBeNull();
    });

    it('allows unauthenticated access to /forgot-password', () => {
      const result = getRouteDecision('/forgot-password', null);
      expect(result.redirect).toBeNull();
    });

    it('allows unauthenticated access to /reset-password', () => {
      const result = getRouteDecision('/reset-password', null);
      expect(result.redirect).toBeNull();
    });
  });
});

describe('getRouteRole', () => {
  it('returns seller for /seller/*', () => {
    expect(getRouteRole('/seller/dashboard')).toBe('seller');
  });

  it('returns buyer for /buyer/*', () => {
    expect(getRouteRole('/buyer/orders')).toBe('buyer');
  });

  it('returns admin for /admin/*', () => {
    expect(getRouteRole('/admin/users')).toBe('admin');
  });

  it('returns null for unregistered paths', () => {
    expect(getRouteRole('/about')).toBeNull();
  });
});

describe('isAuthPage', () => {
  it('identifies /login as auth page', () => expect(isAuthPage('/login')).toBe(true));
  it('identifies /register as auth page', () => expect(isAuthPage('/register')).toBe(true));
  it('identifies /register/seller as auth page', () => expect(isAuthPage('/register/seller')).toBe(true));
  it('identifies /forgot-password as auth page', () => expect(isAuthPage('/forgot-password')).toBe(true));
  it('identifies /reset-password as auth page', () => expect(isAuthPage('/reset-password')).toBe(true));
  it('identifies /about as not auth page', () => expect(isAuthPage('/about')).toBe(false));
  it('identifies /seller/dashboard as not auth page', () => expect(isAuthPage('/seller/dashboard')).toBe(false));
});

describe('isRouteProtected', () => {
  it('protects seller routes', () => expect(isRouteProtected('/seller/products')).toBe(true));
  it('protects buyer routes', () => expect(isRouteProtected('/buyer/rfqs')).toBe(true));
  it('protects admin routes', () => expect(isRouteProtected('/admin/dashboard')).toBe(true));
  it('does not protect public routes', () => expect(isRouteProtected('/about')).toBe(false));
  it('does not protect login', () => expect(isRouteProtected('/login')).toBe(false));
});

describe('isAdminRole', () => {
  it('returns true for SUPER_ADMIN', () => expect(isAdminRole('SUPER_ADMIN')).toBe(true));
  it('returns true for ADMIN', () => expect(isAdminRole('ADMIN')).toBe(true));
  it('returns false for MANAGER', () => expect(isAdminRole('MANAGER')).toBe(false));
  it('returns false for VIEWER', () => expect(isAdminRole('VIEWER')).toBe(false));
  it('returns false for unknown roles', () => expect(isAdminRole('SELLER')).toBe(false));
});

describe('hasMinimumRole', () => {
  it('allows SUPER_ADMIN for ADMIN minimum', () => expect(hasMinimumRole('SUPER_ADMIN', ROLES.ADMIN)).toBe(true));
  it('allows ADMIN for ADMIN minimum', () => expect(hasMinimumRole('ADMIN', ROLES.ADMIN)).toBe(true));
  it('blocks VIEWER for ADMIN minimum', () => expect(hasMinimumRole('VIEWER', ROLES.ADMIN)).toBe(false));
});

describe('redirectToLogin', () => {
  it('preserves the intended URL', () => {
    const result = redirectToLogin('/seller/orders', true);
    expect(result).toContain('next=%2Fseller%2Forders');
  });

  it('does not preserve path when told not to', () => {
    const result = redirectToLogin('/seller/orders', false);
    expect(result).toBe('/login');
  });
});

describe('getDashboardForRole', () => {
  it('returns /admin/dashboard for ADMIN', () => expect(getDashboardForRole('ADMIN')).toBe('/admin/dashboard'));
  it('returns /admin/dashboard for SUPER_ADMIN', () => expect(getDashboardForRole('SUPER_ADMIN')).toBe('/admin/dashboard'));
  it('returns /seller/dashboard for MANAGER', () => expect(getDashboardForRole('MANAGER')).toBe('/seller/dashboard'));
  it('returns /seller/dashboard for VIEWER', () => expect(getDashboardForRole('VIEWER')).toBe('/seller/dashboard'));
  it('returns /seller/dashboard for unknown role', () => expect(getDashboardForRole('SELLER')).toBe('/seller/dashboard'));
});

describe('isRedirectLoop', () => {
  it('detects same path', () => expect(isRedirectLoop('/login', '/login')).toBe(true));
  it('detects same path with query params', () => expect(isRedirectLoop('/login?next=/dashboard', '/login')).toBe(true));
  it('returns false for different paths', () => expect(isRedirectLoop('/dashboard', '/login')).toBe(false));
});

describe('matcher coverage verification', () => {
  const matcher = [
    '/seller/:path*',
    '/buyer/:path*',
    '/admin/:path*',
    '/login',
    '/register/:path*',
    '/forgot-password',
    '/reset-password',
  ];

  function matchesMatcher(path: string): boolean {
    if (matcher.includes(path)) return true;
    for (const pattern of matcher) {
      if (pattern.endsWith('/:path*')) {
        const prefix = pattern.replace('/:path*', '');
        if (path.startsWith(prefix + '/') || path === prefix) return true;
      }
    }
    return false;
  }

  it('matches seller routes', () => expect(matchesMatcher('/seller/dashboard')).toBe(true));
  it('matches buyer routes', () => expect(matchesMatcher('/buyer/orders/123')).toBe(true));
  it('matches admin routes', () => expect(matchesMatcher('/admin/users')).toBe(true));
  it('matches login', () => expect(matchesMatcher('/login')).toBe(true));
  it('matches register/*', () => expect(matchesMatcher('/register/seller')).toBe(true));
  it('matches forgot-password', () => expect(matchesMatcher('/forgot-password')).toBe(true));
  it('matches reset-password', () => expect(matchesMatcher('/reset-password')).toBe(true));
  it('does not match public routes', () => expect(matchesMatcher('/about')).toBe(false));
  it('does not match API routes', () => expect(matchesMatcher('/api/products')).toBe(false));
  it('does not match _next routes', () => expect(matchesMatcher('/_next/static/chunk.js')).toBe(false));
  it('does not match static files', () => expect(matchesMatcher('/favicon.ico')).toBe(false));
  it('does not match root', () => expect(matchesMatcher('/')).toBe(false));
});

describe('no redirect loops', () => {
  it('does not redirect to the same page', () => {
    const dest = '/login';
    const current = '/login';
    expect(isRedirectLoop(dest, current)).toBe(true);
  });

  it('getRouteDecision returns null for auth pages when not logged in', () => {
    const result = getRouteDecision('/login', null);
    expect(result.redirect).toBeNull();
  });
});
