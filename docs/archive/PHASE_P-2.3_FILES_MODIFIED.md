Files modified during initial Phase P-2.3 implementation tasks

Modified files (summary)
- apps/api/src/modules/catalog-adapter/catalog-adapter.service.ts
  - Added: listCatalogCategories(), listOldCategories(), unifiedSearchBulk()
- apps/api/src/modules/marketplace-catalog-bridge/marketplace-catalog-bridge.service.ts
  - Replaced direct catalog reads with adapter helpers
  - Replaced per-product adapter calls with bulk unifiedSearchBulk
  - Added unifiedSearchBulk passthrough
- apps/api/src/modules/marketplace-catalog-bridge/marketplace-catalog-bridge.controller.ts
  - Added GET /marketplace-catalog-bridge/unified-search/bulk endpoint
- apps/api/src/modules/catalog-adapter/__tests__/catalog-adapter.service.spec.ts
  - Added basic unit test for unifiedSearchBulk

Notes
- Changes are backward-compatible: no public route changes (new endpoint is additive), no Prisma schema modifications.
- Next code changes will target: import orchestrator tests; frontend wiring in apps/web; and more adapter unit tests for heuristics and confidence thresholds.
