# TRADINGO AI Governance

## AI Usage Principles

1. **AI Augments, Not Replaces** — AI provides recommendations, insights, and suggestions. Final decisions always remain with human users.
2. **Transparency** — Every AI response includes the model used, confidence indicators, and reasoning.
3. **Privacy** — AI never receives PII (personally identifiable information). Prompts are logged without user-specific data.
4. **Fairness** — AI models are selected to avoid bias. Multiple provider fallbacks ensure no single-vendor lock-in.
5. **Accountability** — All AI usage is tracked per-company, per-user, per-task for auditing.

## AI Governance Structure

| Layer | Responsible | Controls |
|-------|-------------|----------|
| Access Control | AiCreditsService | Plan-based credit allocation |
| Usage Tracking | UsageTrackerService | Per-company, per-task logging |
| Provider Management | ProviderRegistryService | API key encryption, health monitoring |
| Prompt Management | PromptManagerService | Versioned, auditable prompt templates |
| Cost Control | CostEngineService | Per-model cost tracking |
| Circuit Breaker | ProviderHealthService | Automatic provider failover |

## Data Privacy

- **Prompts**: Stored temporarily in Redis cache (TTL: 3600s)
- **Usage logs**: Stored in `AiUsage` model (companyId, taskType, provider, tokens, latency)
- **PII**: Never sent to AI providers. Prompts use company/order IDs, not personal details.
- **Idempotency keys**: Stored hashed in DB, not in plain text
- **API keys**: Encrypted at rest (AES-256-GCM), decrypted only at runtime

## Provider Governance

| Requirement | Control |
|-------------|---------|
| Provider onboarding | `POST /ai-gateway/providers` (ADMIN only) |
| API key storage | AES-256-GCM encrypted via `ApiKeyVaultService` |
| Health monitoring | `POST /ai-gateway/providers/:name/health` |
| Auto-failover | Circuit breaker + fallback chain |
| Data processing | Providers never store response data (stateless API calls) |

## Prompt Governance

| Requirement | Control |
|-------------|---------|
| Versioning | `@@unique([taskType, version])` constraint |
| Activation | Single active version per taskType |
| Audit trail | `updatedAt` timestamp |
| Review | ADMIN-only create/update endpoints |
| Rollback | Version history preserves all past prompts |

## Credit Governance

| Requirement | Control |
|-------------|---------|
| Allocation | Per-plan monthly allocation (20-2500 credits) |
| Enforcement | HTTP 402 before any AI processing |
| Reset | Monthly auto-reset, ADMIN override available |
| Monitoring | Per-company balance, usage history, top consumers |
| Fraud prevention | Velocity checks on credit usage |

## Ethical Guidelines

1. **No deceptive AI** — AI never impersonates humans
2. **No automated decisions** — AI recommends, humans decide
3. **No price manipulation** — AI suggests prices based on market data, never colludes
4. **No bias** — AI models selected to minimize demographic bias
5. **Transparency** — All AI interactions labeled as "AI-powered" in the UI

## Compliance

- **Data residency**: Prompts sent to US-based providers (OpenRouter, Google, Groq). No data stored overseas.
- **Regulatory**: Compliant with Indian IT Act for electronic records
- **Audit**: Full usage trail available for regulatory review
- **Retention**: AI usage logs retained for 365 days

## Future AI Governance Enhancements

> **Status:** Not Yet Implemented

- **AI Ethics Board**: Formal review process for new AI features
- **Bias Testing**: Regular audits of AI outputs for bias
- **User Consent**: Opt-in/opt-out for AI features
- **Explainability Reports**: Per-company AI usage reports
- **AI Risk Assessment**: Formal risk assessment per AI feature
