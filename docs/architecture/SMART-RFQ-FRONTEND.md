# Smart RFQ Engine — Frontend Architecture

## Page Hierarchy

```
/buyer/rfq                          Buyer RFQ Dashboard
/buyer/rfq/new                      RFQ Creation Wizard (7-step)
/buyer/rfq/[id]                     Buyer RFQ Detail View
/buyer/rfq/[id]/edit                Edit RFQ (Draft only)

/seller/rfq                         Seller Incoming RFQs List
/seller/rfq/[id]                    Seller RFQ Detail + Accept/Decline

/admin/rfq                          Admin RFQ Management (Overview / All / Flagged / Audit)
```

## User Journeys

### Buyer — Create RFQ
1. Navigate to `/buyer/rfq` → Click "New RFQ"
2. Step 1 (Requirement): Title, Description, Priority, Visibility, Expiry
3. Step 2 (Products): Add products with quantity/unit/target price
4. Step 3 (Suppliers): View Near To Far™ suggestions, toggle selection
5. Step 4 (Delivery): Location, Required Date, Payment Preference, Terms
6. Step 5 (Attachments): Upload PDF/Image/Document
7. Step 6 (Preview): Full summary with validation warnings
8. Step 7 (Submit): Submit as Active or Save as Draft

### Buyer — Manage RFQs
- `DRAFT` → Continue editing via `/buyer/rfq/[id]/edit`
- `ACTIVE` → View matches/quotes in detail page
- `CONVERTED` → Linked to purchase order
- `EXPIRED/CANCELLED` → Read-only
- Duplicate any RFQ to reuse as template

### Seller — Respond to RFQ
1. View incoming matched RFQs in `/seller/rfq`
2. Click to see full details (products, budget, location, timeline)
3. Accept → RFQ moves to "Quoted" status
4. Decline → Optional reason, moves to "Declined"
5. Message buyer via existing Inbox

### Admin — Monitor Platform RFQs
1. **Overview tab**: Live stats (total/draft/active/expired/cancelled/converted)
2. **All RFQs tab**: Searchable, paginated list of every RFQ
3. **Flagged tab**: RFQs flagged for spam/moderation review
4. **Audit Trail tab**: Event log for all RFQ activity

## Component Reuse

| Component | Source | Usage |
|-----------|--------|-------|
| `DashboardPageHeader` | `@/components/dashboard` | All 7 pages — title + description + actions |
| `StatCard` | `@/components/dashboard` | Buyer dashboard stats, seller stats, admin overview |
| `StatusBadge` | `@/components/dashboard` | RFQ status badges across all pages (DRAFT/ACTIVE/MATCHED/QUOTED/CONVERTED/EXPIRED/CANCELLED) |
| `TableSkeleton` | `@/components/dashboard` | Loading states for all list pages |
| `Button` | `@/components/ui/button` | All actions (accent for primary, outline for secondary, ghost for tertiary) |
| `Badge` | `@/components/ui/badge` | Status indicators, match scores, labels |
| `Input` | `@/components/ui/input` | Form inputs with consistent styling |
| `Label` | `@/components/ui/label` | Form labels |
| `Card` | `@/components/ui/card` | (Available for future use) |

## API Mapping

| Frontend Function | Backend Endpoint | Method |
|-------------------|-----------------|--------|
| `smartRfqApi.list(params)` | `/smart-rfq` | GET |
| `smartRfqApi.create(data)` | `/smart-rfq` | POST |
| `smartRfqApi.getById(id)` | `/smart-rfq/{id}` | GET |
| `smartRfqApi.duplicate(id)` | `/smart-rfq/{id}/duplicate` | POST |
| `smartRfqApi.findSuppliers(id)` | `/smart-rfq/{id}/suppliers` | GET |
| `smartRfqApi.getMatchingStats()` | `/smart-rfq/near-to-far/stats` | GET |
| `smartRfqApi.seller.incoming(params)` | `/smart-rfq/seller/incoming` | GET |
| `smartRfqApi.seller.accept(rfqId)` | `/smart-rfq/seller/{rfqId}/accept` | POST |
| `smartRfqApi.seller.decline(rfqId, reason)` | `/smart-rfq/seller/{rfqId}/decline` | POST |
| `smartRfqApi.seller.stats()` | `/smart-rfq/seller/stats` | GET |
| `smartRfqApi.admin.overview()` | `/smart-rfq/admin/overview` | GET |
| `smartRfqApi.admin.list(params)` | `/smart-rfq/admin/rfqs` | GET |
| `smartRfqApi.admin.flagged(params)` | `/smart-rfq/admin/flagged` | GET |
| `smartRfqApi.admin.auditTrail(params)` | `/smart-rfq/admin/audit-trail` | GET |

## React Query Hooks

| Hook | Query Key | Purpose |
|------|-----------|---------|
| `useSmartRfqs(params)` | `['smart-rfqs', params]` | Buyer RFQ list with filters |
| `useSmartRfq(id)` | `['smart-rfqs', id]` | Single RFQ detail |
| `useCreateSmartRfq()` | — | Mutation: create RFQ |
| `useDuplicateSmartRfq()` | — | Mutation: duplicate RFQ |
| `useSmartRfqSuppliers(id)` | `['smart-rfq-suppliers', id]` | Near To Far suppliers |
| `useSmartRfqMatchingStats()` | `['smart-rfq-matching-stats']` | Matching stats |
| `useSellerIncomingRfqs(params)` | `['seller-incoming-rfqs', params]` | Seller incoming list |
| `useSellerAcceptRfq()` | — | Mutation: accept |
| `useSellerDeclineRfq()` | — | Mutation: decline |
| `useSellerRfqStats()` | `['seller-rfq-stats']` | Seller stats |
| `useAdminRfqOverview()` | `['admin-rfq-overview']` | Admin overview stats |
| `useAdminRfqs(params)` | `['admin-rfqs', params]` | Admin RFQ list |
| `useAdminFlaggedRfqs(params)` | `['admin-flagged-rfqs', params]` | Admin flagged |
| `useAdminRfqAuditTrail(params)` | `['admin-rfq-audit', params]` | Admin audit trail |

## Validation Flow

### Wizard Step Validation
- **Step 1 (Requirement)**: `title` required (non-empty)
- **Step 2 (Products)**: At least 1 product required
- **Step 3 (Suppliers)**: Optional — empty = Open RFQ
- **Step 4-5**: Optional
- **Step 6 (Preview)**: Warnings shown (no title, no products, no suppliers)
- **Step 7 (Submit)**: Final `createSmartRfq` mutation with `status: 'ACTIVE'`

### Duplicate Validation
- `duplicate()` copies RFQ with `status: 'DRAFT'` and resets all timestamps
- New copy receives fresh `rfqNumber`

## State Management

### Wizard Store (`store/rfq-wizard-store.ts` — Zustand)
- `step`: Current wizard step (0-6)
- `title`, `description`: Basic requirement fields
- `priority`, `visibility`, `expiryDays`: RFQ configuration
- `products: WizardProduct[]`: Product line items
- `suppliers: WizardSupplier[]`: Supplier selection with match scores
- `location`, `requiredDate`, `paymentPreference`, `terms`: Delivery details
- `attachments: WizardAttachment[]`: Uploaded files
- `source`, `sourceId`: Entry point tracking
- Actions: `setStep`, `update`, `addProduct`, `removeProduct`, `toggleSupplier`, `addSuppliers`, `addAttachment`, `removeAttachment`, `setSource`, `reset`

### React Query (Server State)
- All API data fetched/cached/mutated via `@tanstack/react-query` hooks
- Query keys follow pattern `['resource', params]` for automatic refetch on param change
- Mutations invalidate all related queries on success

## Responsive Behaviour

| Breakpoint | List Pages | Wizard | Detail Pages |
|------------|-----------|--------|--------------|
| Desktop (lg+) | 12-column grid with header row | Side-by-side step indicator | 2/3 + 1/3 layout |
| Tablet (md) | Card-style list | Compact step circles | Single column |
| Mobile (<sm) | Full-width cards, stacked | Step numbers only | Full-width stacked |

All pages use the existing `container-main` class and inherit the `buyer/layout.tsx` / `seller/layout.tsx` / `admin/layout.tsx` which provide sidebar + topbar.

## Accessibility
- All interactive elements are `<button>` or `<Link>` with visible focus rings (`focus-visible:ring-2 focus-visible:ring-orange-500`)
- Form inputs use `<Label>` elements for screen reader association
- Keyboard navigation: Tab through wizard steps, Enter/Space to select
- Error states include descriptive text
- Color-coded status badges use text labels (not just color)
- ARIA labels on icon-only buttons

## Future Quotation Integration
- `rfq.vendorMatches` links to quotation workflow in `Quote` model
- `/seller/rfq/[id]` has an "Accept" action that sets `vendorMatch.status = 'QUOTED'`
- Future: Add "Create Quote" button that navigates to `/seller/quotes/new?rfqId={id}`
- `/buyer/rfq/[id]` shows `quoteCount` and links to `/buyer/quotes?rfqId={id}`
- `CONVERTED` status links to purchase order in `Order` model

## Rollback Strategy
1. Old pages at `/buyer/rfqs/`, `/seller/rfqs/`, `/admin/rfqs/` remain intact
2. Nav points to Smart RFQ pages at `/buyer/rfq/`, `/seller/rfq/`, `/admin/rfq/`
3. If Smart RFQ backend endpoints unavailable, pages show error state with "Back" button
4. To rollback: revert nav links to `/buyer/rfqs/`, `/seller/rfqs/`, `/admin/rfqs/`
5. Old API lib (`lib/api/rfqs.ts`) remains functional and untouched
