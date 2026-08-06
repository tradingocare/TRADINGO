# Tradingo Webhook Guide

## Overview

Webhooks allow external services to receive real-time notifications when events occur on the TradHexa platform. Instead of polling APIs for changes, you register a webhook endpoint URL, and Tradingo sends HTTP POST requests to that URL when subscribed events occur.

## Available Events

### Product Events

| Event | Description |
|-------|-------------|
| product.created | A new product is listed on the marketplace |
| product.updated | Product details are modified |
| product.published | A product is published and visible |
| product.unpublished | A product is taken down |
| product.approved | A product passes moderation review |
| product.rejected | A product fails moderation review |
| product.quality.updated | Product quality score changes |

### RFQ Events

| Event | Description |
|-------|-------------|
| rfq.created | A new RFQ is created |
| rfq.published | An RFQ is published and visible to sellers |
| rfq.updated | RFQ details are modified |
| rfq.closed | An RFQ is closed (no longer accepting quotes) |

### Quote Events

| Event | Description |
|-------|-------------|
| quote.created | A seller submits a new quote |
| quote.accepted | A buyer accepts a quote (PO created) |
| quote.rejected | A buyer rejects a quote |
| quote.revised | A seller revises an existing quote |

### Negotiation Events

| Event | Description |
|-------|-------------|
| negotiation.started | A negotiation session begins |
| negotiation.message | A new message is sent in a negotiation |
| negotiation.counter | A counter-offer is made |
| negotiation.completed | A negotiation concludes (deal or no-deal) |

### Order Events

| Event | Description |
|-------|-------------|
| order.created | A purchase order is created |
| order.confirmed | An order is confirmed by the seller |
| order.shipped | An order is shipped |
| order.delivered | An order is delivered |
| order.cancelled | An order is cancelled |
| order.disputed | A dispute is opened on an order |

### TradeTalk Events

| Event | Description |
|-------|-------------|
| tradetalk.conversation.created | A new conversation is started |
| tradetalk.message.sent | A new message is posted |
| tradetalk.conversation.status_changed | Conversation status changes |

### GOCASH Events

| Event | Description |
|-------|-------------|
| gocash.transaction.created | A wallet transaction occurs |
| gocash.balance.threshold | Wallet balance crosses a defined threshold |
| gocash.reward.earned | A reward is credited |
| gocash.redemption.requested | A redemption is requested |

### Campaign Events

| Event | Description |
|-------|-------------|
| campaign.started | A campaign becomes active |
| campaign.ending | A campaign is nearing its end |
| campaign.claim | A user claims a campaign reward |

## Event Format

All webhook POST requests have the following structure:

`json
{
  "event": "product.created",
  "id": "evt_abc123def456",
  "createdAt": "2026-07-16T10:30:00.000Z",
  "data": {
    "productId": "prod_xyz789",
    "companyId": "comp_123",
    "productName": "Industrial Grade Widget",
    "categoryId": "cat_456",
    "timestamp": "2026-07-16T10:30:00.000Z"
  },
  "signature": "t=1626429000,v1=abc123def456...",
  "version": "1.0"
}
`

| Field | Description |
|-------|-------------|
| event | The event type identifier |
| id | Unique event ID (use for idempotency) |
| createdAt | ISO 8601 timestamp of event generation |
| data | Event-specific payload |
| signature | HMAC-SHA256 signature for verification |
| version | Webhook payload version |

## Security

### Signature Verification

Each webhook payload includes a signature header that you must verify to confirm the request originated from Tradingo.

The signature is computed as:

`
HMAC-SHA256(webhook_secret, event_id + "." + created_at + "." + json_payload)
`

It is sent in the format 	=<unix_timestamp>,v1=<hex_signature>.

### TypeScript Signature Verification

`	ypescript
import { createHmac, timingSafeEqual } from 'crypto';

interface WebhookHeaders {
  'x-tradingo-signature': string;
}

function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
  const signature = parts.find(p => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) return false;

  const signedPayload = timestamp + '.' + payload;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
`

### Express/Fastify Middleware Example

`	ypescript
async function handleWebhook(req: Request, res: Response) {
  const signature = req.headers['x-tradingo-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  const secret = process.env.TRADINGO_WEBHOOK_SECRET!;
  const isValid = verifyWebhookSignature(rawBody, signature, secret);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;
  const eventData = req.body.data;

  switch (event) {
    case 'product.created':
      await handleProductCreated(eventData);
      break;
    case 'quote.accepted':
      await handleQuoteAccepted(eventData);
      break;
    case 'order.shipped':
      await handleOrderShipped(eventData);
      break;
    default:
      console.log('Unhandled event:', event);
  }

  res.status(200).json({ received: true });
}
`

## Registering Webhook Endpoints

### Via API (Admin)

`	ypescript
const API = 'https://api.tradhexa.com/api/v1';

async function registerWebhook(config: {
  url: string;
  events: string[];
  description?: string;
  secret?: string;
  isActive?: boolean;
}) {
  const res = await fetch(API + '/admin/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(config),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    id: string;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
    createdAt: string;
  };
}

async function listWebhooks() {
  const res = await fetch(API + '/admin/webhooks', {
    headers: { Authorization: 'Bearer ' + token },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function deleteWebhook(webhookId: string) {
  const res = await fetch(API + '/admin/webhooks/' + webhookId, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
`

### Via Admin Dashboard

Webhooks can also be configured through the admin dashboard at /admin/webhooks. The dashboard provides a form-based interface for the same configuration options.

## Retry Policy

Tradingo uses an exponential backoff retry strategy for failed webhook deliveries:

| Attempt | Delay |
|---------|-------|
| 1st | Immediate |
| 2nd | 10 seconds |
| 3rd | 1 minute |
| 4th | 10 minutes |
| 5th | 1 hour |
| 6th | 6 hours |
| 7th+ | 24 hours (max 7 days) |

After 7 days of continuous failure, the webhook is automatically deactivated. You will receive a platform notification when a webhook is deactivated.

### Delivery Guarantees

- Webhooks are delivered with at-least-once semantics.
- Events are delivered in order per event type, but not across event types.
- Duplicate events may occur. Use the event id field for idempotency processing.

## Best Practices

### 1. Respond Quickly

Your webhook endpoint should respond with HTTP 200 within 5 seconds. If your processing takes longer, acknowledge the event immediately and process it asynchronously in a background job.

`	ypescript
async function handleWebhook(req: Request, res: Response) {
  const event = req.body;

  if (!verifyWebhookSignature(req.rawBody, req.headers['x-tradingo-signature'], secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      await processEvent(event);
    } catch (err) {
      console.error('Event processing failed:', event.id, err);
    }
  });
}
`

### 2. Implement Idempotency

Always use the event id to prevent duplicate processing:

`	ypescript
const processedEvents = new Set<string>();

async function processEvent(event: { id: string; event: string; data: unknown }) {
  if (processedEvents.has(event.id)) {
    return;
  }

  try {
    await handleByType(event.event, event.data);
    processedEvents.add(event.id);
  } catch (err) {
    processedEvents.delete(event.id);
    throw err;
  }
}
`

For production systems, store processed event IDs in a database with a TTL:

`sql
CREATE TABLE processed_webhooks (
  event_id VARCHAR(64) PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);
`

### 3. Use HTTPS

Your webhook endpoint must be served over HTTPS. HTTP endpoints are rejected during registration.

### 4. Rotate Secrets

Periodically rotate your webhook secret by updating the webhook configuration via the API or admin dashboard.

### 5. Monitor Deliveries

Check delivery logs via the admin dashboard or the webhook delivery status API:

`	ypescript
async function getWebhookDeliveryLogs(webhookId: string, page = 1, limit = 20) {
  const res = await fetch(
    API + '/admin/webhooks/' + webhookId + '/deliveries?page=' + page + '&limit=' + limit,
    { headers: { Authorization: 'Bearer ' + token } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
`

### 6. Test Webhooks

Use the webhook testing endpoint to simulate events:

`	ypescript
async function testWebhook(webhookId: string, eventType: string) {
  const res = await fetch(API + '/admin/webhooks/' + webhookId + '/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ event: eventType }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
`

## Troubleshooting

**Q: I'm not receiving webhooks.**
A: Check that your endpoint is accessible over HTTPS and responds with HTTP 200. Verify the webhook registration is active in the admin dashboard. Check delivery logs for error details.

**Q: I'm getting 401 signature errors.**
A: Verify that you are using the correct webhook secret. If you recently rotated the secret, ensure the old secret is no longer in use. Make sure you are verifying against the raw request body, not a re-serialized version.

**Q: I received a duplicate event.**
A: Webhooks are delivered with at-least-once semantics. Use the event id field to deduplicate. This is expected behavior and should be handled in your integration.

**Q: My endpoint is down and I missed events.**
A: Tradingo will retry for up to 7 days using exponential backoff. Once your endpoint recovers, the queued events will be delivered. After 7 days, the webhook is deactivated.