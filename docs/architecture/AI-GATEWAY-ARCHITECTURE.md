# AI Gateway Architecture

## Overview

Provider-agnostic AI infrastructure for TRADINGO B2B marketplace. Supports multiple AI providers with task-based routing, prompt versioning, encrypted API key storage, credit enforcement, usage tracking, cost calculation, Redis caching, queue processing, and circuit breaker health monitoring.

## Architecture

```
Client Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│                  AI Gateway                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Validate    │  │ Check Credits│  │ Cache Lookup│  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Provider    │→ │ Execute      │→ │ Usage      │  │
│  │ Router      │  │ Provider     │  │ Track      │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Cost        │  │ Cache Write  │  │ Credits    │  │
│  │ Calculate   │  │              │  │ Deduct     │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
    │
    ▼
Response
```

## Module Structure

### `apps/api/src/modules/ai-gateway/`

| File | Purpose |
|---|---|
| `ai-gateway.module.ts` | Module definition — registers all services, controllers, providers |
| `ai-gateway.service.ts` | **Main Gateway** — receives request, validates, checks credits, routes, calls provider, tracks usage, calculates cost, caches |
| `provider-registry.service.ts` | **Provider Registry** — CRUD for `AiProvider` DB records, built-in provider instances, health status management |
| `provider-router.service.ts` | **Provider Router** — task-to-provider routing, configurable default routing map, priority-based fallback |
| `prompt-manager.service.ts` | **Prompt Manager** — CRUD for `AiPrompt` DB records, versioned prompts, variable rendering, A/B test support |
| `api-key-vault.service.ts` | **API Key Vault** — AES-256-GCM encryption/decryption of provider API keys, master key from env |
| `ai-credits.service.ts` | **AI Credits** — reads `PlanFeature` (feature='ai_credits') or `MembershipPlan.features.aiCredits`, per-task credit costs, balance checks |
| `usage-tracker.service.ts` | **Usage Tracking** — logs every AI call to `AiUsage`, daily/monthly aggregation, top features/companies |
| `cost-engine.service.ts` | **Cost Engine** — per-model cost config, input/output token cost calculation, company/platform spend |
| `provider-health.service.ts` | **Provider Health** — health checks, circuit breaker (5 failure threshold, 60s recovery), automatic failover |
| `ai-gateway.controller.ts` | **API endpoints** — provider CRUD, prompt management, health checks |
| `admin-ai-gateway.controller.ts` | **Admin dashboard endpoints** — usage stats, cost, health, credits summary |

### Providers (`providers/`)

| Provider | File | Status | Task |
|---|---|---|---|
| OpenRouter | `openrouter.provider.ts` | ✅ Built (stub) | Product Description, SEO, Translation, RFQ/Quote/Negotiation/CRM/Finance analysis |
| Gemini | `gemini.provider.ts` | ✅ Built (stub) | OCR, Quality Scoring, Duplicate Detection |
| Groq | `groq.provider.ts` | ✅ Built (stub) | Fast Suggestion, Spec Suggestion, General Chat |
| Tavily | `tavily.provider.ts` | ✅ Built (stub) | Live Search |
| Firecrawl | `firecrawl.provider.ts` | ✅ Built (stub) | Website Import |

> All providers are **stubs** — no external API calls are made. Replace `complete()` method with real HTTP calls using the API key from `getApiKey()`.

### Future Provider Support

OpenAI, Anthropic Claude, Azure OpenAI, DeepSeek, and Local LLM support requires only:
1. Create new provider file in `providers/`
2. Implement `BaseAiProvider` interface
3. Register in `provider-registry.service.ts`
4. Add API key to `.env`
5. No architecture changes needed

## Prisma Schema

### New Models

| Model | Fields | Purpose |
|---|---|---|
| `AiProvider` | name (unique), displayName, providerType, enabled, priority, baseUrl, supportedModels (JSON), supportedTasks (TaskType[]), timeoutMs, retryCount, retryDelayMs, rateLimitRpm, rateLimitTpm, costPer1kInput, costPer1kOutput, healthStatus, lastHealthCheckAt, lastSuccessAt, lastFailureAt, failureCount, circuitOpen, circuitOpenUntil, metadata (JSON) | Provider registry with health monitoring |
| `AiPrompt` | id, taskType, version (unique per taskType), name, description, systemPrompt, userPrompt, variables (JSON), temperature, maxTokens, providerOverride, modelOverride, isActive, metadata (JSON) | Versioned prompt templates |
| `AiUsage` | id, companyId, userId?, taskType, providerId?, providerName?, modelName?, promptVersion?, promptTokens, completionTokens, totalTokens, latencyMs, estimatedCost, cacheHit, queueTimeMs, success, errorMessage?, idempotencyKey (unique), metadata (JSON), createdAt | Usage tracking with idempotency |

### New Enums

| Enum | Values |
|---|---|
| `AiProviderStatus` | ACTIVE, DEGRADED, DOWN, DISABLED |
| `TaskType` | PRODUCT_DESCRIPTION, SEO_GENERATION, TRANSLATION, SPEC_SUGGESTION, IMAGE_SUGGESTION, QUALITY_SCORING, DUPLICATE_DETECTION, OCR, FAST_SUGGESTION, LIVE_SEARCH, WEBSITE_IMPORT, RFQ_ANALYSIS, QUOTE_ANALYSIS, NEGOTIATION, CRM_ANALYSIS, FINANCE_ANALYSIS, GENERAL_CHAT |
| `AiCreditPeriod` | MONTHLY, LIFETIME, PER_BUSINESS |

## Task Routing

Default routing configuration in `ProviderRouterService`:

| Task | Preferred Provider | Fallback |
|---|---|---|
| PRODUCT_DESCRIPTION | OpenRouter | Best by priority |
| SEO_GENERATION | OpenRouter | Best by priority |
| TRANSLATION | OpenRouter | Best by priority |
| SPEC_SUGGESTION | Groq | Best by priority |
| IMAGE_SUGGESTION | OpenRouter | Best by priority |
| QUALITY_SCORING | Gemini | Best by priority |
| DUPLICATE_DETECTION | Gemini | Best by priority |
| OCR | Gemini | Best by priority |
| FAST_SUGGESTION | Groq | Best by priority |
| LIVE_SEARCH | Tavily | Best by priority |
| WEBSITE_IMPORT | Firecrawl | Best by priority |
| RFQ_ANALYSIS | OpenRouter | Best by priority |
| QUOTE_ANALYSIS | OpenRouter | Best by priority |
| NEGOTIATION | OpenRouter | Best by priority |
| CRM_ANALYSIS | OpenRouter | Best by priority |
| FINANCE_ANALYSIS | OpenRouter | Best by priority |
| GENERAL_CHAT | Groq | Best by priority |

All routing is configurable — no hardcoded business logic.

## API Key Vault

- **Algorithm**: AES-256-GCM
- **Key derivation**: scrypt (master key from `AI_VAULT_MASTER_KEY` env)
- **Storage format**: `iv:authTag:ciphertext` (hex-encoded)
- **Storage location**: `AiProvider.metadata.encryptedApiKey` (JSON field)
- **Access**: `ApiKeyVaultService.encrypt()` / `decrypt()`
- **Provider instances**: Fallback to env var (e.g., `OPENROUTER_API_KEY`) when no encrypted key in DB

## AI Credits

| Task Type | Credit Cost |
|---|---|
| PRODUCT_DESCRIPTION | 10 |
| SEO_GENERATION | 5 |
| TRANSLATION | 8 |
| SPEC_SUGGESTION | 3 |
| IMAGE_SUGGESTION | 3 |
| QUALITY_SCORING | 2 |
| DUPLICATE_DETECTION | 5 |
| OCR | 10 |
| FAST_SUGGESTION | 1 |
| LIVE_SEARCH | 2 |
| WEBSITE_IMPORT | 15 |
| RFQ_ANALYSIS | 15 |
| QUOTE_ANALYSIS | 15 |
| NEGOTIATION | 20 |
| CRM_ANALYSIS | 5 |
| FINANCE_ANALYSIS | 10 |
| GENERAL_CHAT | 1 |

Credit allocation per plan is stored in `PlanFeature` (feature='ai_credits', value='500') or `MembershipPlan.features.aiCredits`. Default: 20 credits for free plans.

## Circuit Breaker

- **Failure threshold**: 5 consecutive failures
- **Recovery timeout**: 60 seconds
- **Half-open**: After timeout, next request probes provider
- **State**: Tracked in `AiProvider.circuitOpen` + `circuitOpenUntil`
- **Auto-recovery**: `isCircuitOpen()` checks expiry and resets automatically

## Redis Cache

- **Cache key format**: `ai:gateway:{taskType}:{md5(payload + overrides)}`
- **Default TTL**: 3600 seconds (configurable via `AI_CACHE_TTL_SECONDS`)
- **Enabled by default**: Configurable via `AI_CACHE_ENABLED`
- **Cache stores**: Full response JSON including provider, model, tokens, cost
- **Cache hit tracking**: Usage records with `cacheHit: true`

## Queue

- **Queue name**: `ai` (BullMQ, added to `QueueNames.AI`)
- **Processor**: `AiProcessor` in `apps/api/src/jobs/ai.processor.ts`
- **Job types**: PROCESS_BULK, GENERATE_DESCRIPTION, GENERATE_SEO, TRANSLATE, SUGGEST_SPECS, SUGGEST_IMAGES, QUALITY_SCORE, DUPLICATE_DETECT
- **Data interface**: `AiJobData` with companyId, userId, productIds, options
- **Dead letter**: Reuses existing BullMQ dead letter mechanism

## Admin Dashboard

**Route**: `/admin/ai-infrastructure`

**Tabs**:
1. **Providers** — Table with name, type, priority, health status, circuit breaker state, failure count, timeout, rate limit, last check time. "Check All Health" button.
2. **Prompts** — Table with task type, version, name, active status, temperature, max tokens, provider override, created date.
3. **Usage** — Provider breakdown (requests/tokens/cost), top features, top companies.

**Dashboard cards**: Total requests, total tokens, total cost, today requests.

## API Endpoints

### AI Gateway (`/ai-gateway`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai-gateway/process` | SELLER, ADMIN | Process an AI request (main entry point) |
| GET | `/ai-gateway/providers` | ADMIN | List providers (paginated, filterable) |
| GET | `/ai-gateway/providers/:name` | ADMIN | Get provider details |
| POST | `/ai-gateway/providers` | ADMIN | Create provider |
| PATCH | `/ai-gateway/providers/:name` | ADMIN | Update provider |
| POST | `/ai-gateway/providers/api-key` | ADMIN | Set encrypted API key |
| POST | `/ai-gateway/providers/:name/health` | ADMIN | Check single provider health |
| POST | `/ai-gateway/providers/health/all` | ADMIN | Check all providers health |
| GET | `/ai-gateway/prompts` | ADMIN | List prompts (paginated, filterable) |
| POST | `/ai-gateway/prompts` | ADMIN | Create prompt version |
| PATCH | `/ai-gateway/prompts/:id` | ADMIN | Update prompt |
| POST | `/ai-gateway/prompts/:id/activate` | ADMIN | Activate prompt (deactivates others) |
| GET | `/ai-gateway/prompts/versions/:taskType` | ADMIN | Get version history |
| GET | `/ai-gateway/prompts/:taskType/active` | ADMIN, SELLER | Get active prompt |

### Admin Dashboard (`/admin/ai-gateway`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/ai-gateway/dashboard` | ADMIN | Full dashboard data (usage, health, features, companies, spend) |
| GET | `/admin/ai-gateway/usage` | ADMIN | Usage data (by company or global stats) |
| GET | `/admin/ai-gateway/usage/daily` | ADMIN | Daily usage stats |
| GET | `/admin/ai-gateway/usage/features` | ADMIN | Top features by usage |
| GET | `/admin/ai-gateway/usage/companies` | ADMIN | Top companies by usage |
| GET | `/admin/ai-gateway/cost/platform` | ADMIN | Platform spend (filter by date) |
| GET | `/admin/ai-gateway/health` | ADMIN | Provider health dashboard |
| POST | `/admin/ai-gateway/health/check-all` | ADMIN | Trigger all health checks |

## Environment Variables

```
AI_CACHE_ENABLED=true
AI_CACHE_TTL_SECONDS=3600
AI_VAULT_MASTER_KEY=<64-char-random>

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
GEMINI_API_KEY=
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
TAVILY_API_KEY=
TAVILY_BASE_URL=https://api.tavily.com
FIRECRAWL_API_KEY=
FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1
```

## Future Provider Integration

To add a new provider (e.g., DeepSeek):

1. Create `providers/deepseek.provider.ts` implementing `BaseAiProvider`
2. Register in `provider-registry.service.ts` constructor
3. Add `DEEPSEEK_API_KEY` and `DEEPSEEK_BASE_URL` to `.env`
4. Create `AiProvider` record via admin API or seed with supported tasks and cost config
5. No gateway, router, or prompt manager changes needed

## Verification

| Check | Status |
|---|---|
| `prisma validate` | ✅ PASS |
| `prisma generate` | ✅ PASS |
| `tsc (api)` | ✅ 0 errors |
| `tsc (web)` | ✅ 0 errors |
| `eslint` | ✅ 0 errors (20 warnings — `any` type) |
| `next build` | ✅ 191 routes |
