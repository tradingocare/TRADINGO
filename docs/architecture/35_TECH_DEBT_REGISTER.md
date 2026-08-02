# TRADINGO Tech Debt Register

> Known technical debt items that should be addressed. All items from the production audit have been resolved.

## Critical (0 items)
- All 3 critical items from production audit have been remediated (Phase 14D.1)

## Major

### TECH-001: Legacy GOCASH Module (`go-cash/`)
- **Module**: `apps/api/src/modules/go-cash/`
- **Issue**: Duplicate GOCASH implementation (pre-dates the enterprise `gocash/` module)
- **Impact**: Confusion, potential data inconsistency
- **Resolution**: Deprecate and remove after verifying no routes depend on it
- **Priority**: Medium
- **Depends on**: Migration of any remaining consumers

### TECH-002: Legacy AI Module (`ai/`)
- **Module**: `apps/api/src/modules/ai/`
- **Issue**: Pre-dates the enterprise `ai-gateway/` module with its own OpenAI provider
- **Impact**: Two AI systems running in parallel
- **Resolution**: Migrate to ai-gateway, remove legacy
- **Priority**: Medium
- **Depends on**: Feature parity verification

### TECH-003: Incomplete ABAC Implementation
- **Files**: `security/ABAC-POLICY.md` exists, `PermissionsGuard` exists, but not all endpoints use permissions
- **Impact**: Authorization relies primarily on roles, not fine-grained permissions
- **Resolution**: Implement ABAC policy across all endpoints
- **Priority**: Medium
- **Depends on**: Audit of all endpoints

### TECH-004: 6 NoAction Relations
- **Files**: `prisma/schema.prisma` — 6 relations use `onDelete: NoAction`
- **Impact**: Database will throw on delete if referenced records exist
- **Resolution**: Review and convert to appropriate policy
- **Priority**: Low
- **Depends on**: Data lifecycle analysis

### TECH-005: `packages/ui/` Empty
- **Package**: `@tradingo/ui`
- **Issue**: Placeholder package with no exports
- **Impact**: Cannot share UI primitives across apps
- **Resolution**: Migrate reusable primitives from `apps/web/components/ui/` to package
- **Priority**: Low
- **Depends on**: Future mobile app or second frontend

### TECH-006: `packages/gocash/` Empty
- **Package**: `@tradingo/gocash`
- **Issue**: Placeholder package with no source files
- **Impact**: Cannot share GOCASH types/utilities
- **Resolution**: Migrate GOCASH types from `apps/api/src/modules/gocash/types/` to package
- **Priority**: Low

### TECH-007: Missing Formal Domain Event Bus
- **Issue**: Services call each other directly; no formal event bus
- **Impact**: Tight coupling, harder to add new subscribers
- **Resolution**: Evaluate NestJS EventEmitter or lightweight event bus
- **Priority**: Low
- **Depends on**: Architecture decision

### TECH-008: Missing Correlation IDs
- **Issue**: No correlation ID across distributed requests
- **Impact**: Harder to trace requests across services
- **Resolution**: Add UUID-based correlation ID in middleware
- **Priority**: Low

### TECH-009: Missing Feature Flags
- **Issue**: No formal feature flag system
- **Impact**: Canary releases and A/B testing are manual
- **Resolution**: Evaluate LaunchDarkly or Unleash
- **Priority**: Low

### TECH-010: Missing Outbox Pattern
- **Issue**: No transactional outbox for guaranteed event delivery
- **Impact**: Risk of missed events if service crashes after DB write
- **Resolution**: Implement outbox pattern for critical events
- **Priority**: Low

## Minor

### TECH-011: Some Endpoints Still Use `any`
- **Issue**: ~8 warnings in eslint for `any` type usage
- **Resolution**: Replace with proper types
- **Priority**: Low

### TECH-012: Frontend API Response Types Not Fully Consistent
- **Issue**: Some API responses may not exactly match TypeScript interfaces
- **Resolution**: Audit and fix type mismatches
- **Priority**: Low
