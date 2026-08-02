# TRADINGO AI Architecture

> The complete AI ecosystem: Gateway, providers, credits, prompts, and domain-specific modules.

## Architecture Overview

```mermaid
graph TD
    subgraph Domain["Domain-Specific AI Modules"]
        AISearch["AiSearchService<br/>SEARCH_ANALYSIS (5 credits)"]
        AIFinance["AiFinanceService<br/>FINANCE_ANALYSIS (10 credits)"]
        AIAdmin["AiAdminService<br/>ADMIN_INTELLIGENCE (10 credits)"]
        AINegotiation["AiNegotiationService<br/>NEGOTIATION (20 credits)"]
        AIRFQ["AiRfqService<br/>RFQ_ANALYSIS (15 credits)"]
        AIQuote["AiQuoteService<br/>QUOTE_ANALYSIS (15 credits)"]
        AICRM["AiCrmService<br/>CRM_ANALYSIS (5 credits)"]
        FounderAI["FounderAiService<br/>ADMIN_INTELLIGENCE"]
    end
    
    subgraph Gateway["AI Gateway Layer"]
        AIGateway["AiGatewayService"]
        Credits["AiCreditsService"]
        Prompts["PromptManagerService"]
        Router["ProviderRouterService"]
        Registry["ProviderRegistryService"]
        Health["ProviderHealthService"]
        Tracker["UsageTrackerService"]
        Cost["CostEngineService"]
        Cache["Redis Cache"]
    end
    
    subgraph Providers["Provider Layer"]
        OpenRouter["OpenRouter<br/>Primary Provider<br/>14 task types"]
        Gemini["Gemini<br/>Vision + OCR"]
        Groq["Groq<br/>Fast inference"]
        Tavily["Tavily<br/>Live search"]
        Firecrawl["Firecrawl<br/>Web scraping"]
    end
    
    Domain --> Gateway
    Gateway --> Credits
    Gateway --> Prompts
    Gateway --> Router
    Gateway --> Cache
    Router --> Registry
    Registry --> Health
    Health --> OpenRouter
    Health --> Gemini
    Health --> Groq
    Health --> Tavily
    Health --> Firecrawl
    Gateway --> Tracker
    Gateway --> Cost
```

## AI Request Flow

```mermaid
sequenceDiagram
    participant DomainService as Domain Service
    participant Gateway as AiGatewayService
    participant Credits as AiCreditsService
    participant Cache as Redis Cache
    participant Router as ProviderRouter
    participant Prompt as PromptManager
    participant Provider as AI Provider
    participant Tracker as UsageTracker
    
    DomainService->>Gateway: process(taskType, payload)
    
    Gateway->>Credits: checkCredits(companyId, taskType)
    Credits-->>Gateway: { sufficient, available, required }
    alt Insufficient Credits
        Gateway-->>DomainService: THROW 402 Payment Required
    end
    
    Gateway->>Cache: get(md5(taskType+payload))
    alt Cache Hit
        Cache-->>Gateway: cached response
        Gateway-->>DomainService: return cached
    end
    
    Gateway->>Router: route(taskType)
    Router-->>Gateway: { provider, model }
    
    Gateway->>Prompt: getPrompt(taskType)
    Prompt-->>Gateway: { systemPrompt, userPrompt, variables }
    
    Gateway->>Gateway: renderPrompt(prompt, payload)
    
    Gateway->>Provider: execute(systemPrompt, renderedPrompt, params)
    alt Primary Fails
        Provider-->>Gateway: error
        Gateway->>Router: getFallbackProviders(taskType)
        Router-->>Gateway: fallback providers
        Gateway->>Provider: execute with fallback
    end
    Provider-->>Gateway: { content, tokens, model }
    
    Gateway->>Tracker: track(companyId, taskType, provider, tokens, latency, cost)
    Gateway->>Cache: set(md5, response, ttl=3600)
    Gateway->>Credits: deductCredits(companyId, taskType)
    
    Gateway-->>DomainService: { success, content, provider, model, tokens, latency, cost }
```

## Task Types & Credit Costs (19 values)

| TaskType | Credits | Default Provider | Models |
|----------|---------|-----------------|--------|
| PRODUCT_DESCRIPTION | 10 | OpenRouter | gpt-4o-mini, gpt-4o, gemini-2.0-flash |
| SEO_GENERATION | 5 | OpenRouter | gpt-4o-mini |
| TRANSLATION | 8 | OpenRouter | gpt-4o-mini |
| SPEC_SUGGESTION | 3 | Groq | llama3-70b, mixtral |
| IMAGE_SUGGESTION | 3 | OpenRouter | gpt-4o-mini |
| QUALITY_SCORING | 2 | Gemini | gemini-2.0-flash |
| DUPLICATE_DETECTION | 5 | Gemini | gemini-2.0-flash |
| OCR | 10 | Gemini | gemini-2.0-pro, gemini-1.5-pro |
| FAST_SUGGESTION | 1 | Groq | llama3-8b |
| LIVE_SEARCH | 2 | Tavily | tavily-search |
| WEBSITE_IMPORT | 15 | Firecrawl | firecrawl-scrape |
| RFQ_ANALYSIS | 15 | OpenRouter | gpt-4o-mini, gemini-2.0-flash |
| QUOTE_ANALYSIS | 15 | OpenRouter | gpt-4o-mini, gemini-2.0-flash |
| NEGOTIATION | 20 | OpenRouter | gpt-4o-mini |
| CRM_ANALYSIS | 5 | OpenRouter | gpt-4o-mini |
| FINANCE_ANALYSIS | 10 | OpenRouter | gpt-4o-mini, gemini-2.0-flash |
| SEARCH_ANALYSIS | 5 | OpenRouter | gpt-4o-mini, gemini-2.0-flash |
| ADMIN_INTELLIGENCE | 10 | OpenRouter | gpt-4o-mini, gemini-2.0-flash |
| GENERAL_CHAT | 1 | Groq | llama3-70b |

## Plan Credit Allocations

| Plan | Monthly Credits |
|------|-----------------|
| TRAD UP | 20 |
| Trade Start | 50 |
| Trade Smart | 100 |
| Trade Plus | 250 |
| Trade Pro | 500 |
| Trade Premium | 1000 |
| Trade Elite | 2500 |

## Provider Configuration

| Provider | Default Model | Supported Tasks | Fallback Order |
|----------|--------------|-----------------|----------------|
| OpenRouter | gpt-4o-mini | 14 (all except LIVE_SEARCH, WEBSITE_IMPORT) | 1st |
| Gemini | gemini-2.0-flash | 4 (OCR, scoring, detection) | 2nd |
| Groq | llama3-70b | 3 (fast suggestion, specs, chat) | 3rd |
| Tavily | tavily-search | 1 (LIVE_SEARCH) | 4th |
| Firecrawl | firecrawl-scrape | 1 (WEBSITE_IMPORT) | 5th |

## Circuit Breaker

- **Threshold**: 5 consecutive failures
- **Cooldown**: 60 seconds
- **Scope**: Per provider
- **State**: `ACTIVE` → `DEGRADED` (after circuit opens) → `ACTIVE` (after cooldown + success)

## Prompt Management

- **Storage**: `AiPrompt` Prisma model
- **Versioning**: `@@unique([taskType, version])`
- **Activation**: Only one active version per taskType
- **Variables**: `{{variableName}}` template syntax
- **Rendering**: `renderPrompt()` replaces variables with payload values
- **Fallback**: Generic prompt created if none exists for taskType
- **Auto-seed**: Each AI sub-module seeds its prompt on `onModuleInit()`

## Frontend AI Integration

All AI modules have matching frontend:
- `lib/api/<module>.ts` — Typed API functions
- `hooks/use-<module>.ts` — React Query hooks
- `components/<module>/ai-<module>-copilot.tsx` — Reusable copilot component

Frontend pages with AI integration:
- `/seller/ai-workspace` — Seller AI dashboard
- `/admin/ai-console` — Admin AI intelligence console
- `/admin/ai-infrastructure` — Provider management
- `/admin/ai-credits` — Credit management
- `/admin/founder-ai` — Founder AI command center
- `/seller/products/[id]/edit` — AI CopilotPanel sidebar
- `/admin/dashboard` — AI copilot toggle
- `/search` — AI Search copilot

## Future AI Enhancements

> **Status:** Not Yet Implemented

- **RAG pipeline**: Document retrieval for enhanced AI responses
- **Fine-tuned models**: Domain-specific fine-tuning for B2B trade
- **Voice interface**: Speech-to-text for Founder AI
- **Multi-modal product search**: Image-based product search
- **Auto-negotiation**: AI-driven autonomous negotiation
- **Predictive analytics**: ML model-based predictions
