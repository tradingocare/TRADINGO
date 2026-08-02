# API Module Index

> Complete index of all API modules organized by category.  
> Total: ~92 modules, 155 controllers, 1,325+ endpoints.

---

## 1. Authentication & Users

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Auth | `/api/v1/auth` | AuthController | `POST /login`, `POST /register`, `POST /refresh`, `POST /forgot-password`, `POST /reset-password`, `POST /change-password`, `PATCH /me`, `POST /verify-email`, `POST /verify-mobile`, `POST /social-login` | Public / JWT |
| Users | `/api/v1/users` | UsersController | `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | JWT + Roles |
| User Verification | `/api/v1/user-verifications` | UserVerificationController | `POST /`, `GET /`, `GET /my`, `GET /:id`, `POST /:id/review` | JWT / JWT + Roles |
| Profile Completion | `/api/v1/profile-completion` | ProfileCompletionController | `GET /status`, `POST /complete` | JWT |

## 2. Marketplace Core

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Products | `/api/v1/products` | ProductsController, SellerProductController | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/publish`, `POST /:id/unpublish`, `GET /my-products` | Public / JWT / JWT + Roles |
| Categories | `/api/v1/categories` | CategoriesController | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` | Public / JWT + Roles |
| Industries | `/api/v1/industries` | IndustriesController | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` | Public / JWT + Roles |
| Brands | `/api/v1/brands` | BrandsController | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` | Public / JWT + Roles |
| Organizations | `/api/v1/organizations` | OrganizationsController | `GET /my-company`, `GET /:id`, `GET /`, `PATCH /:id` | JWT |
| Companies | `/api/v1/companies` | CompaniesController | `GET /`, `GET /:id`, `POST /`, `PATCH /:id` | JWT / JWT + Roles |
| Seller | `/api/v1/seller` | SellerController, SellerDashboardController | `GET /products`, `POST /products`, `GET /analytics/overview`, `GET /dashboard` | JWT + Roles (SELLER) |
| Media | `/api/v1/media` | MediaController | `POST /upload`, `GET /:id`, `DELETE /:id`, `POST /bulk-upload` | JWT + Roles |
| Import | `/api/v1/import` | ImportController | `POST /csv`, `GET /jobs`, `GET /jobs/:id`, `POST /validate` | JWT + Roles |
| Bulk | `/api/v1/bulk` | BulkController | `POST /import`, `GET /status/:jobId`, `POST /validate` | JWT + Roles |

## 3. RFQ & Quotes

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Smart RFQ | `/api/v1/smart-rfq` | SmartRfqController | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `GET /:id/quotes`, `POST /:rfqId/accept-quote/:quoteId`, `POST /:rfqId/reject-quote/:quoteId` | JWT |
| Quote | `/api/v1/quotes` | QuoteController, AiQuoteController | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `GET /:id/ai/:action` (10 actions) | JWT |
| Smart Negotiation | `/api/v1/smart-negotiation` | SmartNegotiationController, AiNegotiationController | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `POST /:id/message`, `POST /:id/ai/:action` (12 actions) | JWT |
| Rfq Product | `/api/v1/rfq-products` | RfqProductController | `GET /`, `POST /`, `PATCH /:id` | JWT |

## 4. Orders & Fulfillment

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Purchase Orders | `/api/v1/purchase-orders` | PurchaseOrdersController | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `POST /:id/confirm`, `POST /:id/cancel` | JWT |
| Orders (Legacy) | `/api/v1/orders` | OrdersController | `GET /`, `GET /:id`, `POST /`, `PATCH /:id` | JWT |
| Shipments | `/api/v1/shipments` | ShipmentsController | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/tracking`, `POST /:id/deliver` | JWT |
| Deliveries | `/api/v1/deliveries` | DeliveriesController | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/confirm` | JWT |

## 5. Payments & Finance

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Payments | `/api/v1/payments` | PaymentsController | `POST /`, `GET /`, `GET /:id`, `POST /:id/refund`, `POST /webhook` | JWT / Public |
| Escrow | `/api/v1/escrow` | EscrowController | `POST /`, `GET /:id`, `POST /:id/release`, `POST /:id/dispute` | JWT |
| Finance | `/api/v1/finance` | FinanceController, AiFinanceController | `GET /dashboard`, `GET /transactions`, `POST /credit-risk`, `POST /payment-delay`, `POST /cash-flow-forecast`, `POST /collection-strategy`, `POST /financial-health` | JWT + Roles |
| Credit | `/api/v1/credit` | CreditController | `GET /`, `POST /`, `GET /:id`, `PATCH /:id/status` | JWT + Roles |
| Collections | `/api/v1/collections` | CollectionsController | `GET /`, `GET /:id`, `POST /:id/action` | JWT + Roles |
| Credit Notes | `/api/v1/credit-notes` | CreditNotesController | `POST /`, `GET /`, `GET /:id` | JWT |

## 6. GOCASH & Rewards

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| GOCASH | `/api/v1/gocash` | GocashController | `POST /wallet`, `POST /credit`, `POST /debit`, `POST /reverse`, `POST /redeem`, `GET /balance`, `GET /ledger`, `GET /admin/stats` | JWT |
| Wallet API | `/api/v1/wallet` | WalletApiController | `GET /buyer/summary`, `GET /seller/analytics`, `GET /admin/search`, `POST /admin/freeze/:id`, `POST /admin/credit`, `GET /statement`, `GET /analytics/growth` | JWT |
| GOCASH Ecosystem | `/api/v1/ecosystem` | GocashEcosystemController | `POST /checkin`, `GET /xp/balance`, `GET /levels`, `GET /badges`, `GET /missions`, `POST /missions/:id/complete`, `GET /achievements`, `GET /leaderboard`, `POST /seed` | JWT |
| GOCASH Integration | `/api/v1/gocash-integration` | GocashIntegrationController | `POST /membership/signup`, `POST /order/completed`, `POST /rfq/created`, `POST /quote/accepted`, `POST /negotiation/completed`, `POST /po/confirmed`, `POST /shipment/confirmed`, `GET /summary` | JWT |
| Referral | `/api/v1/referral` | ReferralController | `POST /codes`, `GET /codes`, `POST /validate`, `POST /apply`, `GET /history`, `GET /statistics`, `GET /admin/dashboard`, `POST /admin/blacklist` | JWT |
| Campaign | `/api/v1/campaigns` | CampaignController, AdminCampaignController | `POST /`, `GET /`, `GET /active`, `POST /:id/claim`, `GET /my-claims`, `GET /admin/dashboard`, `POST /:id/clone`, `POST /:id/pause`, `POST /:id/archive` | JWT |

## 7. AI Platform

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| AI Gateway | `/api/v1/ai-gateway` | AiGatewayController, AdminAiGatewayController | `POST /process`, `POST /stream`, `GET /providers`, `GET /models`, `GET /credits/balance`, `GET /credits/summary`, `GET /credits/company/:id`, `POST /credits/reset/:id` | JWT |
| AI Orchestrator | `/api/v1/ai-orchestrator` | AiOrchestratorController | `POST /dispatch`, `POST /workflow`, `GET /actions`, `GET /status/:id` | JWT |
| AI Runtime | `/api/v1/ai-runtime` | AiRuntimeController, AdminRuntimeController | `POST /enqueue`, `POST /dispatch`, `GET /queue/stats`, `GET /sla`, `GET /circuit-breaker`, `GET /job-history`, `POST /workflow`, `POST /circuit-breaker/reset/:action` | JWT |
| AI Federation | `/api/v1/ai-federation` | FederationController, AdminFederationController | `POST /collaborate`, `POST /workflow/execute`, `POST /agents/message`, `GET /agents`, `GET /collaborations`, `GET /capabilities`, `GET /analytics/summary`, `GET /analytics/graph` | JWT |

## 8. TradeAI Agents

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Seller Agent | `/api/v1/seller-agent` | SellerAgentController | `GET /dashboard-copilot`, `GET /smart-sell`, `GET /product-intelligence`, `GET /demand-analysis`, `GET /pricing`, `GET /competition`, `GET /market-intel`, `GET /notifications` | JWT + Roles (SELLER) |
| Buyer Agent | `/api/v1/buyer-agent` | BuyerAgentController | `GET /dashboard-copilot`, `GET /smart-procurement`, `GET /rfq-assistant`, `GET /supplier-intelligence`, `GET /negotiation-advisor`, `GET /cost-optimization`, `GET /notifications`, `GET /all-insights` | JWT + Roles (BUYER) |
| Admin Agent | `/api/v1/admin/agent` | AdminAgentController | `GET /dashboard-copilot`, `GET /system-health`, `GET /user-activity`, `GET /fraud-intelligence`, `GET /revenue-analytics`, `GET /moderation-queue`, `GET /platform-growth`, `GET /performance-metrics`, `GET /daily-brief` | JWT + Roles (ADMIN) |
| Executive Agent | `/api/v1/founder/executive` | ExecutiveAgentController | `GET /copilot`, `GET /decision-center`, `GET /kpi`, `GET /risks`, `GET /opportunities`, `GET /analytics`, `POST /coordinate/:agentId` | JWT + Roles (SUPER_ADMIN) |
| Agent Framework | (internal) | — | AgentRegistryService, AgentExecutorService, CapabilityMatchingService | Internal |

## 9. AI Domain Services

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| AI (Product) | `/api/v1/ai` | AiController, AiProductIntelligenceController | `POST /generate-description`, `POST /generate-seo`, `POST /suggest-specs`, `POST /suggest-images`, `POST /translate`, `POST /generate-title`, `POST /suggest-attributes`, `POST /suggest-category` | JWT + Roles |
| AI Quality | `/api/v1/ai/quality` | CatalogQualityController | `POST /calculate`, `GET /scores`, `POST /detect-duplicates`, `GET /seller-dashboard`, `GET /seller/quality-trend`, `GET /seller/ai-usage`, `GET /seller/rewards`, `GET /seller/commerce-score` | JWT |
| Admin Intelligence | `/api/v1/admin/ai` | AiAdminController | `POST /morning-brief`, `POST /revenue-forecast`, `POST /user-growth`, `POST /fraud-intelligence`, `POST /churn-prediction`, `POST /category-intelligence`, `POST /geo-intelligence`, `POST /market-trends`, `POST /executive-copilot`, `POST /decision-support` | JWT + Roles (ADMIN) |
| Founder AI | `/api/v1/admin/founder-ai` | FounderAiController | `GET /morning-brief`, `GET /evening-summary`, `GET /dashboard`, `GET /decision-center`, `GET /risk-intelligence`, `GET /growth-intelligence`, `GET /copilot`, `GET /health-score`, `GET /priorities`, `GET /timeline`, `GET /report/:type` | JWT + Roles (SUPER_ADMIN) |

## 10. Search & Discovery

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| TradFind | `/api/v1/search` | SearchController, AiSearchController | `GET /`, `GET /autocomplete`, `POST /ai/semantic`, `POST /ai/intent`, `POST /ai/similar-products`, `POST /ai/similar-suppliers`, `POST /ai/smart-filters`, `POST /ai/cross-sell` | Public / JWT |
| Enterprise Catalog | `/api/v1/enterprise-catalog` | GlobalBrandController, GlobalAttributeController, TaxonomyController, CatalogAdminController | `POST /brands`, `GET /brands`, `POST /attributes`, `GET /attributes`, `POST /synonyms`, `POST /industry-mappings`, `GET /admin/dashboard`, `POST /search`, `GET /autocomplete`, `GET /suggestions` | JWT + Roles |
| Enterprise Intelligence | `/api/v1/enterprise-intelligence` | EnterpriseIntelligenceController | `GET /dashboard`, `GET /revenue`, `GET /revenue-forecast`, `GET /growth`, `GET /trends`, `GET /health`, `GET /anomalies`, `GET /market-intelligence`, `GET /compliance`, `GET /risk`, `GET /supplier-intelligence`, `GET /catalog-metrics`, `POST /digital-twin/optimize`, `POST /run-workflow` | JWT + Roles |

## 11. Communications

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| TradeTalk | `/api/v1/tradetalk` | TradeTalkController, TradeTalkAdminController | `GET /channels`, `POST /channels`, `POST /channels/:id/messages`, `GET /channels/:id/messages`, `POST /ai/assist`, `GET /admin/moderation-queue`, `POST /admin/moderation/:id/action` | JWT |
| Notifications | `/api/v1/notifications` | NotificationsController, NotificationPreferencesController | `GET /`, `PATCH /:id/read`, `POST /read-all`, `GET /unread-count`, `GET /preferences`, `PATCH /preferences`, `POST /push/register` | JWT |
| SMS | `/api/v1/sms` | SmsController | `GET /stats`, `GET /logs`, `POST /send-test` | JWT + Roles (ADMIN) |

## 12. CRM

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| CRM | `/api/v1/crm` | CrmController, AiCrmController | `GET /leads`, `POST /leads`, `PATCH /leads/:id`, `GET /pipelines`, `POST /pipelines`, `GET /analytics`, `GET /ai/score-lead`, `GET /ai/next-best-action`, `GET /ai/sentiment` | JWT + Roles |

## 13. TradeServ

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| TradeServ | `/api/v1/tradeserv` | TradeServController, TradeServSearchController, TradeServBookingController, TradeServProposalController, TradeServAdminController, TradeServAiController | `GET /professionals`, `GET /professionals/:id`, `POST /services`, `PATCH /services/:id`, `POST /portfolio`, `POST /certifications`, `POST /availability`, `POST /bookings`, `PATCH /bookings/:id/status`, `GET /bookings`, `POST /proposals`, `PATCH /proposals/:id`, `POST /reviews`, `GET /search`, `POST /ai/match`, `GET /admin/professionals`, `PATCH /admin/professionals/:id/verify` | JWT / JWT + Roles |

## 14. Platform Infrastructure

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Audit Log | `/api/v1/audit-logs` | AuditLogController | `GET /`, `GET /:id`, `GET /export` | JWT + Roles (ADMIN) |
| Incident Response | `/api/v1/incidents` | IncidentController | `POST /`, `GET /`, `PATCH /:id/resolve`, `GET /active` | JWT + Roles (ADMIN) |
| Admin Settings | `/api/v1/admin/settings` | AdminSettingsController | `GET /`, `PATCH /`, `GET /:key` | JWT + Roles (ADMIN) |
| Storage | `/api/v1/storage` | StorageController | `POST /upload`, `GET /:id`, `DELETE /:id` | JWT |
| Company Verification | `/api/v1/company-verifications` | CompanyVerificationController | `POST /`, `GET /`, `GET /my`, `GET /:id/review` | JWT / JWT + Roles |
| Membership | `/api/v1/membership` | MembershipController | `GET /plans`, `GET /current`, `POST /subscribe`, `POST /cancel`, `POST /upgrade`, `GET /history` | Public / JWT |
| Advertising | `/api/v1/advertising` | AdvertisingController, AdminAdvertisingController | `POST /`, `GET /`, `GET /my`, `GET /:id`, `POST /:id/fund`, `POST /:id/pause`, `POST /:id/approve`, `GET /placements`, `GET /admin`, `GET /admin/stats` | JWT |
| Health | `/api/v1/health` | HealthController | `GET /`, `GET /live`, `GET /ready` | Public |
| Analytics | `/api/v1/analytics` | AnalyticsController | `GET /admin/dashboard`, `GET /seller`, `GET /buyer` | JWT |

## 15. Intelligence

| Module | Base Path | Controller(s) | Key Endpoints | Auth |
|--------|-----------|---------------|---------------|------|
| Marketplace Intelligence | `/api/v1/marketplace-intelligence` | MarketplaceIntelligenceController | `GET /best-suppliers`, `GET /buyer-history`, `POST /refresh-scores` | JWT |
| Location Intelligence | `/api/v1/location-intelligence` | LocationIntelligenceController | `POST /geocode`, `GET /nearby`, `GET /clusters`, `GET /geo-entity/:id` | JWT |
| Market Intelligence | `/api/v1/market-intelligence` | MarketIntelligenceController | `GET /overview`, `GET /trends`, `GET /competitors` | JWT + Roles |
| Territory Intelligence | `/api/v1/territory-intelligence` | TerritoryIntelligenceController | `GET /coverage`, `POST /assign`, `GET /analytics` | JWT + Roles |
| Freight Intelligence | `/api/v1/freight-intelligence` | FreightIntelligenceController | `GET /rates`, `POST /optimize`, `GET /tracking` | JWT |
| Company Locations | `/api/v1/company-locations` | CompanyLocationsController | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `GET /nearby` | JWT |
| TradTrust | `/api/v1/tradtrust` | TradTrustController | `GET /score/:companyId`, `GET /history/:companyId`, `POST /recalculate/:companyId`, `POST /recalculate-all` | Public / JWT + Roles |

---

## Module Count Summary

| Category | Modules | Controllers | Est. Endpoints |
|----------|---------|-------------|----------------|
| 1. Authentication & Users | 4 | 4 | 28 |
| 2. Marketplace Core | 10 | 14 | 110 |
| 3. RFQ & Quotes | 4 | 5 | 50 |
| 4. Orders & Fulfillment | 4 | 4 | 32 |
| 5. Payments & Finance | 6 | 6 | 45 |
| 6. GOCASH & Rewards | 5 | 7 | 75 |
| 7. AI Platform | 4 | 6 | 30 |
| 8. TradeAI Agents | 5 | 5 | 42 |
| 9. AI Domain Services | 3 | 5 | 45 |
| 10. Search & Discovery | 3 | 7 | 35 |
| 11. Communications | 3 | 5 | 20 |
| 12. CRM | 1 | 2 | 12 |
| 13. TradeServ | 1 | 6 | 35 |
| 14. Platform Infrastructure | 9 | 12 | 55 |
| 15. Intelligence | 7 | 8 | 55 |
| **Total** | **~92** | **~155** | **~1,325+** |
