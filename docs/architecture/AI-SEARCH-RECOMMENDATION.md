# AI Search & Recommendation Engine

## Architecture

```
TradFind Module
├── ai-search.service.ts       (11 AI methods → AiGateway)
├── ai-search.controller.ts    (11 endpoints under /search/ai/)
├── dto/ai-search.dto.ts       (11 request DTOs)
└── tradfind.module.ts         (imports AiGatewayModule)

Frontend
├── lib/api/ai-search.ts       (11 typed API functions)
├── hooks/use-ai-search.ts     (11 React Query hooks)
└── components/search/ai-search-copilot.tsx  (4-tab sidebar)

Integration
└── app/search/search-content.tsx  (AI toggle + sidebar on search page)
```

## AI Features (11 actions via SEARCH_ANALYSIS TaskType)

| Action | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `semantic_search` | `POST /search/ai/semantic` | Natural language → structured search criteria | Public |
| `intent_detection` | `POST /search/ai/intent` | Classify intent + extract entities | Public |
| `similar_products` | `POST /search/ai/similar-products` | Find similar products by criteria | Public |
| `similar_suppliers` | `POST /search/ai/similar-suppliers` | Find similar suppliers by criteria | Public |
| `personalized_ranking` | `POST /search/ai/personalized-ranking` | Re-rank results by user context | JWT |
| `buyer_recommendations` | `POST /search/ai/buyer-recommendations` | Products/opportunities for buyer | JWT |
| `seller_recommendations` | `POST /search/ai/seller-recommendations` | Opportunities for seller | JWT |
| `search_summary` | `POST /search/ai/summary` | Summarize query results + insights | Public |
| `smart_filters` | `POST /search/ai/smart-filters` | Suggest relevant filters | Public |
| `cross_sell_upsell` | `POST /search/ai/cross-sell` | Related/premium product recommendations | Public |
| `ai_search_sidebar` | `POST /search/ai/sidebar` | All-in-one search insights | Public |

## Files Created/Modified

### Backend
- `prisma/schema.prisma:6237` — Added `SEARCH_ANALYSIS` to TaskType enum
- `apps/api/src/modules/ai-gateway/ai-credits.service.ts:22` — 5 credits
- `apps/api/src/modules/ai-gateway/provider-router.service.ts:31` — Route to OpenRouter
- `apps/api/src/modules/ai-gateway/model-registry.service.ts:113` — gpt-4o-mini + gemini-2.0-flash
- `apps/api/src/modules/ai-gateway/providers/openrouter.provider.ts` — Added supportedTasks
- `apps/api/src/modules/tradfind/ai-search.service.ts` — 11 AI methods + prompt seed
- `apps/api/src/modules/tradfind/ai-search.controller.ts` — 11 endpoints
- `apps/api/src/modules/tradfind/dto/ai-search.dto.ts` — 11 DTOs
- `apps/api/src/modules/tradfind/tradfind.module.ts` — Added AiSearchService + AiSearchController + AiGatewayModule

### Frontend
- `apps/web/lib/api/ai-search.ts` — 11 API functions
- `apps/web/hooks/use-ai-search.ts` — 11 React Query hooks
- `apps/web/components/search/ai-search-copilot.tsx` — 4-tab AI sidebar component
- `apps/web/app/search/search-content.tsx` — AI toggle button + sidebar integration

## Data Flow
1. User clicks "AI Search" toggle on search results page
2. Sidebar opens with AiSearchCopilot component (4 tabs: Discover, Similar, Recommend, Rank)
3. User fills query or clicks action buttons
4. Actions call hook mutations → API client → Backend endpoint
5. AiSearchController → AiSearchService → AiGatewayService.process()
6. AiGateway checks credits, routes to OpenRouter, prompts via PromptManager
7. Response returned → displayed in sidebar panel

## Verification
- `npx prisma validate` ✅
- `npx prisma generate` ✅
- `tsc api --noEmit` 0 errors ✅
- `tsc web --noEmit` 0 errors ✅
- `next build` 192 routes ✅
