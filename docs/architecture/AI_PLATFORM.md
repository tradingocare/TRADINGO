# Tradingo AI Platform API Guide

## Overview

Tradingo provides a comprehensive AI platform that powers intelligent features across the marketplace. The AI Gateway serves as a unified abstraction layer over five LLM providers, providing automatic failover, circuit breaker protection, and SLA monitoring. AI capabilities are consumed via REST endpoints and are metered through a plan-based credit system.

## AI Gateway Architecture

The AI Gateway is the central entry point for all AI operations:

- **Unified Interface**: All AI features communicate through a single gateway regardless of the underlying provider.
- **Provider Abstraction**: Five providers are supported -- OpenRouter, Gemini, Groq, Tavily (search), and Firecrawl (web scraping).
- **Automatic Failover**: If a provider fails, the gateway automatically routes to the next available provider in the fallback chain.
- **Circuit Breaker**: After 3 consecutive failures, a provider enters half-open state for 30 seconds before attempting recovery.
- **SLA Monitoring**: P50, P95, and P99 latency tracking per action type.
- **Streaming**: Server-Sent Events (SSE) support for real-time AI response streaming.

## Authentication

All AI endpoints require authentication via JWT token. AI credits are deducted from the company associated with the authenticated user.

```
Authorization: Bearer <access_token>
```

## Available Task Types

The AI platform supports the following task types. Each task type has a defined credit cost:

| Task Type | Credits | Description |
|-----------|---------|-------------|
| `NEGOTIATION` | 20 | AI negotiation strategy, sentiment analysis, deal probability |
| `SEARCH_ANALYSIS` | 5 | Semantic search, intent detection, similar products/suppliers |
| `CRM_ANALYSIS` | 10 | Lead scoring, customer insights, engagement analysis |
| `FINANCE_ANALYSIS` | 10 | Credit risk, cash flow forecast, fraud detection |
| `ADMIN_INTELLIGENCE` | 10 | Morning brief, revenue forecast, market intelligence |
| `CATEGORY_SUGGESTION` | 5 | AI-powered category classification |
| `PRODUCT_ENRICHMENT` | 5 | Title generation, attribute suggestions |
| `QUALITY_ANALYSIS` | 3 | Product quality scoring |
| `SELLER_AGENT` | 5 | Seller AI agent actions |
| `BUYER_AGENT` | 5 | Buyer AI agent actions |
| `ADMIN_AGENT` | 5 | Admin AI agent actions |
| `FOUNDER_EXECUTIVE` | 10 | Founder executive intelligence |
| `ENTERPRISE_INTELLIGENCE` | 10 | Enterprise-wide analytics and predictions |

## Credit System

AI usage is tracked via a credit system linked to the company's membership plan:

```typescript
interface CreditBalance {
  total: number;       // Total monthly credits allocated
  used: number;        // Credits consumed this period
  remaining: number;   // Available credits
  planName: string;    // Current plan name
  periodStart: string; // ISO 8601
  periodEnd: string;   // ISO 8601
}
```

Check credit balance:

```typescript
const API = 'https://api.tradhexa.com/api/v1';

async function getCreditBalance() {
  const res = await fetch(`${API}/ai-gateway/credits/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as CreditBalance;
}

// Response:
// {
//   total: 1000,
//   used: 245,
//   remaining: 755,
//   planName: "Trade Pro",
//   periodStart: "2026-07-01T00:00:00.000Z",
//   periodEnd: "2026-07-31T23:59:59.000Z"
// }
```

When credits are exhausted, the API returns HTTP 402:

```json
{
  "statusCode": 402,
  "message": "Insufficient AI credits. Available: 0, Required: 10",
  "error": "Payment Required",
  "timestamp": "2026-07-16T10:30:00.000Z",
  "path": "/api/v1/smart-rfq/rfq_123/ai/strategy"
}
```

## Streaming SSE Endpoint

For real-time AI responses, use the streaming endpoint:

```typescript
async function streamAiResponse(payload: {
  action: string;
  context: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<ReadableStream> {
  const response = await fetch(`${API}/ai-gateway/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await response.json();
  return response.body!;
}

// Usage with SSE parser
async function consumeStream() {
  const stream = await streamAiResponse({
    action: 'strategy',
    context: { negotiationId: 'neg_123' },
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        console.log('Stream chunk:', data);
      }
    }
  }
}
```

## Domain-Specific AI Features

### RFQ Intelligence

Endpoints under `/smart-rfq/:id/ai/:action`:

| Action | Description |
|--------|-------------|
| `requirements-analysis` | Extract and structure requirements from RFQ description |
| `buyer-match` | Find best-matching sellers for the RFQ |
| `supplier-suggestions` | Suggest additional suppliers |
| `pricing-analysis` | Analyze pricing trends and benchmarks |
| `timeline-prediction` | Predict optimal timeline for the RFQ |
| `risk-assessment` | Identify potential risks in the RFQ |
| `completeness-check` | Check RFQ completeness and suggest improvements |
| `market-intelligence` | Market insights relevant to the RFQ |
| `scope-clarification` | Suggest scope clarifications |

```typescript
async function getRfqIntelligence(rfqId: string, action: string) {
  const res = await fetch(
    `${API}/smart-rfq/${rfqId}/ai/${action}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Quote & Pricing Advisor

Endpoints under `/quotes/:id/ai/:action`:

| Action | Description |
|--------|-------------|
| `generate` | AI-generated quote draft |
| `price-recommendation` | Optimal pricing recommendation |
| `winning-probability` | Probability of winning the quote |
| `margin-analysis` | Profit margin analysis |
| `competitiveness` | Competitive positioning |
| `review` | Quote quality review |
| `negotiation-prep` | Prepare negotiation strategy |
| `risk-assessment` | Quote-level risk assessment |
| `quality-score` | Quote quality scoring |
| `sidebar` | Combined quote intelligence sidebar |

### Negotiation Copilot

Endpoints under `/smart-negotiation/:id/ai/:action`:

| Action | Description |
|--------|-------------|
| `strategy` | AI negotiation strategy |
| `buyer-behavior` | Buyer behavior analysis |
| `seller-suggestions` | Suggested seller responses |
| `sentiment` | Sentiment analysis of conversation |
| `deal-probability` | Probability of deal closure |
| `suggested-replies` | AI-generated reply suggestions |
| `risk-detection` | Detect negotiation risks |
| `conversation-summary` | Summarize negotiation history |
| `translate` | Translate messages |
| `ai-memory` | Retrieve AI memory context |
| `timeline` | Negotiation timeline analysis |
| `sidebar` | Combined copilot sidebar data |

### Search & Recommendation

Endpoints under `/search/ai/:action`:

| Action | Description |
|--------|-------------|
| `semantic-search` | Semantic search results |
| `intent-detection` | Detect buyer search intent |
| `similar-products` | Find similar products |
| `similar-suppliers` | Find similar suppliers |
| `personalized-ranking` | Personalized result ranking |
| `buyer-recommendations` | Buyer-specific recommendations |
| `seller-recommendations` | Seller-specific recommendations |
| `search-summary` | Summarize search results |
| `smart-filters` | Suggest relevant filters |
| `cross-sell` | Cross-sell and upsell suggestions |
| `sidebar` | Combined search intelligence |

### Finance Intelligence

Endpoints under `/finance/ai/:action`:

| Action | Description |
|--------|-------------|
| `credit-risk` | Credit risk assessment |
| `payment-delay` | Payment delay prediction |
| `cash-flow-forecast` | Cash flow forecasting |
| `collection-strategy` | Collection strategy recommendations |
| `financial-health` | Financial health analysis |
| `credit-limit` | Credit limit recommendation |
| `invoice-intelligence` | Invoice analysis |
| `fraud-signals` | Fraud signal detection |
| `collection-draft` | Draft collection communications |
| `sidebar` | Combined finance intelligence |

### Admin Intelligence

Endpoints under `/admin/ai/:action`:

| Action | Description |
|--------|-------------|
| `morning-brief` | Daily morning brief |
| `revenue-forecast` | Revenue forecast |
| `user-growth` | User growth prediction |
| `fraud-intelligence` | Fraud intelligence |
| `churn-prediction` | Churn prediction |
| `category-intelligence` | Category insights |
| `geo-intelligence` | Geographic insights |
| `market-trends` | Market trend analysis |
| `ai-alerts` | AI-generated alerts |
| `executive-copilot` | Executive assistant copilot |
| `weekly-report` | Weekly business report |
| `monthly-report` | Monthly business report |

## TradeAI Agents

The platform includes five specialized AI agents accessible via dedicated endpoints:

### Seller Agent (`/seller/agent/*`)

```typescript
async function getSellerAgentInsights() {
  const res = await fetch(`${API}/seller/agent/dashboard-copilot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Buyer Agent (`/buyer/agent/*`)

```typescript
async function getBuyerAgentInsights() {
  const res = await fetch(`${API}/buyer/agent/dashboard-copilot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Admin Agent (`/admin/agent/*`)

Covers system health, user activity, fraud intelligence, revenue analytics, moderation, and platform growth.

### Founder Executive Agent (`/founder/executive/*`)

Covers executive copilot, decision center, risk engine, opportunity engine, KPI dashboard, agent coordination, and executive analytics. See [FOUNDER_AI.md](FOUNDER_AI.md).

### Enterprise Intelligence (`/enterprise-intelligence/*`)

Covers predictive analytics, digital twin optimization, anomaly detection, compliance monitoring, and market intelligence. See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).

## AI Context

The AI features work with context built from multiple domains:

- Company profile, membership plan, and usage history
- Product catalog and category data
- RFQ, quote, and negotiation history
- Market intelligence and TradTrust scores
- User activity and preferences

This context is automatically included when you call AI endpoints with the required identifiers (e.g., negotiation ID, RFQ ID, product ID).

## Rate Limiting & Credits Summary

- AI endpoints consume credits (not rate-limited by time window)
- Credit consumption is per-company, reset monthly
- HTTP 402 is returned when credits are exhausted
- Streaming endpoints consume credits upon initiation (not per-chunk)

See [RATE_LIMITING.md](RATE_LIMITING.md) for complete rate limiting details.
