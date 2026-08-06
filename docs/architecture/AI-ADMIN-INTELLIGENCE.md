# AI Admin Intelligence

## Architecture

```
AdminIntelligenceModule (new)
├── ai-admin.service.ts        (12 AI methods → AiGateway)
├── ai-admin.controller.ts     (12 endpoints under /admin/ai/)
├── dto/ai-admin.dto.ts        (12 request DTOs)
└── admin-intelligence.module.ts (imports AiGatewayModule)

Frontend
├── lib/api/ai-admin.ts         (12 typed API functions)
├── hooks/use-ai-admin.ts       (12 React Query hooks)
├── components/admin/ai-admin-copilot.tsx  (4-tab sidebar)
├── app/admin/ai-console/page.tsx  (Full intelligence console)
└── app/admin/dashboard/page.tsx   (Executive Copilot integrated)
```

## AI Features (12 actions via ADMIN_INTELLIGENCE TaskType, 10 credits each)

| Action | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `morning_brief` | `POST /admin/ai/morning-brief` | Daily executive summary | ADMIN |
| `revenue_forecast` | `POST /admin/ai/revenue-forecast` | 7/30/90 day revenue prediction | ADMIN |
| `user_growth_prediction` | `POST /admin/ai/user-growth-prediction` | Buyer/seller/RM acquisition forecast | ADMIN |
| `fraud_intelligence` | `POST /admin/ai/fraud-intelligence` | Cross-domain fraud analysis | ADMIN |
| `churn_prediction` | `POST /admin/ai/churn-prediction` | Buyer/seller churn risk scoring | ADMIN |
| `category_intelligence` | `POST /admin/ai/category-intelligence` | Fastest/slowest/profitable categories | ADMIN |
| `geo_intelligence` | `POST /admin/ai/geo-intelligence` | Top cities/states/emerging markets | ADMIN |
| `market_trends` | `POST /admin/ai/market-trends` | Demand/pricing/seasonality | ADMIN |
| `ai_alerts` | `POST /admin/ai/alerts` | Revenue/fraud/server/engagement/collections alerts | ADMIN |
| `executive_copilot` | `POST /admin/ai/executive-copilot` | Platform health + actions widget | ADMIN |
| `weekly_monthly_report` | `POST /admin/ai/report` | Auto-generated executive reports | ADMIN |
| `decision_support` | `POST /admin/ai/decision-support` | Campaign/offer/ad/market suggestions | ADMIN |

## Files Created/Modified

### Backend
- `prisma/schema.prisma` — Added `ADMIN_INTELLIGENCE` to TaskType enum
- `apps/api/src/modules/ai-gateway/ai-credits.service.ts` — 10 credits
- `apps/api/src/modules/ai-gateway/provider-router.service.ts` — Route to OpenRouter
- `apps/api/src/modules/ai-gateway/model-registry.service.ts` — gpt-4o-mini + gemini-2.0-flash
- `apps/api/src/modules/ai-gateway/providers/openrouter.provider.ts` — Added supportedTasks
- `apps/api/src/modules/admin-intelligence/` (new module):
  - `ai-admin.service.ts` — 12 AI methods + prompt seed
  - `ai-admin.controller.ts` — 12 endpoints
  - `dto/ai-admin.dto.ts` — 12 request DTOs
  - `admin-intelligence.module.ts` — Module registration
- `apps/api/src/app.module.ts` — Registered AdminIntelligenceModule

### Frontend
- `apps/web/lib/api/ai-admin.ts` — 12 API functions
- `apps/web/hooks/use-ai-admin.ts` — 12 React Query hooks
- `apps/web/components/admin/ai-admin-copilot.tsx` — 4-tab sidebar
- `apps/web/app/admin/ai-console/page.tsx` — Full intelligence console
- `apps/web/app/admin/dashboard/page.tsx` — Executive Copilot integrated

## Integration Points

| Admin Page | AI Feature Added |
|------------|-----------------|
| `/admin/dashboard` | AI Copilot toggle button → Executive Copilot sidebar |
| `/admin/ai-console` | All 12 AI features in full console layout |

## Reused Components

- `AiGatewayModule` — For AI processing pipeline
- `PromptManagerService` — Prompt management and versioning
- `ProviderRouterService` — Task-to-provider routing
- `UsageTrackerService` — Usage tracking and analytics
- `CostEngineService` — Token-based cost calculation
- `AiCreditsService` — Credit check and deduction
- `DashboardPageHeader`, `StatCard`, `DashboardSkeleton` — Dashboard components
- `useFraudSummary`, `useUsers`, `useCompanies`, `useRfqs`, `useKycSubmissions` — Existing hooks

## Verification
- `npx prisma validate` ✅
- `npx prisma generate` ✅
- `tsc api --noEmit` 0 errors ✅
- `tsc web --noEmit` 0 errors ✅
- `next build` 193 routes ✅ (new: `/admin/ai-console`)
