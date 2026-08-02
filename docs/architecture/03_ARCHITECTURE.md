# TRADINGO Architecture

## Monorepo Architecture

```mermaid
graph TD
    Root["E:/tradingo (Monorepo Root)"]
    
    subgraph Apps["Apps"]
        API["@tradingo/api<br/>NestJS 11 + Fastify 5<br/>Port 3001"]
        WEB["@tradingo/web<br/>Next.js 16 + React 19<br/>Port 3000"]
    end
    
    subgraph Packages["Shared Packages"]
        CONTRACTS["@tradingo/contracts<br/>Shared API contracts + types"]
        TYPES["@tradingo/types<br/>Shared TypeScript types"]
        UI["@tradingo/ui<br/>Shared UI primitives"]
        UTILS["@tradingo/utils<br/>Shared utilities"]
        GOCASH["@tradingo/gocash<br/>GOCASH types + utilities"]
    end
    
    subgraph Infrastructure["Infrastructure"]
        PG[("PostgreSQL<br/>Prisma 6")]
        REDIS[("Redis<br/>Cache + Queue + Pub/Sub")]
        CH[("ClickHouse<br/>Analytics")]
        OS[("OpenSearch<br/>Search")]
    end
    
    API --> PG
    API --> REDIS
    API --> CH
    WEB -->|API Proxy /api/*| API
    
    Packages -.-> API
    Packages -.-> WEB
    
    style API fill:#6366f1,color:#fff
    style WEB fill:#06b6d4,color:#fff
```

## Frontend Architecture

```mermaid
graph TD
    subgraph Nextjs["Next.js 16 App"]
        RootLayout["Root Layout"]
        
        subgraph Auth["(auth) Route Group"]
            Login["Login"]
            Register["Register"]
            ForgotPassword["Forgot Password"]
            VerifyEmail["Verify Email"]
        end
        
        subgraph Admin["Admin Routes"]
            AdminDashboard["/admin/dashboard"]
            AdminWallets["/admin/wallets"]
            AdminFounderAi["/admin/founder-ai"]
            AdminMore["/admin/* (60+ routes)"]
        end
        
        subgraph Buyer["Buyer Routes"]
            BuyerDashboard["/buyer/dashboard"]
            BuyerGocash["/buyer/gocash"]
            BuyerEcosystem["/buyer/ecosystem"]
            BuyerMore["/buyer/* (38 routes)"]
        end
        
        subgraph Seller["Seller Routes"]
            SellerDashboard["/seller/dashboard"]
            SellerProducts["/seller/products"]
            SellerGocash["/seller/gocash"]
            SellerMore["/seller/* (61 routes)"]
        end
        
        subgraph Public["Public Routes"]
            Home["/"]
            Search["/search"]
            Products["/products/[slug]"]
            Companies["/companies/[slug]"]
        end
        
        RootLayout --> Auth
        RootLayout --> Admin
        RootLayout --> Buyer
        RootLayout --> Seller
        RootLayout --> Public
    end
    
    subgraph Providers["Provider Tree"]
        ThemeProvider["ThemeProvider"]
        QueryProvider["QueryProvider (TanStack Query)"]
        AuthProvider["AuthProvider"]
        SocketProvider["SocketProvider"]
        NotificationProvider["NotificationProvider"]
        
        ThemeProvider --> QueryProvider
        QueryProvider --> AuthProvider
        AuthProvider --> SocketProvider
        SocketProvider --> NotificationProvider
    end
    
    RootLayout --> Providers
```

## Backend Architecture

```mermaid
graph TD
    subgraph NestJS["NestJS 11 + Fastify 5"]
        AppModule["AppModule"]
        
        subgraph Common["Common Infrastructure"]
            Guards["Guards<br/>JWT, Roles, Permissions, CompanyOwner"]
            Interceptors["Interceptors<br/>Transform, Sentry, Logging"]
            Filters["Filters<br/>AllExceptionsFilter"]
            Pipes["Pipes<br/>ValidationPipe"]
            Decorators["@CurrentUser, @Roles, @Public, @Permissions"]
        end
        
        subgraph Modules["74 Feature Modules"]
            Auth["AuthModule"]
            Products["ProductsModule"]
            Orders["OrderModule"]
            Payments["PaymentModule"]
            Gocash["GocashModule"]
            Ecosystem["GocashEcosystemModule"]
            AiGateway["AiGatewayModule"]
            FounderAi["FounderAiModule"]
            More["... (74 total)"]
        end
        
        subgraph Jobs["BullMQ Jobs"]
            EmailProcessor["Email Processor"]
            ExportProcessor["Export Processor"]
            SettlementProcessor["Settlement Processor"]
            AIProcessor["AI Processor"]
            MoreProcessors["... (10 total)"]
        end
        
        subgraph AI["AI Gateway"]
            AIService["AiGatewayService"]
            Providers["5 Providers<br/>OpenRouter, Gemini, Groq, Tavily, Firecrawl"]
            Credits["AiCreditsService"]
            Prompts["PromptManagerService"]
        end
        
        AppModule --> Common
        AppModule --> Modules
        AppModule --> Jobs
        AppModule --> AI
        
        Modules --> AI
    end
    
    subgraph External["External Services"]
        OpenRouter["OpenRouter API"]
        Gemini["Gemini API"]
        Groq["Groq API"]
        Tavily["Tavily API"]
        Firecrawl["Firecrawl API"]
        Razorpay["Razorpay"]
        Stripe["Stripe"]
        Twilio["Twilio SMS"]
        AWS["AWS SES"]
    end
    
    AI --> OpenRouter
    AI --> Gemini
    AI --> Groq
    AI --> Tavily
    AI --> Firecrawl
    Payments --> Razorpay
    Payments --> Stripe
    SMS --> Twilio
    Notifications --> AWS
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant Client as Browser
    participant Next as Next.js 16
    participant API as NestJS API
    participant Guards as Guards
    participant Controller as Controller
    participant Service as Service
    participant Prisma as Prisma/DB
    
    Client->>Next: HTTP Request
    Next->>Next: Apply rewrites /api/* -> backend
    Next->>API: Forward to backend
    
    API->>Guards: ThrottlerGuard (100/60s)
    Guards->>Guards: JwtAuthGuard (verify JWT)
    Guards->>Guards: RolesGuard (check @Roles())
    Guards->>Guards: PermissionsGuard (check @Permissions())
    
    Guards->>Controller: Route to handler
    Controller->>Controller: Validate DTO (ValidationPipe)
    
    Controller->>Service: Delegate to service
    Service->>Prisma: Query/aggregate
    Prisma-->>Service: Return data
    
    alt Needs AI
        Service->>AiGateway: aiGateway.process()
        AiGateway->>AiGateway: Check credits
        AiGateway->>AiGateway: Get prompt
        AiGateway->>Provider: Execute with fallback
        Provider-->>AiGateway: AI response
        AiGateway-->>Service: Processed AI data
    end
    
    Service-->>Controller: Return result
    Controller-->>API: TransformInterceptor wraps response
    API-->>Next: JSON response
    Next-->>Client: Render page
```

## Backend Orchestration

```mermaid
graph LR
    subgraph Auth["Authentication"]
        JWT["JWT Strategy"]
        Google["Google OAuth"]
        LinkedIn["LinkedIn OAuth"]
        Refresh["Refresh Token"]
    end
    
    subgraph Core["Core Modules"]
        Users["Users"]
        Companies["Companies"]
        Categories["Categories"]
        Industries["Industries"]
    end
    
    subgraph Trading["Trading Modules"]
        Products["Products"]
        Rfq["RFQ"]
        Quote["Quote"]
        Negotiation["Smart Negotiation"]
        PO["Purchase Order"]
        Order["Order"]
        Shipment["Smart Shipment"]
        Delivery["Smart Delivery"]
    end
    
    subgraph Finance["Financial Modules"]
        Payments["Payment"]
        Escrow["Escrow"]
        Settlement["Settlement"]
        Credit["Credit/Finance"]
        Invoicing["Billing/Invoicing"]
    end
    
    subgraph Trust["Trust & Verification"]
        TradTrust["TradTrust"]
        KYC["Company Verification"]
        UserKYC["User Verification"]
        Reputation["Reputation Events"]
    end
    
    subgraph Intelligence["Intelligence"]
        TradFind["TradFind Search"]
        TradMatch["TradMatch AI"]
        MarketIntel["Market Intelligence"]
        LocationIntel["Location Intelligence"]
        FreightIntel["Freight Intelligence"]
    end
    
    subgraph Rewards["Rewards & Engagement"]
        GOCASH["GOCASH Wallet"]
        Ecosystem["Ecosystem XP/Levels"]
        Campaign["Campaigns"]
        Referral["Referrals"]
    end
    
    subgraph AI["AI Layer"]
        AiGateway["AI Gateway"]
        AiSearch["Search AI"]
        AiFinance["Finance AI"]
        AiAdmin["Admin AI"]
        AiNegotiation["Negotiation AI"]
        AiRFQ["RFQ AI"]
        AiQuote["Quote AI"]
        FounderAi["Founder AI"]
    end
    
    Auth --> Core
    Core --> Trading
    Trading --> Finance
    Trading --> Trust
    Intelligence --> Trading
    Rewards --> Trading
    AI --> Trading
    AI --> Intelligence
    AI --> Trust
    AI --> Finance
```

## Dependency Rules

1. **Apps cannot depend on other apps** — `@tradingo/api` and `@tradingo/web` are independent
2. **Packages can depend on other packages** — `@tradingo/gocash` depends on `@prisma/client`
3. **Apps depend on packages** — Both apps use `@tradingo/types`, `@tradingo/utils`
4. **No circular dependencies** — enforced by TypeScript module resolution
5. **Shared Prisma schema** — Single `schema.prisma` at monorepo root, consumed by `@tradingo/api`
