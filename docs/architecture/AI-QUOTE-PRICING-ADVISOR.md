# AI Quote & Pricing Advisor — Phase 16.6E

## Architecture

The AI Quote & Pricing Advisor is a sell-side AI system that generates quotes, recommends prices, predicts win probability, analyzes margins, assesses competitiveness, reviews quotes, prepares negotiation strategies, evaluates risk, and scores quote quality — all through the existing AI Gateway.

### Design Principles

- **NO duplicate Quote engine** — extends Smart Quote, Smart Negotiation, Analytics
- **NO duplicate Pricing engine** — reuses TradTrust, Finance, Membership
- **Business logic never depends on any specific AI provider**
- **All AI requests flow through the existing AI Gateway** (`AiGatewayService.process()`)
- **Never hardcode prompts** — all prompts come from Prompt Manager (auto-seeded on module init)
- **Never hardcode models** — all provider selection comes from Provider Router
- **Never call providers directly** — use AI Gateway only
- **All 10 features share `QUOTE_ANALYSIS` TaskType** with different `action` payload fields

### Module Structure

```
apps/api/src/modules/quote/
  ai-quote.service.ts          — 10-method service calling AI Gateway
  ai-quote.controller.ts       — 10 endpoints under POST /companies/:companyId/quote/ai/:action
  dto/ai-quote.dto.ts          — 10 request DTOs + AiQuoteResponse<T> interface
  quote.module.ts              — Updated: imports AiGatewayModule + TradTrustModule
```

```
apps/web/
  lib/api/ai-quote.ts          — 10 typed API functions
  hooks/use-ai-quote.ts        — 10 React Query mutation hooks
  components/quote/ai-quote-sidebar.tsx — Reusable AI sidebar component
  app/seller/quote/new/page.tsx         — Extended with AI Advisor toggle + result display
```

## 10 AI Features

| # | Action | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | `generate` | `POST /companies/:id/quote/ai/generate` | Generate quote from natural language or RFQ context |
| 2 | `price-recommendation` | `POST .../price-recommendation` | Recommend optimal pricing based on market data |
| 3 | `winning-probability` | `POST .../winning-probability` | Predict win probability using price, delivery, trust, competition |
| 4 | `margin-analysis` | `POST .../margin-analysis` | Analyze profit margins with recommendations |
| 5 | `competitiveness` | `POST .../competitiveness` | Score quote competitiveness against benchmarks |
| 6 | `review` | `POST .../review` | Review quote for completeness, errors, improvements |
| 7 | `negotiation-prep` | `POST .../negotiation-prep` | Prepare negotiation strategy using buyer history |
| 8 | `risk-assessment` | `POST .../risk-assessment` | Assess buyer credit and trust risk |
| 9 | `quality-score` | `POST .../quality-score` | Score quote quality and completeness |
| 10 | `sidebar` | `POST .../sidebar` | All-in-one sidebar data for quote builder |

## Data Flow

```
Seller clicks AI button in Quote Builder
  → useAiQuoteSidebar mutation
  → POST /companies/:cid/quote/ai/sidebar
  → AiQuoteController.sidebar()
  → AiQuoteService.sidebar()
    → Enriches context with TradTrust score
    → Calls AiGatewayService.process() with QUOTE_ANALYSIS task
  → AiGatewayService
    → Checks credits via AiCreditsService
    → Routes to provider via ProviderRouterService
    → Gets prompt from PromptManagerService
    → Calls provider (OpenRouter/Gemini/Groq)
    → Tracks usage via UsageTrackerService
    → Calculates cost via CostEngineService
  → Returns structured JSON response
  → Displayed in AI Advisor result panel
```

## Frontend Architecture

### AiQuoteSidebar Component

Reusable component with 4 tabs:
- **Pricing** — Price Recommendation, Win Probability, Competitiveness Score
- **Analysis** — Margin Analysis, Risk Assessment, Quote Review
- **Strategy** — Negotiation Prep
- **Quality** — Quality Score

Each tab contains action buttons that call the corresponding backend endpoint. Results appear in a collapsible panel below the sidebar.

### Integration in Quote Builder

The existing `/seller/quote/new/page.tsx` now has:
- AI Advisor toggle button in header (`Sparkles` icon)
- AiQuoteSidebar replaces Quick Tips card when toggled
- Result display panel with close button
- Loading state with spinner
- Toast notifications on success/failure
- All 8 hooks imported and wired (`useAiPriceRecommendation`, `useAiWinningProbability`, etc.)

## Backend Implementation

### AiQuoteService

Located at `apps/api/src/modules/quote/ai-quote.service.ts`

Key behaviors:
- **`onModuleInit()`** — Auto-seeds a `QUOTE_ANALYSIS` prompt if none exists (ensures the Gateway fallback is never the generic JSON prompt)
- **`generate()`** — Fetches RFQ data + company profile for context enrichment
- **`winningProbability()`** — Enriches with TradTrust unified score (grade + risk level), RFQ budget range
- **`negotiationPrep()`** — Queries past negotiations between seller and same buyer
- **`sidebar()`** — Combines all context into one call for the quote builder
- **`riskAssessment()`** — Enriches with buyer company profile data

All methods call `this.aiGateway.process()` — never call providers directly.

### TaskType

All 10 features use the existing `TaskType.QUOTE_ANALYSIS` enum (no new TaskType values). The `action` field in the payload differentiates behavior:
```
payload: { action: 'generate_quote', context: { ... } }
```

### Auto-Seeded Prompt

On `onModuleInit()`, if no `QUOTE_ANALYSIS` prompt exists in the `aiPrompt` table, a default prompt is created with:
- `systemPrompt`: Role definition for TRADINGO AI Quote & Pricing Advisor
- `userPrompt`: Template with `{{action}}` and `{{context}}` variables
- `temperature`: 0.3 (low for structured JSON output)
- `maxTokens`: 4096

### DTOs

10 request DTOs in `dto/ai-quote.dto.ts`:
- `AiQuoteGenerateDto` — rfqId, naturalLanguage, rfqData
- `AiQuotePriceRecommendationDto` — productName, basePrice, currency, quantity, unit, deliveryTerms, marketContext
- `AiQuoteWinningProbabilityDto` — quoteId, totalAmount, leadTimeDays, trustScore, responseRate, deliveryTerms, competitorQuotes
- `AiQuoteMarginAnalysisDto` — subtotal, totalAmount, taxAmount, discountAmount, estimatedCostOfGoods, shippingCost, platformFee, lineItems
- `AiQuoteCompetitivenessDto` — totalAmount, leadTimeDays, trustScore, deliveryTerms, paymentTerms, categoryName, marketQuotes
- `AiQuoteReviewDto` — quoteId, quoteData, language, strictness
- `AiQuoteNegotiationPrepDto` — quoteId, buyerId, quoteData, buyerProfile, pastNegotiations
- `AiQuoteRiskAssessmentDto` — buyerId, buyerCompanyId, buyerProfile, creditStatus, trustScore, verificationLevel, quoteAmount
- `AiQuoteQualityScoreDto` — quoteData, language
- `AiQuoteSidebarDto` — rfqData, formData, lineItems, companyProfile, buyerProfile

All use class-validator decorators.

## Future Enhancements

- **AI Credits enforcement** — Wire to Membership Engine (TRAD UP 20, Trade Smart 500, Enterprise configurable)
- **Sidebar SSE streaming** — Use `POST /ai-gateway/stream` for real-time AI response streaming in sidebar
- **Quote revision suggestions** — AI analysis of competitor quotes for revision strategy
- **Bulk AI analysis** — Run quality score / competitiveness across all quotes in a seller's portfolio
- **Historical win analysis** — ML-based win probability using historical quote acceptance data

## Verification Status

| Check | Status |
|-------|--------|
| prisma validate | ✅ |
| tsc (api) | ✅ 0 errors |
| tsc (web) | ✅ 0 errors |
| next build | ✅ 191 routes |

## Files Changed/Created

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/modules/quote/dto/ai-quote.dto.ts` | CREATED | 10 request DTOs + response interface |
| `apps/api/src/modules/quote/ai-quote.service.ts` | CREATED | 10-method AI Quote service |
| `apps/api/src/modules/quote/ai-quote.controller.ts` | CREATED | 10 AI Quote endpoints |
| `apps/api/src/modules/quote/quote.module.ts` | MODIFIED | Added AiQuoteService, AiQuoteController, imports AiGatewayModule + TradTrustModule |
| `apps/web/lib/api/ai-quote.ts` | CREATED | 10 typed frontend API functions |
| `apps/web/hooks/use-ai-quote.ts` | CREATED | 10 React Query hooks |
| `apps/web/components/quote/ai-quote-sidebar.tsx` | CREATED | AI Quote Advisor sidebar component |
| `apps/web/app/seller/quote/new/page.tsx` | MODIFIED | Integrated AI Advisor toggle + hooks + result panel |
| `AI-QUOTE-PRICING-ADVISOR.md` | CREATED | This architecture document |
