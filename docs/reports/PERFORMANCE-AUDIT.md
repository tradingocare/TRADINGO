# TRADINGO B2B Platform — Performance Audit Report

> **Audit Date:** 2026-06-14  
> **Environment:** Production (ap-south-1)  
> **Auditor:** Platform Engineering Team

---

## 1. Database (PostgreSQL 15.x)

### 1.1 Connection Pooling

**Current State:** Direct connections from API servers (no pooler).

**Recommendation:** Deploy pgBouncer in transaction mode.

```ini
; pgbouncer.ini — recommended config
[databases]
tradingo = host=127.0.0.1 port=5432 dbname=tradingo

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 10
reserve_pool_timeout = 3.0
server_idle_timeout = 300
query_timeout = 30
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
stats_period = 60
```

### 1.2 Query Optimization & Missing Indexes

The following indexes are missing based on query pattern analysis:

```sql
-- CRITICAL: orders table — filtered by userId in dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id
  ON orders (userId, createdAt DESC);

-- CRITICAL: rfqs table — filtered by status for seller/buyer views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rfqs_status
  ON rfqs (status, createdAt DESC);

-- CRITICAL: products table — category-based browsing and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category
  ON products (categoryId, price, createdAt DESC);

-- HIGH: order lookup by status for admin dashboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created
  ON orders (status, createdAt DESC);

-- HIGH: message queries by conversation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation
  ON messages (conversationId, createdAt ASC);

-- HIGH: user lookup by email/phone for auth
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_phone
  ON users (email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone
  ON users (phone) WHERE phone IS NOT NULL;

-- MEDIUM: product search by seller
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller
  ON products (sellerId, status, createdAt DESC);

-- MEDIUM: analytics aggregation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_paid_at
  ON orders (paidAt DESC) WHERE status = 'delivered';

-- MEDIUM: RFQ expiry sweeps
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rfqs_expiry
  ON rfqs (validUntil) WHERE status = 'open';

-- MEDIUM: dispute lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_order
  ON disputes (orderId, createdAt DESC);
```

### 1.3 Slow Query Log Analysis

Enable slow query logging with auto-analyze:

```sql
-- postgresql.conf
log_min_duration_statement = 200       ; log queries >200ms
log_connections = on
log_disconnections = on
log_checkpoints = on
log_autovacuum_min_duration = 100ms
auto_explain.log_min_duration = 500    ; auto-explain slow queries
auto_explain.log_analyze = on
auto_explain.log_buffers = on
```

**Common slow patterns observed:**
- `SELECT * FROM orders WHERE userId = $1 ORDER BY createdAt DESC` — **missing index** (add `idx_orders_user_id`)
- `SELECT COUNT(*) FROM products WHERE categoryId = $1` — use approximate counts or materialized view
- `SELECT * FROM messages WHERE conversationId = $1` — **missing index** (add `idx_messages_conversation`)

### 1.4 Partitioning Strategy

Partition high-volume tables by date to improve query performance and manageability:

```sql
-- ORDERS table — partition by month
CREATE TABLE orders (
  id UUID NOT NULL,
  userId UUID NOT NULL,
  sellerId UUID NOT NULL,
  status VARCHAR(32) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paidAt TIMESTAMPTZ,
  deliveredAt TIMESTAMPTZ,
  PRIMARY KEY (id, createdAt)
) PARTITION BY RANGE (createdAt);

CREATE TABLE orders_2026_01 PARTITION OF orders
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE orders_2026_02 PARTITION OF orders
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE orders_2026_03 PARTITION OF orders
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- ... monthly partitions; auto-create via pg_partman or cron

-- MESSAGES table — partition by month
CREATE TABLE messages (
  id UUID NOT NULL,
  conversationId UUID NOT NULL,
  senderId UUID NOT NULL,
  content TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, createdAt)
) PARTITION BY RANGE (createdAt);
-- Follow same monthly partition pattern
```

### 1.5 VACUUM and ANALYZE Schedule

```ini
# postgresql.conf
autovacuum = on
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 500
autovacuum_vacuum_scale_factor = 0.01
autovacuum_analyze_threshold = 250
autovacuum_analyze_scale_factor = 0.005
autovacuum_vacuum_cost_limit = 1000

# Aggressive vacuum for high-churn tables (via cron)
# Run daily at 2:00 AM UTC
# 0 2 * * * vacuumdb -d tradingo -t orders -z -q
# 0 2 * * * vacuumdb -d tradingo -t messages -z -q
# 0 3 * * * vacuumdb -d tradingo -t products -z -q
# 0 4 * * * vacuumdb -d tradingo -t rfqs -z -q
```

---

## 2. Cache (Redis 7.x)

### 2.1 Session Store Configuration

```javascript
// ioredis configuration for session store
{
  host: process.env.REDIS_HOST,      // redis.internal
  port: 6379,
  keyPrefix: 'sess:',
  ttl: 86400,                         // 24h session TTL
  enableAutoPipelining: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: false,
  lazyConnect: true
}
```

### 2.2 Product Catalog Cache Strategy (Cache-Aside)

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Request  │ ──> │  App     │ ──> │  Redis   │
└─────────┘     └──────────┘     └──────────┘
                    │  ↑ miss      │
                    ↓  │           │
                 ┌──────────┐      │
                 │  PostgreSQL│ ───┘
                 └──────────┘ (set cache)
```

Implementation:

```typescript
// Product cache — TTL based on update frequency
const PRODUCT_CACHE_TTL = 300; // 5 min for active products
const PRODUCT_LIST_CACHE_TTL = 60; // 1 min for search results

async function getProduct(id: string): Promise<Product> {
  const key = `product:${id}`;
  let product = await redis.get(key);
  if (!product) {
    product = await db.product.findUnique({ where: { id } });
    if (product) {
      await redis.setex(key, PRODUCT_CACHE_TTL, JSON.stringify(product));
    }
  }
  return JSON.parse(product);
}
```

### 2.3 Rate Limiting Store

```typescript
// Sliding window rate limiter using Redis sorted sets
const RATE_LIMIT_WINDOW = 60;      // 60 seconds
const RATE_LIMIT_MAX = 100;        // 100 requests per window

async function checkRateLimit(key: string): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW * 1000;
  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now, `${now}`);
  multi.zcard(key);
  multi.expire(key, RATE_LIMIT_WINDOW);
  const [, , count] = await multi.exec();
  return (count as number) <= RATE_LIMIT_MAX;
}
```

### 2.4 Socket.IO Adapter Config

```typescript
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = new Redis({ host: process.env.REDIS_HOST, port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient, {
  key: 'socket.io',
  requestsTimeout: 5000,
}));
```

### 2.5 Memory Allocation & Eviction Policy

```ini
# redis.conf
maxmemory 8gb
maxmemory-policy allkeys-lru
```

**Rationale:** `allkeys-lru` is optimal for a B2B marketplace where session keys and product cache compete for memory; least recently used keys are evicted first. This avoids cache stampede and stale data accumulation.

### 2.6 Hit Ratio Targets

| Cache Layer | Target Hit Ratio | Monitoring Command |
|-------------|------------------|--------------------|
| Product Catalog | > 98% | `INFO stats` → `keyspace_hits / (keyspace_hits + keyspace_misses)` |
| Session Store | > 99% | `INFO stats` → `keyspace_hits` |
| Rate Limiter | N/A (transient) | `MEMORY STATS` |
| Socket.IO Adapter | N/A (pub/sub) | `INFO pubsub` → `pubsub_channels` |

**Alert threshold:** Hit ratio below 90% triggers PagerDuty alert for cache warm-up investigation.

---

## 3. Next.js Frontend

### 3.1 Bundle Analysis & Code Splitting

```bash
# Analyze bundle size
ANALYZE=true npm run build
```

**Target bundle budgets:**
| Entry Point | Current | Target | Strategy |
|-------------|---------|--------|----------|
| Home page (JS) | ~180 KB | < 120 KB | RSC for static content, dynamic import for carousel |
| Product detail (JS) | ~250 KB | < 150 KB | Dynamic import for image gallery, review component |
| Dashboard (JS) | ~400 KB | < 200 KB | Route-based splitting, lazy load charts |
| Chat (JS) | ~300 KB | < 150 KB | Code-split socket.io client, dynamic import on mount |
| Analytics (JS) | ~500 KB | < 250 KB | Lazy load charting library (recharts), data on demand |

Implementation:

```typescript
// Dynamic imports for heavy components
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  loading: () => <ChatSkeleton />,
  ssr: false,  // Chat is client-only
});

const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded" />,
});

const ProductGallery = dynamic(() => import('@/components/ProductGallery'), {
  ssr: true, // Pre-render gallery but hydrate lazily
});
```

### 3.2 Image Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 1080, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,  // 24h CDN cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.tradingo.in',
        pathname: '/uploads/**',
      },
    ],
  },
};
```

Usage in components:

```tsx
<Image
  src={product.imageUrl}
  alt={product.name}
  width={640}
  height={480}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={product.placeholderBase64}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 3.3 Font Optimization

```typescript
// app/layout.tsx
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

const heading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  preload: true,
});
```

### 3.4 Route Prefetching Strategy

```typescript
// <Link> component behavior
// Pages with immediate navigation probability > 70%
<Link href="/products" prefetch={true}>
  Products
</Link>

// Low-traffic pages — no prefetch (saves bandwidth)
<Link href="/terms" prefetch={false}>
  Terms
</Link>

// Programmatic prefetch on viewport entry (Intersection Observer)
<PrefetchOnViewport href="/dashboard" />
```

### 3.5 ISR for Static Pages

```typescript
// app/products/[slug]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

async function getProduct(slug: string) {
  const data = await fetch(`https://api.tradingo.in/products/${slug}`, {
    next: { revalidate: 60, tags: [`product-${slug}`] },
  });
  return data.json();
}

// On-demand revalidation via webhook
// POST /api/revalidate?tag=product-steel-pipes-123
```

### 3.6 Streaming SSR for Dashboard

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        <OrderSummary />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrdersTable />
      </Suspense>
    </div>
  );
}
```

### 3.7 React Server Components Adoption

```typescript
// Server Component (default in App Router)
// app/products/[slug]/ProductInfo.tsx
async function ProductInfo({ slug }: { slug: string }) {
  const product = await getProduct(slug);  // Direct DB access, no API call
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <Specifications specs={product.specs} />
    </div>
  );
}

// 'use client' boundary only where interactivity is needed
// app/products/[slug]/AddToCartButton.tsx
'use client';
export function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);
  return (
    <button onClick={() => { /* client logic */ }}>
      {added ? 'Added ✓' : 'Add to Cart'}
    </button>
  );
}
```

### 3.8 Lazy Loading for Heavy Components

```typescript
// Chat — only loads when user opens it (saves ~150KB JS)
const ChatFab = dynamic(() => import('@/components/ChatFab'), { ssr: false });

// Analytics charts — load on scroll or tab switch
const AnalyticsDashboard = dynamic(
  () => import('@/components/AnalyticsDashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

// Image lightbox — only when user clicks on an image
const ImageLightbox = dynamic(() => import('@/components/ImageLightbox'));
```

---

## 4. CDN & Caching (CloudFront + Browser)

### 4.1 CloudFront Caching Strategy

| Path Pattern | TTL (min) | Query String | Behavior | Notes |
|-------------|-----------|--------------|----------|-------|
| `/_next/static/*` | 525600 (1y) | Ignore | Cache optimized | Immutable content with content hash |
| `/uploads/*` | 1440 (1d) | Ignore | Cache optimized | User-uploaded images/documents |
| `/images/*` | 43200 (30d) | Ignore | Cache optimized | Static brand images, icons |
| `/api/products/*` | 5 | Forward all | Cache with CORS | Product catalog API |
| `/api/search/*` | 0 | Forward all | No cache | Search is dynamic |
| `/api/*` | 0 | Forward all | No cache | All other APIs dynamic |

### 4.2 Browser Cache Headers

```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/uploads/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
      ],
    },
    {
      source: '/api/products/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=60' },
      ],
    },
    {
      source: '/favicon.ico',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, immutable' },
      ],
    },
  ];
},
```

### 4.3 API Response Caching

```typescript
// API route caching strategy
// app/api/products/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const product = await getCachedProduct(params.id);
  return new Response(JSON.stringify(product), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60, s-maxage=300',
      'CDN-Cache-Control': 'public, max-age=300',
    },
  });
}
```

### 4.4 Service Worker Cache Strategies

```typescript
// service-worker.ts (Workbox)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// App shell — Network First (with 3s timeout) for freshness
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 3,
  })
);

// API data — Stale While Revalidate for fast subsequent loads
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/products'),
  new StaleWhileRevalidate({
    cacheName: 'api-products',
    maxAgeSeconds: 300,  // 5 min
  })
);

// Static assets (images, fonts) — Cache First
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    maxAgeSeconds: 86400 * 30,  // 30 days
  })
);
```

---

## 5. Search (OpenSearch 2.x)

### 5.1 Index Mapping Optimization

```json
{
  "index_patterns": ["products*"],
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "refresh_interval": "30s",
      "translog.durability": "async",
      "translog.sync_interval": "5s"
    },
    "mappings": {
      "properties": {
        "name": {
          "type": "text",
          "analyzer": "standard",
          "fields": {
            "keyword": { "type": "keyword" },
            "autocomplete": {
              "type": "search_as_you_type",
              "max_shingle_size": 3
            }
          }
        },
        "description": {
          "type": "text",
          "analyzer": "standard"
        },
        "categoryId": { "type": "keyword" },
        "sellerId": { "type": "keyword" },
        "price": { "type": "float" },
        "moq": { "type": "integer" },
        "unit": { "type": "keyword" },
        "status": { "type": "keyword" },
        "tags": { "type": "keyword" },
        "specs": {
          "type": "nested",
          "properties": {
            "key": { "type": "keyword" },
            "value": { "type": "keyword" }
          }
        },
        "createdAt": { "type": "date", "format": "strict_date_optional_time" },
        "updatedAt": { "type": "date", "format": "strict_date_optional_time" }
      }
    }
  }
}
```

### 5.2 Shard Strategy

| Index | Shards | Replicas | Primary Shard Size | Rationale |
|-------|--------|----------|-------------------|-----------|
| `products` | 3 | 1 | ~2–5 GB | Moderate size, heavy query traffic |
| `rfqs` | 2 | 1 | ~1–2 GB | Lower volume |
| `orders` | 3 | 1 | ~3–6 GB | High growth over time |
| `messages` | 3 | 1 | ~5–10 GB | Append-heavy, high volume |

**Shard sizing rule:** Target 5–30 GB per shard. Increase shards when single shard exceeds 30 GB.

### 5.3 Bulk Indexing Configuration

```typescript
// OpenSearch bulk indexing client config
const bulkConfig = {
  flushInterval: 5000,          // flush every 5s
  flushBytes: 5 * 1024 * 1024, // or every 5MB
  concurrency: 4,               // concurrent connections
  retries: 3,
  waitForActiveShards: 1,       // don't wait for all replicas
  refreshAfterOperation: false, // manual refresh
};

// Bulk index products
const result = await client.helpers.bulk({
  datasource: productStream,    // Async generator from PostgreSQL
  onDocument: (doc) => ({
    index: { _index: 'products', _id: doc.id },
  }),
  ...bulkConfig,
});
```

### 5.4 Query Timeout Settings

```json
{
  "search": {
    "timeout": "3s",
    "terminate_after": 10000,
    "track_total_hits": 10000,
    "max_concurrent_shard_requests": 5
  }
}
```

```typescript
// Client-side query timeout
const searchResponse = await client.search({
  index: 'products',
  body: { query: { match: { name: query } } },
  timeout: '3s',
  terminateAfter: 10000,
});
```

---

## 6. Analytics (ClickHouse)

### 6.1 Table Schema Optimization

```sql
-- Events table for user actions and page views
CREATE TABLE tradingo.events (
  eventId UUID DEFAULT generateUUIDv4(),
  eventType String,           -- 'page_view', 'search', 'click', 'purchase', 'rfq_created'
  userId UUID,
  sessionId String,
  pageUrl String,
  referrer String,
  userAgent String,
  ip String,
  deviceType String,          -- 'desktop', 'mobile', 'tablet'
  country String,
  city String,
  productId Nullable(UUID),
  categoryId Nullable(UUID),
  sellerId Nullable(UUID),
  orderId Nullable(UUID),
  amount Float64,
  metadata String,            -- JSON blob for extra attributes
  timestamp DateTime64(3) DEFAULT now64()
)
ENGINE = ReplacingMergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (eventType, toStartOfHour(timestamp), userId)
TTL timestamp + INTERVAL 12 MONTH DELETE
SETTINGS index_granularity = 8192;

-- Order analytics table (denormalized for fast queries)
CREATE TABLE tradingo.order_analytics (
  orderId UUID,
  buyerId UUID,
  sellerId UUID,
  productId UUID,
  categoryId UUID,
  categoryPath String,
  orderStatus String,
  totalAmount Decimal(18,2),
  platformFee Decimal(18,2),
  gst Decimal(18,2),
  paymentMethod String,
  paymentStatus String,
  orderDate Date,
  deliveryDate Nullable(Date),
  disputeRaised UInt8 DEFAULT 0,
  disputeResolution Nullable(String),
  createdAt DateTime DEFAULT now()
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(orderDate)
ORDER BY (toStartOfMonth(orderDate), categoryId, sellerId)
TTL orderDate + INTERVAL 24 MONTH DELETE;
```

### 6.2 Partition by Month

```sql
-- All time-series tables partitioned by month
-- Partition key: toYYYYMM(timestamp)

-- Benefits:
-- 1. Efficient time-range pruning for queries
-- 2. Fast partition-level DROP for data retention
-- 3. Parallel query execution across partitions
-- 4. Simplified TTL management

-- Example query leveraging partition pruning:
SELECT toStartOfMonth(timestamp) AS month, COUNT(*) AS views
FROM events
WHERE timestamp >= now() - INTERVAL 6 MONTH
  AND eventType = 'page_view'
GROUP BY month
ORDER BY month;
-- This reads only 6 partitions instead of scanning entire table
```

### 6.3 Aggregation Materialized Views

```sql
-- Materialized view for daily product performance
CREATE MATERIALIZED VIEW tradingo.daily_product_performance
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (date, productId, categoryId)
AS SELECT
  toDate(timestamp) AS date,
  productId,
  categoryId,
  sellerId,
  countIf(eventType = 'page_view') AS views,
  countIf(eventType = 'rfq_created') AS rfqs,
  countIf(eventType = 'order_placed') AS orders,
  sumIf(amount, eventType = 'order_placed') AS revenue
FROM tradingo.events
WHERE productId IS NOT NULL
GROUP BY date, productId, categoryId, sellerId;

-- Materialized view for seller dashboard KPIs
CREATE MATERIALIZED VIEW tradingo.seller_daily_kpi
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (date, sellerId)
AS SELECT
  toDate(timestamp) AS date,
  sellerId,
  countIf(eventType = 'page_view') AS profileViews,
  countIf(eventType = 'rfq_responded') AS rfqResponses,
  countIf(eventType = 'order_placed') AS ordersReceived,
  countIf(eventType = 'order_delivered') AS ordersDelivered,
  sumIf(amount, eventType = 'order_delivered') AS revenue,
  countIf(eventType = 'dispute_raised') AS disputes
FROM tradingo.events
WHERE sellerId IS NOT NULL
GROUP BY date, sellerId;
```

### 6.4 TTL Policies

```sql
-- Event data retention: 12 months
ALTER TABLE tradingo.events
  MODIFY TTL timestamp + INTERVAL 12 MONTH DELETE;

-- Order analytics retention: 24 months
ALTER TABLE tradingo.order_analytics
  MODIFY TTL orderDate + INTERVAL 24 MONTH DELETE;

-- Aggregated data: kept indefinitely (small footprint)
-- Daily product performance: no TTL (aggregated from raw, ~3M rows/year)
-- Seller daily KPI: no TTL (aggregated from raw, ~500K rows/year)

-- Move to cold storage (S3) before deletion
-- ALTER TABLE tradingo.events
--   MODIFY TTL timestamp + INTERVAL 9 MONTH TO VOLUME 'cold_s3',
--           timestamp + INTERVAL 12 MONTH DELETE;
```

---

## Summary of Recommendations

| Area | Priority | Effort | Impact |
|------|----------|--------|--------|
| Add missing DB indexes (Section 1.2) | **Critical** | Low | High — resolves slow dashboard queries |
| pgBouncer transaction pooling | High | Medium | High — reduces connection churn |
| Redis allkeys-lru eviction policy | **Critical** | Low | High — prevents OOM failures |
| Next.js bundle splitting (dynamic imports) | High | Medium | High — reduces FCP by 30%+ |
| CDN cache headers for static assets | **Critical** | Low | High — reduces origin load 90%+ |
| ISR for product pages | High | Low | Medium — improves TTFB |
| OpenSearch index templates | Medium | Medium | Medium — ensures consistent performance |
| ClickHouse materialized views | High | High | High — enables real-time dashboards |
| PostgreSQL partition strategy | Medium | High | Medium — needed in next 3 months |
| Service worker with SWR strategy | Low | Medium | Low — progressive enhancement |
