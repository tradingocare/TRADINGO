#!/bin/bash
set -euo pipefail

OS_ENDPOINT="${1:?Usage: $0 <opensearch-endpoint>}"
AUTH="${2:-}"
BASE="https://$OS_ENDPOINT"

echo "Initializing OpenSearch at $OS_ENDPOINT..."

create_index() {
  local name=$1 mapping=$2
  curl -s -X PUT "$BASE/$name" -H 'Content-Type: application/json' -d "$mapping" ${AUTH:+-u "$AUTH"} > /dev/null
  echo "  Index created: $name"
}

# tradingo-products
create_index "tradingo-products" '{
  "settings": { "number_of_shards": 3, "number_of_replicas": 2 },
  "mappings": {
    "properties": {
      "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "description": { "type": "text" },
      "category": { "type": "keyword" },
      "price": { "type": "float" },
      "unit": { "type": "keyword" },
      "minOrder": { "type": "integer" },
      "stock": { "type": "integer" },
      "companyId": { "type": "keyword" },
      "status": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "city": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}'

# tradingo-orders
create_index "tradingo-orders" '{
  "settings": { "number_of_shards": 3, "number_of_replicas": 2 },
  "mappings": {
    "properties": {
      "orderNumber": { "type": "keyword" },
      "buyerId": { "type": "keyword" },
      "sellerId": { "type": "keyword" },
      "productName": { "type": "text" },
      "quantity": { "type": "integer" },
      "amount": { "type": "float" },
      "status": { "type": "keyword" },
      "paymentStatus": { "type": "keyword" },
      "createdAt": { "type": "date" }
    }
  }
}'

# tradingo-rfqs
create_index "tradingo-rfqs" '{
  "settings": { "number_of_shards": 3, "number_of_replicas": 2 },
  "mappings": {
    "properties": {
      "productName": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "description": { "type": "text" },
      "quantity": { "type": "integer" },
      "unit": { "type": "keyword" },
      "budget": { "type": "float" },
      "status": { "type": "keyword" },
      "city": { "type": "keyword" },
      "companyId": { "type": "keyword" },
      "responseCount": { "type": "integer" },
      "createdAt": { "type": "date" }
    }
  }
}'

echo "OpenSearch initialized: 3 indices created with 3 shards, 2 replicas each."
