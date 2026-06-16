-- ============================================================================
-- TRADINGO ClickHouse Schema — High-Volume Analytics
-- Target: 10M+ events/month, Dashboard <500ms
-- ============================================================================

-- ─── Seller Analytics ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.seller_analytics_events (
    event_id       UUID DEFAULT generateUUIDv4(),
    company_id     String,
    user_id        String,
    event_type     String,
    metadata       String DEFAULT '{}',
    ip_address     String DEFAULT '',
    user_agent     String DEFAULT '',
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ─── RFQ Analytics ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.rfq_analytics_events (
    event_id       UUID DEFAULT generateUUIDv4(),
    company_id     String,
    rfq_id         String,
    event_type     String,
    metadata       String DEFAULT '{}',
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ─── Order Analytics ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.order_analytics_events (
    event_id       UUID DEFAULT generateUUIDv4(),
    company_id     String,
    order_id       String,
    event_type     String,
    order_status   String DEFAULT '',
    amount         Decimal(18,2) DEFAULT 0,
    currency       String DEFAULT 'INR',
    metadata       String DEFAULT '{}',
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ─── Chat Analytics ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.chat_analytics_events (
    event_id        UUID DEFAULT generateUUIDv4(),
    company_id      String,
    conversation_id String,
    message_id      String,
    event_type      String,
    participant_count UInt32 DEFAULT 0,
    metadata        String DEFAULT '{}',
    created_at      DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 1 YEAR DELETE;

-- ─── Notification Analytics ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.notification_analytics_events (
    event_id       UUID DEFAULT generateUUIDv4(),
    company_id     String,
    notification_id String,
    channel        String,
    event_type     String,
    status         String,
    attempt_count  UInt32 DEFAULT 0,
    metadata       String DEFAULT '{}',
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 1 YEAR DELETE;

-- ─── Dispute Analytics ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.dispute_analytics_events (
    event_id       UUID DEFAULT generateUUIDv4(),
    company_id     String,
    dispute_id     String,
    event_type     String,
    dispute_status String DEFAULT '',
    amount         Decimal(18,2) DEFAULT 0,
    metadata       String DEFAULT '{}',
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ─── Payment Analytics ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.payment_analytics_events (
    event_id        UUID DEFAULT generateUUIDv4(),
    company_id      String,
    payment_id      String,
    event_type      String,
    payment_status  String,
    amount          Decimal(18,2) DEFAULT 0,
    gateway         String DEFAULT '',
    currency        String DEFAULT 'INR',
    metadata        String DEFAULT '{}',
    created_at      DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ─── Settlement Analytics ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.settlement_analytics_events (
    event_id        UUID DEFAULT generateUUIDv4(),
    company_id      String,
    settlement_id   String,
    event_type      String,
    settlement_status String,
    amount          Decimal(18,2) DEFAULT 0,
    metadata        String DEFAULT '{}',
    created_at      DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ─── GoCash Analytics ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradingo.gocash_analytics_events (
    event_id       UUID DEFAULT generateUUIDv4(),
    company_id     String,
    transaction_id String,
    event_type     String,
    transaction_type String,
    amount         Int32 DEFAULT 0,
    balance_after  Int32 DEFAULT 0,
    metadata       String DEFAULT '{}',
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (company_id, created_at)
TTL created_at + INTERVAL 2 YEAR DELETE;

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Daily Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.daily_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (company_id, day)
POPULATE AS
SELECT
    company_id,
    toDate(created_at) AS day,
    countIf(event_type = 'ORDER_PLACED') AS orders,
    countIf(event_type = 'RFQ_SUBMITTED') AS rfqs,
    countIf(event_type = 'QUOTE_SENT') AS quotes_sent,
    countIf(event_type = 'QUOTE_ACCEPTED') AS quotes_accepted,
    countIf(event_type = 'PROFILE_VIEW') AS profile_views,
    countIf(event_type = 'PRODUCT_VIEW') AS product_views,
    countIf(event_type = 'SEARCH_IMPRESSION') AS search_impressions,
    countIf(event_type = 'SEARCH_CLICK') AS search_clicks,
    countIf(event_type = 'DISPUTE_OPENED') AS disputes,
    countIf(event_type = 'PAYMENT_CAPTURED') AS payments,
    countIf(event_type = 'SETTLEMENT_COMPLETED') AS settlements,
    sumIf(amount, event_type = 'ORDER_PLACED') AS revenue
FROM tradingo.seller_analytics_events
GROUP BY company_id, day;

-- Monthly Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.monthly_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (company_id, month)
POPULATE AS
SELECT
    company_id,
    toStartOfMonth(created_at) AS month,
    countIf(event_type = 'ORDER_PLACED') AS orders,
    countIf(event_type = 'RFQ_SUBMITTED') AS rfqs,
    countIf(event_type = 'QUOTE_SENT') AS quotes_sent,
    countIf(event_type = 'QUOTE_ACCEPTED') AS quotes_accepted,
    countIf(event_type = 'DISPUTE_OPENED') AS disputes,
    countIf(event_type = 'PAYMENT_CAPTURED') AS payments,
    countIf(event_type = 'SETTLEMENT_COMPLETED') AS settlements,
    sumIf(amount, event_type = 'ORDER_PLACED') AS revenue
FROM tradingo.seller_analytics_events
GROUP BY company_id, month;

-- Yearly Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.yearly_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(year)
ORDER BY (company_id, year)
POPULATE AS
SELECT
    company_id,
    toStartOfYear(created_at) AS year,
    countIf(event_type = 'ORDER_PLACED') AS orders,
    countIf(event_type = 'RFQ_SUBMITTED') AS rfqs,
    countIf(event_type = 'QUOTE_SENT') AS quotes_sent,
    countIf(event_type = 'QUOTE_ACCEPTED') AS quotes_accepted,
    sumIf(amount, event_type = 'ORDER_PLACED') AS revenue
FROM tradingo.seller_analytics_events
GROUP BY company_id, year;

-- Leaderboard Metrics (by total orders revenue)
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.leaderboard_metrics
ENGINE = SummingMergeTree()
ORDER BY (total_revenue)
POPULATE AS
SELECT
    company_id,
    countIf(event_type = 'ORDER_PLACED') AS total_orders,
    countIf(event_type = 'RFQ_SUBMITTED') AS total_rfqs,
    countIf(event_type = 'QUOTE_ACCEPTED') AS total_quotes_accepted,
    sumIf(amount, event_type = 'ORDER_PLACED') AS total_revenue
FROM tradingo.seller_analytics_events
GROUP BY company_id;

-- TRADGO Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.tradgo_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (company_id, month)
POPULATE AS
SELECT
    company_id,
    toStartOfMonth(created_at) AS month,
    countIf(event_type = 'GOCASH_EARNED') AS earned,
    countIf(event_type = 'GOCASH_REDEEMED') AS redeemed,
    sumIf(amount, event_type = 'GOCASH_EARNED') AS total_earned,
    sumIf(amount, event_type = 'GOCASH_REDEEMED') AS total_redeemed
FROM tradingo.gocash_analytics_events
GROUP BY company_id, month;

-- Subscription Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.subscription_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (company_id, month)
POPULATE AS
SELECT
    company_id,
    toStartOfMonth(created_at) AS month,
    countIf(event_type = 'SUBSCRIPTION_ACTIVATED') AS activations,
    countIf(event_type = 'SUBSCRIPTION_EXPIRED') AS expirations,
    countIf(event_type = 'SUBSCRIPTION_RENEWED') AS renewals
FROM tradingo.seller_analytics_events
GROUP BY company_id, month;

-- Dispute Metrics (for admin dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.dispute_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (company_id, month)
POPULATE AS
SELECT
    company_id,
    toStartOfMonth(created_at) AS month,
    countIf(event_type = 'DISPUTE_OPENED') AS total_disputes,
    countIf(event_type = 'DISPUTE_RESOLVED') AS resolved_disputes,
    countIf(event_type = 'DISPUTE_REFUNDED') AS refunded_disputes,
    countIf(event_type = 'ARBITRATION_STARTED') AS arbitration_cases,
    countIf(event_type = 'ARBITRATION_SLA_BREACH') AS sla_breaches
FROM tradingo.dispute_analytics_events
GROUP BY company_id, month;
