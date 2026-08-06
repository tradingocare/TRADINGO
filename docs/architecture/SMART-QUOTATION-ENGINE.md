# Smart Quotation Engine — Architecture

## Page Hierarchy

```
/seller/quote                      Seller Quotes Dashboard (RFQs to quote on)
/seller/quote/new?rfqId=xxx       Quotation Creation Wizard
/seller/quote/[id]                 Seller Quote Detail View

/buyer/quote                       Buyer Quotation Inbox (RFQ-grouped)
/buyer/quote/compare?rfqId=xxx    Side-by-Side Quotation Comparison
/buyer/quote/[id]                  Buyer Quote Detail View (future)

/admin/quote                       Admin Quote Monitoring (Overview / All / Flagged / Trends)
```

## Workflow

```
Buyer → RFQ → Seller → Create Quotation → Buyer → Compare → Negotiate → Accept → Purchase Order
```

## Existing Backend (NOT modified — already complete)

**Module:** `apps/api/src/modules/quote/` (QuoteModule)

**Controller:** `companies/:companyId/rfq/:rfqId/quotes`

| Method | Endpoint | Action |
|--------|----------|--------|
| POST | `/` | Create quote |
| GET | `/` | List quotes for RFQ (ranked for buyer) |
| GET | `/:quoteId` | Get quote details |
| PATCH | `/:quoteId` | Update draft |
| POST | `/:quoteId/submit` | Submit draft |
| POST | `/:quoteId/withdraw` | Withdraw (with reason) |
| POST | `/:quoteId/accept` | Accept (buyer only) |
| POST | `/:quoteId/reject` | Reject (buyer only) |
| POST | `/:quoteId/revise` | Revise (new version, max 5) |

**Prisma Models:** `Quote`, `QuoteLineItem`, `QuoteAttachment`, `QuoteEvent`
**Status Enum:** `DRAFT → SUBMITTED → VIEWED → NEGOTIATING → ACCEPTED/REJECTED/EXPIRED/WITHDRAWN`

## Frontend API (`lib/api/smart-quote.ts`)

| Function | Backend Call |
|----------|-------------|
| `smartQuoteApi.create(companyId, rfqId, data)` | POST `companies/:cId/rfq/:rfqId/quotes` |
| `smartQuoteApi.list(companyId, rfqId)` | GET `.../quotes` |
| `smartQuoteApi.getById(companyId, rfqId, quoteId)` | GET `.../quotes/:quoteId` |
| `smartQuoteApi.update(companyId, rfqId, quoteId, data)` | PATCH `.../quotes/:quoteId` |
| `smartQuoteApi.submit(companyId, rfqId, quoteId)` | POST `.../quotes/:quoteId/submit` |
| `smartQuoteApi.withdraw(companyId, rfqId, quoteId, reason?)` | POST `.../quotes/:quoteId/withdraw` |
| `smartQuoteApi.accept(companyId, rfqId, quoteId)` | POST `.../quotes/:quoteId/accept` |
| `smartQuoteApi.reject(companyId, rfqId, quoteId, reason?)` | POST `.../quotes/:quoteId/reject` |
| `smartQuoteApi.revise(companyId, rfqId, quoteId, data)` | POST `.../quotes/:quoteId/revise` |

**Note:** `companyId` must be resolved from the auth store. Seller uses their own companyId; buyer also uses their own companyId.

## Frontend Hooks (`hooks/use-smart-quote.ts`)

| Hook | Query Key | Purpose |
|------|-----------|---------|
| `useQuoteList(companyId, rfqId)` | `['smart-quotes', companyId, rfqId]` | List quotes for an RFQ |
| `useQuoteDetail(companyId, rfqId, quoteId)` | `['smart-quotes', 'detail', quoteId]` | Single quote detail |
| `useCreateQuote()` | — | Mutation: create quote |
| `useSubmitQuote()` | — | Mutation: submit draft |
| `useAcceptQuote()` | — | Mutation: accept (buyer) |
| `useRejectQuote()` | — | Mutation: reject (buyer) |
| `useWithdrawQuote()` | — | Mutation: withdraw (seller) |
| `useReviseQuote()` | — | Mutation: revise |

## Seller Quotation Wizard

Located at `/seller/quote/new?rfqId=xxx`. Single-page comprehensive form with:

1. **Line Items** — Auto-populated from RFQ product items. Editable product name, quantity, unit price.
2. **Pricing Summary** — Currency, subtotal, discount %, tax (GST), calculated total.
3. **Terms & Delivery** — Delivery terms (EX_WORKS/FOB/CIF/etc.), payment terms, lead time, validity date.
4. **Notes & Remarks** — Warranty, freight, GST details, special conditions.
5. **Actions** — Save as Draft or Submit directly.

## Buyer Quotation Comparison Engine

Located at `/buyer/quote/compare?rfqId=xxx`. Side-by-side comparison table.

**Comparison columns:**
- Supplier (name, verification badge)
- Price (total amount with currency)
- MOQ (minimum order quantity)
- Lead Time (days with clock icon)
- GST (tax amount)
- Freight (included/buyer pays)
- Validity (expiry date)
- Warranty (duration)
- Trust Score (% with star)
- Response Rate (% with trend icon)
- Delivery Terms (badge)
- Payment Terms

**Interaction:**
- Checkbox selection per quote
- "Accept Selected" action button
- "Message Sellers" link to Communication Hub
- Sticky first column with criteria labels
- Horizontal scroll for many quotes

## Admin Dashboard

Located at `/admin/quote`. Four-tab monitoring interface:

1. **Overview** — Total quotes, submitted, accepted, rejected, conversion rate, average amount
2. **All Quotes** — Searchable, filterable quote list
3. **Flagged** — Quotations flagged for review
4. **Pricing Trends** — Average quote value by category, audit trail

## Nav Items Added

| Role | Path | Label |
|------|------|-------|
| Seller | `/seller/quote` | Quotes |
| Buyer | `/buyer/quote` | Quotes |
| Admin | `/admin/quote` | Quotes |

## Design

- Reuses `DashboardPageHeader`, `StatusBadge`, `StatCard`, `TableSkeleton` from existing dashboard
- Uses `Button`, `Input`, `Label`, `Badge` from existing UI components
- Follows existing glassmorphism design: `border-white/[0.06] bg-white/[0.04] backdrop-blur-xl`
- Accent color `#FF4D00` for primary actions, consistent with brand
- Sidebar navigation uses existing layout (`buyer/layout.tsx`, `seller/layout.tsx`, `admin/layout.tsx`)

## Validation Rules
- Quote must be linked to an existing ACTIVE RFQ
- Only matched vendors can create quotes
- Maximum validity: 30 days from creation
- One active quote per vendor per RFQ (draft/submitted/viewed/negotiating)
- Max 5 revisions per quote
- Only buyer can accept/reject quotes
- Buyer cannot quote on own RFQ

## Future Integration

**Negotiation Preparation:**
- Every quote tracks `quoteVersion` and `revisionComment` for negotiation history
- `NEGOTIATING` status reserved for future counter-offer flow
- Communication Hub integration via `rfqId` for buyer-seller messaging

**Purchase Order Integration:**
- Accepted quote (`ACCEPTED` status) becomes source for Purchase Order
- Quote line items map directly to PO line items
- `rfq.acceptedQuoteId` tracks which quote was accepted
- `rfq.status` set to `CONVERTED` upon PO creation

**Quotation Analytics (Admin):**
- Pricing trends by category, region, time period
- Seller ranking by acceptance rate
- Quote-to-order conversion tracking

## Rollback Strategy
1. Old pages at `/buyer/quotes/` and `/seller/quotes/` remain intact (part of Buyer/Seller Workspace — locked)
2. New smart quote pages at `/buyer/quote/` and `/seller/quote/` use singular paths
3. If backend QuoteModule endpoints fail, pages show loading/error states
4. To rollback: revert nav links to `/buyer/quotes/` and `/seller/quotes/`
5. Old API lib (`lib/api/quotes.ts`) and hooks (`hooks/use-quotes.ts`) remain functional
