# AI Finance & Credit Intelligence — Phase 16.6H

## Architecture

```
Frontend (React)                    Backend (NestJS)                    AI Gateway
┌───────────────────────┐  POST     ┌──────────────────────┐  FINANCE_ANALYSIS  ┌──────────────┐
│ Admin Finance Pages    │ /finance  │ AiFinanceController  │  (TaskType, 10cr)  │ OpenRouter   │
│                       │ /ai/      │  (10 endpoints)      │ ────────────────> │ → GPT-4o-mini│
│ Dashboard (AI card)   │ :action   │                      │                   │              │
│ Credit (AI panel)     │ <───────  │ AiFinanceService     │ <────────────────  └──────────────┘
│ Collections (AI card) │ JSON      │  (10 AI methods)     │
│                       │           │  + onModuleInit      │  Finance Services (existing)
│ AiFinanceCopilot      │           │  + auto-seed prompt  │  ┌──────────────────────────┐
│ (4-tab component)     │           │                      │  │ CreditService             │
└───────────────────────┘           │  Reuses:             │  │ CollectionsService        │
                                    │  - CreditService     │  │ FinanceDashboardService   │
                                    │  - CollectionsSrvc   │  │ RmFinanceService          │
                                    │  - DashboardService  │  │ CreditNoteService         │
                                    │  - PrismaService     │  └──────────────────────────┘
                                    │  - TradTrust (via    │
                                    │    context/payload)  │  Prisma + ClickHouse
                                    └──────────────────────┘
```

## 10 AI Finance Features

| # | Feature | Endpoint | Description |
|---|---------|----------|-------------|
| 1 | Credit Risk Assessment | `POST /finance/ai/credit-risk` | Approve/Reject/Review with confidence %, reason, risk factors |
| 2 | Payment Delay Prediction | `POST /finance/ai/payment-delay` | Predict payment delay probability % with context from recent payments |
| 3 | Cash Flow Forecast | `POST /finance/ai/cash-flow-forecast` | 7/30/90 day forecast with dashboard + cash flow context |
| 4 | Collection Strategy | `POST /finance/ai/collection-strategy` | Call/Email/Reminder/Legal Notice/Hold Orders/Payment Plan with escalation timeline |
| 5 | Customer Financial Health | `POST /finance/ai/financial-health` | Excellent/Good/Average/Risky/Critical with payment history + invoice context |
| 6 | Credit Limit Recommendation | `POST /finance/ai/credit-limit` | Increase/Decrease/Freeze/Review with recommended amount |
| 7 | Invoice Intelligence | `POST /finance/ai/invoice-intelligence` | Detect GST issues, duplicates, missing fields, risk |
| 8 | Fraud Signals | `POST /finance/ai/fraud-signals` | Analyse payments, refunds, chargebacks, credit, collections for anomalies |
| 9 | Collection Draft | `POST /finance/ai/collection-draft` | Generate professional Email, Reminder Letter, WhatsApp, SMS drafts |
| 10 | Finance Copilot Sidebar | `POST /finance/ai/sidebar` | All-in-one: credit risk, financial health, cash flow, payment prediction, collection advice |

## Files Created/Modified

### Backend
| File | Type |
|------|------|
| `apps/api/src/modules/finance/dto/ai-finance.dto.ts` | CREATE — 10 request DTOs |
| `apps/api/src/modules/finance/ai-finance.service.ts` | CREATE — 10 AI methods + auto-seed FINANCE_ANALYSIS prompt |
| `apps/api/src/modules/finance/ai-finance.controller.ts` | CREATE — 10 endpoints under `/finance/ai/` |
| `apps/api/src/modules/finance/finance.module.ts` | MODIFY — Import AiGatewayModule, register AiFinanceService + AiFinanceController |
| `apps/api/src/modules/finance/dto/index.ts` | MODIFY — Export ai-finance.dto |
| `apps/api/src/modules/ai-gateway/providers/openrouter.provider.ts` | MODIFY — Add `TaskType.FINANCE_ANALYSIS` to supportedTasks |

### Frontend
| File | Type |
|------|------|
| `apps/web/lib/api/ai-finance.ts` | CREATE — 10 typed API functions |
| `apps/web/hooks/use-ai-finance.ts` | CREATE — 10 React Query hooks |
| `apps/web/components/finance/ai-finance-copilot.tsx` | CREATE — 4-tab finance copilot component |
| `apps/web/app/admin/finance/page.tsx` | MODIFY — AI Finance Insights card (Cash Flow Forecast + Fraud Signal Scan) |
| `apps/web/app/admin/finance/credit/page.tsx` | MODIFY — AI Credit Intelligence panel (Credit Risk + Financial Health + Credit Limit Rec.) |
| `apps/web/app/admin/finance/collections/page.tsx` | MODIFY — AI Collection Intelligence card (Collection Strategy + Collection Draft) |

## Components Reused
- **AiGatewayService**: `process()` method with `TaskType.FINANCE_ANALYSIS` (10 credits/call)
- **PromptManagerService**: `getPrompt()`/`createPrompt()` — auto-seeds FINANCE_ANALYSIS prompt on init
- **CreditService**: `getCredit()` for credit profile context
- **CollectionsService**: `getOutstandingSummary()`, `getAgingReport()`, `listNotes()` for collection context
- **FinanceDashboardService**: `getDashboard()`, `getCashFlow()` for cash flow forecast context
- **PrismaService**: Standard DI across all services
- **Existing TaskType**: `FINANCE_ANALYSIS` already in Prisma enum (costs 10 credits)

## Verification Results
- tsc api: 0 errors ✅
- tsc web: 0 errors ✅
- next build: 192 routes ✅
