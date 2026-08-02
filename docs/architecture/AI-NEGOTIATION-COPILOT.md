# AI Negotiation Copilot — Phase 16.6F

## Architecture

The AI Negotiation Copilot is a dual-party AI system that helps both buyers and sellers negotiate more effectively. All AI requests flow through the existing AI Gateway — never calling providers directly.

### Design Principles

- **NO duplicate Negotiation module** — extends Smart Negotiation (14 endpoints, 15 methods)
- **NO duplicate Quote/Pricing logic** — reuses QuoteService, AiQuoteService, TradTrustService
- **All 12 features use `TaskType.NEGOTIATION`** (already exists, costs 20 credits)
- **Provider-agnostic** — all requests via `AiGatewayService.process()`
- **Never hardcode prompts** — auto-seeded on module init via `PromptManagerService`
- **Never hardcode models** — routed via `ProviderRouterService`
- **Suggestions only, never auto-send**
- **AI Memory** summarized from RFQ + Quote + Negotiation + Orders + CRM — never resends unnecessary context

### Module Structure

```
apps/api/src/modules/smart-negotiation/
  ai-negotiation.service.ts       — 12-method service calling AI Gateway
  ai-negotiation.controller.ts    — 12 endpoints under POST /smart-negotiation/:id/ai/:action
  dto/ai-negotiation.dto.ts       — 12 request DTOs
  smart-negotiation.module.ts     — Updated: imports AiGatewayModule + QuoteModule + TradTrustModule
```

```
apps/web/
  lib/api/ai-negotiation.ts           — 12 typed API functions
  hooks/use-ai-negotiation.ts         — 12 React Query mutation hooks
  components/negotiation/ai-negotiation-copilot.tsx — Reusable AI sidebar (5 tabs)
  app/seller/negotiation/[id]/page.tsx — Extended with AI Copilot toggle
  app/buyer/negotiation/[id]/page.tsx  — Extended with AI Copilot toggle
```

## 12 AI Features

| # | Action | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | `strategy` | `POST /smart-negotiation/:id/ai/strategy` | Generate counter offer, walk-away price, discount, sequence, closing strategy |
| 2 | `buyer-behavior` | `POST .../buyer-behavior` | Analyze price sensitivity, response speed, style, intent, historical acceptance |
| 3 | `seller-suggestions` | `POST .../seller-suggestions` | Suggest price/delivery/warranty/payment improvements |
| 4 | `sentiment` | `POST .../sentiment` | Positive/neutral/negative with confidence % |
| 5 | `probability` | `POST .../probability` | Deal closing %, reason, confidence, improvement tips |
| 6 | `replies` | `POST .../replies` | Professional/short/commercial/escalation replies (editable) |
| 7 | `risk` | `POST .../risk` | Payment risk, fraud signals, unrealistic demands |
| 8 | `summary` | `POST .../summary` | Key points, agreements, pending issues, action items |
| 9 | `translate` | `POST .../translate` | Multi-language via existing TRANSLATION TaskType |
| 10 | `memory` | `POST .../memory` | Summarized context from RFQ/Quote/Negotiation/Orders/CRM |
| 11 | `timeline` | `POST .../timeline` | Offer history, counter offers, AI suggestions, outcome |
| 12 | `sidebar` | `POST .../sidebar` | All-in-one data for negotiation detail page |

## Data Flow

```
Seller/Buyer clicks AI button on Negotiation Detail page
  → useAiNegotiationStrategy mutation
  → POST /smart-negotiation/:id/ai/strategy
  → AiNegotiationController.strategy()
  → AiNegotiationService.generateStrategy()
    → Enriches context with TradTrust score
    → Calls AiGatewayService.process() with NEGOTIATION task
  → AiGatewayService
    → Checks credits via AiCreditsService (20 credits)
    → Routes to provider via ProviderRouterService
    → Gets prompt from PromptManagerService (auto-seeded)
    → Calls provider (OpenRouter/Gemini/Groq)
    → Tracks usage via UsageTrackerService
    → Calculates cost via CostEngineService
  → Returns structured JSON response
  → Displayed in AI Copilot result panel
```

## AI Memory Architecture

```
User clicks "AI Memory"
  → Service fetches from 5 sources:
    1. RFQ — title, status, budget, currency, createdAt
    2. Quote — amount, currency, status, leadTime, terms, version
    3. Negotiation — status, createdAt, versionCount
    4. Buyer Company — name, trustScore, verificationLevel, TradTrust grade
    5. Seller Company — name, trustScore, verificationLevel, TradTrust grade
  → Summarized into single context payload (never resends raw history)
  → Sent to AI Gateway for analysis
```

## Frontend Architecture

### AiNegotiationCopilot Component

Reusable component with 5 tabs:
- **Strategy** — Generate Strategy, Deal Probability, Timeline Analysis
- **Behaviour** — Buyer Behaviour (seller), Seller Improvements (seller) / Seller Insights (buyer), Sentiment Analysis
- **Risk** — Risk Detection, AI Memory Context
- **Comm.** — Tone selector (Professional/Short/Commercial/Escalation), Suggested Replies, Sentiment Analysis
- **Summary** — Conversation Summary

### Integration in Negotiation Detail Pages

Both seller and buyer negotiation detail pages now have:
- AI Copilot toggle button in header (`Sparkles` icon)
- AiNegotiationCopilot replaces Quote Info/Details card when toggled
- Result display panel with close button (`XCircle`)
- Loading state with spinner
- Toast notifications on success/failure (`useToast`)

### Context Enrichment Per Feature

| Feature | Data Enriched From |
|---------|-------------------|
| Strategy | Negotiation data, Quote data, TradTrust unified score |
| Buyer Behavior | Buyer company (trustScore, verificationLevel, responseRate), TradTrust grade, RFQ history, past negotiations |
| Seller Suggestions | Negotiation data, current offer, TradTrust score |
| Sentiment | Chat messages, negotiation events |
| Deal Probability | Negotiation data, seller trust score, buyer trust score, total rounds, status, TradTrust grade |
| Suggested Replies | Role, tone, negotiation context |
| Risk Detection | Negotiation data, buyer credit status, trust score, verification level, quote amount |
| Conversation Summary | Chat messages, negotiation events, versions |
| AI Memory | RFQ, Quote, Negotiation (with version count), Buyer/Seller company, TradTrust grades |
| Timeline | Versions, events |

## Prompt Management

On `onModuleInit()`, if no `NEGOTIATION` prompt exists in the `aiPrompt` table, a default prompt is created with:
- `systemPrompt`: Role definition for TRADINGO AI Negotiation Copilot
- `userPrompt`: Template with `{{action}}` and `{{context}}` variables
- `temperature`: 0.3 (low for structured JSON output)
- `maxTokens`: 4096

## Credit Cost

Uses existing `CREDIT_COSTS[NEGOTIATION] = 20` credits per call.

## Verification Results

| Check | Status |
|-------|--------|
| prisma validate | ✅ |
| prisma generate | ✅ |
| tsc (api) | ✅ 0 errors |
| tsc (web) | ✅ 0 errors |
| next build | ✅ 191 routes |

## Files Changed/Created

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/modules/smart-negotiation/dto/ai-negotiation.dto.ts` | CREATED | 12 request DTOs with class-validator |
| `apps/api/src/modules/smart-negotiation/ai-negotiation.service.ts` | CREATED | 12-method AI service seeding prompts, enriching context, calling AI Gateway |
| `apps/api/src/modules/smart-negotiation/ai-negotiation.controller.ts` | CREATED | 12 AI endpoints under /smart-negotiation/:id/ai |
| `apps/api/src/modules/smart-negotiation/smart-negotiation.module.ts` | MODIFIED | Added AiNegotiationService, AiNegotiationController, imports AiGatewayModule + QuoteModule + TradTrustModule |
| `apps/api/src/modules/quote/quote.module.ts` | MODIFIED | Fixed missing AiQuoteService export |
| `apps/web/lib/api/ai-negotiation.ts` | CREATED | 12 typed frontend API functions |
| `apps/web/hooks/use-ai-negotiation.ts` | CREATED | 12 React Query mutation hooks |
| `apps/web/components/negotiation/ai-negotiation-copilot.tsx` | CREATED | Reusable AI copilot sidebar with 5 tabs |
| `apps/web/app/seller/negotiation/[id]/page.tsx` | MODIFIED | Integrated AI Copilot toggle + sidebar + result panel |
| `apps/web/app/buyer/negotiation/[id]/page.tsx` | MODIFIED | Integrated AI Copilot toggle + sidebar + result panel |
| `AI-NEGOTIATION-COPILOT.md` | CREATED | This architecture document |

## Components Reused

| Component | How Reused |
|-----------|------------|
| SmartNegotiationService | Negotiation CRUD + context for AI |
| QuoteService | Quote data for AI memory |
| AiQuoteService | Quote analysis features |
| TradTrustService | Trust scores, risk levels, grades |
| AiGatewayService | All AI processing |
| PromptManagerService | Prompt seeding + retrieval |
| UsageTrackerService | Token/credit tracking |
| CostEngineService | Cost calculation |
| ModelRegistryService | Model selection |
| AiCreditsService | Credit checking |
| DashboardPageHeader | Header with actions |
| StatusBadge | Status display |
| Button, Input, Label | UI components |
| useToast | Toast notifications |
| Lucide icons | Icons (Sparkles, CheckCircle, XCircle, etc.) |
