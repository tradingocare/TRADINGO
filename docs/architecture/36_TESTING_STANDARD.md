# TRADINGO Testing Standard

> Testing approach across the monorepo.

## Testing Tools

| Layer | Tool | Location |
|-------|------|----------|
| Unit Tests (API) | Jest | `*.spec.ts` alongside files, `__tests__/` dirs |
| Unit Tests (Web) | Jest + Testing Library | `*.test.ts`, `__tests__/` dirs |
| E2E Tests | Playwright | Root `playwright.config.ts` |
| UAT | Manual test scripts | `uat/` directory |

## Current Coverage

> **Status:** Comprehensive automated test coverage is still being built. Current tests are focused on critical paths.

### API Unit Tests (Found in:)
- `apps/api/src/modules/smart-rfq/__tests__/`
- `apps/api/src/modules/category-templates/__tests__/`
- `apps/api/src/modules/product-location/__tests__/`
- `apps/api/src/modules/product-claims/__tests__/`
- `apps/api/src/modules/products/__tests__/`
- `apps/api/src/modules/near-me/__tests__/`
- `apps/api/src/modules/malware/__tests__/`
- `apps/api/src/modules/location-intelligence/__tests__/`
- `apps/api/src/modules/catalog-import/__tests__/`
- `apps/api/src/modules/jobs/__tests__/`

### Frontend Tests (Found in:)
- `apps/web/test/`
- `apps/web/__tests__/`
- Isolated test files (error-boundary, middleware-utils)

### E2E Tests
- Playwright config at root
- `tests/` directory

## Test Patterns

### Backend Service Test
```typescript
describe('GocashService', () => {
  describe('credit', () => {
    it('should credit wallet and create transaction', async () => {
      // Arrange
      const wallet = await createTestWallet()
      const params = { walletId: wallet.id, amount: 100, type: 'MANUAL_CREDIT', reason: 'Test' }
      
      // Act
      const result = await service.credit(params)
      
      // Assert
      expect(result.transaction.direction).toBe('CREDIT')
      expect(result.wallet.currentBalance).toBe(100)
    })
  })
})
```

### Frontend Component Test
```typescript
describe('StatCard', () => {
  it('should render with value and title', () => {
    render(<StatCard title="Revenue" value="$1,000" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })
})
```

## UAT Reports

Complete UAT reports exist in `uat/` directory:
- `TRADINGO-UAT-REPORT.md`: 80+ pages, 70+ controllers, 100+ services — 77 issues found, verdict: PASS WITH MINOR ISSUES
- `GOCASH-UAT-REPORT.md`: 140 test cases, 100% pass

## Testing Best Practices

1. **Unit test services** — Business logic in services should be unit-tested
2. **Integration test controllers** — Test request/response flow
3. **E2E test critical paths** — Auth, RFQ→Quote→Order→Payment
4. **Mock external services** — AI, payments, SMS, email in unit tests
5. **Test error states** — Loading, empty, error, edge cases
6. **Use factories** — Test data factories for consistent setup
7. **Clean up** — Remove test data after each test
