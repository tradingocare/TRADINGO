#!/bin/bash
set -euo pipefail

REDIS_ENDPOINT="${1:?Usage: $0 <redis-endpoint>}"

echo "Configuring Redis at $REDIS_ENDPOINT..."

redis-cli -h "$REDIS_ENDPOINT" -p 6379 <<'EOF'
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET timeout 300
CONFIG SET maxclients 10000
CONFIG SET appendonly yes
CONFIG SET appendfsync everysec
CONFIG SET slowlog-log-slower-than 10000
CONFIG SET slowlog-max-len 128
CONFIG SET notify-keyspace-events Ex
CONFIG SET activedefrag yes
CONFIG SET lazyfree-lazy-eviction yes
CONFIG SET lazyfree-lazy-expire yes
CONFIG REWRITE
EOF

echo "Redis configured successfully."
echo "  maxmemory-policy: allkeys-lru"
echo "  timeout: 300"
echo "  maxclients: 10000"
echo "  appendonly: yes"
echo "  slowlog: 10000us, 128 entries"
