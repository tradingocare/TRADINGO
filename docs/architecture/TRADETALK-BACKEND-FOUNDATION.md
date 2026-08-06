# Phase 22.0 — TradeTalk Community Backend Foundation

## 1. Existing Audit

| Module | Status | Key Findings | Reusability |
|--------|--------|-------------|-------------|
| Auth | FROZEN | JwtAuthGuard, RolesGuard, @Roles() decorator, 20 endpoints | Reuse guards & decorators as-is |
| User | FROZEN | id, email, name, role, permissions[], verificationLevel | Added reverse relations for Community |
| Company | FROZEN | 143-field B2B profile, trustScore, verificationLevel | Added reverse relations for Community |
| Membership | FROZEN | Plan feature matrix, subscription lifecycle | Reuse plan pattern for community tiers (future) |
| TradTrust | FROZEN | 14-dimension scoring engine, grade/risk thresholds | Reuse scoring pattern for community reputation (future) |
| Notification | FROZEN | 80+ NotificationType values, @Global() module, template engine | Added 5 community NotificationType values |
| AI Gateway | FROZEN | 5 providers, 19 task types, credit enforcement | Reuse for community content moderation (future) |
| Search/TradFind | FROZEN | OpenSearch multi-index, 9 sub-services | Reuse for community search (future) |
| Analytics | FROZEN | Event ingestion, ClickHouse, seller/admin dashboards | Reuse for community analytics (future) |
| RBAC | FROZEN | Role enum (7), PermissionsGuard, @Roles() decorator, @Permissions() | Reuse guards without modification |
| ABAC | FROZEN | String[] permissions on User model, PermissionsGuard | Reuse for community-level permissions |
| Shared | FROZEN | PaginationDto, ValidationPipe, TransformInterceptor, RedisService | Reuse all canonical patterns |
| Organization | EXISTING | Organization, OrganizationMember, OrgMemberRole, OrganizationInvitation | Direct pattern reference for community membership |
| Conversation/Chat | FROZEN | Multi-tenant chat with participants, roles, moderation | Reference pattern only (future post/comment system) |

**No existing community, group, forum, room, or network models exist.** Zero matches — greenfield domain.

## 2. Existing vs New

### New Prisma Enums (4)
| Enum | Values | Purpose |
|------|--------|---------|
| `CommunityVisibility` | PUBLIC, PRIVATE, INVITE_ONLY | Community discoverability |
| `CommunityJoinSetting` | OPEN, APPROVAL_REQUIRED, INVITE_ONLY | Join policy |
| `CommunityMemberRole` | OWNER, ADMIN, MODERATOR, MEMBER | Role hierarchy |
| `CommunityMemberStatus` | ACTIVE, INACTIVE, BANNED, PENDING | Membership state |

### Extended Prisma Enums (1)
| Enum | Added Values |
|------|-------------|
| `NotificationType` | COMMUNITY_INVITE, COMMUNITY_MEMBER_JOINED, COMMUNITY_MEMBER_LEFT, COMMUNITY_MEMBER_ROLE_CHANGED, COMMUNITY_NEW_ROOM |

### New Prisma Models (5)
| Model | Key Fields | Relations |
|-------|-----------|-----------|
| `CommunityCategory` | name, slug, description, icon, sortOrder, isActive | → Community[] |
| `Community` | name, slug, description, visibility, joinSetting, ownerId, companyId, tags[], memberCount, roomCount | → CommunityCategory, User, Company; → CommunityMember[], IndustryRoom[], CommunityInvitation[] |
| `IndustryRoom` | name, slug, description, icon, industryId, sortOrder, isActive | → Community (Cascade), Industry |
| `CommunityMember` | role, status, joinedAt, invitedById, lastActiveAt | → Community (Cascade), User (Cascade), Company, User (invitedBy) |
| `CommunityInvitation` | email, token (unique), role, status, message, expiresAt | → Community (Cascade), User (Cascade) |

### Extended Existing Models (3)
| Model | Added Relations |
|-------|----------------|
| `User` | communitiesOwned, communityMemberships, invitationsSent, membersInvited |
| `Company` | communities, communityMembers |
| `Industry` | industryRooms |

### New Backend Module (1)
| Module | File | Endpoints |
|--------|------|-----------|
| `TradeTalkModule` | `modules/tradetalk/` | 27 endpoints (see below) |

## 3. Database Design

```
CommunityCategory (1) ──→ (N) Community (1) ──→ (N) IndustryRoom
                                    │
                                    ├── (N) CommunityMember (N) ──→ (1) User
                                    │                              └── (1) Company
                                    │
                                    └── (N) CommunityInvitation ──→ (1) User
                                                                   └── email (external)
```

**onDelete policies:**
- `Cascade`: Community→rooms, Community→members, Community→invitations, User→members, User→invitations
- `SetNull`: CommunityCategory→Community, Community→Company, IndustryRoom→Industry, CommunityMember→Company
- `Restrict`: Community→User (owner cannot be deleted while owning communities)

**Indexes:** 15 indexes across all 5 models (FK, status, composite queries)

## 4. API Planning — 27 Endpoints

### Public Community Controller (`/tradetalk`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | JWT | List community categories |
| GET | `/communities` | JWT | Discover public communities (paginated, filterable) |
| GET | `/communities/:idOrSlug` | JWT | Get community detail with rooms |
| POST | `/communities` | JWT | Create community (creator becomes OWNER) |
| PATCH | `/communities/:idOrSlug` | OWNER/ADMIN | Update community |
| DELETE | `/communities/:idOrSlug` | OWNER | Soft-delete community |
| POST | `/communities/:id/join` | JWT | Join community |
| POST | `/communities/:id/leave` | JWT | Leave community |
| GET | `/communities/:id/members` | JWT | List members (paginated) |
| PATCH | `/communities/:id/members/:userId` | OWNER/ADMIN | Update member role |
| DELETE | `/communities/:id/members/:userId` | OWNER/ADMIN | Remove member |
| POST | `/communities/:id/invite` | OWNER/ADMIN/MODERATOR | Send invitation |
| GET | `/communities/:id/invitations` | OWNER/ADMIN/MODERATOR | List invitations |
| POST | `/invitations/:token/accept` | JWT | Accept invitation |
| POST | `/invitations/:token/reject` | JWT | Reject invitation |
| DELETE | `/invitations/:invitationId` | OWNER/ADMIN | Cancel invitation |
| POST | `/communities/:id/rooms` | OWNER/ADMIN/MODERATOR | Create industry room |
| GET | `/communities/:id/rooms` | JWT | List rooms |
| PATCH | `/communities/:id/rooms/:roomId` | OWNER/ADMIN/MODERATOR | Update room |
| DELETE | `/communities/:id/rooms/:roomId` | OWNER/ADMIN | Delete room |
| GET | `/my-communities` | JWT | List user's communities |

### Admin Controller (`/admin/tradetalk`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | ADMIN | List all categories |
| POST | `/categories` | ADMIN | Create category |
| PATCH | `/categories/:id` | ADMIN | Update category |
| DELETE | `/categories/:id` | ADMIN | Delete category |
| GET | `/communities` | ADMIN | List all communities (incl. inactive) |

## 5. Permission Matrix

| Action | PUBLIC | MEMBER | MODERATOR | ADMIN | OWNER |
|--------|--------|--------|-----------|-------|-------|
| View community | ✅ | ✅ | ✅ | ✅ | ✅ |
| Join community | ✅ (if OPEN) | — | — | — | — |
| Leave community | — | ✅ | ✅ | ✅ | — |
| Create post (future) | — | ✅ | ✅ | ✅ | ✅ |
| Reply (future) | — | ✅ | ✅ | ✅ | ✅ |
| Create room | — | — | ✅ | ✅ | ✅ |
| Invite members | — | — | ✅ | ✅ | ✅ |
| Manage members | — | — | — | ✅ | ✅ |
| Assign MODERATOR | — | — | — | ✅ | ✅ |
| Assign ADMIN | — | — | — | — | ✅ |
| Update community | — | — | — | ✅ | ✅ |
| Delete community | — | — | — | — | ✅ |
| Manage categories (admin) | — | — | — | — | — |

**Enforcement:** `requireCommunityAccess(communityId, userId, allowedRoles[])` in TradeTalkService.

## 6. Files Created

| File | Purpose |
|------|---------|
| `apps/api/src/modules/tradetalk/tradetalk.module.ts` | Module definition |
| `apps/api/src/modules/tradetalk/tradetalk.service.ts` | Core service (465 lines, 20 methods) |
| `apps/api/src/modules/tradetalk/tradetalk.controller.ts` | Public/buyer/seller controller (21 endpoints) |
| `apps/api/src/modules/tradetalk/tradetalk-admin.controller.ts` | Admin controller (6 endpoints) |
| `apps/api/src/modules/tradetalk/dto/index.ts` | DTO barrel export |
| `apps/api/src/modules/tradetalk/dto/create-community.dto.ts` | Community creation validation |
| `apps/api/src/modules/tradetalk/dto/update-community.dto.ts` | Community update validation |
| `apps/api/src/modules/tradetalk/dto/discover-communities.dto.ts` | Community search/filter validation |
| `apps/api/src/modules/tradetalk/dto/create-room.dto.ts` | Room creation validation |
| `apps/api/src/modules/tradetalk/dto/update-room.dto.ts` | Room update validation |
| `apps/api/src/modules/tradetalk/dto/invite-member.dto.ts` | Invitation creation validation |
| `apps/api/src/modules/tradetalk/dto/update-member-role.dto.ts` | Role update validation |
| `apps/api/src/modules/tradetalk/dto/join-community.dto.ts` | Join community validation |

**Total:** 13 new files

## 7. Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added 4 enums, 5 models, 5 NotificationType values, reverse relations on User/Company/Industry |
| `apps/api/src/app.module.ts` | Imported + registered TradeTalkModule |

## 8. Future Compatibility

### Architecture Reservations (ready for later phases)

| Future Feature | Reserved Pattern | Status |
|---------------|-----------------|--------|
| Posts (Wall / Feed) | Community.id as parent — new `CommunityPost` model | Greenfield |
| Replies/Comments | `parentId` self-reference on CommunityPost | Reserved |
| Reactions (Likes) | Future `CommunityReaction` model with userId, postId, type | Reserved |
| AI Content Moderation | TaskType.COMMUNITY_MODERATION reserved in Prisma | Reserved |
| Community Search | OpenSearch index `COMMUNITY_POSTS` via TradFind | Reserved |
| Notifications | 5 NotificationType values pre-seeded | Ready |
| Chat integration | ConversationType.FORUM reserved | Reserved |
| Community Reputation | CommunityEngagementScore dimension for TradTrust | Reserved |
| Community Plans | Separate pricing tiers via existing PlanFeature pattern | Reserved |
| File Uploads | Reuse existing StorageService pattern | Reserved |
| Polls | Future `CommunityPoll` model with option tracking | Reserved |
| Events | Future `CommunityEvent` model with RSVP | Reserved |

### What Must Not Change
- Frozen modules (Auth, GOCASH, AI Gateway, TradTrust core, Master Catalog)
- Existing User/Company/Industry field definitions
- Community model visibility/joinSetting fields (foundational design)

## 9. Verification

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ Schema valid |
| `prisma generate` | ✅ Client generated |
| `tsc api --noEmit` | ✅ 0 errors |
| `tsc web --noEmit` | ✅ 0 errors |
| `eslint modules/tradetalk/` | ✅ 0 errors (15 `any` warnings — NestJS req pattern, consistent with codebase) |
| `next build` | ✅ 251 routes |

## 10. NEXT PHASE READY

```
NEXT PHASE READY
Phase: Phase 22.1 — TradeTalk Frontend (Community Pages + Discovery UI)
Status: Waiting for only one command: START

Implementation Prompt:
1. Phase 22.0 backend is complete — 27 API endpoints available under /tradetalk/ and /admin/tradetalk/
2. Create frontend pages: /tradetalk (community listing/landing), /tradetalk/[slug] (community detail), /tradetalk/create (community creation form)
3. Create React Query hooks: useDiscoverCommunities, useGetCommunity, useCreateCommunity, useJoinCommunity, useInviteMember, useCreateRoom, useMyCommunities
4. Create API layer at lib/api/tradetalk.ts with typed functions
5. Reuse existing patterns: PaginatedResponse, useToast, loading/error/empty states, skeleton components
6. Add TradeTalk to navigation (both buyer and seller nav menus)
7. Components to reuse: Card, Button, Modal, Badge, Avatar, Tabs from existing shared components
8. Verification: tsc api 0 errors, tsc web 0 errors, next build passes
```

**Stop condition:** This is a backend-only phase. No frontend changes required. Wait for Founder approval before starting Phase 22.1.
