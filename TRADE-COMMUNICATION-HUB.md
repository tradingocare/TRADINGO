# TRADE COMMUNICATION HUB — Architecture & Implementation

## Overview

The Trade Communication Hub is the **single centralized communication layer** inside TRADINGO. It replaces the legacy chat module and becomes the foundation for all Buyer–Seller interactions including RFQ negotiation, order discussion, and future quotation workflows.

**Core Principle:** Every conversation originates from a business entity (Product, Company, Requirement List, etc.) — there is no standalone chat.

---

## Architecture

```
Frontend (Buyer/Inbox, Seller/Inbox, Admin/Communication)
        │
        ▼
API Layer (NestJS Module: CommunicationModule)
        │
        ├── ConversationController
        ├── MessageController
        ├── LabelController
        ├── TemplateController
        └── ModerationController
        │
        ▼
Prisma (PostgreSQL)
        │
        ├── Conversation
        ├── ConversationParticipant
        ├── Message
        ├── MessageAttachment
        ├── ConversationLabel
        ├── ConversationLabelAssignment
        ├── SavedTemplate
        ├── ConversationAuditLog
        ├── ReportedMessage
        └── BlockedUser
```

### Module Location
- **Backend:** `apps/api/src/modules/communication/`
- **Frontend Buyer:** `apps/web/app/buyer/inbox/`
- **Frontend Seller:** `apps/web/app/seller/inbox/`
- **Frontend Admin:** `apps/web/app/admin/communication/`

---

## Database Schema

### Enums Added

```prisma
enum ConversationSource {
  PRODUCT           // Product Enquiry — from product page
  COMPANY           // Company Enquiry — from company profile
  REQUIREMENT_LIST  // Requirement Discussion — from requirement list
  SAVED_SUPPLIER    // Supplier Enquiry — from saved supplier
  SAVED_PRODUCT     // Product Enquiry — from saved product
  ORDER             // Order Discussion — from order page
  RFQ               // RFQ Negotiation — from RFQ page
  SUPPORT           // Support ticket
  GENERAL           // General business enquiry
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
}

enum ModerationAction {
  WARNING
  MESSAGE_REMOVED
  USER_BLOCKED
  CONVERSATION_CLOSED
  DISMISSED
}
```

### Extended Models

**Conversation** — added `source` (ConversationSource), `sourceId`, reverse relations for `labels` and `auditLogs`

**ConversationParticipant** — added `isArchived`, `isMuted`, `isPinned`, `notes` (per-participant preferences)

**Message** — added `status` (MessageStatus), `metadata` (JSON — future typing indicators)

**ReportedMessage** — added relation fields to `Message`, `User` (reportedBy, reviewedBy), removed raw ID strings

### New Models

**ConversationLabel** — company-scoped labels (name + color) for organizing conversations

**ConversationLabelAssignment** — many-to-many junction between conversations and labels

**ConversationAuditLog** — immutable audit trail for conversation events (CREATED, MESSAGE_DELETED, PARTICIPANT_ADDED, etc.)

**SavedTemplate** — seller quick-reply templates (title, content, category, isShared)

---

## API Contracts

All endpoints prefixed with `/api/v1/communication/` unless noted.

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/conversations` | Create conversation with participants |
| GET | `/conversations?source=&archived=` | List user's conversations |
| GET | `/conversations/:id` | Get conversation detail |
| PATCH | `/conversations/:id/archive` | Archive conversation |
| PATCH | `/conversations/:id/mute` | Toggle mute |
| PATCH | `/conversations/:id/pin` | Toggle pin |
| PATCH | `/conversations/:id/notes` | Update personal notes |
| POST | `/conversations/:id/participants` | Add participant |
| DELETE | `/conversations/:id/participants/:userId` | Remove participant |
| GET | `/conversations/:id/audit-log` | Get audit log |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations/:id/messages?limit=&offset=` | Get messages (newest first) |
| POST | `/conversations/:id/messages` | Send message (supports text + attachments) |
| POST | `/conversations/:id/messages/read` | Mark all as read |
| DELETE | `/conversations/:id/messages/:msgId` | Delete own message |
| POST | `/conversations/:id/messages/:msgId/report` | Report a message |

### Labels

| Method | Path | Description |
|--------|------|-------------|
| GET | `/labels` | List company's labels |
| POST | `/labels` | Create label |
| PATCH | `/labels/:id` | Update label |
| DELETE | `/labels/:id` | Delete label |
| POST | `/conversations/:id/labels/:labelId` | Assign label |
| DELETE | `/conversations/:id/labels/:labelId` | Remove label |

### Templates (Seller)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates?category=` | List saved templates |
| POST | `/templates` | Create template |
| PATCH | `/templates/:id` | Update template |
| DELETE | `/templates/:id` | Delete template |

### Moderation (Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/communication/reports?status=&limit=&offset=` | List reported messages |
| GET | `/admin/communication/stats` | Moderation statistics |
| POST | `/admin/communication/reports/:id/review` | Review (warn/remove) |
| POST | `/admin/communication/reports/:id/dismiss` | Dismiss report |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| GET | `/communication/unread-count` | Total unread messages for user |

---

## Conversation Lifecycle

### Creation
1. User initiates from a Product, Company, Requirement List, or Saved Supplier
2. System creates Conversation with `source` + `sourceId` + `type`
3. Initiator and target company's default user become participants
4. Audit log entry: `CREATED`
5. Notification sent to target participant via existing Notification system

### Messaging
1. Participant sends message (text + optional attachments)
2. Message stored with `status: SENT`, `senderId`, `senderCompanyId`
3. `conversation.updatedAt` updated
4. Other participant's `lastReadAt` unchanged → message appears unread

### Read Receipts
1. Participant opens conversation → `POST /messages/read`
2. All messages from other participants marked `status: READ`, `seenAt` set
3. Participant's `lastReadAt` updated
4. Unread count recalculated from `lastReadAt` cut-off

### Archiving / Muting / Pinning
Per-participant preferences stored on `ConversationParticipant`:
- `isArchived: true` → filtered off main inbox
- `isMuted: true` → no push notifications
- `isPinned: true` → sorted to top

### Deletion
- Messages soft-deleted (`isDeleted: true`, content → `[deleted]`)
- Only sender can delete their own messages
- Audit log: `MESSAGE_DELETED`

### Reporting
1. Any participant reports a message with reason
2. Entry created in `ReportedMessage` with `status: PENDING`
3. Admin reviews via moderation queue
4. Admin action: WARNING, MESSAGE_REMOVED, USER_BLOCKED, or DISMISSED

---

## Future RFQ Conversion

The Conversation model stores `source` and `sourceId`, enabling direct conversion:

```
Conversation.source = REQUIREMENT_LIST
Conversation.sourceId = <requirementListId>
```

**Proposed flow:**
1. Buyer clicks "Convert to RFQ" on conversation
2. System reads `RequirementList` from `sourceId`
3. Creates RFQ with items from the requirement list
4. Links RFQ back to conversation via `Conversation.rfqId`
5. Audit log: `CONVERTED_TO_RFQ`

The `rfqId` field already exists on Conversation — the data layer is ready.

---

## Future Order Conversion

Similarly, Order discussion conversations track:

```
Conversation.source = ORDER
Conversation.sourceId = <orderId>
```

The `orderId` field already exists on Conversation.

**Proposed flow:**
1. Seller clicks "Create Quotation" on conversation
2. System reads context from `source` + `sourceId`
3. Pre-fills quotation with product/quantity data
4. On acceptance, creates Order linked to conversation

---

## Security Model

| Concern | Implementation |
|---------|---------------|
| Authentication | JWT via `JwtAuthGuard` |
| Authorization | User can only see own conversations (filtered by `participants.some({userId})`) |
| Message access | Only participants can read/send messages |
| Message deletion | Only sender can delete own message |
| Reporting | Any participant can report; only admins can review |
| File validation | Attachments reuse Media Library — validated at upload |
| Moderation | Admin-only via `RolesGuard('SUPER_ADMIN', 'ADMIN')` |
| Audit | All destructive actions logged in `ConversationAuditLog` |

---

## Integration Points

| Existing System | Integration |
|----------------|-------------|
| Authentication | JWT guard, `CurrentUser` decorator |
| Company Profile | Reused for participant display (name, logo, slug) |
| Product Cards | Source of product enquiries |
| Requirement Lists | Source of requirement discussions |
| Saved Suppliers | Source of supplier enquiries |
| Media Library | Attachment storage (no duplicate upload) |
| Notification System | `NotificationStatus` for unread indicators |
| Legacy Chat | Legacy `ChatModule` still present but deprecated — all new communication through Hub |

---

## Rollback Strategy

### Schema Rollback
If rollback is needed:
1. Run `prisma db push` with the previous schema (before Phase 12B changes)
2. This drops: `ConversationLabel`, `ConversationLabelAssignment`, `ConversationAuditLog`, `SavedTemplate`
3. Removes new fields from: `Conversation`, `ConversationParticipant`, `Message`, `ReportedMessage`
4. Data loss: All labels, templates, audit logs, moderation actions, conversation sources, participant preferences, message statuses

### API Rollback
1. Remove `CommunicationModule` from `AppModule`
2. Remove frontend pages (`buyer/inbox/`, `seller/inbox/`, `admin/communication/`)
3. Remove nav items from `master-data.ts`
4. Revert to legacy `ChatModule`

Note: Conversations created by the Hub are stored in the same `Conversation` table used by the legacy chat — existing conversations are preserved but lose new fields.

---

## File Manifest

### Backend (`apps/api/src/modules/communication/`)
- `communication.module.ts` — Module registration
- `conversation.service.ts` — Conversation CRUD, participants, archive/mute/pin, audit log
- `conversation.controller.ts` — REST endpoints for conversations
- `message.service.ts` — Send, list, mark read, delete, report, unread count
- `message.controller.ts` — REST endpoints for messages + stats
- `label.service.ts` — Label CRUD + assignment
- `label.controller.ts` — REST endpoints for labels
- `template.service.ts` — Saved template CRUD
- `template.controller.ts` — REST endpoints for templates
- `moderation.service.ts` — Reported message listing, review, dismiss, stats
- `moderation.controller.ts` — REST endpoints for admin moderation

### Frontend Buyer (`apps/web/app/buyer/inbox/`)
- `page.tsx` — Inbox list view with search, filter (all/unread/archived), unread count
- `[conversationId]/page.tsx` — Conversation detail with message list, send, delete, report, read receipts

### Frontend Seller (`apps/web/app/seller/inbox/`)
- `page.tsx` — Inbox list view + quick replies sidebar with template CRUD
- `[conversationId]/page.tsx` — Conversation detail with template quick-insert dropdown

### Frontend Admin (`apps/web/app/admin/communication/`)
- `page.tsx` — Moderation queue with stats, report review (warn/remove/dismiss)

### API Layer (`apps/web/lib/api/`)
- `communication.ts` — Axios-based API client for all endpoints

### Hooks (`apps/web/hooks/`)
- `use-communication.ts` — 22 React Query hooks covering all endpoints

### Nav Configuration
- `master-data.ts` — Added Inbox to buyer + seller nav, Communication to admin nav
- `sidebar.tsx` — Added `MessageSquare` icon to icon map

---

## Verification

- `prisma validate` — ✅ Schema valid
- `prisma db push` — ✅ Database synced
- `tsc --noEmit apps/api` — ✅ 0 errors
- `tsc --noEmit apps/web` — ✅ 0 new errors (only pre-existing generated file errors)
