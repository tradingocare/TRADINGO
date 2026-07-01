# AI RFQ Intelligence — Phase 16.6D

## Architecture

```
Buyer types natural language → AI RFQ Copilot (Frontend)
  → AiRfqService calls AiGatewayService.process()
    → PromptManagerService renders RFQ prompt template
    → ProviderRouter routes to OpenRouter (gpt-4o-mini)
    → AiCreditsService checks/deducts credits (RFQ_ANALYSIS=15)
    → Provider executes → JSON response
    → UsageTrackerService records all usage
    → CostEngineService calculates cost
  → Parsed structured RFQ data returned to frontend
```

## Existing vs New Report

### Existing (Reused Without Modification)

| Module | Role in RFQ Intelligence |
|---|---|
| **AiGatewayService** (`ai-gateway.service.ts`) | Full pipeline: credit check, cache lookup, routing, prompt rendering, circuit breaker, provider execution, fallback, cost calc, usage tracking |
| **PromptManagerService** (`prompt-manager.service.ts`) | Variable injection via `renderPrompt()` |
| **ProviderRouterService** (`provider-router.service.ts`) | Routes `RFQ_ANALYSIS` to OpenRouter (gpt-4o-mini) with Gemini/Groq fallback |
| **ProviderHealthService** (`provider-health.service.ts`) | Circuit breaker protects RFQ AI calls |
| **AiCreditsService** (`ai-credits.service.ts`) | `CREDIT_COSTS[RFQ_ANALYSIS]=15`, checks plan-based credits |
| **ModelRegistryService** (`model-registry.service.ts`) | `getBestModelForTask('RFQ_ANALYSIS')` → gpt-4o-mini |
| **CostEngineService** (`cost-engine.service.ts`) | Calculates per-token cost for RFQ analysis |
| **UsageTrackerService** (`usage-tracker.service.ts`) | Records all RFQ AI usage with full metadata |
| **SmartRfqService** (`smart-rfq.service.ts`) | `getRfqQualityMetrics()`, `getQuotePerformanceMetrics()` — statistical baseline |
| **NearToFarService** (`near-to-far.service.ts`) | Weighted supplier scoring framework (geo 30%, trust 20%, verification 15%, response 20%, plan 15%) |
| **Prisma Rfq model** | Full data model: title, description, productItems, locations, vendorMatches, budget, etc. |
| **Prisma RfqVendorMatch** | Multi-dimensional scoring fields (matchScore, categoryScore, geoScore, trustScore, etc.) |
| **TaskType enum** | `RFQ_ANALYSIS`, `QUOTE_ANALYSIS`, `NEGOTIATION` already exist |
| **OpenRouter/Gemini/Groq providers** | HTTP implementations with retry, timeout, streaming, token counting |

### New (Built in Phase 16.6D)

| File | Type | Purpose |
|---|---|---|
| `apps/api/src/modules/smart-rfq/ai-rfq.service.ts` | Service | Core AI RFQ Intelligence with 10 features |
| `apps/api/src/modules/smart-rfq/dto/ai-rfq.dto.ts` | DTO | 10 request + 6 response DTOs with class-validator |
| `apps/web/lib/api/ai-rfq.ts` | Frontend API | 10 typed API functions matching backend endpoints |
| `apps/web/hooks/use-ai-rfq.ts` | Hooks | 10 React Query mutation hooks |
| `apps/web/components/rfq/ai-rfq-copilot.tsx` | Component | AI Copilot sidebar with 4 tabs (generate/analyze/quality/category) |

### Modified

| File | Change |
|---|---|
| `smart-rfq.controller.ts` | Added 10 AI endpoints (from-text, refine, detect-missing, detect-duplicates, predict-category, suggest-products, suggest-suppliers, quality-score, translate, assistant) |
| `smart-rfq.module.ts` | Imported `AiGatewayModule`, registered `AiRfqService` |
| `steps/StepRequirement.tsx` | Added AI Copilot toggle, natural language textarea, dynamic import of AI API functions |

## Files Modified

1. `apps/api/src/modules/smart-rfq/smart-rfq.controller.ts` — 10 new endpoints added
2. `apps/api/src/modules/smart-rfq/smart-rfq.module.ts` — Import AiGatewayModule, register AiRfqService
3. `apps/web/app/buyer/rfq/new/steps/StepRequirement.tsx` — AI Copilot integration, natural language input

## Files Created

1. `apps/api/src/modules/smart-rfq/ai-rfq.service.ts` — 10-feature AI RFQ service
2. `apps/api/src/modules/smart-rfq/dto/ai-rfq.dto.ts` — 16 DTOs for AI RFQ endpoints
3. `apps/web/lib/api/ai-rfq.ts` — 10 typed frontend API functions
4. `apps/web/hooks/use-ai-rfq.ts` — 10 React Query hooks
5. `apps/web/components/rfq/ai-rfq-copilot.tsx` — AI Copilot component

## Components Reused

| Component | Source | Usage |
|---|---|---|
| `AiGatewayService` | `ai-gateway.module` | All 10 features call `process()` |
| `AiCreditsService` | `ai-gateway.module` | `checkCredits()` before all AI calls |
| `PromptManagerService` | `ai-gateway.module` | Prompt rendering with variables |
| `ProviderRouterService` | `ai-gateway.module` | Task-to-provider routing |
| `ProviderHealthService` | `ai-gateway.module` | Circuit breaker |
| `UsageTrackerService` | `ai-gateway.module` | Usage recording |
| `CostEngineService` | `ai-gateway.module` | Cost calculation |
| `ModelRegistryService` | `ai-gateway.module` | Model recommendations |
| `PrismaService` | `prisma.module` | All DB queries |
| `SmartRfqService` | `smart-rfq.module` | Existing RFQ CRUD |
| `NearToFarService` | `smart-rfq.module` | Supplier scoring framework |

## AI RFQ Features Added

### 1. Natural Language RFQ
- **Endpoint**: `POST /smart-rfq/ai/generate-from-text`
- **Input**: `"I need 500kg food grade cocoa powder every month in Delhi"`
- **Output**: `GeneratedRfq` with title, description, category, quantity, unit, deliveryLocation, deliveryTimeline, budgetMin, budgetMax, specifications[], suggestedTags[]
- **AI Gateway**: `RFQ_ANALYSIS` → OpenRouter gpt-4o-mini

### 2. AI Requirement Refinement
- **Endpoint**: `POST /smart-rfq/:id/ai/refine`
- **Input**: rfqId + optional focusArea
- **Output**: improvedTitle, improvedDescription, additionalSpecs[], suggestions[]
- **Fetches existing RFQ** from DB, sends to AI Gateway for improvement

### 3. Missing Information Detection
- **Endpoint**: `POST /smart-rfq/ai/detect-missing`
- **Input**: Partial rfqData
- **Output**: `MissingField[]` — each with field name, label, reason (why it matters), suggestion (what to enter)
- **AI Gateway** analyzes which fields are incomplete and why they matter

### 4. Duplicate RFQ Detection
- **Endpoint**: `POST /smart-rfq/ai/detect-duplicates`
- **Two-phase**: AI generates search keywords → Prisma fuzzy search on title/description → Jaccard similarity scoring → sorted by similarity
- **Output**: `DuplicateRfq[]` with rfqId, title, similarityScore (0-100), status, createdAt
- **No dedicated AI call for comparison** — uses title similarity + Jaccard coefficient

### 5. AI Category Prediction
- **Endpoint**: `POST /smart-rfq/ai/predict-category`
- **Input**: productName, description
- **Output**: categoryName, categoryPath (e.g. "Food & Beverages > Cocoa > Cocoa Powder"), confidence (0-100), alternatives[], categoryId (matched from DB)
- **Matches AI prediction** against actual Category table for a concrete ID

### 6. AI Product Suggestions
- **Endpoint**: `POST /smart-rfq/ai/suggest-products`
- **Two-phase**: AI generates product specs/units/price ranges → Prisma Product search by name similarity
- **Output**: `{ aiSuggestions[], catalogProducts[] }`

### 7. AI Supplier Suggestions
- **Endpoint**: `POST /smart-rfq/:id/ai/suggest-suppliers`
- **Two-phase**: AI generates supplier criteria from RFQ (target categories, industries, location, trust) → Prisma Company query with sorting by relevanceScore (trust*0.6 + verification*15 + products*0.1)
- **Output**: `{ matchingCriteria, suppliers[] }` with matchReason and relevanceScore

### 8. RFQ Quality Score
- **Endpoint**: `POST /smart-rfq/ai/quality-score`
- **Algorithm**: 7 criteria (Title 20, Description 20, Category 15, Products 15, Qty/Unit 10, Location 10, Budget 10) → weighted score (0-100)
- **AI enhancement**: AI analyzes the score breakdown and generates improvement suggestions and strengths
- **Output**: `{ score, maxScore, breakdown[], improvements[], strengths[] }`

### 9. Multi-language RFQ
- **Endpoint**: `POST /smart-rfq/:id/ai/translate`
- **Input**: rfqId, targetLanguage
- **Output**: translatedTitle, translatedDescription, translatedProductItems[]
- **AI Gateway** handles translation, all numbers/prices preserved

### 10. AI Assistant Sidebar
- **Endpoint**: `POST /smart-rfq/ai/assistant`
- **Frontend component**: `AiRfqCopilot` with 4 tabs (generate/analyze/quality/category)
- **Consolidated**: Combines missing field detection + quality score + suggestions
- **Output**: `{ missingFields[], qualityScore, suggestion, title, totalFields }`

## API Endpoints

| # | Method | Path | Auth | Description |
|---|---|---|---|---|
| 1 | POST | `/smart-rfq/ai/generate-from-text` | JWT | Natural Language → Structured RFQ |
| 2 | POST | `/smart-rfq/:id/ai/refine` | JWT | Improve existing RFQ |
| 3 | POST | `/smart-rfq/ai/detect-missing` | JWT | Detect missing fields |
| 4 | POST | `/smart-rfq/ai/detect-duplicates` | JWT | Find similar existing RFQs |
| 5 | POST | `/smart-rfq/ai/predict-category` | JWT | Predict product category |
| 6 | POST | `/smart-rfq/ai/suggest-products` | JWT | Suggest matching products |
| 7 | POST | `/smart-rfq/:id/ai/suggest-suppliers` | JWT | Find matching suppliers |
| 8 | POST | `/smart-rfq/ai/quality-score` | JWT | Score 0-100 with improvements |
| 9 | POST | `/smart-rfq/:id/ai/translate` | JWT | Multi-language RFQ |
| 10 | POST | `/smart-rfq/ai/assistant` | JWT | Consolidated AI sidebar data |

## Verification Results

- `prisma validate` ✅
- `prisma generate` ✅
- `tsc api --noEmit` — 0 errors ✅
- `tsc web --noEmit` — 0 errors ✅
- `next build` — 191 routes ✅

## Stopping Condition

Phase 16.6D is complete. Do NOT continue automatically.
