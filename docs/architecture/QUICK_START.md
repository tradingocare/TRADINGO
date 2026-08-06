# Tradingo API Quick Start Guide

This guide walks through the complete buyer journey in under 5 minutes: register, authenticate, browse the catalog, create an RFQ, review quotes, and place an order.

## Prerequisites

- A tool for making HTTP requests (curl, Postman, or a code editor)
- This guide uses both `curl` and TypeScript `fetch` examples
- The API base URL is `https://api.tradhexa.com/api/v1/`

## Step 1: Register a Buyer Account

Create a buyer account to access the marketplace.

```bash
curl -X POST https://api.tradhexa.com/api/v1/auth/register/buyer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quickstart@example.com",
    "password": "DemoPass123!",
    "name": "Quick Start User",
    "companyName": "Demo Corp",
    "mobile": "+919876543210"
  }'
```

TypeScript equivalent:

```typescript
const API = 'https://api.tradhexa.com/api/v1';

async function register() {
  const res = await fetch(`${API}/auth/register/buyer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'quickstart@example.com',
      password: 'DemoPass123!',
      name: 'Quick Start User',
      companyName: 'Demo Corp',
      mobile: '+919876543210',
    }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  console.log('Registered:', body.data);
  return body.data;
}
```

## Step 2: Log In and Get a JWT Token

```bash
curl -X POST https://api.tradhexa.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quickstart@example.com",
    "password": "DemoPass123!"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "usr_abc",
      "email": "quickstart@example.com",
      "role": "BUYER",
      "companyId": "comp_xyz"
    }
  }
}
```

TypeScript equivalent:

```typescript
let accessToken: string;
let companyId: string;

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'quickstart@example.com',
      password: 'DemoPass123!',
    }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  accessToken = body.data.accessToken;
  companyId = body.data.user.companyId;
  console.log('Logged in. Token:', accessToken.substring(0, 20) + '...');
}
```

## Step 3: Browse Categories

```bash
curl https://api.tradhexa.com/api/v1/categories \
  -H "Authorization: Bearer $TOKEN"
```

TypeScript equivalent:

```typescript
async function getCategories() {
  const res = await fetch(`${API}/categories`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  console.log(`Found ${body.meta?.total || body.data.length} categories`);
  return body.data;
}
```

## Step 4: Search Products

Search for products by keyword, with optional filters and sorting.

```bash
curl "https://api.tradhexa.com/api/v1/products/search?q=industrial+widget&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

TypeScript equivalent:

```typescript
async function searchProducts(query: string) {
  const res = await fetch(
    `${API}/products/search?q=${encodeURIComponent(query)}&page=1&limit=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  console.log(`Found ${body.meta.total} results`);
  return body.data;
}

// Usage
const products = await searchProducts('industrial widget');
const firstProductId = products[0]?.id;
```

## Step 5: Create an RFQ (Request for Quote)

Once you have identified the products you need, create an RFQ to request quotes from sellers.

```bash
curl -X POST https://api.tradhexa.com/api/v1/smart-rfq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Need 500 Industrial Widgets",
    "description": "Looking for bulk pricing on industrial grade widgets",
    "categoryId": "cat_123",
    "items": [
      {
        "name": "Industrial Widget Type A",
        "quantity": 500,
        "unit": "pieces",
        "specifications": {
          "material": "stainless steel",
          "size": "10cm x 5cm"
        }
      }
    ],
    "deliveryRequiredBy": "2026-08-15T00:00:00Z"
  }'
```

TypeScript equivalent:

```typescript
async function createRfq() {
  const res = await fetch(`${API}/smart-rfq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      title: 'Need 500 Industrial Widgets',
      description: 'Looking for bulk pricing on industrial grade widgets',
      categoryId: 'cat_123',
      items: [{
        name: 'Industrial Widget Type A',
        quantity: 500,
        unit: 'pieces',
        specifications: { material: 'stainless steel', size: '10cm x 5cm' },
      }],
      deliveryRequiredBy: '2026-08-15T00:00:00.000Z',
    }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  console.log('RFQ created:', body.data.id);
  return body.data;
}
```

## Step 6: View Quotes on an RFQ

After sellers respond to your RFQ, retrieve the quotes to compare pricing and terms.

```bash
curl https://api.tradhexa.com/api/v1/smart-rfq/RFQ_ID/quotes \
  -H "Authorization: Bearer $TOKEN"
```

TypeScript equivalent:

```typescript
async function getQuotes(rfqId: string) {
  const res = await fetch(`${API}/smart-rfq/${rfqId}/quotes`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  console.log(`Received ${body.data.length} quotes`);
  return body.data;
}

// Usage
const rfqId = 'rfq_abc123'; // from Step 5 response
const quotes = await getQuotes(rfqId);
const bestQuote = quotes.sort((a, b) => a.totalAmount - b.totalAmount)[0];
```

## Step 7: Accept a Quote (Creates Purchase Order)

Accept the best quote to automatically generate a Purchase Order.

```bash
curl -X POST https://api.tradhexa.com/api/v1/smart-rfq/RFQ_ID/accept-quote/QUOTE_ID \
  -H "Authorization: Bearer $TOKEN"
```

TypeScript equivalent:

```typescript
async function acceptQuote(rfqId: string, quoteId: string) {
  const res = await fetch(
    `${API}/smart-rfq/${rfqId}/accept-quote/${quoteId}`,
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  console.log('Quote accepted. Purchase Order:', body.data.purchaseOrderId);
  return body.data;
}

// Run all steps
async function main() {
  await login();
  const categories = await getCategories();
  const products = await searchProducts('industrial widget');
  const rfq = await createRfq();
  const quotes = await getQuotes(rfq.id);
  if (quotes.length > 0) {
    const result = await acceptQuote(rfq.id, quotes[0].id);
    console.log('Done! PO:', result.purchaseOrderId);
  }
}
```

## What's Next?

Now that you have completed the basic buyer flow, explore these topics:

- **Marketplace API**: Full product catalog, order management, dispute handling -- see [MARKETPLACE.md](MARKETPLACE.md).
- **Smart Negotiation**: AI-assisted price and term negotiation -- see the Negotiation section in [MARKETPLACE.md](MARKETPLACE.md).
- **TradeServ**: Professional services marketplace -- see [TRADESERV.md](TRADESERV.md).
- **GOCASH Wallet**: Digital wallet, rewards, and payments -- see [GOCASH.md](GOCASH.md).
- **AI Platform**: AI-powered features for pricing, search, and negotiation -- see [AI_PLATFORM.md](AI_PLATFORM.md).
- **Webhooks**: Receive real-time event notifications -- see [WEBHOOKS.md](WEBHOOKS.md).
