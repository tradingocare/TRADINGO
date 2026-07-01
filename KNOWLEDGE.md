# KNOWLEDGE.md — TRADINGO Platform Architecture

## Platform Overview

TRADINGO™ is a B2B marketplace platform connecting buyers and sellers through RFQ (Request for Quotation) workflows. The platform supports the complete commerce lifecycle: registration → product browsing → RFQ → quotation → negotiation → purchase order → order → shipment → delivery → payment.

---

## Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (React) | 14 |
| Backend API | NestJS (Node.js) | 20 |
| Database | PostgreSQL | 16 |
| ORM | Prisma | Latest |
| Cache/Queue | Redis + BullMQ | 7 |
| Search | OpenSearch | 2.11 |
| Analytics | ClickHouse | 24.12 |
| Object Storage | AWS S3 | — |
| CDN | CloudFront | — |
| Email | AWS SES | — |
| Payments | Razorpay + Stripe | — |
| Monitoring | Sentry + Prometheus + Grafana | — |
| Malware | ClamAV | — |
| IaC | Terraform | — |
| CI/CD | GitHub Actions | — |

### Monorepo Structure

```
tradingo/
├── apps/
│   ├── api/                    # NestJS backend API
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules (auth, products, rfq, etc.)
│   │   │   ├── common/         # Guards, decorators, interceptors, pipes
│   │   │   ├── config/         # Config modules (app, database, redis, jwt, aws)
│   │   │   ├── health/         # Health controller (liveness, readiness)
│   │   │   ├── jobs/           # BullMQ processors (email, export, malware)
│   │   │   └── main.ts         # Application entry point
│   │   └── Dockerfile
│   └── web/                    # Next.js frontend
│       ├── app/                # App router pages
│       │   ├── buyer/          # Buyer-facing pages
│       │   ├── seller/         # Seller-facing pages
│       │   ├── search/         # Product search
│       │   ├── products/       # Product detail
│       │   ├── companies/      # Company profiles
│       │   └── (auth)/         # Auth pages (login, register)
│       ├── components/         # Shared UI components
│       ├── hooks/              # React hooks (useProducts, useAuth, etc.)
│       └── lib/                # API clients, utilities
│           └── api/            # Typed API functions
├── prisma/
│   ├── schema.prisma           # Database schema (167 models, 107 enums)
│   └── migrations/             # Database migrations
├── deployment/                 # Terraform, scripts, configs
├── infrastructure/             # Docker compose, ECS task definitions
├── monitoring/                 # Prometheus, Grafana, alerting rules
├── load-tests/                 # k6 load test scripts
└── security/                   # Security scripts and configs
```

---

## Key Patterns

### Authentication Flow

1. **Registration:** `POST /auth/register` → creates User + Company → sends verification email
2. **Login:** `POST /auth/login` → validates credentials → checks lockout → generates JWT + refresh token → stores session
3. **Token Refresh:** `POST /auth/refresh` → validates refresh token → checks session → rotates (deletes old, creates new)
4. **OTP Flow:** `POST /auth/send-otp` → generates 6-digit OTP → stores in Redis (TTL 300s) → `POST /auth/verify-otp` → validates and deletes from Redis
5. **Password Reset:** `POST /auth/forgot-password` → sends OTP → `POST /auth/verify-reset-otp` → generates reset token (Redis TTL 600s) → `POST /auth/reset-password` → validates token, updates password

### Authorization Flow

1. **Global Guard:** `JwtAuthGuard` applied via `APP_GUARD` — all routes require JWT unless `@Public()`
2. **Role Check:** `RolesGuard` reads `@Roles('ADMIN')` metadata — checks `user.role`
3. **Permission Check:** `PermissionsGuard` reads `@Permissions('users:write:role')` — `SUPER_ADMIN` bypasses
4. **Ownership Check:** `CompanyOwnerGuard` validates `user` owns the `companyId` being accessed

### RFQ → Quote → Negotiation → PO → Order Flow

```
Buyer creates RFQ (6-step wizard)
    ↓
RFQ status: ACTIVE
    ↓
Near-to-Far matching finds suppliers
    ↓
Seller accepts/declines RFQ
    ↓
Seller creates Quote (line items, pricing, delivery terms)
    ↓
Buyer compares quotes (ranking algorithm: price 30%, deliveryTime 25%, trustScore 20%, rating 15%, responseTime 10%)
    ↓
Buyer accepts quote OR starts negotiation
    ↓
Negotiation: counter-offers (versioned, tracked)
    ↓
Buyer accepts negotiation → generates PO
    ↓
PO lifecycle: DRAFT → CONFIRMED → SELLER_PENDING → ACCEPTED → LOCKED
    ↓
Order created from locked PO
    ↓
Order lifecycle: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
    ↓
Shipment: PREPARING → PACKED → READY_FOR_PICKUP → COURIER_ASSIGNED → DISPATCHED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
    ↓
Delivery: Proof of Delivery (POD) with confirm/reject
    ↓
Payment: Razorpay/Stripe → Invoice generated
```

### Data Access Patterns

1. **Prisma ORM:** All standard CRUD uses Prisma with parameterized queries (SQL injection safe)
2. **Transactions:** `prisma.$transaction(async (tx) => { ... })` for multi-table operations (91 call sites)
3. **Raw Queries:** `prisma.$queryRawUnsafe()` with `$N` parameter placeholders (used in near-me service)
4. **Pagination:** `{ data, meta: { total, page, limit, totalPages, hasNext, hasPrevious } }`
5. **Soft Delete:** `deletedAt` field on User, Company, Product, Rfq, Quote, Order, etc.

### Frontend Data Fetching

1. **React Query Hooks:** `useProducts()`, `useAuth()`, `useBuyerDashboard()`, etc.
2. **API Client:** `apps/web/lib/api/` — typed fetch functions with auth headers
3. **Loading States:** All pages show loading spinners during fetch
4. **Error States:** All pages show error messages with retry options
5. **Empty States:** All pages show empty state when no data

---

## Module Reference

### Core Modules

| Module | Path | Purpose |
|--------|------|---------|
| Auth | `modules/auth/` | Registration, login, OTP, password reset, social login |
| Users | `modules/users/` | User CRUD, profile management |
| Companies | `modules/companies/` | Company CRUD, profiles, my-company |
| Products | `modules/products/` | Product CRUD, wishlist, categories |
| Smart RFQ | `modules/smart-rfq/` | RFQ creation, listing, matching, near-to-far |
| Quote | `modules/quote/` | Quote CRUD, ranking, acceptance |
| Smart Negotiation | `modules/smart-negotiation/` | Negotiation lifecycle, counter-offers |
| Smart PO | `modules/smart-po/` | Purchase order generation, lifecycle |
| Smart Order | `modules/smart-order/` | Order creation from PO, status updates |
| Smart Shipment | `modules/smart-shipment/` | Shipment creation, tracking, courier assignment |
| Smart Delivery | `modules/smart-delivery/` | Proof of Delivery, confirm/reject |
| Payment | `modules/payment/` | Razorpay + Stripe, webhooks, refunds |
| Notification | `modules/notification/` | Multi-channel notifications (in-app, email, SMS) |
| Storage | `modules/storage/` | S3 file upload, presigned URLs, ClamAV scanning |
| Search | `modules/search/` | OpenSearch full-text search |
| Tradfind | `modules/tradfind/` | Advanced search (autocomplete, geo, trending) |
| Chat | `modules/chat/` | Real-time messaging, conversations |
| Analytics | `modules/analytics/` | ClickHouse analytics, dashboards |
| Seller Analytics | `modules/seller-analytics/` | Seller-specific analytics |
| Dispute | `modules/dispute/` | Dispute creation, resolution, escalation |
| Escrow | `modules/escrow/` | Escrow management |
| Settlement | `modules/settlement/` | Settlement processing |
| Billing | `modules/billing/` | Invoices, subscriptions |
| Go Cash | `modules/go-cash/` | Wallet/credit system |
| Vendor Codes | `modules/vendor-codes/` | Vendor code validation |

### Common Infrastructure

| Component | Path | Purpose |
|-----------|------|---------|
| JWT Auth Guard | `common/guards/jwt-auth.guard.ts` | Global JWT validation |
| Roles Guard | `common/guards/roles.guard.ts` | Role-based access control |
| Permissions Guard | `common/guards/permissions.guard.ts` | Fine-grained permissions |
| Company Owner Guard | `common/guards/company-owner.guard.ts` | Company ownership validation |
| @Roles Decorator | `common/decorators/roles.decorator.ts` | Role metadata |
| @Public Decorator | `common/decorators/public.decorator.ts` | Public endpoint marker |
| @CurrentUser Decorator | `common/decorators/current-user.decorator.ts` | User extraction |
| Validation Pipe | `common/pipes/validation.pipe.ts` | Input validation |
| Transform Interceptor | `common/interceptors/transform.interceptor.ts` | Response wrapping |
| Logging Interceptor | `common/interceptors/logging.interceptor.ts` | Request logging |
| Sentry Interceptor | `common/interceptors/sentry.interceptor.ts` | Error capture |
| All Exceptions Filter | `common/filters/all-exceptions.filter.ts` | Error handling |
| Redis Service | `common/services/redis.service.ts` | Redis operations |
| Template Utils | `common/utils/template.utils.ts` | Email templates |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | `redis://localhost:6379/0` | Redis connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh token secret (min 32 chars) |
| `FRONTEND_URL` | ✅ | `http://localhost:3000` | Frontend URL for CORS |
| `OPENSEARCH_URL` | ✅ | — | OpenSearch node URL |
| `CLICKHOUSE_URL` | ✅ | — | ClickHouse connection URL |
| `SENTRY_DSN` | — | — | Sentry error tracking DSN |
| `SENTRY_ENABLED` | — | `false` | Enable Sentry |
| `AWS_REGION` | — | `ap-south-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | — | — | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | — | — | AWS secret key |
| `S3_BUCKET_NAME` | — | — | S3 bucket for uploads |
| `CLOUDFRONT_DOMAIN` | — | — | CloudFront distribution domain |
| `RAZORPAY_KEY_ID` | — | — | Razorpay key |
| `RAZORPAY_KEY_SECRET` | — | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | — | Razorpay webhook secret |
| `SMTP_HOST` | — | — | SMTP host (fallback for SES) |
| `SMTP_PORT` | — | `587` | SMTP port |
| `SMTP_USER` | — | — | SMTP username |
| `SMTP_PASS` | — | — | SMTP password |
| `EMAIL_FROM` | — | `noreply@tradingo.io` | Sender email |
| `TWILIO_ACCOUNT_SID` | — | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | — | — | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | — | — | Twilio phone number |

### Config Modules

All config loaded via `ConfigModule.forRoot()` with `registerAs()` namespaces:
- `app` — NODE_ENV, PORT, API_PREFIX
- `database` — DATABASE_URL
- `redis` — REDIS_URL
- `jwt` — JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY
- `aws` — region, accessKeyId, secretAccessKey, s3Bucket, cloudfrontDomain
- `opensearch` — url, username, password, rejectUnauthorized
- `sentry` — dsn, enabled
- `clickhouse` — url
- `razorpay` — keyId, keySecret, webhookSecret

---

## Security Architecture

### Authentication
- JWT access tokens (15-minute expiry)
- Refresh tokens (7-day expiry, rotated on use)
- SHA-256 hashed refresh tokens stored in DB
- bcrypt password hashing (12 salt rounds)
- Account lockout after 3 failed attempts (15-minute lock)
- OTP-based password reset (Redis TTL 300s)
- Email verification (Redis TTL 86400s)

### Authorization
- Global `JwtAuthGuard` (all routes require JWT unless `@Public()`)
- `RolesGuard` — role-based access (SUPER_ADMIN, ADMIN, MANAGER, VIEWER, SELLER, BUYER)
- `PermissionsGuard` — fine-grained permissions (SUPER_ADMIN bypasses)
- `CompanyOwnerGuard` — company ownership validation

### Rate Limiting
- Global: 100 requests per 60 seconds
- Auth endpoints: 3-10 requests per minute (stricter)
- WebSocket: 30 messages per minute per user

### Security Headers
- Helmet (CSP, X-Frame-Options: DENY, HSTS, X-XSS-Protection)
- CSRF protection via `@fastify/csrf-protection`

### File Security
- MIME-type whitelist (18 types)
- 100MB file size limit
- ClamAV malware scanning
- S3 ACL control (public/private)
- Quarantine for infected files

---

## Database Schema

### Key Models (167 total)

| Domain | Models |
|--------|--------|
| Auth & Users | User, Session, AuditLog, Organization, OrganizationMember, OrganizationInvitation |
| Companies | Company, CompanyOwner, CompanyLocation, CompanyGalleryImage, CompanyCertification |
| Products | Product, ProductMedia, ProductAttribute, ProductVariant, Category, Industry |
| RFQ/Quote | Rfq, RfqVendorMatch, RfqCreditLedger, Quote, QuoteEvent, QuoteLineItem |
| Negotiation | Negotiation, NegotiationVersion, NegotiationEvent |
| Orders | PurchaseOrder, PurchaseOrderVersion, PurchaseOrderEvent, Order, OrderItem, OrderTimelineEvent |
| Payments | Payment, Escrow, EscrowEvent, ManualPaymentProof, ProcessedWebhookEvent |
| Shipment/Delivery | Shipment, ShipmentPackage, ShipmentTimelineEvent, Delivery, DeliveryTimelineEvent |
| Notifications | Notification, NotificationPreference, NotificationTemplate |
| Chat | Conversation, ConversationParticipant, Message, ConversationAuditLog, BlockedUser |
| Disputes | Dispute, DisputeProcessorExecution, DisputeTimelineEvent |
| Analytics | SellerAnalyticsEvent, RfqAnalyticsEvent, OrderAnalyticsEvent, ProductBestsellerSnapshot |
| Billing | Invoice, InvoiceHistory, InvoiceSequence, Subscription, SubscriptionEvent |
| Go Cash | GoCashTransaction, GoCashLedger |
| Catalog Import | ImportJob, ImportJobRow |
| File Security | FileScan |
| Vendor Codes | VendorCode, VendorCodeSequence |

### onDelete Policy Distribution

| Policy | Count | Purpose |
|--------|-------|---------|
| Cascade | 113 | Delete children with parent (e.g., Order → OrderItem) |
| SetNull | 46 | Null FK on parent delete (e.g., User → AuditLog) |
| Restrict | 42 | Block parent delete if children exist (e.g., Company → RFQ) |
| NoAction | 6 | Archival analytics records (e.g., Company → GoCashTransaction) |

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Rate Limit |
|--------|----------|:----:|:----------:|
| POST | `/auth/register` | No | 5/min |
| POST | `/auth/register/vendor` | No | 3/min |
| POST | `/auth/register/buyer` | No | 3/min |
| POST | `/auth/login` | No | 10/min |
| POST | `/auth/refresh` | No | 5/min |
| POST | `/auth/logout` | Yes | — |
| POST | `/auth/forgot-password` | No | 3/min |
| POST | `/auth/reset-password` | No | 5/min |
| POST | `/auth/change-password` | Yes | 3/min |
| POST | `/auth/send-otp` | No | 3/min |
| POST | `/auth/verify-otp` | No | 5/min |
| POST | `/auth/send-login-otp` | No | 3/min |
| POST | `/auth/login-otp` | No | 5/min |
| POST | `/auth/verify-email` | No | 5/min |
| POST | `/auth/resend-verification` | No | 3/min |
| PATCH | `/auth/me` | Yes | — |
| GET | `/auth/sessions` | Yes | — |
| DELETE | `/auth/sessions/:id` | Yes | — |

### Health Endpoints

| Method | Endpoint | Auth | Rate Limit |
|--------|----------|:----:|:----------:|
| GET | `/live` | No | Skipped |
| GET | `/ready` | No | Skipped |
| GET | `/health` | No | Skipped |

### RFQ Endpoints

| Method | Endpoint | Auth | Role |
|--------|----------|:----:|------|
| POST | `/smart-rfq` | Yes | BUYER |
| GET | `/smart-rfq` | Yes | — |
| GET | `/smart-rfq/:id` | Yes | — |
| PATCH | `/smart-rfq/:id` | Yes | BUYER |
| GET | `/smart-rfq/:id/quotes` | Yes | — |
| POST | `/smart-rfq/:rfqId/accept-quote/:quoteId` | Yes | BUYER |
| POST | `/smart-rfq/:rfqId/reject-quote/:quoteId` | Yes | BUYER |
| GET | `/smart-rfq/seller/incoming` | Yes | SELLER |
| POST | `/smart-rfq/seller/:rfqId/accept` | Yes | SELLER |
| POST | `/smart-rfq/seller/:rfqId/decline` | Yes | SELLER |

### Payment Endpoints

| Method | Endpoint | Auth | Role |
|--------|----------|:----:|------|
| POST | `/payments/order` | Yes | — |
| POST | `/payments/verify` | Yes | — |
| GET | `/payments` | Yes | — |
| GET | `/payments/:id` | Yes | — |
| POST | `/payments/:id/refund` | Yes | ADMIN |
| POST | `/payments/webhook/razorpay` | No | — |
| POST | `/payments/webhook/stripe` | No | — |

---

## Troubleshooting

### Common Issues

1. **Prisma Client not found:** Run `npx prisma generate` after schema changes
2. **TypeScript errors:** Run `npx tsc --noEmit` in the affected app directory
3. **Build fails:** Check `next.config.js` for missing `output: 'standalone'`
4. **Redis connection refused:** Ensure Redis is running on `localhost:6379`
5. **JWT validation fails:** Check `JWT_SECRET` is at least 32 characters
6. **CORS error:** Ensure `FRONTEND_URL` matches the actual frontend origin
7. **File upload fails:** Check MIME type is in whitelist, size < 100MB
8. **Rate limit hit:** Auth endpoints have strict limits (3-10/min)

### Debug Commands

```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma client
npx prisma generate

# Check TypeScript (API)
cd apps/api && npx tsc --noEmit

# Check TypeScript (Web)
cd apps/web && npx tsc --noEmit

# Build frontend
cd apps/web && npx next build

# Run database migrations
npx prisma migrate deploy

# Check database status
npx prisma migrate status

# Seed database
npx prisma db seed
```

### Key Files for Debugging

| Issue | File |
|-------|------|
| Auth errors | `apps/api/src/modules/auth/auth.service.ts` |
| JWT issues | `apps/api/src/config/app.config.ts` (jwt config) |
| Database errors | `prisma/schema.prisma` |
| CORS errors | `apps/api/src/main.ts` (CORS config) |
| Rate limiting | `apps/api/src/app.module.ts` (ThrottlerModule) |
| File upload | `apps/api/src/modules/storage/storage.controller.ts` |
| Payment errors | `apps/api/src/modules/payment/payment.service.ts` |
| Notification errors | `apps/api/src/modules/notification/notification.processor.ts` |

---

*Last Updated: June 29, 2026*  
*Platform: TRADINGO™ Core Platform v1.0*
