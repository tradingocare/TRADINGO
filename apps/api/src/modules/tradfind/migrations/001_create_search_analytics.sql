CREATE TABLE IF NOT EXISTS search_analytics (
    user_id String,
    session_id String,
    query String,
    entity_type String,
    result_count UInt32,
    clicked_result_id String,
    clicked_result_type String,
    latitude Float64,
    longitude Float64,
    ip_address String,
    user_agent String,
    timestamp DateTime
) ENGINE = MergeTree()
ORDER BY (timestamp, query)
TTL timestamp + INTERVAL 90 DAY;

ALTER TABLE search_analytics ADD INDEX idx_query query TYPE bloom_filter GRANULARITY 1;
ALTER TABLE search_analytics ADD INDEX idx_timestamp timestamp TYPE minmax GRANULARITY 1;
