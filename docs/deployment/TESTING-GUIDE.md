# TRADINGO Testing Guide

## Unit Testing

### Framework & Setup
- **Framework:** Jest (v29)
- **API tests:** `ts-jest` transformer, `@nestjs/testing` for module integration
- **Web tests:** `@testing-library/react` with Jest
- **Coverage threshold:** 80% global (branches, functions, lines, statements)

### Running Tests
```bash
# All tests across monorepo
pnpm test

# API only
pnpm --filter @tradingo/api test

# Web only
pnpm --filter @tradingo/web test

# With coverage
pnpm --filter @tradingo/api test -- --coverage
```

### What to Unit Test
- Services: business logic, validations, edge cases
- Controllers: request/response mapping, status codes, error handling
- Guards, interceptors, pipes, filters
- Utility functions and helpers
- React hooks and custom components (via `@testing-library/react`)
- Zustand stores (pure state transitions)

### Naming Convention
Test files are placed next to their source files with `.spec.ts` extension:
```
src/modules/users/users.service.ts
src/modules/users/users.service.spec.ts
```

## Integration Testing

### API Integration Tests (E2E)
Located in `apps/api/test/` using `supertest` with `jest-e2e.json` configuration.
Running:
```bash
pnpm --filter @tradingo/api test:e2e
```

Existing E2E test suites:
| Test File | Description |
|---|---|
| `auth-flow.e2e-spec.ts` | Registration, login, token refresh, logout |
| `business-flow.e2e-spec.ts` | Organization, products, RFQs, quotes |
| `full-trade-flow.e2e-spec.ts` | Complete buyer-to-seller trade lifecycle |
| `dispute-flow.e2e-spec.ts` | Escrow disputes, admin resolution |
| `app.e2e-spec.ts` | Basic app module smoke test |

### Database Integration
Tests spin up a test PostgreSQL instance (via Docker `services` in CI or local).
Prisma database URL is overridden with `DATABASE_URL` env pointing to the test DB.
Migrations run before tests via `prisma migrate deploy`.

## E2E Testing (Browser)

### Playwright Tests
End-to-end browser tests should be implemented using Playwright.
```bash
# Install Playwright (if not already)
npx playwright install

# Run E2E tests
pnpm --filter @tradingo/web exec playwright test
```

Key E2E scenarios to cover:
- Guest user searches products and browses categories
- User registration and email verification flow
- Seller creates a product listing
- Buyer creates an RFQ
- Seller submits a quote
- Buyer accepts quote and places order
- Payment via Razorpay iframe
- Order status tracking with escrow
- Dispute creation and admin resolution
- Mobile responsive navigation (open/close drawer)
- Offline page shown when service worker detects no connectivity

## Mobile Testing Checklist

- [ ] Responsive layout verified at: 360px, 414px, 768px, 1024px, 1440px
- [ ] Touch targets minimum 44x44 px
- [ ] Bottom navigation works on mobile (no overlap with browser chrome)
- [ ] Forms usable on mobile: input labels visible, autocomplete works, virtual keyboard doesn't obscure fields
- [ ] Horizontal scrolling avoided (overflow hidden on body)
- [ ] Tap feedback visible on interactive elements
- [ ] Image lazy loading functional on slow connections
- [ ] Service worker registers and caches static assets
- [ ] Offline page displays when network unavailable
- [ ] iOS Safari: no 100vh issues, safe-area-inset respected
- [ ] Android Chrome: no text autozoom on input focus

## Cross-Browser Testing Matrix

| Browser | Versions | Priority |
|---|---|---|
| Chrome | Latest 2 major versions | Full |
| Firefox | Latest 2 major versions | Full |
| Safari | Latest 2 major versions | Full |
| Edge | Latest 2 major versions | Full |
| Chrome Android | Latest | Full |
| Safari iOS | Latest 2 major versions | Full |
| Samsung Internet | Latest | Visual smoke |

Test on actual devices where possible. Use BrowserStack or LambdaTest for device coverage.

## Load Testing

### Tools
- **k6** for API load testing (script in `infrastructure/load-test/`)
- **Lighthouse** for frontend performance benchmarking

### Load Test Scenarios

| Scenario | Target | Threshold |
|---|---|---|
| Concurrent user sessions | 1,000 simultaneous | p95 response <2s, error rate <1% |
| Product search burst | 500 req/s for 60s | p95 <500ms, no 5xx |
| RFQ creation | 100 req/s for 30s | p95 <1s, error rate <0.5% |
| Payment order creation | 50 req/s for 30s | p95 <2s, error rate <0.1% |
| Analytics query (30-day agg) | 20 req/s for 30s | p95 <3s |

```bash
# Run k6 load test
k6 run infrastructure/load-test/search-scenario.js
```

### Stress Testing
- Gradually increase load until the system fails
- Note the breaking point (requests/second, concurrent connections)
- Verify auto-scaling triggers before performance degrades
- Document the max sustainable throughput

## Security Testing (OWASP Top 10)

| Category | Validation Method | Tool |
|---|---|---|
| **A01: Broken Access Control** | Verify role-based route guards in middleware, API guards | Manual + automated tests |
| **A02: Cryptographic Failures** | Confirm HTTPS enforced, JWT signed, passwords hashed (bcrypt) | Code review, `zap` scan |
| **A03: Injection** | Prisma parameterized queries; no raw SQL | Code review, SQLMap |
| **A04: Insecure Design** | Rate limiting on auth, throttling on API | Integration tests |
| **A05: Security Misconfiguration** | Helmet headers, CORS, infra hardening | `zap` scan, `nmap` |
| **A06: Vulnerable Components** | Dependency audit | `pnpm audit`, `trivy`, Dependabot |
| **A07: Auth Failures** | Lockout after 5 failed attempts, 2FA optional | Manual + E2E |
| **A08: Data Integrity Failures** | CI/CD pipeline integrity, signed commits | GitHub branch protection |
| **A09: Logging Failures** | All auth events logged; Sentry captures errors | Code review |
| **A10: SSRF** | No user-controlled URLs in server requests | Code review |

### Scanning Commands
```bash
# Dependency audit
pnpm audit --audit-level=high

# Container image scan (Trivy)
trivy image tradingo-api:latest

# OWASP ZAP baseline scan
docker run -t ghcr.io/zaproxy/zaproxy zap-baseline.py -t https://staging.tradingo.io
```

## Accessibility Testing (WCAG 2.1 AA)

### Automated Checks
- Run `axe-core` via Playwright or browser extension
- Verify color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
- All images have `alt` attributes (informative images) or `aria-hidden="true"` (decorative)
- Form inputs have associated `<label>` elements
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` regions present
- Heading hierarchy: `h1` > `h2` > `h3` (not skipping levels)
- Focus indicators visible (minimum 2px outline)

### Manual Checks
- Keyboard navigation: Tab through all interactive elements, verify visible focus ring
- Screen reader: VoiceOver (macOS) or NVDA (Windows) — navigate through pages
- Zoom: Page readable at 200% zoom without horizontal scrolling
- Reduced motion: Animations respect `prefers-reduced-motion`
- Error messages: Form validation errors announced to screen readers (`aria-live`, `role="alert"`)
- Links: No "click here" or "read more" — links are descriptive out of context

## Lighthouse Performance Targets

| Metric | Target |
|---|---|
| **Performance** | 90+ |
| **Accessibility** | 95+ |
| **Best Practices** | 90+ |
| **SEO** | 100 |
| **PWA** | Meets installable criteria |

### Running Lighthouse
```bash
# CLI
npx lighthouse https://staging.tradingo.io --view --preset=desktop
npx lighthouse https://staging.tradingo.io --view --preset=phone --screen-emulation=iphone-x

# CI integration
npx lhci autorun
```

### Lighthouse CI (optional)
Install `@lhci/cli` and configure `lighthouserc.js`:
```js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      url: ['http://localhost:3000', 'http://localhost:3000/products'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'performance': ['warn', { minScore: 0.9 }],
        'accessibility': ['error', { minScore: 0.95 }],
        'best-practices': ['warn', { minScore: 0.9 }],
        'seo': ['error', { minScore: 1.0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### PWA Requirements
- Web app manifest (`/manifest.webmanifest`) with icons, name, theme color
- Service worker (`/sw.js`) registered and functional
- HTTPS only
- App loads offline or shows offline page
- `start_url` points to `/`
- `display: standalone` or `minimal-ui`

## Test Data Setup

### Seeding
```bash
pnpm db:seed
```
The seed script creates:
- Admin account (`admin@tradingo.io`)
- Sample companies (buyer and seller)
- Product categories and sample products
- Initial RFQs and quotes

### Test Accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@tradingo.io | Admin@1234 |
| Seller | seller@test.io | Test@1234 |
| Buyer | buyer@test.io | Test@1234 |

## Continuous Integration

All tests run automatically in CI (see `.github/workflows/ci.yml`):
1. **Lint** — ESLint across monorepo
2. **TypeCheck** — `tsc --noEmit` for both apps
3. **Test** — Jest unit tests
4. **Build** — `pnpm build` with Docker smoke test

PRs to `main` must pass all CI checks and maintain 80%+ code coverage.
