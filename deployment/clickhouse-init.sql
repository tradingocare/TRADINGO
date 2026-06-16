CREATE DATABASE IF NOT EXISTS tradingo;

CREATE TABLE IF NOT EXISTS tradingo.page_views (
  event_id UUID DEFAULT generateUUIDv4(),
  session_id String,
  user_id String,
  page_path String,
  page_title String,
  referrer String,
  device_type String,
  browser String,
  country String,
  city String,
  duration_seconds Int32 DEFAULT 0,
  timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, page_path)
TTL timestamp + INTERVAL 90 DAY;

CREATE TABLE IF NOT EXISTS tradingo.events (
  event_id UUID DEFAULT generateUUIDv4(),
  session_id String,
  user_id String,
  event_name String,
  event_category String,
  event_label String,
  event_value Float64,
  page_path String,
  timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, event_name)
TTL timestamp + INTERVAL 90 DAY;

CREATE TABLE IF NOT EXISTS tradingo.user_sessions (
  session_id String,
  user_id String,
  started_at DateTime,
  ended_at DateTime,
  duration_seconds Int32,
  page_views Int32,
  events_count Int32,
  device_type String,
  browser String,
  country String,
  source String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(started_at)
ORDER BY (started_at, user_id)
TTL started_at + INTERVAL 90 DAY;

-- Materialized view: daily active users
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.dau_daily
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (day)
AS SELECT
  toDate(timestamp) AS day,
  uniqState(user_id) AS users
FROM tradingo.events
GROUP BY day;

-- Materialized view: daily page views by path
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.page_views_daily
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (day, page_path)
AS SELECT
  toDate(timestamp) AS day,
  page_path,
  count() AS views
FROM tradingo.page_views
GROUP BY day, page_path;

-- Materialized view: weekly aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS tradingo.metrics_weekly
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(week_start)
ORDER BY (week_start)
AS SELECT
  toMonday(toDate(timestamp)) AS week_start,
  uniqState(user_id) AS active_users,
  countIf(event_name = 'order_created') AS orders,
  countIf(event_name = 'rfq_created') AS rfqs,
  countIf(event_name = 'chat_sent') AS chat_messages
FROM tradingo.events
GROUP BY week_start;

-- TTL policies for aggregated views (keep longer)
ALTER TABLE tradingo.dau_daily MODIFY TTL day + INTERVAL 2 YEARS;
ALTER TABLE tradingo.page_views_daily MODIFY TTL day + INTERVAL 2 YEARS;
ALTER TABLE tradingo.metrics_weekly MODIFY TTL week_start + INTERVAL 5 YEARS;
