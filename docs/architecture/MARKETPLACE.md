# Tradingo Marketplace API Guide

## Overview

The Marketplace API powers the core B2B trading platform, including product catalog management, RFQ (Request for Quote) lifecycle, quote management, smart negotiation, purchase orders, fulfillment, and dispute resolution. This guide covers all marketplace operations for buyers and sellers.

## Product Catalog

### Categories

Retrieve the category tree:

```typescript
const API = 'https://api.tradhexa.com/api/v1';

// Get all categories (tree structure)
async function getCategories() {
  const res = await fetch(`${API}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Get single category with subcategories
async function getCategory(slug: string) {
  const res = await fetch(`${API}/categories/${slug}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Products

```typescript
// Search products
async function searchProducts(params: {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/products/search?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Get product detail
async function getProduct(id: string) {
  const res = await fetch(`${API}/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Seller: Create product
async function createProduct(product: {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  currency?: string;
  unit?: string;
  minimumOrderQuantity?: number;
  images?: string[];
  specifications?: Record<string, string>;
}) {
  const res = await fetch(`${API}/seller/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Seller: Update product
async function updateProduct(id: string, updates: Partial<{
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}>) {
  const res = await fetch(`${API}/seller/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## RFQ Lifecycle

The RFQ (Request for Quote) is the primary procurement mechanism. Buyers publish RFQs and sellers respond with quotes.

### Create RFQ

```typescript
async function createRfq(rfq: {
  title: string;
  description: string;
  categoryId: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications?: Record<string, unknown>;
  }>;
  deliveryRequiredBy?: string;
  budgetRange?: { min: number; max: number };
  isUrgent?: boolean;
}) {
  const res = await fetch(`${API}/smart-rfq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rfq),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Manage RFQs

```typescript
// List buyer's RFQs
async function getMyRfqs(page = 1, limit = 10) {
  const res = await fetch(
    `${API}/smart-rfq?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Get RFQ detail
async function getRfq(id: string) {
  const res = await fetch(`${API}/smart-rfq/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Update RFQ
async function updateRfq(id: string, updates: Partial<{
  title: string;
  description: string;
  deliveryRequiredBy: string;
}>) {
  const res = await fetch(`${API}/smart-rfq/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Get Quotes for RFQ

```typescript
async function getRfqQuotes(rfqId: string) {
  const res = await fetch(`${API}/smart-rfq/${rfqId}/quotes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data; // Array of quotes with pricing, terms, seller info
}
```

## Quote Management

### Create Quote (Seller)

```typescript
async function createQuote(quote: {
  rfqId: string;
  items: Array<{
    rfqItemId: string;
    unitPrice: number;
    quantity: number;
    deliveryDate?: string;
  }>;
  paymentTerms?: string;
  deliveryTerms?: string;
  validityPeriod?: number; // days
  notes?: string;
}) {
  const res = await fetch(`${API}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(quote),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Accept Quote

Accepts a quote and automatically creates a Purchase Order:

```typescript
async function acceptQuote(rfqId: string, quoteId: string) {
  const res = await fetch(
    `${API}/smart-rfq/${rfqId}/accept-quote/${quoteId}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns: { purchaseOrderId, status: "PO_CREATED" }
  return body.data;
}
```

### Reject Quote

```typescript
async function rejectQuote(rfqId: string, quoteId: string) {
  const res = await fetch(
    `${API}/smart-rfq/${rfqId}/reject-quote/${quoteId}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Smart Negotiation

The Smart Negotiation module enables structured, AI-assisted negotiation between buyers and sellers.

### Initiate Negotiation

```typescript
async function initiateNegotiation(quoteId: string, message: string) {
  const res = await fetch(`${API}/smart-negotiation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quoteId, message }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Send Counter Offer

```typescript
async function sendCounterOffer(negotiationId: string, payload: {
  message: string;
  proposedPrice?: number;
  proposedTerms?: string;
  attachmentUrls?: string[];
}) {
  const res = await fetch(
    `${API}/smart-negotiation/${negotiationId}/counter`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### AI Negotiation Copilot

Leverage AI for negotiation insights. See [AI_PLATFORM.md](AI_PLATFORM.md) for the full list of actions.

```typescript
async function getNegotiationStrategy(negotiationId: string) {
  const res = await fetch(
    `${API}/smart-negotiation/${negotiationId}/ai/strategy`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function getSuggestedReplies(negotiationId: string) {
  const res = await fetch(
    `${API}/smart-negotiation/${negotiationId}/ai/suggested-replies`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data; // Array of suggested reply strings
}
```

## Purchase Orders

### Track Orders

```typescript
// List orders (buyer)
async function getMyOrders(page = 1, limit = 10) {
  const res = await fetch(
    `${API}/purchase-orders?page=${page}&limit=${limit}&sort=createdAt&order=desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Get order detail
async function getOrder(id: string) {
  const res = await fetch(`${API}/purchase-orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Order Fulfillment

```typescript
// Seller: Update order status
async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  const res = await fetch(`${API}/seller/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, notes }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

Available order statuses: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `DISPUTED`, `REFUNDED`.

## Dispute Resolution

```typescript
// Open a dispute
async function createDispute(orderId: string, reason: string, description: string) {
  const res = await fetch(`${API}/disputes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId, reason, description }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Get dispute details
async function getDispute(id: string) {
  const res = await fetch(`${API}/disputes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## TradFind Search Engine

TradFind is the platform's unified search engine, combining full-text search with OpenSearch for relevance ranking.

```typescript
async function tradFindSearch(params: {
  q: string;
  type?: 'products' | 'suppliers' | 'all';
  categoryId?: string;
  location?: { lat: number; lng: number; radiusKm: number };
  minPrice?: number;
  maxPrice?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/tradfind/search?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```

## TradTrust Scoring

TradTrust is the platform's trust and scoring engine, evaluating sellers on 16 dimensions.

```typescript
// Get company trust score
async function getTrustScore(companyId: string) {
  const res = await fetch(`${API}/tradtrust/score/${companyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Get score history
async function getTrustHistory(companyId: string) {
  const res = await fetch(`${API}/tradtrust/history/${companyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

TradTrust scores range from 0 to 1000 and factor in: transaction history, dispute history, delivery performance, communication quality, verification level, account age, product quality ratings, and more.

## Near-Far-Best Ranking

The Near-Far-Best engine combines location proximity with quality scoring to produce optimized search rankings:

- **Near**: Suppliers within the buyer's geographic region are prioritized.
- **Far**: Quality suppliers outside the immediate region are still surfaced.
- **Best**: The composite score (proximity + TradTrust + relevance) determines final ranking.

This ranking is automatically applied in TradFind search results. No additional API parameters are required.

## Enterprise Catalog Search

For advanced catalog management, the Enterprise Search platform provides synonym expansion, attribute search, and cross-entity search:

```typescript
async function enterpriseSearch(params: {
  q: string;
  entityType?: 'products' | 'brands' | 'attributes' | 'all';
  filters?: Record<string, string[]>;
  page?: number;
  limit?: number;
}) {
  const res = await fetch(`${API}/enterprise-catalog/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```
