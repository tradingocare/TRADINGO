-- Phase 3ZB: scope AiUsage idempotency from a global key to (companyId,
-- idempotencyKey) so one company's key can never suppress another company's
-- legitimate charge. NULL keys stay unconstrained (Postgres treats NULLs as
-- distinct), preserving all existing key-less usage rows byte-for-byte.

-- DropConstraint
DROP INDEX "AiUsage_idempotencyKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "AiUsage_companyId_idempotencyKey_key" ON "AiUsage"("companyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AiUsage_idempotencyKey_idx" ON "AiUsage"("idempotencyKey");
