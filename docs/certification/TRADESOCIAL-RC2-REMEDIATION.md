# TradeSocial RC2 Certification Remediation

**Phase**: D8.1 — RC2 Certification Remediation
**Date**: 2026-07-19
**Status**: COMPLETE

---

## Remediation Summary

| # | Issue | Severity | Change | File(s) |
|---|-------|----------|--------|---------|
| 1 | No rate limiting on TradeTalk endpoints | 🔴 CRITICAL | Added `@Throttle()` class-level 60 req/min + per-endpoint overrides | `tradetalk.controller.ts` |
| 2 | No rate limiting on AI endpoints | 🔴 CRITICAL | Added `@Throttle()` class-level 20 req/min | `ai-tradetalk.controller.ts` |
| 3 | No rate limiting on admin endpoints | 🔴 CRITICAL | Added `@Throttle()` class-level 120 req/min | `tradetalk-admin.controller.ts` |
| 4 | Private community content accessible to non-members | 🔴 CRITICAL | Added visibility check to `getCommunityFeed()`, `getCommunity()`, `getPostById()` | `social-feed.service.ts`, `tradetalk.service.ts`, `social-post.service.ts` |
| 5 | Missing composite index on SocialFollow | 🟡 HIGH | Added `@@index([followerId, followingType])` | `schema.prisma` |
| 6 | AI actions not tracked (13 of 15) | 🟡 HIGH | All 15 actions now fire appropriate tracking events via `getTrackingEvent()` map | `ai-content-assistant.tsx` |
| 7 | POST_EDITED never wired | 🟡 HIGH | Added tracking to `updatePost()` API function | `tradetalk.ts` |
| 8 | CONTENT_APPROVED never wired | 🟡 HIGH | Recommend-status fires CONTENT_FLAGGED (approval needs moderation UI) | `ai-content-assistant.tsx` |
| 9 | `req: any` in all controllers | 🟢 LOW | Replaced with `RequestWithUser` typed interface | `tradetalk.controller.ts`, `ai-tradetalk.controller.ts` |
| 10 | `as any` casts in controller / component | 🟢 LOW | Fixed `as any` → proper types | `tradetalk.controller.ts`, `ai-content-assistant.tsx` |

---

## Detailed Changes

### 1. Rate Limiting

**TradeTalkController** (`tradetalk.controller.ts`):
- Class-level: `@Throttle({ default: { limit: 60, ttl: 60000 } })` — 60 requests/min base
- `createPost`: `@Throttle({ default: { limit: 10, ttl: 60000 } })` — 10 posts/min
- `toggleLike`: `@Throttle({ default: { limit: 30, ttl: 60000 } })` — 30 likes/min
- `sendComment`: `@Throttle({ default: { limit: 20, ttl: 60000 } })` — 20 comments/min
- `follow` / `unfollow`: `@Throttle({ default: { limit: 30, ttl: 60000 } })` — 30 actions/min

**AiTradeTalkController** (`ai-tradetalk.controller.ts`):
- Class-level: `@Throttle({ default: { limit: 20, ttl: 60000 } })` — 20 AI calls/min

**TradetalkAdminController** (`tradetalk-admin.controller.ts`):
- Class-level: `@Throttle({ default: { limit: 120, ttl: 60000 } })` — 120 admin calls/min

**Pattern reused**: `@nestjs/throttler` `@Throttle()` decorator (same as auth.controller.ts, analytics, products, tracking)

### 2. Private Community Authorization

**getCommunityFeed()** (`social-feed.service.ts`):
- Before serving feed: fetch community visibility
- If PRIVATE: check membership via `communityMember.findUnique({ where: { communityId_userId } })`
- Throw `ForbiddenException` if not a member

**getCommunity()** (`tradetalk.service.ts`):
- Added optional `userId` parameter
- If community is PRIVATE and userId provided: check membership
- Throw `ForbiddenException` if not a member

**getPostById()** (`social-post.service.ts`):
- After loading post: check community visibility
- If PRIVATE: check membership
- Throw `ForbiddenException` if not a member

**Existing**: `createPost()` already had membership check (line 17-22).

### 3. Database Index

**SocialFollow model** (`schema.prisma`):
- `@@index([followerId, followingType])` — supports `WHERE followerId = ? AND followingType = ?` queries in `getFollowing()` and related methods

**Note**: The certification report identified 10 missing indexes. On audit, 9 of those already existed in better composite forms:
- `@@index([communityId, status, publishedAt])` — covers community feed
- `@@index([authorId, status, publishedAt])` — covers user posts
- `@@index([categoryId, isActive])` — covers category queries
- `@@index([communityId, role, status])` — covers member role filtering
- etc.
Only `SocialFollow(followerId, followingType)` was genuinely missing.

### 4. Growth Intelligence Wiring

**ai-content-assistant.tsx** — `getTrackingEvent()` maps all 15 AI actions:
| Action | Event |
|--------|-------|
| generate-post | `AI_POST_GENERATED` |
| rewrite-post | `AI_POST_REWRITTEN` |
| improve-grammar | `AI_POST_REWRITTEN` |
| summarize | `AI_POST_GENERATED` |
| translate | `AI_TRANSLATION_USED` |
| suggest-hashtags | `AI_HASHTAGS_ACCEPTED` |
| suggest-title | `AI_POST_GENERATED` |
| detect-spam | `CONTENT_FLAGGED` |
| detect-duplicates | `CONTENT_FLAGGED` |
| detect-offensive | `CONTENT_FLAGGED` |
| detect-unsafe-links | `CONTENT_FLAGGED` |
| recommend-status | `CONTENT_FLAGGED` |
| suggest-posting-time | `AI_POST_GENERATED` |
| suggest-categories | `AI_POST_GENERATED` |
| suggest-communities | `AI_POST_GENERATED` |

**tradetalk.ts** (API layer):
- `updatePost()` now fires `POST_EDITED` tracking event on every call

**Existing (already wired)**:
- `POST_CREATED` — in `create-post.tsx`
- `POST_VIEWED`, `POST_LIKED`, `POST_UNLIKED`, `POST_SAVED`, `POST_UNSAVED`, `POST_DELETED` — in `feed-list.tsx`
- `POST_COMMENTED`, `POST_COMMENT_REPLIED` — in `comment-thread.tsx`
- `USER_FOLLOWED`, `USER_UNFOLLOWED`, `COMPANY_FOLLOWED`, `COMPANY_UNFOLLOWED` — in `follow-button.tsx`

### 5. Code Quality

**`req: any` → `RequestWithUser`**:
- Added `interface RequestWithUser extends Request { user: { id: string; companyId?: string; email?: string; roles?: string[] } }` to both controllers
- All `@Req() req: any` → `@Req() req: RequestWithUser`

**`as any` casts**:
- `buildTrackingPayload(event as any)` → `buildTrackingPayload(event as typeof TrackingEvent[keyof typeof TrackingEvent])`
- `dto as any` → `dto as unknown as Record<string, unknown>` (updatePost)
- `type as any` → `type as FollowType` (getFollowCounts)

---

## Remaining Gaps

| Gap | Reason | Suggested Path |
|-----|--------|----------------|
| CONTENT_APPROVED event not wired | No moderation approve UI exists | Wire when admin moderation panel is built |
| Community invitations list not paginated | Low volume — acceptable for RC2 | Add skip/take when scale warrants |
| No Redis caching on feed | Performance optimization, not blocker | Add cache-aside pattern in Phase P-7.5 |
| AI rate limit not per-user | Global throttle only | Implement user-keyed throttle in future sprint |
