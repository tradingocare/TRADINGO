# TRADINGO Shared Services

> Every reusable backend service documented with purpose, dependencies, and consumers.

## Core Infrastructure Services

### PrismaService
- **File**: `apps/api/src/prisma/prisma.service.ts`
- **Purpose**: PrismaClient wrapper, extends `PrismaClient`
- **Global**: Yes (`@Global()` module)
- **Dependencies**: `@prisma/client`
- **Used by**: Every module

### RedisService
- **File**: `apps/api/src/common/services/redis.service.ts`
- **Purpose**: Wraps ioredis (get/set/del/incr/expire/exists/ttl)
- **Global**: Yes (`@Global()` module)
- **Consumers**: AI Gateway (cache, idempotency), Chat (pub/sub), Session management

### AiGatewayService
- **File**: `apps/api/src/modules/ai-gateway/ai-gateway.service.ts`
- **Purpose**: Unified AI processing pipeline (validate, check credits, route, get prompt, execute with fallback, track usage, cache)
- **Consumers**: AiSearchService, AiFinanceService, AiAdminService, AiNegotiationService, AiRfqService, AiQuoteService, AiCrmService, FounderAiService

### GocashService
- **File**: `apps/api/src/modules/gocash/gocash.service.ts`
- **Purpose**: Core ledger engine (createWallet, credit, debit, reverse, redeem, approve/reject redemption, getBalance, getLedger)
- **Consumers**: WalletApiService, GocashIntegrationService, ReferralService, CampaignService, AdvertisingService

### NotificationService
- **File**: `apps/api/src/modules/notification/notification.service.ts`
- **Purpose**: Create notifications, deliver via in-app/email/SMS with templates
- **Consumers**: Every module that needs to notify users

### AnalyticsService
- **File**: `apps/api/src/modules/analytics/analytics.service.ts`
- **Purpose**: Dashboard analytics, event ingestion, ClickHouse queries
- **Consumers**: Admin dashboard, Founder AI, Seller analytics

### TradTrustService
- **File**: `apps/api/src/modules/tradtrust/tradtrust.service.ts`
- **Purpose**: 6-dimension trust scoring engine
- **Consumers**: SmartNegotiationService, MarketplaceIntelligenceService

## Shared Utility Services

### RedisService (Common)
Redis operations for caching, distributed locks, pub/sub.

### ClickhouseService
- **File**: `apps/api/src/modules/analytics/clickhouse.service.ts`
- **Purpose**: ClickHouse client for analytical queries
- **Consumers**: AnalyticsService

### EventIngestionService
- **File**: `apps/api/src/modules/analytics/event-ingestion.service.ts`
- **Purpose**: Ingests business events into ClickHouse
- **Consumers**: AnalyticsService

### PrismaService
- **File**: `apps/api/src/prisma/prisma.service.ts`
- **Purpose**: Prisma client with auto-connect

## Job Processors (BullMQ)

| Queue | Processor | Files | Purpose |
|-------|-----------|-------|---------|
| EMAIL | email.processor.ts | 1 | Send transactional emails |
| EXPORT | export.processor.ts | 1 | Generate CSV/PDF exports |
| NOTIFICATION | notification.processor.ts | 1 | Process notification delivery |
| CERTIFICATION | certification.processor.ts | 1 | Check cert expiry, recalculate trust |
| SUBSCRIPTION | subscription.processor.ts | 1 | Renewal check, grace, expiry |
| RFQ | rfq.processor.ts | 1 | Expire RFQs, credit packs, quotes |
| ESCROW | escrow.processor.ts | 1 | Auto-release, expiry monitor |
| SETTLEMENT | settlement.processor.ts | 1 | Process settlements, retries |
| DISPUTE | dispute.processor.ts | 1 | Expire disputes, SLA breach |
| ANALYTICS | analytics.processor.ts | 1 | Batch analytics processing |
| MALWARE | malware.processor.ts | 1 | File scan processing |
| BESTSELLER | bestseller.processor.ts | 1 | Weekly bestseller calculation |
| AI | ai.processor.ts | 1 | Bulk AI processing |

## AI Provider Services

All located in `apps/api/src/modules/ai-gateway/providers/`:

| Provider | File | Tasks | Extension |
|----------|------|-------|-----------|
| OpenRouterProvider | openrouter.provider.ts | 14 task types | `fetchWithRetry` + AbortController SSE |
| GeminiProvider | gemini.provider.ts | OCR, scoring, detection | Google AI SDK |
| GroqProvider | groq.provider.ts | Fast suggestions, chat | Groq SDK |
| TavilyProvider | tavily.provider.ts | Live search | Tavily Search API |
| FirecrawlProvider | firecrawl.provider.ts | Website import | Firecrawl API |

All extend `BaseAiProvider` which provides:
- `fetchWithRetry()` — Exponential backoff (max 3 retries)
- `estimateTokens()` — Character/4 approximation
- `parseTokenCount()` — Provider-specific token parsing

## Shared Pattern: AI Sub-Module

Every AI sub-module follows this exact pattern:
1. Inject `AiGatewayService` + `PromptManagerService`
2. Call `aiGateway.process()` with their `TaskType`
3. Auto-seed their prompt in `onModuleInit()`
4. Expose typed methods returning `AiGatewayResponseDto`
5. Credit enforcement happens in `AiGatewayService.process()` before any AI call
