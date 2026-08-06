# GST Invoice & Billing Engine — Phase 10D

## Status: ✅ Complete

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    BillingModule                           │
├───────────────────────────────────────────────────────────┤
│  BillingController  →  BillingService                     │
│  InvoiceController  →  InvoiceService  →  Prisma          │
│  TaxController      →  TaxService       →  Prisma          │
│  PdfController      →  PdfService       →  HTML Template   │
│  BillingAdminController → BillingService                  │
├───────────────────────────────────────────────────────────┤
│  MembershipModule (forwardRef) → InvoiceService            │
└───────────────────────────────────────────────────────────┘
```

## Prisma Models

### Invoice (enhanced)
| Field | Type | Description |
|-------|------|-------------|
| `invoiceNumber` | String (unique) | `TRD-INV-YYYY-XXXXXX` format |
| `planId` | String | Membership plan ID |
| `planName` | String | Human-readable plan name |
| `planTier` | String | Plan tier label |
| `gstType` | String? | `INTRA_STATE` / `INTER_STATE` |
| `cgstAmount` | Decimal? | 9% CGST |
| `sgstAmount` | Decimal? | 9% SGST |
| `igstAmount` | Decimal? | 18% IGST |
| `hsnSacCode` | String? | HSN/SAC code |
| `taxAmount` | Decimal | Total tax |
| `subtotal` | Decimal | Amount before tax |
| `totalAmount` | Decimal | Subtotal + tax |
| `status` | InvoiceStatus | GENERATED → SENT → PAID / VOID |
| `voidAt` | DateTime? | When voided |
| `voidReason` | String? | Why voided |
| `company` | Company (relation) | Seller company |
| `payment` | Payment (relation) | Associated payment |
| `items` | InvoiceItem[] | Line items |
| `taxBreakdown` | TaxBreakdown[] | GST breakdown details |
| `history` | InvoiceHistory[] | Timeline |

### InvoiceItem
- `description`, `quantity`, `unitPrice`, `amount`, `hsnSacCode`, `taxRate`, `taxAmount`

### InvoiceHistory
- `action` (CREATED, PAID, SENT, EMAIL_SENT, VOID, CANCELLED, DOWNLOADED)
- `oldStatus` → `newStatus`
- `reason` (optional)

### InvoiceSequence
- `prefix` (default: `INV`)
- `year` (current year)
- `sequence` (auto-incrementing number per year)

### TaxBreakdown
- `taxType` (CGST / SGST / IGST)
- `taxRate` (9 / 9 / 18)
- `taxableAmount`
- `taxAmount`

## API Endpoints

### Public / Seller
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/billing/invoices` | GET | List invoices (pagination, search, status filter) |
| `/billing/invoices/:id` | GET | Invoice detail with items, tax, company, payment |
| `/billing/invoices/:id/pdf` | GET | Download A4 HTML invoice PDF |
| `/billing/history` | GET | Complete billing timeline |

### Admin (`/admin/billing`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/billing/invoices` | GET | All invoices (admin view) |
| `/admin/billing/invoices/:id/void` | PATCH | Void an invoice (reason required) |
| `/admin/billing/stats` | GET | Revenue, monthly reports, status counts |

## Tax Calculation

- **Intra-state** (same state seller & buyer): CGST 9% + SGST 9% = 18%
- **Inter-state** (different states): IGST 18%
- **HSN/SAC Mapping**: Defaults to SAC 9983 (subscription service) — configurable per plan

## Invoice Numbering

Format: `TRD-INV-YYYY-XXXXXX`
- `TRD` — company prefix
- `INV` — document type
- `YYYY` — current year
- `XXXXXX` — zero-padded 6-digit sequence (resets yearly)

Stored in `InvoiceSequence` table with `findOrCreateSequence(prefix, year)`.

## Membership Integration

`activateSubscription()` in `membership.service.ts` delegates invoice creation to `InvoiceService.createSubscriptionInvoice()`:

```typescript
const invoice = await this.invoiceService.createSubscriptionInvoice({
  companyId,
  paymentId,
  planId,
  planName,
  planTier,
  amount,
  isIntraState: boolean,
});
```

## PDF Template

Inline A4 HTML template in `pdf.service.ts`:
- Letterhead (branding, TRADINGO name, GSTIN placeholder, address)
- Invoice metadata (number, date, status)
- Seller / Buyer details (name, email, GST, PAN, address)
- Line items table
- Tax breakdown (CGST/SGST/IGST)
- Total
- GST declaration ("goods and services supplied")
- QR code placeholder (for future E-invoice compliance)
- Terms & footer

## Quick Commands

```bash
# Sync schema
npx prisma db push

# Regenerate client
npx prisma generate

# Build check
npx tsc --noEmit --pretty
```

## Future Improvements

- [ ] Binary PDF generation (pdfkit/pdf-lib) instead of HTML
- [ ] Email invoice automatically after payment
- [ ] E-invoice compliance (IRN generation via NIC API)
- [ ] Download CSV/Excel export of invoice list
- [ ] Bulk void / credit note support
- [ ] Invoice customisation (logo, colours, footer) per company
