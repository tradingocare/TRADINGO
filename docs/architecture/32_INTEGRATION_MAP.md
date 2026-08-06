# TRADINGO Integration Map

> Every external service integration and how it connects.

## External Service Integrations

| Service | Purpose | Integration Type | Configuration |
|---------|---------|-----------------|---------------|
| **OpenRouter** | AI model access (primary) | REST API (fetchWithRetry) | API key in AiProvider |
| **Google Gemini** | AI model access (vision/OCR) | REST API | API key in AiProvider |
| **Groq** | AI model access (fast inference) | REST API | API key in AiProvider |
| **Tavily** | AI-powered web search | REST API | API key in AiProvider |
| **Firecrawl** | AI-powered web scraping | REST API | API key in AiProvider |
| **Razorpay** | Payment processing (primary) | REST API + Webhooks | API key + secret in config |
| **Stripe** | Payment processing (fallback) | REST API + Webhooks | API key + secret in config |
| **Twilio** | SMS delivery | SDK (`twilio` npm) | Account SID + Auth Token |
| **AWS SES** | Email delivery | `@aws-sdk/client-ses` | AWS credentials |
| **AWS S3** | File storage | `@aws-sdk/client-s3` | AWS credentials |
| **Cloudinary** | Image optimization | API | Cloud name + API key |
| **OpenStreetMap** | Geocoding | Nominatim API (free) | Rate-limited, no key |
| **PostgreSQL** | Primary database | Prisma ORM | DATABASE_URL |
| **Redis** | Cache + Queue + Pub/Sub | ioredis | REDIS_URL |
| **ClickHouse** | Analytics database | clickhouse npm | CLICKHOUSE_URL |
| **OpenSearch** | Full-text search | @opensearch-project/opensearch | OPENSEARCH_URL |
| **Sentry** | Error monitoring | @sentry/nestjs + @sentry/nextjs | SENTRY_DSN |

## Internal Module Dependencies

```mermaid
graph TD
    SmartRFQ --> Quote
    Quote --> SmartNegotiation
    SmartNegotiation --> SmartPO
    SmartPO --> Order
    Order --> Payment
    Order --> Shipment
    Shipment --> Delivery
    Order --> Escrow
    Escrow --> Settlement
    
    Products --> SmartRFQ
    SmartRFQ --> TradMatch
    
    Gocash --> WalletAPI
    Gocash --> GocashIntegration
    Gocash --> Campaign
    Gocash --> Referral
    Gocash --> Advertising
    
    AiGateway --> AiSearch
    AiGateway --> AiFinance
    AiGateway --> AiAdmin
    AiGateway --> AiNegotiation
    AiGateway --> AiRFQ
    AiGateway --> AiQuote
    AiGateway --> AiCRM
    AiGateway --> FounderAI
    
    TradTrust --> SmartNegotiation
    TradTrust --> MarketplaceIntelligence
    
    Notification --> GocashIntegration
    Notification --> All Modules
```

## API Gateway Pattern

Frontend → Backend communication is proxied through Next.js rewrites:
- `/api/*` → Fastify backend at `http://localhost:3001` (dev) or production URL
- Next.js API routes exist for: auth set-cookie, feedback submit

## WebSocket Connections

- **Socket.IO**: Chat, real-time notifications, presence
- **Redis Adapter**: Horizontal scaling for Socket.IO
- **Namespaces**: `/chat`, `/notifications`
- **Rooms**: Per-user for targeted delivery
