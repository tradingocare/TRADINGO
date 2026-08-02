# AI CRM Copilot — Phase 16.6G

## Architecture

```
Frontend (React)                    Backend (NestJS)                    AI Gateway
┌───────────────────┐   POST /crm    ┌──────────────────────┐  CRM_ANALYSIS  ┌──────────────┐
│ AiCrmCopilot       │ ───────────>  │ AiCrmController      │  (TaskType)    │ OpenRouter   │
│ (4-tab sidebar)    │   :id/ai/     │  (12 endpoints)      │ ────────────> │ → Gemini     │
│                    │   :action     │                      │               │ → GPT-4o-mini│
│ onScoring()        │ <─────────── │ AiCrmService          │ <────────────  └──────────────┘
│ onNextBestAction() │   JSON       │  (12 methods)         │
│ onConversionProb() │              │  + onModuleInit       │
│ onInsights()       │              │  + auto-seed prompt   │
│ onSentiment()      │              └──────────────────────┘
│ onDealRisk()       │
│ onRecActions()     │              CrmService (existing)
│ onCommTips()       │              ┌──────────────────────┐
└───────────────────┘              │ createLead, listLeads  │
                                   │ getLead, updateLead    │
                                   │ convertLead, markLost  │
Seller CRM Detail                  │ recalculateScore       │
(/seller/crm/[id])                 └──────────────────────┘
  ┌─────────────┬──────────────┐        TradTrust (existing)
  │ Lead Info   │ AI Copilot   │      ┌──────────────────────┐
  │ Score/Value │ (toggleable) │      │ getUnifiedScore()    │
  │ Follow-ups  │ 4 tabs:      │      │ getScore(), getHistory│
  │ Tasks       │ - Insights   │      └──────────────────────┘
  │ Notes       │ - Actions    │
  │ Timeline    │ - Risk       │
  │ Details     │ - Comm.      │
  └─────────────┴──────────────┘

Admin CRM Page
(/admin/crm)
  ┌──────────────────────────────────┐
  │ Dashboard stats (leads/status)   │
  │ Pipeline Stages                  │
  │ Recent Leads                     │
  │ Leads by Source                  │
  │ AI Pipeline Insights Card        │
  │  - Pipeline Health button        │
  │  - Forecast button               │
  └──────────────────────────────────┘
```

## 12 AI CRM Features

| # | Feature | Endpoint | Description |
|---|---------|----------|-------------|
| 1 | Lead Scoring | `POST /crm/:id/ai/scoring` | AI-powered 0-100 score based on behaviour, company profile, trust score, engagement, pipeline stage, estimated value |
| 2 | Next Best Action | `POST /crm/:id/ai/next-best-action` | Recommends call/email/demo/proposal/follow-up/escalation/nurture |
| 3 | Conversion Probability | `POST /crm/:id/ai/conversion-probability` | Predicts close probability % with key drivers and risk factors |
| 4 | Lead Insights | `POST /crm/:id/ai/insights` | Deep analysis of engagement patterns, company health, buying intent |
| 5 | Sentiment | `POST /crm/:id/ai/sentiment` | Sentiment from notes, interactions, timeline events |
| 6 | Pipeline Health | `POST /crm/ai/pipeline-health` | Stage distribution, velocity, bottlenecks, leakages |
| 7 | Forecast | `POST /crm/ai/forecast` | Expected revenue, close rates, time-to-close ranges |
| 8 | Deal Risk | `POST /crm/:id/ai/deal-risk` | Stagnation, ghosting, budget issues, competitor threats |
| 9 | Recommended Actions | `POST /crm/:id/ai/recommended-actions` | Specific actions per lead status |
| 10 | Communication Tips | `POST /crm/:id/ai/communication-tips` | Personalized messaging, tone, timing, objection handling |
| 11 | Follow-up Priority | `POST /crm/ai/follow-up-priority` | Urgency score, lead value, time sensitivity |
| 12 | Sidebar (all-in-one) | `POST /crm/:id/ai/sidebar` | Key metrics, risk level, recommended action, deal health |

## Files Created/Modified

### Backend
| File | Type | Lines |
|------|------|-------|
| `apps/api/src/modules/crm/dto/ai-crm.dto.ts` | CREATE | 12 request DTOs |
| `apps/api/src/modules/crm/ai-crm.service.ts` | CREATE | 12 AI methods + auto-seed CRM_ANALYSIS prompt |
| `apps/api/src/modules/crm/ai-crm.controller.ts` | CREATE | 12 endpoints under `POST /crm/:id/ai/:action` |
| `apps/api/src/modules/crm/crm.module.ts` | MODIFY | Import AiGatewayModule, register AiCrmService + AiCrmController |

### Frontend
| File | Type | Lines |
|------|------|-------|
| `apps/web/lib/api/ai-crm.ts` | CREATE | 12 typed API functions |
| `apps/web/hooks/use-ai-crm.ts` | CREATE | 12 React Query hooks |
| `apps/web/components/crm/ai-crm-copilot.tsx` | CREATE | Composable 4-tab AI CRM Copilot component |
| `apps/web/app/seller/crm/[id]/page.tsx` | MODIFY | AI Copilot toggle + sidebar integration |
| `apps/web/app/admin/crm/page.tsx` | MODIFY | AI Pipeline Insights card |

## Reused Components (No Duplication)
- **AiGatewayService**: `process()` method — same pattern as AiNegotiationService, AiQuoteService
- **PromptManagerService**: `getPrompt()`/`createPrompt()` — same pattern as all 6 other AI modules
- **TradTrustService**: `getUnifiedScore()` — same integration point as AI Negotiation
- **PrismaService**: Standard DI pattern across all services
- **TaskType.CRM_ANALYSIS**: Already existed in Prisma enum (costs 5 credits)

## Credit Cost
- TaskType: `CRM_ANALYSIS`
- Cost per call: 5 credits (via existing CREDIT_COSTS)
- All 12 features use the same TaskType with different `action` fields

## Verification
- tsc (api): 0 errors ✅
- tsc (web): 0 errors ✅
- next build: 192 routes ✅
