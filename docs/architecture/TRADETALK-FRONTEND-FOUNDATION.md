# Phase 22.1 — TradeTalk Frontend Foundation

## 1. Existing Audit

| Area | Status | Key Findings | Reusability |
|------|--------|-------------|-------------|
| TradeTalk Landing | EXISTS | `/tradetalk/page.tsx` — marketing landing page, untouched | Preserved |
| Auth | FROZEN | JwtAuthGuard, `useAuth()` hook, session management | Reuse `useAuth()` for auth state |
| Dashboard Shell | EXISTS | Buyer/seller/admin layouts with Topbar, Sidebar, container-main | All pages placed under `/tradetalk/*` use default root layout |
| Sidebar | REUSABLE | All 3 navs already have `TradeTalk` entry with `MessageCircle` icon in ICON_MAP | Only needed to update href |
| Cards | REUSABLE | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | Reused in all 5 pages |
| Data Tables | REUSABLE | Table, THead, TR, TH, TBody, TD with overflow-x-auto wrapper | Reused in management page |
| Dialogs/Modals | REUSABLE | Modal component with open/close, sizes, animation | Reused for invite + room creation |
| Empty States | REUSABLE | EmptyState with variant (empty/loading/error), title, description, action | Reused in all 5 pages |
| Skeleton Loaders | REUSABLE | ShimmerSkeleton, Card-level shimmer patterns | Reused in loading states |
| Pagination | REUSABLE | Pagination component with meta + onPageChange | Reused in community directory |
| Badges | REUSABLE | Badge with variant (default/secondary/outline/success/warning) | Reused for visibility, role, status |
| Tabs | REUSABLE | Tabs with value/onChange, pills/underline variant | Reused in management page |
| DashboardPageHeader | REUSABLE | Title + description + actions + breadcrumbs | Reused in all pages |
| Breadcrumbs | REUSABLE | Auto-generates from pathname with labelMap | Added tradetalk/community/community/invitations/manage labels |
| API Layer | REUSABLE | apiClient with interceptors, PaginatedResponse type | Created tradetalk.ts following campaign.ts pattern |
| React Query Hooks | REUSABLE | useQuery/useMutation with queryKey naming convention | Created use-tradetalk.ts (21 hooks) |
| Notification | REUSABLE | toast system | Reused for success/error feedback |
| StatCard | REUSABLE | Icon + label + value | Reusable (used indirectly via dashboard widget) |
| PlatformIntegrationsCard | REUSABLE | XP integration links | Preserved, TradeTalk widget added alongside |
| Membership | FROZEN | Plan feature matrix — no community-specific tiers yet | Display placeholder via TradTrust badge |
| TradTrust | FROZEN | Scoring engine — no community dimension yet | Reuse Badge variant for trust indication |

## 2. Existing vs New

### New Files Created (9)

| File | Purpose | Lines |
|------|---------|-------|
| `lib/api/tradetalk.ts` | Typed API layer (21 functions, 6 interfaces) | ~175 |
| `hooks/use-tradetalk.ts` | React Query hooks (21 hooks) | ~195 |
| `components/tradetalk/dashboard-widget.tsx` | Dashboard widget (joined/owned/pending counts) | ~80 |
| `app/tradetalk/communities/page.tsx` | Community Directory with grid, search, category filter, pagination | ~155 |
| `app/tradetalk/community/[slug]/page.tsx` | Community Detail with rooms, membership, join/leave, invite | ~185 |
| `app/tradetalk/my/page.tsx` | My Communities (owned + joined sections) | ~115 |
| `app/tradetalk/invitations/page.tsx` | Pending invitations with accept/reject | ~105 |
| `app/tradetalk/community/[slug]/manage/page.tsx` | Management (members, invitations, rooms tabs) | ~370 |

### New Routes Added (5)

| Route | Type | Purpose |
|-------|------|---------|
| `/tradetalk/communities` | Static | Community directory |
| `/tradetalk/community/[slug]` | Dynamic | Community detail |
| `/tradetalk/community/[slug]/manage` | Dynamic | Community management |
| `/tradetalk/invitations` | Static | Invitations list |
| `/tradetalk/my` | Static | My communities |

### Files Modified (5)

| File | Change |
|------|--------|
| `lib/api/index.ts` | Added `export * from './tradetalk'` |
| `data/master-data.ts` | Updated 3 nav hrefs from `/seller\|buyer\|admin/tradetalk` to `/tradetalk/communities` |
| `components/dashboard/breadcrumbs.tsx` | Added 5 labelMap entries (tradetalk, community, communities, invitations, manage) |
| `app/buyer/dashboard/page.tsx` | Added TradeTalkDashboardWidget |
| `app/seller/dashboard/page.tsx` | Added TradeTalkDashboardWidget |

## 3. Components Reused

| Component | Used In | Usage |
|-----------|---------|-------|
| Card | All 5 pages + widget | Main content container |
| CardHeader, CardTitle, CardDescription, CardContent, CardFooter | All 5 pages | Card sub-components |
| Button | All pages | Primary/secondary/ghost actions |
| Badge | communities, detail, management | Visibility, role, status badges |
| Input | communities, detail, management | Search, invite email, room name |
| ShimmerSkeleton | All 5 pages | Loading skeletons for cards, tables |
| EmptyState | communities, detail, my, invitations, management | Empty/error states |
| Pagination | communities | Page navigation |
| Tabs | management | Members/Invitations/Rooms tabs |
| Modal | management | Invite member + create room modals |
| Table | management | Members + invitations tables |
| DashboardPageHeader | All 5 pages + widget | Title, description, breadcrumbs |
| toast | detail, management, invitations | Success/error feedback |
| Link | All pages | Internal navigation |

## 4. Components Created

| Component | Path | Description |
|-----------|------|-------------|
| TradeTalkDashboardWidget | `components/tradetalk/dashboard-widget.tsx` | Displays joined/owned/pending counts with links |

## 5. Routes Added

| Route | Description |
|-------|-------------|
| `/tradetalk/communities` | Directory with search, category filter, grid view, pagination, featured badge |
| `/tradetalk/community/[slug]` | Detail with cover, info, rooms, sidebar, join/leave, invite |
| `/tradetalk/my` | Split into Owned (with manage link) and Joined sections |
| `/tradetalk/invitations` | Pending invitations with accept/reject |
| `/tradetalk/community/[slug]/manage` | 3-tab page: Members (role update, remove), Invitations (send, cancel), Rooms (create, delete) |

## 6. API Layer (21 Functions)

| Function | Endpoint | Purpose |
|----------|----------|---------|
| getCategories | GET /tradetalk/categories | List community categories |
| discoverCommunities | GET /tradetalk/communities | Paginated discovery with search/filter |
| getCommunity | GET /tradetalk/communities/:idOrSlug | Community detail with rooms |
| createCommunity | POST /tradetalk/communities | Create community |
| updateCommunity | PATCH /tradetalk/communities/:idOrSlug | Update community |
| deleteCommunity | DELETE /tradetalk/communities/:idOrSlug | Soft-delete community |
| joinCommunity | POST /tradetalk/communities/:id/join | Join community |
| leaveCommunity | POST /tradetalk/communities/:id/leave | Leave community |
| getMembers | GET /tradetalk/communities/:id/members | List members (paginated) |
| updateMemberRole | PATCH /tradetalk/communities/:id/members/:userId | Change member role |
| removeMember | DELETE /tradetalk/communities/:id/members/:userId | Remove member |
| inviteMember | POST /tradetalk/communities/:id/invite | Send invitation |
| getInvitations | GET /tradetalk/communities/:id/invitations | List invitations |
| acceptInvitation | POST /tradetalk/invitations/:token/accept | Accept invitation |
| rejectInvitation | POST /tradetalk/invitations/:token/reject | Reject invitation |
| cancelInvitation | DELETE /tradetalk/invitations/:invitationId | Cancel sent invitation |
| createRoom | POST /tradetalk/communities/:id/rooms | Create industry room |
| getRooms | GET /tradetalk/communities/:id/rooms | List rooms |
| updateRoom | PATCH /tradetalk/communities/:id/rooms/:roomId | Update room |
| deleteRoom | DELETE /tradetalk/communities/:id/rooms/:roomId | Delete room |
| getMyCommunities | GET /tradetalk/my-communities | User's communities |

## 7. React Query Hooks (21 Hooks)

| Hook | Type | Invalidates |
|------|------|-------------|
| useCategories | Query | — |
| useDiscoverCommunities | Query | — |
| useCommunity | Query (enabled: !!idOrSlug) | — |
| useCreateCommunity | Mutation | ['tradetalk'] |
| useUpdateCommunity | Mutation | ['tradetalk'] |
| useDeleteCommunity | Mutation | ['tradetalk'] |
| useJoinCommunity | Mutation | ['tradetalk', 'my-communities'], ['tradetalk', 'community'] |
| useLeaveCommunity | Mutation | ['tradetalk', 'my-communities'], ['tradetalk', 'community'] |
| useMembers | Query (enabled: !!communityId) | — |
| useUpdateMemberRole | Mutation | ['tradetalk', 'members'] |
| useRemoveMember | Mutation | ['tradetalk', 'members'], ['tradetalk', 'community'] |
| useInviteMember | Mutation | ['tradetalk', 'invitations'] |
| useCommunityInvitations | Query (enabled: !!communityId) | — |
| useAcceptInvitation | Mutation | ['tradetalk', 'my-communities'], ['tradetalk', 'invitations'] |
| useRejectInvitation | Mutation | ['tradetalk', 'invitations'] |
| useCancelInvitation | Mutation | ['tradetalk', 'invitations'] |
| useCreateRoom | Mutation | ['tradetalk', 'rooms'] |
| useRooms | Query (enabled: !!communityId) | — |
| useUpdateRoom | Mutation | ['tradetalk', 'rooms'] |
| useDeleteRoom | Mutation | ['tradetalk', 'rooms'] |
| useMyCommunities | Query | — |

## 8. Future Integration Notes

| Future Feature | Reserved | Ready When |
|---------------|----------|------------|
| Posts/Discussions | Community detail page has "Industry Rooms" section placeholder | Phase 22.2+ — new CommunityPost model + service |
| Comments/Replies | Slot under rooms | Phase 22.2+ |
| AI Content Moderation | Community management page reserved tab structure | After posts phase |
| Community Search | Search bar in community directory (wired to real API) | After OpenSearch index added |
| File/Image Uploads | StorageService exists, modal slots reserved | After files phase |
| Notifications for community activity | NotificationType enum has 5 community types seeded | After posts phase |
| Real-time chat | ChatGateway already exists, ConversationType.FORUM reserved | After chat integration phase |
| Admin community management | Admin routes exist in backend (admin/tradetalk/*) | Frontend admin page pending |
| Community membership plans | Membership module feature matrix pattern | After community monetization |
| Recommendation engine | Dashboard widget discovery slot reserved | After AI search phase |

## 9. Verification

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ (no schema changes in this phase) |
| `prisma generate` | ✅ (no schema changes in this phase) |
| `tsc api --noEmit` | ✅ 0 errors |
| `tsc web --noEmit` | ✅ 0 errors |
| `eslint` | ✅ (no tradetalk-specific errors) |
| `next build` | ✅ 254 routes (3 new: communities, invitations, my + 2 dynamic: community/[slug], community/[slug]/manage) |

## 10. NEXT PHASE READY

```
NEXT PHASE READY
Phase: Phase 22.2 — TradeTalk Posts & Discussions
Status: Waiting for only one command: START

Implementation Prompt:
1. Phase 22.0 (backend) + Phase 22.1 (frontend foundation) are complete — 27 API endpoints, 5 frontend pages, 21 hooks, dashboard widget
2. Implement CommunityPost model in Prisma (id, communityId, roomId, authorId, title, content, type, status, isPinned, createdAt, updatedAt, deletedAt)
3. Implement CommunityComment model (id, postId, authorId, parentId, content, createdAt, updatedAt)
4. Add backend service methods: createPost, getPosts, getPost, updatePost, deletePost, createComment, getComments
5. Add backend controller endpoints: POST/GET/PATCH/DELETE for posts and comments
6. Add frontend API functions, React Query hooks
7. Wire posts into community detail page (Industry Rooms → Discussion threads)
8. Verification: prisma validate, generate, tsc api/web 0 errors, next build passes
```

**Stop condition:** Do NOT implement AI, realtime, notifications, reactions, polls, or files. Wait for Founder approval before starting Phase 22.2.
